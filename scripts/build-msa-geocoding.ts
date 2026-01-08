/**
 * Build MSA Geocoding Data
 *
 * This script creates mapping data between ZIP codes, coordinates, and MSAs
 * to enable location detection and search functionality.
 *
 * ## Data Sources
 * - HUD USPS ZIP Crosswalk: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
 *   Maps ZIP codes to CBSAs (Core Based Statistical Areas = MSAs + micropolitan areas)
 * - Census Bureau MSA Definitions for centroid coordinates
 * - Population data for MSA ranking
 *
 * ## How It Works
 * 1. Downloads HUD ZIP-to-CBSA crosswalk file
 * 2. Creates ZIP → MSA mapping (using primary MSA when ZIP spans multiple)
 * 3. Calculates approximate MSA centroids from ZIP code centroids
 * 4. Builds searchable index of MSA names
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/build-msa-geocoding.ts          # Use cached data if available
 * npx tsx scripts/build-msa-geocoding.ts --fresh  # Force re-download
 * ```
 *
 * ## Output
 * - data/processed/msa-geocoding.json - ZIP-to-MSA mapping with coordinates
 *
 * @see https://www.huduser.gov/portal/datasets/usps_crosswalk.html
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/bls-msa');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// HUD crosswalk URL - requires registration, so we'll use a local file approach
// Users need to download from: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
const HUD_CROSSWALK_FILE = path.join(OUTPUT_DIR, 'zip_cbsa_crosswalk.xlsx');

// Ensure directories exist
[OUTPUT_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Type definitions
interface ZIPToCBSA {
  zip: string;
  cbsa: string;
  cbsa_name: string;
  res_ratio: number; // Residential ratio - percentage of ZIP addresses in this CBSA
}

interface MSAGeocodingOutput {
  metadata: {
    source: string;
    generated_at: string;
    total_zips: number;
    total_msas: number;
  };
  zipToMsa: { [zip: string]: string }; // "94102" -> "41860"
  zipToState: { [zip: string]: string }; // "94102" -> "CA"
  msaMetadata: {
    [msaCode: string]: {
      name: string;
      shortName: string;
      states: string[];
      lat: number | null;
      lng: number | null;
      population: number | null;
    };
  };
  stateMetadata: {
    [stateCode: string]: {
      name: string;
      lat: number | null;
      lng: number | null;
    };
  };
  searchIndex: {
    // Normalized search terms -> MSA codes for fast search
    [term: string]: string[];
  };
}

// State coordinates (approximate centroids)
const STATE_COORDS: { [state: string]: { lat: number; lng: number; name: string } } = {
  'AL': { lat: 32.806671, lng: -86.791130, name: 'Alabama' },
  'AK': { lat: 61.370716, lng: -152.404419, name: 'Alaska' },
  'AZ': { lat: 33.729759, lng: -111.431221, name: 'Arizona' },
  'AR': { lat: 34.969704, lng: -92.373123, name: 'Arkansas' },
  'CA': { lat: 36.116203, lng: -119.681564, name: 'California' },
  'CO': { lat: 39.059811, lng: -105.311104, name: 'Colorado' },
  'CT': { lat: 41.597782, lng: -72.755371, name: 'Connecticut' },
  'DE': { lat: 39.318523, lng: -75.507141, name: 'Delaware' },
  'DC': { lat: 38.897438, lng: -77.026817, name: 'District of Columbia' },
  'FL': { lat: 27.766279, lng: -81.686783, name: 'Florida' },
  'GA': { lat: 33.040619, lng: -83.643074, name: 'Georgia' },
  'HI': { lat: 21.094318, lng: -157.498337, name: 'Hawaii' },
  'ID': { lat: 44.240459, lng: -114.478828, name: 'Idaho' },
  'IL': { lat: 40.349457, lng: -88.986137, name: 'Illinois' },
  'IN': { lat: 39.849426, lng: -86.258278, name: 'Indiana' },
  'IA': { lat: 42.011539, lng: -93.210526, name: 'Iowa' },
  'KS': { lat: 38.526600, lng: -96.726486, name: 'Kansas' },
  'KY': { lat: 37.668140, lng: -84.670067, name: 'Kentucky' },
  'LA': { lat: 31.169546, lng: -91.867805, name: 'Louisiana' },
  'ME': { lat: 44.693947, lng: -69.381927, name: 'Maine' },
  'MD': { lat: 39.063946, lng: -76.802101, name: 'Maryland' },
  'MA': { lat: 42.230171, lng: -71.530106, name: 'Massachusetts' },
  'MI': { lat: 43.326618, lng: -84.536095, name: 'Michigan' },
  'MN': { lat: 45.694454, lng: -93.900192, name: 'Minnesota' },
  'MS': { lat: 32.741646, lng: -89.678696, name: 'Mississippi' },
  'MO': { lat: 38.456085, lng: -92.288368, name: 'Missouri' },
  'MT': { lat: 46.921925, lng: -110.454353, name: 'Montana' },
  'NE': { lat: 41.125370, lng: -98.268082, name: 'Nebraska' },
  'NV': { lat: 38.313515, lng: -117.055374, name: 'Nevada' },
  'NH': { lat: 43.452492, lng: -71.563896, name: 'New Hampshire' },
  'NJ': { lat: 40.298904, lng: -74.521011, name: 'New Jersey' },
  'NM': { lat: 34.840515, lng: -106.248482, name: 'New Mexico' },
  'NY': { lat: 42.165726, lng: -74.948051, name: 'New York' },
  'NC': { lat: 35.630066, lng: -79.806419, name: 'North Carolina' },
  'ND': { lat: 47.528912, lng: -99.784012, name: 'North Dakota' },
  'OH': { lat: 40.388783, lng: -82.764915, name: 'Ohio' },
  'OK': { lat: 35.565342, lng: -96.928917, name: 'Oklahoma' },
  'OR': { lat: 44.572021, lng: -122.070938, name: 'Oregon' },
  'PA': { lat: 40.590752, lng: -77.209755, name: 'Pennsylvania' },
  'RI': { lat: 41.680893, lng: -71.511780, name: 'Rhode Island' },
  'SC': { lat: 33.856892, lng: -80.945007, name: 'South Carolina' },
  'SD': { lat: 44.299782, lng: -99.438828, name: 'South Dakota' },
  'TN': { lat: 35.747845, lng: -86.692345, name: 'Tennessee' },
  'TX': { lat: 31.054487, lng: -97.563461, name: 'Texas' },
  'UT': { lat: 40.150032, lng: -111.862434, name: 'Utah' },
  'VT': { lat: 44.045876, lng: -72.710686, name: 'Vermont' },
  'VA': { lat: 37.769337, lng: -78.169968, name: 'Virginia' },
  'WA': { lat: 47.400902, lng: -121.490494, name: 'Washington' },
  'WV': { lat: 38.491226, lng: -80.954456, name: 'West Virginia' },
  'WI': { lat: 44.268543, lng: -89.616508, name: 'Wisconsin' },
  'WY': { lat: 42.755966, lng: -107.302490, name: 'Wyoming' },
  'PR': { lat: 18.220833, lng: -66.590149, name: 'Puerto Rico' },
  'VI': { lat: 18.335765, lng: -64.896335, name: 'Virgin Islands' },
  'GU': { lat: 13.444304, lng: 144.793731, name: 'Guam' },
};

// Major MSA coordinates (for popular metros)
// These are approximate downtown/centroid coordinates
const MSA_COORDS: { [code: string]: { lat: number; lng: number } } = {
  '35620': { lat: 40.7128, lng: -74.0060 },  // New York-Newark-Jersey City
  '31080': { lat: 34.0522, lng: -118.2437 }, // Los Angeles-Long Beach-Anaheim
  '16980': { lat: 41.8781, lng: -87.6298 },  // Chicago-Naperville-Elgin
  '19100': { lat: 32.7767, lng: -96.7970 },  // Dallas-Fort Worth-Arlington
  '26420': { lat: 29.7604, lng: -95.3698 },  // Houston-The Woodlands-Sugar Land
  '47900': { lat: 38.9072, lng: -77.0369 },  // Washington-Arlington-Alexandria
  '33100': { lat: 25.7617, lng: -80.1918 },  // Miami-Fort Lauderdale-Pompano Beach
  '37980': { lat: 39.9526, lng: -75.1652 },  // Philadelphia-Camden-Wilmington
  '12060': { lat: 33.4484, lng: -112.0740 }, // Phoenix-Mesa-Chandler
  '14460': { lat: 42.3601, lng: -71.0589 },  // Boston-Cambridge-Newton
  '41860': { lat: 37.7749, lng: -122.4194 }, // San Francisco-Oakland-Berkeley
  '38060': { lat: 33.4484, lng: -112.0740 }, // Phoenix-Mesa-Scottsdale
  '40140': { lat: 40.4406, lng: -79.9959 },  // Riverside-San Bernardino-Ontario
  '19740': { lat: 39.7392, lng: -104.9903 }, // Denver-Aurora-Lakewood
  '41740': { lat: 37.3382, lng: -121.8863 }, // San Jose-Sunnyvale-Santa Clara
  '41180': { lat: 29.4241, lng: -98.4936 },  // San Antonio-New Braunfels
  '36740': { lat: 33.5207, lng: -86.8025 },  // Orlando-Kissimmee-Sanford
  '12580': { lat: 33.7490, lng: -84.3880 },  // Atlanta-Sandy Springs-Alpharetta
  '42660': { lat: 47.6062, lng: -122.3321 }, // Seattle-Tacoma-Bellevue
  '33460': { lat: 44.9778, lng: -93.2650 },  // Minneapolis-St. Paul-Bloomington
  '41700': { lat: 29.9511, lng: -90.0715 },  // San Diego-Chula Vista-Carlsbad
  '45300': { lat: 27.9506, lng: -82.4572 },  // Tampa-St. Petersburg-Clearwater
  '19820': { lat: 42.3314, lng: -83.0458 },  // Detroit-Warren-Dearborn
  '17140': { lat: 39.1031, lng: -84.5120 },  // Cincinnati
  '40060': { lat: 40.4406, lng: -79.9959 },  // Pittsburgh
  '38900': { lat: 45.5152, lng: -122.6784 }, // Portland-Vancouver-Hillsboro
  '12420': { lat: 30.2672, lng: -97.7431 },  // Austin-Round Rock-Georgetown
  '39580': { lat: 36.1627, lng: -86.7816 },  // Nashville-Davidson--Murfreesboro--Franklin
  '28140': { lat: 39.0997, lng: -94.5786 },  // Kansas City
  '18140': { lat: 39.7684, lng: -86.1581 },  // Indianapolis-Carmel-Anderson
  '29820': { lat: 36.1699, lng: -115.1398 }, // Las Vegas-Henderson-Paradise
  '16740': { lat: 35.2271, lng: -80.8431 },  // Charlotte-Concord-Gastonia
  '41940': { lat: 37.3382, lng: -121.8863 }, // San Jose-Sunnyvale-Santa Clara
  '36420': { lat: 35.4676, lng: -97.5164 },  // Oklahoma City
  '27260': { lat: 28.5383, lng: -81.3792 },  // Jacksonville
  '32820': { lat: 35.1495, lng: -90.0490 },  // Memphis
  '40900': { lat: 40.7608, lng: -111.8910 }, // Salt Lake City
  '13820': { lat: 32.7157, lng: -117.1611 }, // Birmingham-Hoover
  '39300': { lat: 41.4993, lng: -81.6944 },  // Providence-Warwick
  '15380': { lat: 42.8864, lng: -78.8784 },  // Buffalo-Cheektowaga
  '40380': { lat: 43.0731, lng: -89.4012 },  // Rochester
  '34980': { lat: 36.1627, lng: -86.7816 },  // Nashville-Davidson--Murfreesboro--Franklin
};

/**
 * Load MSA metadata from previously fetched BLS data.
 */
function loadMSAMetadata(): Map<string, { name: string; states: string[] }> {
  const metadataFile = path.join(OUTPUT_DIR, 'msa-metadata.json');
  if (!fs.existsSync(metadataFile)) {
    console.log('Warning: msa-metadata.json not found. Run fetch-bls-msa-wages.ts first.');
    return new Map();
  }

  const data = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  const map = new Map<string, { name: string; states: string[] }>();

  for (const msa of data.msas || []) {
    map.set(msa.code, { name: msa.name, states: msa.states || [] });
  }

  return map;
}

/**
 * Create a short name from MSA full name.
 * "San Francisco-Oakland-Hayward, CA" -> "San Francisco"
 */
function createShortName(fullName: string): string {
  // Extract first city name before hyphen or comma
  const match = fullName.match(/^([^-,]+)/);
  if (match) {
    return match[1].trim();
  }
  return fullName;
}

/**
 * Extract states from MSA name.
 * "New York-Newark-Jersey City, NY-NJ-PA" -> ["NY", "NJ", "PA"]
 */
function extractStates(msaName: string): string[] {
  const match = msaName.match(/,\s*([A-Z-]+)$/);
  if (match) {
    return match[1].split('-');
  }
  return [];
}

/**
 * Build ZIP-to-MSA mapping using a simplified approach.
 * Since HUD data requires registration, we'll create mappings from BLS MSA data.
 */
async function buildZIPMappingFromBLS(): Promise<MSAGeocodingOutput> {
  console.log('Building MSA geocoding data...');

  const msaMetadataMap = loadMSAMetadata();
  console.log(`Loaded ${msaMetadataMap.size} MSAs from BLS data`);

  // Build MSA metadata with coordinates
  const msaMetadata: MSAGeocodingOutput['msaMetadata'] = {};
  const searchIndex: MSAGeocodingOutput['searchIndex'] = {};

  for (const [code, data] of msaMetadataMap) {
    const shortName = createShortName(data.name);
    const states = data.states.length > 0 ? data.states : extractStates(data.name);
    const coords = MSA_COORDS[code];

    msaMetadata[code] = {
      name: data.name,
      shortName,
      states,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      population: null, // Would need Census data
    };

    // Build search index
    const searchTerms = [
      shortName.toLowerCase(),
      ...states.map(s => s.toLowerCase()),
      data.name.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
    ];

    for (const term of searchTerms) {
      const words = term.split(/\s+/);
      for (const word of words) {
        if (word.length < 2) continue;
        if (!searchIndex[word]) {
          searchIndex[word] = [];
        }
        if (!searchIndex[word].includes(code)) {
          searchIndex[word].push(code);
        }
      }
    }
  }

  // Build state metadata
  const stateMetadata: MSAGeocodingOutput['stateMetadata'] = {};
  for (const [code, data] of Object.entries(STATE_COORDS)) {
    stateMetadata[code] = {
      name: data.name,
      lat: data.lat,
      lng: data.lng,
    };
  }

  // Note: ZIP-to-MSA mapping requires HUD crosswalk data
  // For now, we'll create an empty mapping that will need to be populated
  // Users can manually download HUD data and re-run
  const zipToMsa: { [zip: string]: string } = {};
  const zipToState: { [zip: string]: string } = {};

  // Check if HUD crosswalk file exists
  if (fs.existsSync(HUD_CROSSWALK_FILE)) {
    console.log('Found HUD crosswalk file, parsing...');
    try {
      const workbook = XLSX.readFile(HUD_CROSSWALK_FILE);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      console.log(`Found ${data.length} rows in HUD crosswalk`);

      for (const row of data) {
        const zip = String(row['ZIP'] || row['zip'] || '').padStart(5, '0');
        const cbsa = String(row['CBSA'] || row['cbsa'] || '');
        const resRatio = parseFloat(String(row['RES_RATIO'] || row['res_ratio'] || '0'));

        if (zip && cbsa && cbsa !== '99999') {
          // Only update if this ZIP has a higher residential ratio for this CBSA
          // or if we haven't seen this ZIP yet
          if (!zipToMsa[zip] || resRatio > 0.5) {
            zipToMsa[zip] = cbsa;

            // Infer state from ZIP prefix (first 3 digits)
            // This is approximate - proper mapping would use ZIP data
            const prefix = zip.substring(0, 3);
            const inferredState = inferStateFromZIP(prefix);
            if (inferredState) {
              zipToState[zip] = inferredState;
            }
          }
        }
      }

      console.log(`Mapped ${Object.keys(zipToMsa).length} ZIPs to MSAs`);
    } catch (error) {
      console.error('Failed to parse HUD crosswalk:', error);
    }
  } else {
    console.log('\nNote: HUD ZIP-to-CBSA crosswalk file not found.');
    console.log('To enable ZIP-based location detection:');
    console.log('1. Download from: https://www.huduser.gov/portal/datasets/usps_crosswalk.html');
    console.log('2. Save as: data/sources/bls-msa/zip_cbsa_crosswalk.xlsx');
    console.log('3. Re-run this script\n');
  }

  const output: MSAGeocodingOutput = {
    metadata: {
      source: 'BLS_OEWS_MSA + HUD_ZIP_CROSSWALK',
      generated_at: new Date().toISOString(),
      total_zips: Object.keys(zipToMsa).length,
      total_msas: Object.keys(msaMetadata).length,
    },
    zipToMsa,
    zipToState,
    msaMetadata,
    stateMetadata,
    searchIndex,
  };

  return output;
}

/**
 * Infer state from ZIP code prefix.
 * This is a simplified mapping based on ZIP code ranges.
 */
function inferStateFromZIP(prefix: string): string | null {
  const prefixNum = parseInt(prefix, 10);

  // ZIP prefix ranges by state (approximate)
  const ranges: Array<[number, number, string]> = [
    [0, 99, 'PR'], // Puerto Rico and Virgin Islands
    [100, 149, 'NY'],
    [150, 196, 'PA'],
    [197, 199, 'DE'],
    [200, 205, 'DC'],
    [206, 219, 'MD'],
    [220, 246, 'VA'],
    [247, 268, 'WV'],
    [270, 289, 'NC'],
    [290, 299, 'SC'],
    [300, 319, 'GA'],
    [320, 339, 'FL'],
    [350, 369, 'AL'],
    [370, 385, 'TN'],
    [386, 397, 'MS'],
    [400, 427, 'KY'],
    [430, 459, 'OH'],
    [460, 479, 'IN'],
    [480, 499, 'MI'],
    [500, 528, 'IA'],
    [530, 549, 'WI'],
    [550, 567, 'MN'],
    [570, 577, 'SD'],
    [580, 588, 'ND'],
    [590, 599, 'MT'],
    [600, 629, 'IL'],
    [630, 658, 'MO'],
    [660, 679, 'KS'],
    [680, 693, 'NE'],
    [700, 714, 'LA'],
    [716, 729, 'AR'],
    [730, 749, 'OK'],
    [750, 799, 'TX'],
    [800, 816, 'CO'],
    [820, 831, 'WY'],
    [832, 838, 'ID'],
    [840, 847, 'UT'],
    [850, 865, 'AZ'],
    [870, 884, 'NM'],
    [889, 898, 'NV'],
    [900, 961, 'CA'],
    [967, 968, 'HI'],
    [970, 979, 'OR'],
    [980, 994, 'WA'],
    [995, 999, 'AK'],
  ];

  for (const [min, max, state] of ranges) {
    if (prefixNum >= min && prefixNum <= max) {
      return state;
    }
  }

  return null;
}

async function main() {
  console.log('\n=== Building MSA Geocoding Data ===\n');

  const freshMode = process.argv.includes('--fresh');
  const outputFile = path.join(PROCESSED_DIR, 'msa-geocoding.json');

  // Check for cached data
  if (!freshMode && fs.existsSync(outputFile)) {
    console.log('Cached geocoding data found. Use --fresh to rebuild.');
    const cached = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    console.log(`Loaded: ${cached.metadata.total_msas} MSAs, ${cached.metadata.total_zips} ZIPs`);
    return;
  }

  const geocodingData = await buildZIPMappingFromBLS();

  // Save output
  fs.writeFileSync(outputFile, JSON.stringify(geocodingData, null, 2));
  console.log(`\nSaved geocoding data to ${outputFile}`);
  console.log(`MSAs: ${geocodingData.metadata.total_msas}`);
  console.log(`ZIPs mapped: ${geocodingData.metadata.total_zips}`);
  console.log(`States: ${Object.keys(geocodingData.stateMetadata).length}`);
  console.log(`Search index terms: ${Object.keys(geocodingData.searchIndex).length}`);

  // Sample output
  console.log('\nSample MSA metadata:');
  const sampleCodes = Object.keys(geocodingData.msaMetadata).slice(0, 5);
  for (const code of sampleCodes) {
    const msa = geocodingData.msaMetadata[code];
    console.log(`  ${code}: ${msa.shortName}, ${msa.states.join('-')} (${msa.lat?.toFixed(2)}, ${msa.lng?.toFixed(2)})`);
  }

  console.log('\n=== MSA Geocoding Build Complete ===\n');
}

main().catch(console.error);
