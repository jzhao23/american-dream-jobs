/**
 * Fetch BLS Wage Data
 *
 * This script fetches and parses Occupational Employment and Wage Statistics (OEWS)
 * from the Bureau of Labor Statistics (BLS) to enrich career data with accurate salary information.
 *
 * ## Data Source
 * - URL: https://www.bls.gov/oes/special.requests/oesm23nat.zip
 * - Contains: National employment and wage estimates by occupation
 * - Format: Excel XLSX file with detailed wage data
 * - Update frequency: BLS releases new data annually (May estimates)
 *
 * ## How It Works
 * 1. Downloads the BLS OEWS ZIP file containing national wage data
 * 2. Extracts and parses the Excel file using the xlsx library
 * 3. Maps BLS SOC codes (e.g., "29-1211") to O*NET codes (e.g., "29-1211.00")
 * 4. Updates occupations_complete.json with actual wage data
 * 5. Caches parsed data for faster subsequent runs
 *
 * ## BLS Special Codes
 * The BLS uses special codes for suppressed/unavailable data:
 * - "#" = Wage estimate not available (high variability or small sample)
 * - "*" = Employment estimate not available
 * - "**" = Wage estimate above $115.00/hr or $239,200/yr
 *
 * When median is suppressed (common for high-paying jobs like physicians),
 * we fall back to using the mean wage instead.
 *
 * ## SOC Code Mapping
 * BLS uses 6-digit SOC codes (e.g., "29-1211")
 * O*NET uses 8-digit codes with suffix (e.g., "29-1211.00")
 * This script handles the mapping by:
 * 1. First trying exact match with O*NET code
 * 2. Then trying match with base SOC code (without .XX suffix)
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/fetch-bls-wages.ts          # Use cached data if available
 * npx tsx scripts/fetch-bls-wages.ts --fresh  # Force re-download and re-parse
 * ```
 *
 * ## Output
 * - Updates: data/processed/occupations_complete.json
 * - Cache: data/sources/bls/bls_wages_cache.json
 *
 * @see https://www.bls.gov/oes/current/oes_tec.htm for BLS methodology
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const BLS_DATA_URL = 'https://www.bls.gov/oes/special.requests/oesm23nat.zip';
const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/bls');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Ensure directories exist
[OUTPUT_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
}

/**
 * Parse a BLS value, handling special codes for suppressed data.
 * BLS uses these codes:
 * - "#" = Wage estimate not available
 * - "*" = Employment estimate not available
 * - "**" = Wage above $115.00/hr or $239,200/yr
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
async function downloadBLSData(): Promise<string> {
  const zipPath = path.join(OUTPUT_DIR, 'oesm23nat.zip');
  const extractDir = path.join(OUTPUT_DIR, 'oesm23nat');

  // Find existing data file (may be in nested directory)
  const findXlsxFile = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const found = findXlsxFile(fullPath);
        if (found) return found;
      } else if (item.name.endsWith('.xlsx') && item.name.includes('national')) {
        return fullPath;
      }
    }
    return null;
  };

  const existingFile = findXlsxFile(extractDir);
  if (existingFile) {
    console.log(`Using existing BLS data: ${existingFile}`);
    return existingFile;
  }

  console.log('Downloading BLS OEWS data from:', BLS_DATA_URL);

  const response = await fetch(BLS_DATA_URL);
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
    throw new Error('Could not find BLS XLSX data file in extracted contents');
  }

  console.log(`Extracted BLS data: ${dataFile}`);
  return dataFile;
}

/**
 * Parse BLS Excel file and extract wage data by SOC code.
 *
 * BLS XLSX columns:
 * - OCC_CODE: SOC occupation code (e.g., "29-1211")
 * - OCC_TITLE: Occupation title
 * - O_GROUP: "detailed" for specific occupations, "major"/"minor" for aggregates
 * - TOT_EMP: Total employment
 * - H_MEAN, A_MEAN: Mean hourly/annual wage
 * - H_MEDIAN, A_MEDIAN: Median hourly/annual wage
 * - H_PCT10/25/75/90, A_PCT10/25/75/90: Percentile wages
 */
async function parseBLSExcel(filePath: string): Promise<Map<string, BLSWageData>> {
  console.log(`Parsing BLS Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  console.log(`Found ${data.length} rows in BLS data`);

  const wageMap = new Map<string, BLSWageData>();
  let detailedCount = 0;
  let suppressedMedianCount = 0;

  for (const row of data) {
    const socCode = row['OCC_CODE'] as string;
    const oGroup = row['O_GROUP'] as string;

    // Skip invalid codes
    if (!socCode || !socCode.includes('-')) continue;

    // Include "detailed" (specific occupations) and "broad" (aggregates like 13-1020)
    // Skip "major" and "minor" groups which are too aggregate (e.g., 29-0000)
    if (oGroup !== 'detailed' && oGroup !== 'broad') continue;

    detailedCount++;

    // Parse wage values
    const annualMedian = parseValue(row['A_MEDIAN']);
    const annualMean = parseValue(row['A_MEAN']);
    const hourlyMedian = parseValue(row['H_MEDIAN']);
    const hourlyMean = parseValue(row['H_MEAN']);

    // Track suppressed medians (common for high-paying occupations)
    if (annualMedian === null && annualMean !== null) {
      suppressedMedianCount++;
    }

    // Use mean as fallback when median is suppressed
    const effectiveAnnualMedian = annualMedian ?? annualMean;
    const effectiveHourlyMedian = hourlyMedian ?? hourlyMean;

    wageMap.set(socCode, {
      soc_code: socCode,
      title: (row['OCC_TITLE'] as string) || '',
      employment: parseValue(row['TOT_EMP']),
      hourly: {
        pct_10: parseValue(row['H_PCT10']),
        pct_25: parseValue(row['H_PCT25']),
        median: effectiveHourlyMedian,
        pct_75: parseValue(row['H_PCT75']),
        pct_90: parseValue(row['H_PCT90']),
        mean: hourlyMean,
      },
      annual: {
        pct_10: parseValue(row['A_PCT10']),
        pct_25: parseValue(row['A_PCT25']),
        median: effectiveAnnualMedian,
        pct_75: parseValue(row['A_PCT75']),
        pct_90: parseValue(row['A_PCT90']),
        mean: annualMean,
      },
    });
  }

  console.log(`Parsed ${wageMap.size} detailed occupation wage records`);
  console.log(`${suppressedMedianCount} occupations had suppressed medians (using mean as fallback)`);

  return wageMap;
}

/**
 * Load cached wage data if available.
 */
function loadCachedWages(): Map<string, BLSWageData> | null {
  const cacheFile = path.join(OUTPUT_DIR, 'bls_wages_cache.json');
  if (!fs.existsSync(cacheFile)) return null;

  console.log('Loading cached BLS wage data...');
  const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));

  // Check if cache has actual BLS data (mean > 200k exists) vs estimated data
  const hasRealData = Object.values(cached).some(
    (d: unknown) => (d as BLSWageData).annual?.mean && (d as BLSWageData).annual.mean! > 200000
  );

  if (!hasRealData) {
    console.log('Cache contains estimated data, will re-fetch actual BLS data');
    return null;
  }

  const wageMap = new Map<string, BLSWageData>();
  Object.entries(cached).forEach(([code, data]) => {
    wageMap.set(code, data as BLSWageData);
  });

  console.log(`Loaded ${wageMap.size} wage records from cache`);
  return wageMap;
}

/**
 * Generate fallback wage estimates when BLS data is unavailable.
 * This is a last resort - actual BLS data is strongly preferred.
 */
function generateFallbackEstimates(
  occupations: Array<{ onet_code: string; job_zone: number; category: string }>
): Map<string, BLSWageData> {
  console.log('\n⚠️  WARNING: Generating fallback wage estimates (BLS data unavailable)');
  console.log('These estimates are rough approximations. Re-run with --fresh to fetch actual BLS data.\n');

  const wageMap = new Map<string, BLSWageData>();

  // Wage estimates by job zone (rough approximations)
  const jobZoneWages: Record<number, { median: number; low: number; high: number }> = {
    1: { median: 32000, low: 24000, high: 42000 },
    2: { median: 40000, low: 28000, high: 55000 },
    3: { median: 52000, low: 35000, high: 75000 },
    4: { median: 75000, low: 50000, high: 110000 },
    5: { median: 100000, low: 65000, high: 180000 },
  };

  // Category adjustments
  const categoryMultipliers: Record<string, number> = {
    'Technology': 1.3,
    'Healthcare': 1.15,
    'Management': 1.25,
    'Legal': 1.3,
    'Science': 1.1,
    'Business & Finance': 1.1,
    'Construction': 1.05,
    'Installation & Repair': 1.0,
    'Production': 0.95,
    'Transportation': 0.95,
    'Office & Admin': 0.9,
    'Food Service': 0.8,
    'Personal Care': 0.85,
    'Building & Grounds': 0.85,
    'Agriculture': 0.9,
    'Sales': 1.0,
    'Education': 0.95,
    'Arts & Media': 1.0,
    'Social Services': 0.9,
    'Protective Services': 1.05,
    'Military': 1.0,
  };

  occupations.forEach((occ) => {
    const jobZone = occ.job_zone || 3;
    const baseWages = jobZoneWages[jobZone] || jobZoneWages[3];
    const multiplier = categoryMultipliers[occ.category] || 1.0;

    wageMap.set(occ.onet_code, {
      soc_code: occ.onet_code,
      title: '',
      employment: null,
      hourly: {
        pct_10: Math.round(baseWages.low * multiplier * 0.7 / 2080),
        pct_25: Math.round(baseWages.low * multiplier / 2080),
        median: Math.round(baseWages.median * multiplier / 2080),
        pct_75: Math.round(baseWages.high * multiplier * 0.9 / 2080),
        pct_90: Math.round(baseWages.high * multiplier / 2080),
        mean: Math.round(baseWages.median * multiplier * 1.05 / 2080),
      },
      annual: {
        pct_10: Math.round(baseWages.low * multiplier * 0.7),
        pct_25: Math.round(baseWages.low * multiplier),
        median: Math.round(baseWages.median * multiplier),
        pct_75: Math.round(baseWages.high * multiplier * 0.9),
        pct_90: Math.round(baseWages.high * multiplier),
        mean: Math.round(baseWages.median * multiplier * 1.05),
      },
    });
  });

  return wageMap;
}

/**
 * Look up wage data for an O*NET occupation code.
 * Handles the mapping between O*NET 8-digit codes and BLS 6-digit SOC codes.
 *
 * BLS uses broader occupation categories than O*NET. For example:
 * - O*NET: 13-1021.00, 13-1022.00, 13-1023.00 (specific buyer types)
 * - BLS: 13-1020 (Buyers and Purchasing Agents - broad category)
 *
 * This function tries multiple matching strategies:
 * 1. Exact O*NET code match (for fallback estimates)
 * 2. Base SOC code without .XX suffix (29-1211.00 -> 29-1211)
 * 3. Broad occupation code ending in 0 (29-1211 -> 29-1210)
 * 4. Minor group code (29-1211 -> 29-1200)
 */
function lookupWageData(
  onetCode: string,
  wageMap: Map<string, BLSWageData>
): BLSWageData | null {
  // Try exact match first (for fallback estimates that use O*NET codes)
  if (wageMap.has(onetCode)) {
    return wageMap.get(onetCode)!;
  }

  // Try base SOC code (strip .XX suffix)
  // O*NET: "29-1211.00" -> BLS: "29-1211"
  const baseCode = onetCode.split('.')[0];
  if (wageMap.has(baseCode)) {
    return wageMap.get(baseCode)!;
  }

  // Try broad occupation code (last digit -> 0)
  // Example: 13-1021 -> 13-1020 (Buyers and Purchasing Agents)
  const broadCode = baseCode.slice(0, -1) + '0';
  if (wageMap.has(broadCode)) {
    return wageMap.get(broadCode)!;
  }

  // Try minor group code (last two digits -> 00)
  // Example: 29-1211 -> 29-1200
  const minorGroupCode = baseCode.slice(0, -2) + '00';
  if (wageMap.has(minorGroupCode)) {
    return wageMap.get(minorGroupCode)!;
  }

  return null;
}

async function main() {
  console.log('\n=== Fetching BLS Wage Data ===\n');

  const freshMode = process.argv.includes('--fresh');
  if (freshMode) {
    console.log('Fresh mode: ignoring cache, will re-parse BLS data\n');
  }

  // Load occupations from Phase 1
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  if (!fs.existsSync(occupationsFile)) {
    console.error('Error: occupations_complete.json not found. Run process-onet.ts first.');
    process.exit(1);
  }

  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Loaded ${occupations.length} occupations to enrich with wage data`);

  // Get BLS wage data
  let wageMap: Map<string, BLSWageData>;
  let isActualBLSData = false;

  // Try to use cache first (unless --fresh flag)
  if (!freshMode) {
    const cached = loadCachedWages();
    if (cached && cached.size > 0) {
      wageMap = cached;
      isActualBLSData = true;
    } else {
      wageMap = new Map();
    }
  } else {
    wageMap = new Map();
  }

  // If no valid cache, parse from XLSX
  if (wageMap.size === 0) {
    try {
      const dataFile = await downloadBLSData();
      wageMap = await parseBLSExcel(dataFile);
      isActualBLSData = true;
    } catch (error) {
      console.error('Failed to fetch/parse BLS data:', error);
      // Fall back to estimates only if we absolutely must
      wageMap = generateFallbackEstimates(occupations);
      isActualBLSData = false;
    }
  }

  // Update occupations with wage data
  let updatedCount = 0;
  let matchedCount = 0;
  let unmatchedCodes: string[] = [];

  occupations.forEach((occ: {
    onet_code: string;
    title: string;
    wages: unknown;
    data_completeness: { has_wages: boolean; completeness_score: number };
    data_sources: { source: string; url: string; retrieved_at: string }[]
  }) => {
    const wageData = lookupWageData(occ.onet_code, wageMap);

    if (wageData) {
      matchedCount++;

      // Only update if we have actual wage data (at least annual median)
      if (wageData.annual.median !== null || wageData.annual.mean !== null) {
        occ.wages = {
          source: isActualBLSData ? 'BLS_OES' : 'BLS_OES_ESTIMATE',
          year: 2023,
          annual: wageData.annual,
          hourly: wageData.hourly,
          employment_count: wageData.employment,
        };
        occ.data_completeness.has_wages = true;

        // Only add score if not already counted
        if (!occ.data_sources.some((s: { source: string }) => s.source.includes('BLS'))) {
          occ.data_completeness.completeness_score += 30;
        }

        // Update data sources
        const blsSourceIndex = occ.data_sources.findIndex(
          (s: { source: string }) => s.source.includes('BLS')
        );
        const blsSource = {
          source: isActualBLSData ? 'BLS OES (May 2023)' : 'BLS OES (estimated)',
          url: 'https://www.bls.gov/oes/',
          retrieved_at: new Date().toISOString().split('T')[0],
        };

        if (blsSourceIndex >= 0) {
          occ.data_sources[blsSourceIndex] = blsSource;
        } else {
          occ.data_sources.push(blsSource);
        }

        updatedCount++;
      }
    } else {
      unmatchedCodes.push(occ.onet_code);
    }
  });

  // Save updated occupations
  occupationsData.metadata.fields_pending = occupationsData.metadata.fields_pending.filter(
    (f: string) => f !== 'wages'
  );
  occupationsData.metadata.last_updated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(occupationsFile, JSON.stringify(occupationsData, null, 2));
  console.log(`\nUpdated ${updatedCount} occupations with wage data`);
  console.log(`SOC code match rate: ${matchedCount}/${occupations.length} (${Math.round(matchedCount/occupations.length*100)}%)`);

  if (unmatchedCodes.length > 0 && unmatchedCodes.length < 20) {
    console.log(`\nUnmatched O*NET codes (no BLS wage data): ${unmatchedCodes.join(', ')}`);
  } else if (unmatchedCodes.length >= 20) {
    console.log(`\n${unmatchedCodes.length} O*NET codes had no BLS wage data match`);
  }

  // Save wage cache
  const cacheFile = path.join(OUTPUT_DIR, 'bls_wages_cache.json');
  const cacheObj: Record<string, BLSWageData> = {};
  wageMap.forEach((data, code) => {
    cacheObj[code] = data;
  });
  fs.writeFileSync(cacheFile, JSON.stringify(cacheObj, null, 2));
  console.log('Saved wage cache for future runs');

  // Print sample of high-paying occupations to verify data quality
  console.log('\n--- Sample High-Paying Occupations (verification) ---');
  const highPaySamples = occupations
    .filter((occ: { wages?: { annual?: { median?: number } } }) =>
      occ.wages?.annual?.median && occ.wages.annual.median > 150000
    )
    .slice(0, 5);

  highPaySamples.forEach((occ: { title: string; onet_code: string; wages: { annual: { median: number } } }) => {
    console.log(`  ${occ.title} (${occ.onet_code}): $${occ.wages.annual.median.toLocaleString()}/year`);
  });

  // Print some regular samples too
  console.log('\n--- Sample Regular Occupations ---');
  const regularSamples = occupations
    .filter((occ: { wages?: { annual?: { median?: number } } }) =>
      occ.wages?.annual?.median &&
      occ.wages.annual.median > 40000 &&
      occ.wages.annual.median < 80000
    )
    .slice(0, 3);

  regularSamples.forEach((occ: { title: string; onet_code: string; wages: { annual: { median: number } } }) => {
    console.log(`  ${occ.title} (${occ.onet_code}): $${occ.wages.annual.median.toLocaleString()}/year`);
  });

  console.log('\n=== BLS Wage Fetch Complete ===\n');
}

main().catch(console.error);
