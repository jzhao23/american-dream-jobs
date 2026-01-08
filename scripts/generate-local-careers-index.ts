/**
 * Generate Local Careers Index
 *
 * This script creates a lightweight, frontend-ready index of local career data
 * by combining BLS MSA/state wage data with career metadata.
 *
 * ## How It Works
 * 1. Loads BLS MSA and state wage data (from fetch-bls-msa-wages.ts)
 * 2. Loads career data to map O*NET/SOC codes to career slugs
 * 3. Creates location-specific employment and wage data per career
 * 4. Calculates location quotients (concentration vs national)
 * 5. Pre-computes "local jobs" rankings for each location
 *
 * ## Output Structure
 * The output is designed to be efficiently loaded by the frontend:
 * - Small enough to bundle or lazy-load
 * - Keyed by career slug for O(1) lookups
 * - Pre-computed rankings for Local Jobs page
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/generate-local-careers-index.ts
 * ```
 *
 * ## Output
 * - data/output/local-careers-index.json - Frontend-ready local data
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_DIR = path.join(DATA_DIR, 'output');
const SOURCES_DIR = path.join(DATA_DIR, 'sources/bls-msa');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Type definitions
interface BLSWageData {
  soc_code: string;
  title: string;
  employment: number | null;
  annual: {
    median: number | null;
    mean: number | null;
    pct_10: number | null;
    pct_25: number | null;
    pct_75: number | null;
    pct_90: number | null;
  };
  location_quotient: number | null;
}

interface MSAWageFile {
  metadata: {
    total_msas: number;
    total_occupations: number;
  };
  data: {
    [msaCode: string]: {
      [socCode: string]: BLSWageData;
    };
  };
}

interface StateWageFile {
  metadata: {
    total_states: number;
    total_occupations: number;
  };
  data: {
    [stateCode: string]: {
      [socCode: string]: BLSWageData;
    };
  };
}

interface Career {
  slug: string;
  title: string;
  soc_code: string;
  onet_code: string;
  category: string;
  wages?: {
    annual?: {
      median?: number;
    };
  };
}

interface LocalCareerData {
  employment: number;
  medianWage: number;
  locationQuotient: number;
}

interface LocalJobsRanking {
  fastestGrowing: string[]; // Career slugs
  mostJobs: string[]; // Career slugs
  highConcentration: string[]; // Career slugs with LQ > 1.2
}

interface LocalCareersIndex {
  metadata: {
    source: string;
    generated_at: string;
    total_careers: number;
    total_msas: number;
    total_states: number;
  };
  msas: {
    [msaCode: string]: {
      name: string;
      shortName: string;
      states: string[];
    };
  };
  states: {
    [stateCode: string]: {
      name: string;
    };
  };
  careers: {
    [slug: string]: {
      [locationCode: string]: LocalCareerData;
    };
  };
  localJobs: {
    [locationCode: string]: LocalJobsRanking;
  };
  // National baseline for comparison
  national: {
    [slug: string]: {
      employment: number;
      medianWage: number;
    };
  };
}

/**
 * Load JSON file with error handling.
 */
function loadJSON<T>(filePath: string, description: string): T | null {
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: ${description} not found at ${filePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch (error) {
    console.error(`Error loading ${description}:`, error);
    return null;
  }
}

/**
 * Map SOC code to career slug.
 * Handles both exact matches and base SOC code matches.
 */
function findCareerBySOC(socCode: string, socToSlug: Map<string, string>): string | null {
  // Try exact match first
  if (socToSlug.has(socCode)) {
    return socToSlug.get(socCode)!;
  }

  // Try with .00 suffix
  if (socToSlug.has(`${socCode}.00`)) {
    return socToSlug.get(`${socCode}.00`)!;
  }

  // Try base code (without suffix)
  const baseCode = socCode.split('.')[0];
  if (socToSlug.has(baseCode)) {
    return socToSlug.get(baseCode)!;
  }

  // Try broad occupation code (last digit -> 0)
  const broadCode = baseCode.slice(0, -1) + '0';
  if (socToSlug.has(broadCode)) {
    return socToSlug.get(broadCode)!;
  }

  return null;
}

/**
 * Create short name from full MSA name.
 */
function createShortName(fullName: string): string {
  const match = fullName.match(/^([^-,]+)/);
  return match ? match[1].trim() : fullName;
}

/**
 * Extract states from MSA name.
 */
function extractStates(msaName: string): string[] {
  const match = msaName.match(/,\s*([A-Z-]+)$/);
  return match ? match[1].split('-') : [];
}

async function main() {
  console.log('\n=== Generating Local Careers Index ===\n');

  // Load MSA wage data
  const msaWageData = loadJSON<MSAWageFile>(
    path.join(SOURCES_DIR, 'msa-wages.json'),
    'MSA wage data'
  );

  // Load state wage data
  const stateWageData = loadJSON<StateWageFile>(
    path.join(SOURCES_DIR, 'state-wages.json'),
    'State wage data'
  );

  // Load career data
  const careers = loadJSON<Career[]>(
    path.join(OUTPUT_DIR, 'careers.json'),
    'Career data'
  );

  // Load geocoding data for MSA metadata
  const geocodingData = loadJSON<{
    msaMetadata: { [code: string]: { name: string; shortName: string; states: string[] } };
    stateMetadata: { [code: string]: { name: string } };
  }>(
    path.join(PROCESSED_DIR, 'msa-geocoding.json'),
    'Geocoding data'
  );

  if (!careers) {
    console.error('Cannot proceed without career data. Run data pipeline first.');
    process.exit(1);
  }

  // Build SOC code to slug mapping
  const socToSlug = new Map<string, string>();
  const slugToTitle = new Map<string, string>();
  const slugToNational = new Map<string, { employment: number; medianWage: number }>();

  for (const career of careers) {
    const socCode = career.soc_code || career.onet_code?.split('.')[0];
    if (socCode) {
      socToSlug.set(socCode, career.slug);
      socToSlug.set(career.onet_code, career.slug);
      slugToTitle.set(career.slug, career.title);

      // Store national baseline
      if (career.wages?.annual?.median) {
        slugToNational.set(career.slug, {
          employment: 0, // Will be updated from BLS data
          medianWage: career.wages.annual.median,
        });
      }
    }
  }

  console.log(`Loaded ${careers.length} careers, ${socToSlug.size} SOC mappings`);

  // Initialize output
  const output: LocalCareersIndex = {
    metadata: {
      source: 'BLS_OEWS_MSA_STATE',
      generated_at: new Date().toISOString(),
      total_careers: 0,
      total_msas: 0,
      total_states: 0,
    },
    msas: {},
    states: {},
    careers: {},
    localJobs: {},
    national: {},
  };

  // Process MSA data
  if (msaWageData) {
    console.log(`Processing ${Object.keys(msaWageData.data).length} MSAs...`);
    let matchedOccupations = 0;
    let unmatchedOccupations = 0;

    for (const [msaCode, occupations] of Object.entries(msaWageData.data)) {
      // Get MSA metadata
      const firstOcc = Object.values(occupations)[0];
      const msaName = firstOcc?.title ? '' : ''; // BLS data doesn't include MSA name in occ records
      const geocodedMsa = geocodingData?.msaMetadata?.[msaCode];

      output.msas[msaCode] = {
        name: geocodedMsa?.name || `MSA ${msaCode}`,
        shortName: geocodedMsa?.shortName || createShortName(geocodedMsa?.name || `MSA ${msaCode}`),
        states: geocodedMsa?.states || [],
      };

      // Process occupations
      for (const [socCode, wageData] of Object.entries(occupations)) {
        const slug = findCareerBySOC(socCode, socToSlug);

        if (slug && wageData.employment && wageData.annual?.median) {
          matchedOccupations++;

          if (!output.careers[slug]) {
            output.careers[slug] = {};
          }

          output.careers[slug][msaCode] = {
            employment: wageData.employment,
            medianWage: wageData.annual.median,
            locationQuotient: wageData.location_quotient || 1.0,
          };
        } else if (!slug) {
          unmatchedOccupations++;
        }
      }
    }

    console.log(`MSA processing: ${matchedOccupations} matched, ${unmatchedOccupations} unmatched occupations`);
    output.metadata.total_msas = Object.keys(output.msas).length;
  }

  // Process state data (for rural fallback)
  if (stateWageData) {
    console.log(`Processing ${Object.keys(stateWageData.data).length} states...`);
    let matchedOccupations = 0;

    for (const [stateCode, occupations] of Object.entries(stateWageData.data)) {
      // Get state metadata
      const stateInfo = geocodingData?.stateMetadata?.[stateCode];
      output.states[stateCode] = {
        name: stateInfo?.name || stateCode,
      };

      // Process occupations
      for (const [socCode, wageData] of Object.entries(occupations)) {
        const slug = findCareerBySOC(socCode, socToSlug);

        if (slug && wageData.employment && wageData.annual?.median) {
          matchedOccupations++;

          if (!output.careers[slug]) {
            output.careers[slug] = {};
          }

          // Use state code as location key (e.g., "CA", "TX")
          output.careers[slug][stateCode] = {
            employment: wageData.employment,
            medianWage: wageData.annual.median,
            locationQuotient: wageData.location_quotient || 1.0,
          };

          // Update national baseline employment
          const current = slugToNational.get(slug);
          if (current) {
            // Sum up employment across states as rough national total
            current.employment += wageData.employment;
          }
        }
      }
    }

    console.log(`State processing: ${matchedOccupations} occupation-state combinations`);
    output.metadata.total_states = Object.keys(output.states).length;
  }

  // Copy national baseline
  for (const [slug, data] of slugToNational) {
    output.national[slug] = data;
  }

  // Generate local jobs rankings for each location
  console.log('Generating local jobs rankings...');

  const allLocationCodes = [
    ...Object.keys(output.msas),
    ...Object.keys(output.states),
  ];

  for (const locationCode of allLocationCodes) {
    // Get all careers with data for this location
    const careersInLocation: Array<{
      slug: string;
      employment: number;
      medianWage: number;
      locationQuotient: number;
    }> = [];

    for (const [slug, locations] of Object.entries(output.careers)) {
      if (locations[locationCode]) {
        careersInLocation.push({
          slug,
          ...locations[locationCode],
        });
      }
    }

    // Skip if no careers in this location
    if (careersInLocation.length === 0) continue;

    // Sort for most jobs (top 20)
    const mostJobs = careersInLocation
      .sort((a, b) => b.employment - a.employment)
      .slice(0, 20)
      .map(c => c.slug);

    // Sort for high concentration (LQ > 1.2, top 20)
    const highConcentration = careersInLocation
      .filter(c => c.locationQuotient > 1.2)
      .sort((a, b) => b.locationQuotient - a.locationQuotient)
      .slice(0, 20)
      .map(c => c.slug);

    // Note: "fastest growing" requires historical data (year-over-year)
    // For now, we'll use high concentration + good wages as proxy
    const fastestGrowing = careersInLocation
      .filter(c => c.locationQuotient > 1.0 && c.medianWage > 50000)
      .sort((a, b) => (b.locationQuotient * b.medianWage) - (a.locationQuotient * a.medianWage))
      .slice(0, 20)
      .map(c => c.slug);

    output.localJobs[locationCode] = {
      fastestGrowing,
      mostJobs,
      highConcentration,
    };
  }

  output.metadata.total_careers = Object.keys(output.careers).length;

  // Save output
  const outputPath = path.join(OUTPUT_DIR, 'local-careers-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nSaved local careers index to ${outputPath}`);
  console.log(`Total careers with local data: ${output.metadata.total_careers}`);
  console.log(`Total MSAs: ${output.metadata.total_msas}`);
  console.log(`Total states: ${output.metadata.total_states}`);
  console.log(`Location rankings generated: ${Object.keys(output.localJobs).length}`);

  // Print some samples
  console.log('\nSample career local data:');
  const sampleSlugs = Object.keys(output.careers).slice(0, 3);
  for (const slug of sampleSlugs) {
    const locations = output.careers[slug];
    const locCount = Object.keys(locations).length;
    const sampleLoc = Object.entries(locations)[0];
    if (sampleLoc) {
      console.log(`  ${slug}: ${locCount} locations (e.g., ${sampleLoc[0]}: ${sampleLoc[1].employment.toLocaleString()} jobs, $${sampleLoc[1].medianWage.toLocaleString()})`);
    }
  }

  console.log('\n=== Local Careers Index Generation Complete ===\n');
}

main().catch(console.error);
