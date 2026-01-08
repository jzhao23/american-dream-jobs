/**
 * Fetch BLS MSA & State Wage Data
 *
 * This script fetches and parses Occupational Employment and Wage Statistics (OEWS)
 * from the Bureau of Labor Statistics (BLS) for Metropolitan Statistical Areas (MSAs)
 * and states to enable location-aware job information.
 *
 * ## Data Sources
 * - MSA Data: https://www.bls.gov/oes/special.requests/oesm24ma.zip
 *   Contains: Employment and wage estimates by occupation for ~530 MSAs
 * - State Data: https://www.bls.gov/oes/special.requests/oesm24st.zip
 *   Contains: State-level employment and wage estimates (fallback for rural users)
 *
 * ## How It Works
 * 1. Downloads BLS OEWS ZIP files containing MSA and state wage data
 * 2. Extracts and parses the Excel files using the xlsx library
 * 3. Maps BLS SOC codes (e.g., "29-1211") to O*NET codes (e.g., "29-1211.00")
 * 4. Calculates location quotients (concentration vs national average)
 * 5. Saves processed data for use by generate-local-careers-index.ts
 *
 * ## BLS Special Codes
 * The BLS uses special codes for suppressed/unavailable data:
 * - "#" = Wage estimate not available (high variability or small sample)
 * - "*" = Employment estimate not available
 * - "**" = Wage estimate above $115.00/hr or $239,200/yr
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/fetch-bls-msa-wages.ts          # Use cached data if available
 * npx tsx scripts/fetch-bls-msa-wages.ts --fresh  # Force re-download and re-parse
 * ```
 *
 * ## Output
 * - data/sources/bls-msa/msa-wages.json - MSA-level wage data
 * - data/sources/bls-msa/state-wages.json - State-level wage data
 * - data/sources/bls-msa/msa-metadata.json - MSA names and info
 *
 * @see https://www.bls.gov/oes/current/oes_tec.htm for BLS methodology
 * @see https://www.bls.gov/oes/current/oessrcma.htm for MSA data documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// BLS data URLs - updated to May 2024 release
const BLS_MSA_URL = 'https://www.bls.gov/oes/special.requests/oesm24ma.zip';
const BLS_STATE_URL = 'https://www.bls.gov/oes/special.requests/oesm24st.zip';

const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/bls-msa');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Ensure directories exist
[OUTPUT_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Type definitions
interface BLSWageData {
  soc_code: string;
  title: string;
  employment: number | null;
  hourly: {
    pct_10: number | null;
    pct_25: number | null;
    median: number | null;
    pct_75: number | null;
    pct_90: number | null;
    mean: number | null;
  };
  annual: {
    pct_10: number | null;
    pct_25: number | null;
    median: number | null;
    pct_75: number | null;
    pct_90: number | null;
    mean: number | null;
  };
  location_quotient: number | null;
}

interface MSAMetadata {
  code: string;
  name: string;
  states: string[];
  total_employment: number | null;
}

interface StateMetadata {
  code: string;
  name: string;
  fips: string;
  total_employment: number | null;
}

interface MSAWageOutput {
  metadata: {
    source: string;
    year: number;
    reference_month: string;
    total_msas: number;
    total_occupations: number;
    generated_at: string;
  };
  data: {
    [msaCode: string]: {
      [socCode: string]: BLSWageData;
    };
  };
}

interface StateWageOutput {
  metadata: {
    source: string;
    year: number;
    reference_month: string;
    total_states: number;
    total_occupations: number;
    generated_at: string;
  };
  data: {
    [stateCode: string]: {
      [socCode: string]: BLSWageData;
    };
  };
}

/**
 * Parse a BLS value, handling special codes for suppressed data.
 */
function parseValue(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return null;

  const str = val.trim();
  if (!str || str === '*' || str === '#' || str === '**') {
    return null;
  }
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Download and extract BLS OEWS data ZIP file.
 * Returns path to the extracted XLSX file.
 */
async function downloadBLSData(url: string, prefix: string): Promise<string> {
  const zipPath = path.join(OUTPUT_DIR, `${prefix}.zip`);
  const extractDir = path.join(OUTPUT_DIR, prefix);

  // Find existing data file
  const findXlsxFile = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const found = findXlsxFile(fullPath);
        if (found) return found;
      } else if (item.name.endsWith('.xlsx') && !item.name.startsWith('~')) {
        return fullPath;
      }
    }
    return null;
  };

  const existingFile = findXlsxFile(extractDir);
  if (existingFile) {
    console.log(`Using existing ${prefix} data: ${existingFile}`);
    return existingFile;
  }

  console.log(`Downloading BLS ${prefix} data from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download BLS data: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(zipPath, Buffer.from(buffer));
  console.log('Download complete, extracting...');

  // Extract using unzip command
  const { execSync } = await import('child_process');
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: 'pipe' });

  const dataFile = findXlsxFile(extractDir);
  if (!dataFile) {
    throw new Error(`Could not find BLS XLSX data file in ${extractDir}`);
  }

  console.log(`Extracted: ${dataFile}`);
  return dataFile;
}

/**
 * Parse BLS MSA Excel file and extract wage data.
 */
async function parseMSAExcel(filePath: string): Promise<{
  msaData: MSAWageOutput;
  msaMetadata: Map<string, MSAMetadata>;
}> {
  console.log(`Parsing MSA Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  console.log(`Found ${data.length} rows in MSA data`);

  const msaWages: { [msaCode: string]: { [socCode: string]: BLSWageData } } = {};
  const msaMetadata = new Map<string, MSAMetadata>();
  const occupationCounts = new Set<string>();
  let detailedCount = 0;

  for (const row of data) {
    const areaCode = String(row['AREA'] || row['area'] || '');
    const areaTitle = String(row['AREA_TITLE'] || row['area_title'] || '');
    const socCode = String(row['OCC_CODE'] || row['occ_code'] || '');
    const oGroup = String(row['O_GROUP'] || row['o_group'] || '');

    // Skip invalid rows
    if (!areaCode || !socCode || !socCode.includes('-')) continue;

    // Only include detailed occupations (not aggregates)
    if (oGroup !== 'detailed' && oGroup !== 'broad') continue;

    detailedCount++;
    occupationCounts.add(socCode);

    // Initialize MSA if not seen
    if (!msaWages[areaCode]) {
      msaWages[areaCode] = {};
    }

    // Extract state codes from area title (e.g., "San Francisco-Oakland-Hayward, CA")
    const stateMatch = areaTitle.match(/,\s*([A-Z-]+)$/);
    const states = stateMatch ? stateMatch[1].split('-') : [];

    // Update MSA metadata
    if (!msaMetadata.has(areaCode)) {
      msaMetadata.set(areaCode, {
        code: areaCode,
        name: areaTitle,
        states,
        total_employment: null,
      });
    }

    // Parse wage values
    const annualMedian = parseValue(row['A_MEDIAN'] || row['a_median']);
    const annualMean = parseValue(row['A_MEAN'] || row['a_mean']);
    const hourlyMedian = parseValue(row['H_MEDIAN'] || row['h_median']);
    const hourlyMean = parseValue(row['H_MEAN'] || row['h_mean']);
    const employment = parseValue(row['TOT_EMP'] || row['tot_emp']);
    const locationQuotient = parseValue(row['LOC_QUOTIENT'] || row['loc_quotient']);

    // Use mean as fallback when median is suppressed
    const effectiveAnnualMedian = annualMedian ?? annualMean;
    const effectiveHourlyMedian = hourlyMedian ?? hourlyMean;

    msaWages[areaCode][socCode] = {
      soc_code: socCode,
      title: String(row['OCC_TITLE'] || row['occ_title'] || ''),
      employment,
      hourly: {
        pct_10: parseValue(row['H_PCT10'] || row['h_pct10']),
        pct_25: parseValue(row['H_PCT25'] || row['h_pct25']),
        median: effectiveHourlyMedian,
        pct_75: parseValue(row['H_PCT75'] || row['h_pct75']),
        pct_90: parseValue(row['H_PCT90'] || row['h_pct90']),
        mean: hourlyMean,
      },
      annual: {
        pct_10: parseValue(row['A_PCT10'] || row['a_pct10']),
        pct_25: parseValue(row['A_PCT25'] || row['a_pct25']),
        median: effectiveAnnualMedian,
        pct_75: parseValue(row['A_PCT75'] || row['a_pct75']),
        pct_90: parseValue(row['A_PCT90'] || row['a_pct90']),
        mean: annualMean,
      },
      location_quotient: locationQuotient,
    };
  }

  console.log(`Parsed ${Object.keys(msaWages).length} MSAs with ${occupationCounts.size} unique occupations`);
  console.log(`Total detailed occupation records: ${detailedCount}`);

  const msaData: MSAWageOutput = {
    metadata: {
      source: 'BLS_OEWS_MSA',
      year: 2024,
      reference_month: 'May',
      total_msas: Object.keys(msaWages).length,
      total_occupations: occupationCounts.size,
      generated_at: new Date().toISOString(),
    },
    data: msaWages,
  };

  return { msaData, msaMetadata };
}

/**
 * Parse BLS State Excel file and extract wage data.
 */
async function parseStateExcel(filePath: string): Promise<{
  stateData: StateWageOutput;
  stateMetadata: Map<string, StateMetadata>;
}> {
  console.log(`Parsing State Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  console.log(`Found ${data.length} rows in state data`);

  const stateWages: { [stateCode: string]: { [socCode: string]: BLSWageData } } = {};
  const stateMetadata = new Map<string, StateMetadata>();
  const occupationCounts = new Set<string>();
  let detailedCount = 0;

  // State FIPS to abbreviation mapping
  const stateFipsToAbbrev: { [fips: string]: string } = {
    '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
    '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
    '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
    '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
    '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
    '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
    '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
    '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
    '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
    '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
    '56': 'WY', '72': 'PR', '78': 'VI', '66': 'GU',
  };

  for (const row of data) {
    // State data uses ST (state FIPS code) or PRIM_STATE
    const stFips = String(row['ST'] || row['st'] || row['PRIM_STATE'] || row['prim_state'] || '').padStart(2, '0');
    const areaTitle = String(row['AREA_TITLE'] || row['area_title'] || row['STATE'] || '');
    const socCode = String(row['OCC_CODE'] || row['occ_code'] || '');
    const oGroup = String(row['O_GROUP'] || row['o_group'] || '');

    // Skip invalid rows
    if (!stFips || stFips === '00' || !socCode || !socCode.includes('-')) continue;

    // Only include detailed occupations
    if (oGroup !== 'detailed' && oGroup !== 'broad') continue;

    const stateAbbrev = stateFipsToAbbrev[stFips] || stFips;

    detailedCount++;
    occupationCounts.add(socCode);

    // Initialize state if not seen
    if (!stateWages[stateAbbrev]) {
      stateWages[stateAbbrev] = {};
    }

    // Update state metadata
    if (!stateMetadata.has(stateAbbrev)) {
      stateMetadata.set(stateAbbrev, {
        code: stateAbbrev,
        name: areaTitle,
        fips: stFips,
        total_employment: null,
      });
    }

    // Parse wage values
    const annualMedian = parseValue(row['A_MEDIAN'] || row['a_median']);
    const annualMean = parseValue(row['A_MEAN'] || row['a_mean']);
    const hourlyMedian = parseValue(row['H_MEDIAN'] || row['h_median']);
    const hourlyMean = parseValue(row['H_MEAN'] || row['h_mean']);
    const employment = parseValue(row['TOT_EMP'] || row['tot_emp']);
    const locationQuotient = parseValue(row['LOC_QUOTIENT'] || row['loc_quotient']);

    const effectiveAnnualMedian = annualMedian ?? annualMean;
    const effectiveHourlyMedian = hourlyMedian ?? hourlyMean;

    stateWages[stateAbbrev][socCode] = {
      soc_code: socCode,
      title: String(row['OCC_TITLE'] || row['occ_title'] || ''),
      employment,
      hourly: {
        pct_10: parseValue(row['H_PCT10'] || row['h_pct10']),
        pct_25: parseValue(row['H_PCT25'] || row['h_pct25']),
        median: effectiveHourlyMedian,
        pct_75: parseValue(row['H_PCT75'] || row['h_pct75']),
        pct_90: parseValue(row['H_PCT90'] || row['h_pct90']),
        mean: hourlyMean,
      },
      annual: {
        pct_10: parseValue(row['A_PCT10'] || row['a_pct10']),
        pct_25: parseValue(row['A_PCT25'] || row['a_pct25']),
        median: effectiveAnnualMedian,
        pct_75: parseValue(row['A_PCT75'] || row['a_pct75']),
        pct_90: parseValue(row['A_PCT90'] || row['a_pct90']),
        mean: annualMean,
      },
      location_quotient: locationQuotient,
    };
  }

  console.log(`Parsed ${Object.keys(stateWages).length} states with ${occupationCounts.size} unique occupations`);
  console.log(`Total detailed occupation records: ${detailedCount}`);

  const stateData: StateWageOutput = {
    metadata: {
      source: 'BLS_OEWS_STATE',
      year: 2024,
      reference_month: 'May',
      total_states: Object.keys(stateWages).length,
      total_occupations: occupationCounts.size,
      generated_at: new Date().toISOString(),
    },
    data: stateWages,
  };

  return { stateData, stateMetadata };
}

/**
 * Check if cached data exists and is valid.
 */
function loadCachedData<T>(filename: string): T | null {
  const cacheFile = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(cacheFile)) return null;

  try {
    console.log(`Loading cached data from ${filename}...`);
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as T;
  } catch (error) {
    console.log(`Failed to load cache: ${error}`);
    return null;
  }
}

async function main() {
  console.log('\n=== Fetching BLS MSA & State Wage Data ===\n');

  const freshMode = process.argv.includes('--fresh');
  if (freshMode) {
    console.log('Fresh mode: ignoring cache, will re-download and re-parse\n');
  }

  // Try to load cached MSA data
  let msaData: MSAWageOutput | null = null;
  let msaMetadataArray: MSAMetadata[] = [];

  if (!freshMode) {
    msaData = loadCachedData<MSAWageOutput>('msa-wages.json');
  }

  if (!msaData) {
    try {
      const msaFile = await downloadBLSData(BLS_MSA_URL, 'oesm24ma');
      const result = await parseMSAExcel(msaFile);
      msaData = result.msaData;
      msaMetadataArray = Array.from(result.msaMetadata.values());

      // Save MSA data
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'msa-wages.json'),
        JSON.stringify(msaData, null, 2)
      );
      console.log('Saved MSA wage data');

      // Save MSA metadata
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'msa-metadata.json'),
        JSON.stringify({
          metadata: {
            source: 'BLS_OEWS_MSA',
            total_msas: msaMetadataArray.length,
            generated_at: new Date().toISOString(),
          },
          msas: msaMetadataArray,
        }, null, 2)
      );
      console.log('Saved MSA metadata');
    } catch (error) {
      console.error('Failed to fetch/parse MSA data:', error);
    }
  }

  // Try to load cached state data
  let stateData: StateWageOutput | null = null;
  let stateMetadataArray: StateMetadata[] = [];

  if (!freshMode) {
    stateData = loadCachedData<StateWageOutput>('state-wages.json');
  }

  if (!stateData) {
    try {
      const stateFile = await downloadBLSData(BLS_STATE_URL, 'oesm24st');
      const result = await parseStateExcel(stateFile);
      stateData = result.stateData;
      stateMetadataArray = Array.from(result.stateMetadata.values());

      // Save state data
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'state-wages.json'),
        JSON.stringify(stateData, null, 2)
      );
      console.log('Saved state wage data');

      // Save state metadata
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'state-metadata.json'),
        JSON.stringify({
          metadata: {
            source: 'BLS_OEWS_STATE',
            total_states: stateMetadataArray.length,
            generated_at: new Date().toISOString(),
          },
          states: stateMetadataArray,
        }, null, 2)
      );
      console.log('Saved state metadata');
    } catch (error) {
      console.error('Failed to fetch/parse state data:', error);
    }
  }

  // Print summary
  console.log('\n=== Summary ===');
  if (msaData) {
    console.log(`MSA Data: ${msaData.metadata.total_msas} MSAs, ${msaData.metadata.total_occupations} occupations`);

    // Sample some MSAs
    const msaCodes = Object.keys(msaData.data).slice(0, 5);
    console.log('\nSample MSAs:');
    for (const code of msaCodes) {
      const occupations = Object.keys(msaData.data[code]).length;
      const sampleOcc = Object.values(msaData.data[code])[0];
      console.log(`  ${code}: ${occupations} occupations (e.g., ${sampleOcc?.title} - $${sampleOcc?.annual?.median?.toLocaleString() || 'N/A'})`);
    }
  }

  if (stateData) {
    console.log(`\nState Data: ${stateData.metadata.total_states} states, ${stateData.metadata.total_occupations} occupations`);

    // Sample some states
    const stateCodes = Object.keys(stateData.data).slice(0, 5);
    console.log('\nSample States:');
    for (const code of stateCodes) {
      const occupations = Object.keys(stateData.data[code]).length;
      console.log(`  ${code}: ${occupations} occupations`);
    }
  }

  console.log('\n=== BLS MSA & State Wage Fetch Complete ===\n');
}

main().catch(console.error);
