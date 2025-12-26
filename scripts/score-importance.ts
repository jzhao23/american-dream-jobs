/**
 * ARCHIVED - National Importance Scoring
 *
 * ⚠️ This script is currently NOT IN USE. The importance feature has been
 * temporarily removed from the UI. All existing importance data has been
 * preserved in: data/archived/importance-scores-backup.json
 *
 * To restore importance scoring:
 * 1. Run this script to regenerate scores
 * 2. Uncomment importance fields in scripts/generate-final.ts
 * 3. Uncomment importance fields in src/types/career.ts
 * 4. Re-add importance UI components to career pages
 *
 * ---
 * Original description:
 * Scores all occupations on a 1-10 scale for importance to US national interest.
 * Aligned with DHS Critical Infrastructure Sectors and DoD priorities.
 *
 * Run: npx tsx scripts/score-importance.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// DHS 16 Critical Infrastructure Sectors
const CRITICAL_INFRASTRUCTURE_PATTERNS: { sector: string; patterns: RegExp[]; weight: number }[] = [
  {
    sector: 'Energy',
    patterns: [/power plant/i, /electric/i, /energy/i, /utility/i, /grid/i, /nuclear/i, /petroleum/i, /oil/i, /gas.*technician/i, /linework/i, /power line/i],
    weight: 10,
  },
  {
    sector: 'Water and Wastewater',
    patterns: [/water.*treatment/i, /wastewater/i, /sewage/i, /water system/i, /water plant/i],
    weight: 9,
  },
  {
    sector: 'Transportation',
    patterns: [/air traffic/i, /pilot/i, /aviation/i, /locomotive/i, /railroad/i, /maritime/i, /ship.*captain/i, /port/i, /transportation.*security/i],
    weight: 9,
  },
  {
    sector: 'Healthcare and Public Health',
    patterns: [/physician/i, /surgeon/i, /nurse/i, /emergency.*medical/i, /paramedic/i, /pharmacist/i, /epidemiolog/i, /public health/i, /hospital/i],
    weight: 9,
  },
  {
    sector: 'Communications',
    patterns: [/telecommunication/i, /broadcast/i, /radio.*engineer/i, /network.*engineer/i, /communication.*technician/i],
    weight: 8,
  },
  {
    sector: 'Defense Industrial Base',
    patterns: [/defense/i, /military/i, /weapon/i, /ammunition/i, /aerospace/i, /aircraft.*mechanic/i, /shipbuilding/i, /armament/i],
    weight: 10,
  },
  {
    sector: 'Critical Manufacturing',
    patterns: [/machinist/i, /tool.*die/i, /welder/i, /metalwork/i, /foundry/i, /steel/i, /semiconductor/i, /manufacturing.*engineer/i],
    weight: 8,
  },
  {
    sector: 'Emergency Services',
    patterns: [/firefighter/i, /police/i, /sheriff/i, /emergency.*dispatch/i, /911/i, /rescue/i, /first responder/i],
    weight: 9,
  },
  {
    sector: 'Food and Agriculture',
    patterns: [/farmer/i, /agricultural.*inspector/i, /food.*safety/i, /veterinarian/i, /meat.*inspector/i, /grain/i],
    weight: 7,
  },
  {
    sector: 'Government',
    patterns: [/federal.*agent/i, /intelligence/i, /border.*patrol/i, /customs/i, /immigration/i, /diplomat/i],
    weight: 8,
  },
  {
    sector: 'Nuclear',
    patterns: [/nuclear.*engineer/i, /nuclear.*technician/i, /reactor/i, /radiation/i],
    weight: 10,
  },
  {
    sector: 'Information Technology',
    patterns: [/cybersecurity/i, /information security/i, /network.*security/i, /security.*analyst/i],
    weight: 8,
  },
  {
    sector: 'Chemical',
    patterns: [/chemical.*engineer/i, /chemical.*plant/i, /hazardous.*material/i, /hazmat/i],
    weight: 7,
  },
  {
    sector: 'Financial Services',
    patterns: [/federal reserve/i, /bank examiner/i, /financial.*regulator/i],
    weight: 6,
  },
  {
    sector: 'Dams',
    patterns: [/dam.*operator/i, /hydroelectric/i, /flood.*control/i],
    weight: 7,
  },
];

// Skilled trades shortage occupations (high importance due to labor shortage)
const SKILLED_TRADES_SHORTAGE = [
  /electrician/i, /plumber/i, /hvac/i, /heating.*cool/i,
  /carpenter/i, /mason/i, /roofer/i,
  /welder/i, /machinist/i, /millwright/i,
  /diesel.*mechanic/i, /heavy.*equipment/i,
  /elevator.*installer/i, /boilermaker/i,
  /ironworker/i, /sheet.*metal/i, /pipefitter/i,
  /lineworker/i, /power.*line/i,
];

// Cannot be offshored (must be done domestically)
const CANNOT_OFFSHORE_PATTERNS = [
  /install/i, /repair/i, /maintain/i,
  /construct/i, /build/i,
  /emergency/i, /firefight/i, /police/i,
  /patient.*care/i, /bedside/i,
  /field.*service/i, /on-site/i,
  /local/i, /community/i,
  /inspect/i, /site/i,
  /truck.*driver/i, /delivery/i,
  /warehouse/i, /logistics.*local/i,
];

// Manufacturing and production (industrial base)
const MANUFACTURING_PATTERNS = [
  /manufactur/i, /produc.*worker/i, /assembl/i,
  /machin/i, /fabricat/i, /weld/i,
  /tool/i, /die/i, /mold/i,
  /foundry/i, /steel/i, /metal/i,
  /electronics.*assembl/i, /semiconductor/i,
  /aerospace/i, /aircraft/i, /automotive/i,
];

// Geopolitical/strategic importance
const GEOPOLITICAL_PATTERNS = [
  /rare earth/i, /mining.*engineer/i,
  /petroleum/i, /oil.*gas/i,
  /nuclear/i, /uranium/i,
  /cyber/i, /intelligence/i,
  /aerospace/i, /defense/i,
  /semiconductor/i, /chip/i,
  /pharmaceutical.*manufact/i, /vaccine/i,
  /shipbuild/i, /naval/i,
];

interface NationalImportanceScore {
  score: number;
  label: 'standard' | 'important' | 'critical';
  flag_count: 1 | 2 | 3;
  rationale: {
    summary: string;
    critical_infrastructure_sector: string | null;
    defense_related: boolean;
    shortage_occupation: boolean;
    cannot_offshore: boolean;
  };
  framework_alignments: { framework: string; aligned: boolean; sector: string | null }[];
  last_assessed: string;
  assessor: 'claude' | 'human_override';
}

function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text));
}

function findMatchingSector(text: string): { sector: string; weight: number } | null {
  for (const ci of CRITICAL_INFRASTRUCTURE_PATTERNS) {
    if (matchesAnyPattern(text, ci.patterns)) {
      return { sector: ci.sector, weight: ci.weight };
    }
  }
  return null;
}

function scoreOccupation(occ: {
  onet_code: string;
  title: string;
  description: string;
  category: string;
  job_zone: number;
  tasks: string[];
}): NationalImportanceScore {
  const allText = [occ.title, occ.description, ...(occ.tasks || [])].join(' ');

  let score = 3.0; // Base score (standard importance)
  let ciSector: string | null = null;
  let isDefenseRelated = false;
  let isShortageOccupation = false;
  let cannotOffshore = false;

  const frameworks: { framework: string; aligned: boolean; sector: string | null }[] = [];

  // 1. Check Critical Infrastructure Sectors (highest weight)
  const matchedCI = findMatchingSector(allText);
  if (matchedCI) {
    ciSector = matchedCI.sector;
    score += matchedCI.weight / 2; // Add up to 5 points
    frameworks.push({
      framework: 'DHS Critical Infrastructure',
      aligned: true,
      sector: matchedCI.sector,
    });
  } else {
    frameworks.push({
      framework: 'DHS Critical Infrastructure',
      aligned: false,
      sector: null,
    });
  }

  // 2. Check defense-related
  if (/defense|military|weapon|ammunition|aerospace|naval|army|navy|air force/i.test(allText)) {
    isDefenseRelated = true;
    score += 2;
    frameworks.push({
      framework: 'Defense Industrial Base',
      aligned: true,
      sector: 'Defense',
    });
  }

  // 3. Check skilled trades shortage
  if (matchesAnyPattern(allText, SKILLED_TRADES_SHORTAGE)) {
    isShortageOccupation = true;
    score += 1.5;
  }

  // 4. Check cannot offshore
  if (matchesAnyPattern(allText, CANNOT_OFFSHORE_PATTERNS)) {
    cannotOffshore = true;
    score += 1;
  }

  // 5. Check manufacturing/production
  if (matchesAnyPattern(allText, MANUFACTURING_PATTERNS)) {
    score += 1;
  }

  // 6. Check geopolitical importance
  if (matchesAnyPattern(allText, GEOPOLITICAL_PATTERNS)) {
    score += 1.5;
  }

  // 7. Category adjustments
  const categoryBonus: Record<string, number> = {
    'Healthcare': 1.5,
    'Protective Services': 1.5,
    'Construction': 1,
    'Installation & Repair': 1,
    'Transportation': 1,
    'Production': 0.5,
    'Military': 2,
    'Agriculture': 0.5,
  };
  score += categoryBonus[occ.category] || 0;

  // Clamp and round
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  // Determine label and flag count
  let label: NationalImportanceScore['label'];
  let flag_count: 1 | 2 | 3;

  if (score >= 7) {
    label = 'critical';
    flag_count = 3;
  } else if (score >= 4) {
    label = 'important';
    flag_count = 2;
  } else {
    label = 'standard';
    flag_count = 1;
  }

  // Generate summary
  let summary = '';
  if (ciSector) {
    summary = `${occ.title} is part of the ${ciSector} critical infrastructure sector, essential for national security and public safety.`;
  } else if (isDefenseRelated) {
    summary = `${occ.title} supports the defense industrial base and national security.`;
  } else if (isShortageOccupation) {
    summary = `${occ.title} addresses a critical skilled trades shortage in the American workforce.`;
  } else if (cannotOffshore) {
    summary = `${occ.title} must be performed domestically, supporting local infrastructure and services.`;
  } else {
    summary = `${occ.title} contributes to the American economy and workforce.`;
  }

  return {
    score,
    label,
    flag_count,
    rationale: {
      summary,
      critical_infrastructure_sector: ciSector,
      defense_related: isDefenseRelated,
      shortage_occupation: isShortageOccupation,
      cannot_offshore: cannotOffshore,
    },
    framework_alignments: frameworks,
    last_assessed: new Date().toISOString().split('T')[0],
    assessor: 'claude',
  };
}

async function main() {
  console.log('\n=== Scoring National Importance ===\n');

  // Load occupations
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  if (!fs.existsSync(occupationsFile)) {
    console.error('Error: occupations_complete.json not found.');
    process.exit(1);
  }

  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Scoring ${occupations.length} occupations...`);

  // Score each occupation
  const scoreDistribution: Record<string, number> = {
    'standard': 0,
    'important': 0,
    'critical': 0,
  };

  const ciSectorCounts: Record<string, number> = {};

  occupations.forEach((occ: {
    onet_code: string;
    title: string;
    description: string;
    category: string;
    job_zone: number;
    tasks: string[];
    national_importance: NationalImportanceScore | null;
  }) => {
    const importance = scoreOccupation(occ);
    occ.national_importance = importance;
    scoreDistribution[importance.label]++;

    if (importance.rationale.critical_infrastructure_sector) {
      const sector = importance.rationale.critical_infrastructure_sector;
      ciSectorCounts[sector] = (ciSectorCounts[sector] || 0) + 1;
    }
  });

  // Update occupations file
  occupationsData.metadata.fields_pending = occupationsData.metadata.fields_pending.filter(
    (f: string) => f !== 'national_importance'
  );
  occupationsData.metadata.last_updated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(occupationsFile, JSON.stringify(occupationsData, null, 2));
  console.log('Updated occupations with national importance scores');

  // Update rationales file
  const rationalesFile = path.join(PROCESSED_DIR, 'ai_risk_rationales.json');
  if (fs.existsSync(rationalesFile)) {
    const rationales = JSON.parse(fs.readFileSync(rationalesFile, 'utf-8'));
    occupations.forEach((occ: { onet_code: string; national_importance: NationalImportanceScore }) => {
      if (rationales.assessments[occ.onet_code]) {
        rationales.assessments[occ.onet_code].national_importance = occ.national_importance;
      }
    });
    rationales.metadata.importance_scored_at = new Date().toISOString().split('T')[0];
    fs.writeFileSync(rationalesFile, JSON.stringify(rationales, null, 2));
    console.log('Updated rationales file with national importance');
  }

  // Print distribution
  console.log('\nNational Importance Distribution:');
  Object.entries(scoreDistribution).forEach(([label, count]) => {
    const pct = ((count / occupations.length) * 100).toFixed(1);
    const flags = label === 'critical' ? '🇺🇸🇺🇸🇺🇸' : label === 'important' ? '🇺🇸🇺🇸' : '🇺🇸';
    console.log(`  ${flags} ${label.padEnd(10)}: ${count.toString().padStart(4)} (${pct}%)`);
  });

  console.log('\nCritical Infrastructure Sectors:');
  Object.entries(ciSectorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sector, count]) => {
      console.log(`  ${sector}: ${count} occupations`);
    });

  // Print examples
  console.log('\nExamples of CRITICAL importance occupations:');
  occupations
    .filter((o: { national_importance: NationalImportanceScore }) => o.national_importance?.label === 'critical')
    .slice(0, 10)
    .forEach((o: { title: string; national_importance: NationalImportanceScore }) => {
      console.log(`  🇺🇸🇺🇸🇺🇸 ${o.title} (${o.national_importance.score})`);
    });

  console.log('\n=== National Importance Scoring Complete ===\n');
}

main().catch(console.error);
