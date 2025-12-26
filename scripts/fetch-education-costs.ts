/**
 * Fetch Education Cost Data
 *
 * Calculates education costs for each occupation using:
 * 1. CIP-SOC crosswalk (maps occupations to educational programs)
 * 2. College Board 2024-25 national average tuition data
 * 3. Professional program costs (MD, JD, etc.)
 * 4. Trade school/apprenticeship costs
 *
 * Run: npx tsx scripts/fetch-education-costs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const SOURCES_DIR = path.join(process.cwd(), 'data/sources/education');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Ensure directories exist
[SOURCES_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// =============================================================================
// COLLEGE BOARD 2024-25 NATIONAL AVERAGE TUITION DATA
// Source: https://research.collegeboard.org/trends/college-pricing
// =============================================================================

const COLLEGE_BOARD_2024_25 = {
  year: 2024,
  source: 'College Board Trends in College Pricing 2024-25',
  url: 'https://research.collegeboard.org/trends/college-pricing',

  // Tuition and fees only (not including room & board)
  tuition_and_fees: {
    public_2year_in_district: 3990,
    public_4year_in_state: 11610,
    public_4year_out_of_state: 24030,
    private_nonprofit_4year: 43350,
  },

  // Total cost of attendance (tuition + fees + room + board + books + personal)
  total_cost_of_attendance: {
    public_2year_in_district: 19860,  // Includes living expenses
    public_4year_in_state: 24030,
    public_4year_out_of_state: 42590,
    private_nonprofit_4year: 58600,
  },
};

// Degree duration in years
const DEGREE_DURATIONS: Record<string, number> = {
  'certificate': 1,
  'associates': 2,
  'bachelors': 4,
  'masters': 2,
  'doctoral': 5,
  'professional': 3, // Varies: JD=3, MD=4, etc.
};

// =============================================================================
// CIP CODE FIELD CATEGORIES AND COST ADJUSTMENTS
// Based on College Scorecard field of study analysis
// =============================================================================

// CIP code prefixes mapped to fields with relative cost adjustments
const CIP_FIELD_CATEGORIES: Record<string, { name: string; costMultiplier: number }> = {
  '01': { name: 'Agriculture', costMultiplier: 0.95 },
  '03': { name: 'Natural Resources', costMultiplier: 1.0 },
  '04': { name: 'Architecture', costMultiplier: 1.1 },
  '05': { name: 'Area Studies', costMultiplier: 0.95 },
  '09': { name: 'Communication', costMultiplier: 0.95 },
  '10': { name: 'Communications Technology', costMultiplier: 1.0 },
  '11': { name: 'Computer Science', costMultiplier: 1.15 },
  '12': { name: 'Culinary Services', costMultiplier: 0.85 },
  '13': { name: 'Education', costMultiplier: 0.9 },
  '14': { name: 'Engineering', costMultiplier: 1.2 },
  '15': { name: 'Engineering Technology', costMultiplier: 1.05 },
  '16': { name: 'Foreign Languages', costMultiplier: 0.95 },
  '19': { name: 'Family Sciences', costMultiplier: 0.9 },
  '22': { name: 'Legal Studies', costMultiplier: 1.1 },
  '23': { name: 'English', costMultiplier: 0.9 },
  '24': { name: 'Liberal Arts', costMultiplier: 0.9 },
  '25': { name: 'Library Science', costMultiplier: 0.95 },
  '26': { name: 'Biological Sciences', costMultiplier: 1.1 },
  '27': { name: 'Mathematics', costMultiplier: 1.0 },
  '29': { name: 'Military Technologies', costMultiplier: 1.0 },
  '30': { name: 'Interdisciplinary', costMultiplier: 1.0 },
  '31': { name: 'Parks & Recreation', costMultiplier: 0.95 },
  '38': { name: 'Philosophy & Religion', costMultiplier: 0.9 },
  '40': { name: 'Physical Sciences', costMultiplier: 1.1 },
  '41': { name: 'Science Technologies', costMultiplier: 1.05 },
  '42': { name: 'Psychology', costMultiplier: 0.95 },
  '43': { name: 'Security & Protective Services', costMultiplier: 0.9 },
  '44': { name: 'Public Administration', costMultiplier: 0.95 },
  '45': { name: 'Social Sciences', costMultiplier: 0.95 },
  '46': { name: 'Construction Trades', costMultiplier: 0.7 },
  '47': { name: 'Mechanic & Repair', costMultiplier: 0.7 },
  '48': { name: 'Precision Production', costMultiplier: 0.7 },
  '49': { name: 'Transportation', costMultiplier: 0.7 },
  '50': { name: 'Visual & Performing Arts', costMultiplier: 1.05 },
  '51': { name: 'Health Professions', costMultiplier: 1.15 },
  '52': { name: 'Business', costMultiplier: 1.0 },
  '54': { name: 'History', costMultiplier: 0.9 },
};

// =============================================================================
// INTERFACES
// =============================================================================

interface CIPSOCMapping {
  cipCode: string;
  cipTitle: string;
  socCode: string;
  socTitle: string;
}

interface EducationCostByType {
  total: number;
  per_year: number;
}

interface EducationCostEstimate {
  soc_code: string;
  min_cost: number;
  max_cost: number;
  typical_cost: number;
  cost_breakdown: Array<{ item: string; min: number; max: number; typical: number }>;
  by_institution_type: {
    public_in_state: EducationCostByType | null;
    public_out_of_state: EducationCostByType | null;
    private_nonprofit: EducationCostByType | null;
    community_college: EducationCostByType | null;
    trade_school: { total: number; program_length_months: number } | null;
    apprenticeship: { cost: number; earn_while_learning: boolean } | null;
  };
  data_source: {
    primary: 'college_board' | 'professional_association' | 'trade_data' | 'estimated';
    cip_codes: string[];
    year: number;
    confidence: 'high' | 'medium' | 'low';
  };
  notes: string;
}

interface ProfessionalProgram {
  name: string;
  typical_duration_years: number;
  requires_bachelor: boolean;
  costs: {
    public_in_state?: { per_year: number; total: number };
    public_out_of_state?: { per_year: number; total: number };
    private?: { per_year: number; total: number };
  };
  median_debt_at_graduation: number;
  applicable_soc_codes: string[];
}

interface TradeProgram {
  name: string;
  pathway: string;
  costs: {
    trade_school?: { total: number; range_min: number; range_max: number };
    apprenticeship?: { total: number; earn_while_learning: boolean };
    certificate?: { total: number; range_min: number; range_max: number };
  };
  applicable_soc_codes: string[];
}

// =============================================================================
// PARSE CIP-SOC CROSSWALK
// =============================================================================

function parseCIPSOCCrosswalk(): Map<string, string[]> {
  const crosswalkFile = path.join(SOURCES_DIR, 'cip_soc_crosswalk.xlsx');

  if (!fs.existsSync(crosswalkFile)) {
    console.warn('CIP-SOC crosswalk file not found, using fallback mapping');
    return new Map();
  }

  console.log('Parsing CIP-SOC crosswalk...');
  const workbook = XLSX.readFile(crosswalkFile);

  // Use the SOC-CIP sheet which maps SOC codes to CIP codes
  const sheetName = 'SOC-CIP';
  if (!workbook.SheetNames.includes(sheetName)) {
    console.warn(`Sheet '${sheetName}' not found in crosswalk file`);
    return new Map();
  }

  const sheet = workbook.Sheets[sheetName];
  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Build SOC -> CIP mapping
  // Format: SOC2018Code, SOC2018Title, CIP2020Code, CIP2020Title
  const socToCip = new Map<string, string[]>();

  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as string[];
    if (!row || row.length < 3) continue;

    const socCode = String(row[0] || '').trim();
    const cipCode = String(row[2] || '').trim();

    if (socCode && cipCode && socCode.match(/^\d{2}-\d{4}$/)) {
      if (!socToCip.has(socCode)) {
        socToCip.set(socCode, []);
      }
      const cips = socToCip.get(socCode)!;
      if (!cips.includes(cipCode)) {
        cips.push(cipCode);
      }
    }
  }

  console.log(`Loaded ${socToCip.size} SOC-to-CIP mappings`);
  return socToCip;
}

// =============================================================================
// LOAD PROFESSIONAL & TRADE PROGRAMS
// =============================================================================

function loadProfessionalPrograms(): {
  professional: Map<string, ProfessionalProgram>;
  trades: Map<string, TradeProgram>;
} {
  const file = path.join(SOURCES_DIR, 'professional_programs.json');

  if (!fs.existsSync(file)) {
    console.warn('Professional programs file not found');
    return { professional: new Map(), trades: new Map() };
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const professional = new Map<string, ProfessionalProgram>();
  const trades = new Map<string, TradeProgram>();

  // Index by SOC code
  for (const [key, program] of Object.entries(data.programs || {})) {
    const prog = program as ProfessionalProgram;
    for (const soc of prog.applicable_soc_codes) {
      professional.set(soc, prog);
    }
  }

  for (const [key, program] of Object.entries(data.trade_programs || {})) {
    const prog = program as TradeProgram;
    for (const soc of prog.applicable_soc_codes) {
      trades.set(soc, prog);
    }
  }

  console.log(`Loaded ${professional.size} professional program mappings`);
  console.log(`Loaded ${trades.size} trade program mappings`);

  return { professional, trades };
}

// =============================================================================
// CALCULATE EDUCATION COSTS
// =============================================================================

function calculateCostForCredentialLevel(
  credentialLevel: string,
  cipCodes: string[],
  professionalProgram?: ProfessionalProgram,
  tradeProgram?: TradeProgram
): EducationCostEstimate {
  const result: EducationCostEstimate = {
    soc_code: '',
    min_cost: 0,
    max_cost: 0,
    typical_cost: 0,
    cost_breakdown: [],
    by_institution_type: {
      public_in_state: null,
      public_out_of_state: null,
      private_nonprofit: null,
      community_college: null,
      trade_school: null,
      apprenticeship: null,
    },
    data_source: {
      primary: 'college_board',
      cip_codes: cipCodes,
      year: 2024,
      confidence: 'medium',
    },
    notes: '',
  };

  // Get field cost multiplier from first CIP code
  let costMultiplier = 1.0;
  if (cipCodes.length > 0) {
    const prefix = cipCodes[0].substring(0, 2);
    costMultiplier = CIP_FIELD_CATEGORIES[prefix]?.costMultiplier || 1.0;
  }

  const credential = credentialLevel.toLowerCase();

  // Handle professional programs (MD, JD, etc.)
  if (professionalProgram) {
    result.data_source.primary = 'professional_association';
    result.data_source.confidence = 'high';

    const costs = professionalProgram.costs;

    // Add bachelor's degree cost if required
    if (professionalProgram.requires_bachelor) {
      const bachelorsCost = {
        item: "Bachelor's degree",
        min: Math.round(COLLEGE_BOARD_2024_25.tuition_and_fees.public_4year_in_state * 4),
        max: Math.round(COLLEGE_BOARD_2024_25.tuition_and_fees.private_nonprofit_4year * 4),
        typical: Math.round(COLLEGE_BOARD_2024_25.tuition_and_fees.public_4year_out_of_state * 4),
      };
      result.cost_breakdown.push(bachelorsCost);
    }

    // Add professional program cost
    const profCost = {
      item: professionalProgram.name,
      min: costs.public_in_state?.total || 0,
      max: costs.private?.total || 0,
      typical: costs.public_out_of_state?.total || Math.round((costs.public_in_state?.total || 0 + (costs.private?.total || 0)) / 2),
    };
    result.cost_breakdown.push(profCost);

    // Calculate totals
    result.min_cost = result.cost_breakdown.reduce((sum, item) => sum + item.min, 0);
    result.max_cost = result.cost_breakdown.reduce((sum, item) => sum + item.max, 0);
    result.typical_cost = result.cost_breakdown.reduce((sum, item) => sum + item.typical, 0);

    // Institution type breakdown for professional programs
    if (professionalProgram.requires_bachelor) {
      const bachInState = COLLEGE_BOARD_2024_25.tuition_and_fees.public_4year_in_state * 4;
      const bachOutState = COLLEGE_BOARD_2024_25.tuition_and_fees.public_4year_out_of_state * 4;
      const bachPrivate = COLLEGE_BOARD_2024_25.tuition_and_fees.private_nonprofit_4year * 4;

      result.by_institution_type.public_in_state = {
        total: bachInState + (costs.public_in_state?.total || 0),
        per_year: Math.round((bachInState + (costs.public_in_state?.total || 0)) / (4 + professionalProgram.typical_duration_years)),
      };
      result.by_institution_type.public_out_of_state = {
        total: bachOutState + (costs.public_out_of_state?.total || 0),
        per_year: Math.round((bachOutState + (costs.public_out_of_state?.total || 0)) / (4 + professionalProgram.typical_duration_years)),
      };
      result.by_institution_type.private_nonprofit = {
        total: bachPrivate + (costs.private?.total || 0),
        per_year: Math.round((bachPrivate + (costs.private?.total || 0)) / (4 + professionalProgram.typical_duration_years)),
      };
    }

    result.notes = `${professionalProgram.name} costs from professional association data. Median debt at graduation: $${professionalProgram.median_debt_at_graduation.toLocaleString()}.`;
    return result;
  }

  // Handle trade programs
  if (tradeProgram) {
    result.data_source.primary = 'trade_data';
    result.data_source.confidence = 'high';

    if (tradeProgram.costs.apprenticeship) {
      result.by_institution_type.apprenticeship = {
        cost: 0,
        earn_while_learning: true,
      };
      result.cost_breakdown.push({
        item: tradeProgram.name,
        min: 0,
        max: 2000,  // Tools and supplies
        typical: 500,
      });
      result.notes = `${tradeProgram.name} via apprenticeship - earn while you learn with $0 tuition.`;
    } else if (tradeProgram.costs.trade_school) {
      result.by_institution_type.trade_school = {
        total: tradeProgram.costs.trade_school.total,
        program_length_months: 12,
      };
      result.cost_breakdown.push({
        item: tradeProgram.name,
        min: tradeProgram.costs.trade_school.range_min,
        max: tradeProgram.costs.trade_school.range_max,
        typical: tradeProgram.costs.trade_school.total,
      });
      result.notes = `Trade school training for ${tradeProgram.name}.`;
    } else if (tradeProgram.costs.certificate) {
      result.cost_breakdown.push({
        item: tradeProgram.name,
        min: tradeProgram.costs.certificate.range_min,
        max: tradeProgram.costs.certificate.range_max,
        typical: tradeProgram.costs.certificate.total,
      });
      result.notes = `Certificate program for ${tradeProgram.name}.`;
    }

    result.min_cost = result.cost_breakdown.reduce((sum, item) => sum + item.min, 0);
    result.max_cost = result.cost_breakdown.reduce((sum, item) => sum + item.max, 0);
    result.typical_cost = result.cost_breakdown.reduce((sum, item) => sum + item.typical, 0);
    return result;
  }

  // Standard degree paths using College Board data
  const cb = COLLEGE_BOARD_2024_25.tuition_and_fees;

  if (credential.includes('doctoral') || credential.includes('phd')) {
    // Doctoral = Bachelor's + Doctoral (often funded)
    const bachYears = 4;
    const docYears = 5;

    result.cost_breakdown.push({
      item: "Bachelor's degree",
      min: Math.round(cb.public_4year_in_state * bachYears * costMultiplier),
      max: Math.round(cb.private_nonprofit_4year * bachYears * costMultiplier),
      typical: Math.round(cb.public_4year_out_of_state * bachYears * costMultiplier),
    });
    result.cost_breakdown.push({
      item: 'Doctoral degree',
      min: 0,  // Often funded
      max: Math.round(cb.private_nonprofit_4year * docYears * 0.5 * costMultiplier),  // Partial funding
      typical: 0,  // Most STEM PhDs are funded
    });
    result.notes = 'Doctoral programs are often fully funded with stipend. Costs shown are for bachelor\'s degree plus potential unfunded doctoral costs.';
    result.data_source.confidence = 'medium';

  } else if (credential.includes('master')) {
    // Master's = Bachelor's + Master's
    const bachYears = 4;
    const mastYears = 2;

    result.cost_breakdown.push({
      item: "Bachelor's degree",
      min: Math.round(cb.public_4year_in_state * bachYears * costMultiplier),
      max: Math.round(cb.private_nonprofit_4year * bachYears * costMultiplier),
      typical: Math.round(cb.public_4year_out_of_state * bachYears * costMultiplier),
    });
    result.cost_breakdown.push({
      item: "Master's degree",
      min: Math.round(cb.public_4year_in_state * mastYears * 1.1 * costMultiplier),  // Graduate slightly higher
      max: Math.round(cb.private_nonprofit_4year * mastYears * 1.2 * costMultiplier),
      typical: Math.round(cb.public_4year_out_of_state * mastYears * 1.1 * costMultiplier),
    });
    result.notes = `Based on College Board 2024-25 tuition data. Field adjustment: ${(costMultiplier * 100).toFixed(0)}%.`;

    result.by_institution_type.public_in_state = {
      total: Math.round(cb.public_4year_in_state * (bachYears + mastYears) * costMultiplier),
      per_year: Math.round(cb.public_4year_in_state * costMultiplier),
    };
    result.by_institution_type.public_out_of_state = {
      total: Math.round(cb.public_4year_out_of_state * (bachYears + mastYears) * costMultiplier),
      per_year: Math.round(cb.public_4year_out_of_state * costMultiplier),
    };
    result.by_institution_type.private_nonprofit = {
      total: Math.round(cb.private_nonprofit_4year * (bachYears + mastYears) * 1.1 * costMultiplier),
      per_year: Math.round(cb.private_nonprofit_4year * 1.1 * costMultiplier),
    };

  } else if (credential.includes('bachelor')) {
    // Bachelor's degree
    const years = 4;

    result.cost_breakdown.push({
      item: "Bachelor's degree",
      min: Math.round(cb.public_4year_in_state * years * costMultiplier),
      max: Math.round(cb.private_nonprofit_4year * years * costMultiplier),
      typical: Math.round(cb.public_4year_out_of_state * years * costMultiplier),
    });
    result.notes = `Based on College Board 2024-25 tuition data. Field adjustment: ${(costMultiplier * 100).toFixed(0)}%.`;

    result.by_institution_type.public_in_state = {
      total: Math.round(cb.public_4year_in_state * years * costMultiplier),
      per_year: Math.round(cb.public_4year_in_state * costMultiplier),
    };
    result.by_institution_type.public_out_of_state = {
      total: Math.round(cb.public_4year_out_of_state * years * costMultiplier),
      per_year: Math.round(cb.public_4year_out_of_state * costMultiplier),
    };
    result.by_institution_type.private_nonprofit = {
      total: Math.round(cb.private_nonprofit_4year * years * costMultiplier),
      per_year: Math.round(cb.private_nonprofit_4year * costMultiplier),
    };

  } else if (credential.includes('associate')) {
    // Associate's degree
    const years = 2;

    result.cost_breakdown.push({
      item: "Associate's degree",
      min: Math.round(cb.public_2year_in_district * years * costMultiplier),
      max: Math.round(cb.public_4year_in_state * years * costMultiplier),  // Some at 4-year schools
      typical: Math.round(cb.public_2year_in_district * years * costMultiplier * 1.2),
    });
    result.notes = 'Based on College Board 2024-25 community college tuition data.';

    result.by_institution_type.community_college = {
      total: Math.round(cb.public_2year_in_district * years * costMultiplier),
      per_year: Math.round(cb.public_2year_in_district * costMultiplier),
    };
    result.by_institution_type.public_in_state = {
      total: Math.round(cb.public_4year_in_state * years * costMultiplier),
      per_year: Math.round(cb.public_4year_in_state * costMultiplier),
    };

  } else if (credential.includes('certificate') || credential.includes('postsecondary')) {
    // Certificate/vocational
    result.cost_breakdown.push({
      item: 'Certificate program',
      min: 3000,
      max: 20000,
      typical: 10000,
    });
    result.notes = 'Certificate program costs vary widely by field and institution.';
    result.data_source.confidence = 'low';

    result.by_institution_type.trade_school = {
      total: 10000,
      program_length_months: 12,
    };
    result.by_institution_type.community_college = {
      total: Math.round(cb.public_2year_in_district),
      per_year: Math.round(cb.public_2year_in_district),
    };

  } else if (credential.includes('apprentice')) {
    // Apprenticeship
    result.cost_breakdown.push({
      item: 'Apprenticeship',
      min: 0,
      max: 2000,
      typical: 500,
    });
    result.notes = 'Apprenticeships are paid positions - earn while you learn.';
    result.data_source.confidence = 'high';

    result.by_institution_type.apprenticeship = {
      cost: 0,
      earn_while_learning: true,
    };

  } else if (credential.includes('high school') || credential.includes('less than')) {
    // High school or less
    result.cost_breakdown.push({
      item: 'High school diploma',
      min: 0,
      max: 0,
      typical: 0,
    });
    result.notes = 'Public high school education with no additional costs.';
    result.data_source.confidence = 'high';

  } else {
    // Fallback: on-the-job training
    result.cost_breakdown.push({
      item: 'On-the-job training',
      min: 0,
      max: 5000,
      typical: 1000,
    });
    result.notes = 'Primarily on-the-job training with minimal formal education costs.';
    result.data_source.confidence = 'low';
  }

  // Calculate totals
  result.min_cost = result.cost_breakdown.reduce((sum, item) => sum + item.min, 0);
  result.max_cost = result.cost_breakdown.reduce((sum, item) => sum + item.max, 0);
  result.typical_cost = result.cost_breakdown.reduce((sum, item) => sum + item.typical, 0);

  return result;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function main() {
  console.log('\n=== Fetching Education Cost Data ===\n');

  // Load CIP-SOC mapping
  const socToCip = parseCIPSOCCrosswalk();

  // Load professional and trade programs
  const { professional, trades } = loadProfessionalPrograms();

  // Load existing occupations
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  if (!fs.existsSync(occupationsFile)) {
    console.error('Error: occupations_complete.json not found. Run process-onet.ts first.');
    process.exit(1);
  }

  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Processing education costs for ${occupations.length} occupations`);

  // Process each occupation
  const educationCosts: Map<string, EducationCostEstimate> = new Map();
  let mappedCount = 0;
  let professionalCount = 0;
  let tradeCount = 0;
  let fallbackCount = 0;

  for (const occ of occupations) {
    const onetCode = occ.onet_code;
    const socCode = onetCode.replace(/\.\d+$/, '');  // Remove .XX suffix
    const typicalEducation = occ.education?.typical_entry_education || '';

    // Get CIP codes for this occupation
    const cipCodes = socToCip.get(socCode) || [];

    // Check for professional or trade program
    const profProgram = professional.get(socCode);
    const tradeProgram = trades.get(socCode);

    // Calculate costs
    const costEstimate = calculateCostForCredentialLevel(
      typicalEducation,
      cipCodes,
      profProgram,
      tradeProgram
    );
    costEstimate.soc_code = onetCode;

    if (profProgram) {
      professionalCount++;
    } else if (tradeProgram) {
      tradeCount++;
    } else if (cipCodes.length > 0) {
      mappedCount++;
    } else {
      fallbackCount++;
    }

    educationCosts.set(onetCode, costEstimate);

    // Update occupation with new cost data
    if (occ.education) {
      occ.education.estimated_cost = {
        min_cost: costEstimate.min_cost,
        max_cost: costEstimate.max_cost,
        typical_cost: costEstimate.typical_cost,
        cost_breakdown: costEstimate.cost_breakdown,
        notes: costEstimate.notes,
      };

      // Add new fields
      occ.education.cost_by_institution_type = costEstimate.by_institution_type;
      occ.education.cost_data_source = costEstimate.data_source;
    }
  }

  // Update metadata
  occupationsData.metadata.education_data = {
    source: 'College Board Trends in College Pricing 2024-25',
    professional_data: 'AAMC, ABA, ADA, and other professional associations',
    cip_soc_crosswalk: 'NCES CIP-SOC Crosswalk 2020',
    year: 2024,
    last_updated: new Date().toISOString().split('T')[0],
  };
  occupationsData.metadata.last_updated = new Date().toISOString().split('T')[0];

  // Save updated occupations
  fs.writeFileSync(occupationsFile, JSON.stringify(occupationsData, null, 2));

  // Save education costs separately for reference
  const costsFile = path.join(PROCESSED_DIR, 'education_costs.json');
  const costsObj: Record<string, EducationCostEstimate> = {};
  educationCosts.forEach((cost, code) => {
    costsObj[code] = cost;
  });
  fs.writeFileSync(costsFile, JSON.stringify({
    metadata: {
      generated: new Date().toISOString(),
      sources: [
        'College Board Trends in College Pricing 2024-25',
        'NCES CIP-SOC Crosswalk 2020',
        'Professional association data (AAMC, ABA, ADA, etc.)',
      ],
      methodology: 'See docs/education-cost-methodology.md',
    },
    costs: costsObj,
  }, null, 2));

  // Save CIP-SOC mapping for reference
  const mappingFile = path.join(PROCESSED_DIR, 'cip_soc_mapping.json');
  const mappingObj: Record<string, string[]> = {};
  socToCip.forEach((cips, soc) => {
    mappingObj[soc] = cips;
  });
  fs.writeFileSync(mappingFile, JSON.stringify({
    metadata: {
      source: 'NCES CIP-SOC Crosswalk 2020',
      url: 'https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx',
      generated: new Date().toISOString(),
    },
    mappings: mappingObj,
  }, null, 2));

  // Summary
  console.log('\n=== Education Cost Summary ===');
  console.log(`Total occupations processed: ${occupations.length}`);
  console.log(`  - CIP-mapped occupations: ${mappedCount}`);
  console.log(`  - Professional programs (MD, JD, etc.): ${professionalCount}`);
  console.log(`  - Trade programs: ${tradeCount}`);
  console.log(`  - Fallback estimates: ${fallbackCount}`);
  console.log(`\nFiles saved:`);
  console.log(`  - ${occupationsFile}`);
  console.log(`  - ${costsFile}`);
  console.log(`  - ${mappingFile}`);

  // Sample output
  console.log('\n=== Sample Education Costs ===');
  const samples = occupations.slice(0, 5);
  samples.forEach((occ: { title: string; education?: { estimated_cost?: { typical_cost: number } } }) => {
    const cost = occ.education?.estimated_cost?.typical_cost || 0;
    console.log(`  ${occ.title}: $${cost.toLocaleString()}`);
  });

  console.log('\n=== Education Cost Fetch Complete ===\n');
}

main().catch(console.error);
