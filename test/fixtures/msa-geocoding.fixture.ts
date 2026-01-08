/**
 * MSA Geocoding Test Fixture
 *
 * Provides mock geocoding data for testing location-related functionality.
 * This fixture mirrors the structure of data/processed/msa-geocoding.json
 * but with a smaller, controlled dataset for predictable testing.
 *
 * Data Source: Mock data based on BLS MSA definitions
 */

export interface MSAMetadata {
  name: string;
  shortName: string;
  states: string[];
  lat?: number | null;
  lng?: number | null;
}

export interface StateMetadata {
  name: string;
  lat?: number | null;
  lng?: number | null;
}

export interface GeocodingData {
  zipToMsa: { [zip: string]: string };
  zipToState: { [zip: string]: string };
  msaMetadata: { [code: string]: MSAMetadata };
  stateMetadata: { [code: string]: StateMetadata };
  searchIndex: { [term: string]: string[] };
}

/**
 * Mock geocoding data for testing.
 * Contains a representative sample of MSAs, states, and ZIP codes.
 */
export const mockGeocodingData: GeocodingData = {
  // ZIP code to MSA mappings
  zipToMsa: {
    // San Francisco Bay Area
    '94123': '41860', // San Francisco
    '94102': '41860',
    '94103': '41860',
    '94107': '41860',
    '94110': '41860',
    '94601': '41860', // Oakland
    '94702': '41860', // Berkeley

    // San Jose/Silicon Valley
    '95101': '41940',
    '95110': '41940',
    '95112': '41940',
    '94301': '41940', // Palo Alto

    // New York
    '10001': '35620',
    '10002': '35620',
    '10003': '35620',
    '10010': '35620',
    '11201': '35620', // Brooklyn

    // Los Angeles
    '90001': '31080',
    '90210': '31080', // Beverly Hills
    '90401': '31080', // Santa Monica

    // Chicago
    '60601': '16980',
    '60602': '16980',
    '60614': '16980',

    // Seattle
    '98101': '42660',
    '98102': '42660',
    '98103': '42660',

    // Denver
    '80202': '19740',
    '80203': '19740',

    // Washington DC
    '20001': '47900',
    '20002': '47900',
    '20036': '47900',

    // Miami
    '33101': '33100',
    '33139': '33100',

    // San Diego
    '92101': '41740',
    '92103': '41740',
  },

  // ZIP code to state mappings (for fallback)
  zipToState: {
    '94123': 'CA',
    '90210': 'CA',
    '10001': 'NY',
    '60601': 'IL',
    '98101': 'WA',
    '80202': 'CO',
    '20001': 'DC',
    '33101': 'FL',
    '99999': 'AK', // Unknown/rural ZIP
  },

  // MSA metadata with coordinates
  msaMetadata: {
    '41860': {
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco, CA',
      states: ['CA'],
      lat: 37.7749,
      lng: -122.4194,
    },
    '41940': {
      name: 'San Jose-Sunnyvale-Santa Clara, CA',
      shortName: 'San Jose, CA',
      states: ['CA'],
      lat: 37.3382,
      lng: -121.8863,
    },
    '35620': {
      name: 'New York-Newark-Jersey City, NY-NJ-PA',
      shortName: 'New York, NY',
      states: ['NY', 'NJ', 'PA'],
      lat: 40.7128,
      lng: -74.006,
    },
    '31080': {
      name: 'Los Angeles-Long Beach-Anaheim, CA',
      shortName: 'Los Angeles, CA',
      states: ['CA'],
      lat: 34.0522,
      lng: -118.2437,
    },
    '16980': {
      name: 'Chicago-Naperville-Elgin, IL-IN-WI',
      shortName: 'Chicago, IL',
      states: ['IL', 'IN', 'WI'],
      lat: 41.8781,
      lng: -87.6298,
    },
    '42660': {
      name: 'Seattle-Tacoma-Bellevue, WA',
      shortName: 'Seattle, WA',
      states: ['WA'],
      lat: 47.6062,
      lng: -122.3321,
    },
    '19740': {
      name: 'Denver-Aurora-Lakewood, CO',
      shortName: 'Denver, CO',
      states: ['CO'],
      lat: 39.7392,
      lng: -104.9903,
    },
    '47900': {
      name: 'Washington-Arlington-Alexandria, DC-VA-MD-WV',
      shortName: 'Washington, DC',
      states: ['DC', 'VA', 'MD', 'WV'],
      lat: 38.9072,
      lng: -77.0369,
    },
    '33100': {
      name: 'Miami-Fort Lauderdale-Pompano Beach, FL',
      shortName: 'Miami, FL',
      states: ['FL'],
      lat: 25.7617,
      lng: -80.1918,
    },
    '41740': {
      name: 'San Diego-Chula Vista-Carlsbad, CA',
      shortName: 'San Diego, CA',
      states: ['CA'],
      lat: 32.7157,
      lng: -117.1611,
    },
  },

  // State metadata with coordinates
  stateMetadata: {
    'CA': {
      name: 'California',
      lat: 36.7783,
      lng: -119.4179,
    },
    'NY': {
      name: 'New York',
      lat: 40.7128,
      lng: -74.006,
    },
    'IL': {
      name: 'Illinois',
      lat: 40.6331,
      lng: -89.3985,
    },
    'WA': {
      name: 'Washington',
      lat: 47.7511,
      lng: -120.7401,
    },
    'CO': {
      name: 'Colorado',
      lat: 39.5501,
      lng: -105.7821,
    },
    'DC': {
      name: 'District of Columbia',
      lat: 38.9072,
      lng: -77.0369,
    },
    'FL': {
      name: 'Florida',
      lat: 27.6648,
      lng: -81.5158,
    },
    'TX': {
      name: 'Texas',
      lat: 31.9686,
      lng: -99.9018,
    },
    'AK': {
      name: 'Alaska',
      lat: 64.2008,
      lng: -152.4937,
    },
    'NJ': {
      name: 'New Jersey',
      lat: 40.0583,
      lng: -74.4057,
    },
    'PA': {
      name: 'Pennsylvania',
      lat: 41.2033,
      lng: -77.1945,
    },
    'WI': {
      name: 'Wisconsin',
      lat: 43.7844,
      lng: -88.7879,
    },
    'IN': {
      name: 'Indiana',
      lat: 40.2672,
      lng: -86.1349,
    },
    'VA': {
      name: 'Virginia',
      lat: 37.4316,
      lng: -78.6569,
    },
    'MD': {
      name: 'Maryland',
      lat: 39.0458,
      lng: -76.6413,
    },
    'WV': {
      name: 'West Virginia',
      lat: 38.5976,
      lng: -80.4549,
    },
  },

  // Search index for fuzzy matching
  searchIndex: {
    'san': ['41860', '41940', '41740', '41700'],
    'francisco': ['41860'],
    'oakland': ['41860'],
    'berkeley': ['41860'],
    'jose': ['41940'],
    'sunnyvale': ['41940'],
    'new': ['35620'],
    'york': ['35620'],
    'newark': ['35620'],
    'jersey': ['35620'],
    'los': ['31080'],
    'angeles': ['31080'],
    'chicago': ['16980'],
    'naperville': ['16980'],
    'seattle': ['42660'],
    'tacoma': ['42660'],
    'denver': ['19740'],
    'aurora': ['19740'],
    'washington': ['47900'],
    'arlington': ['47900'],
    'miami': ['33100'],
    'fort': ['33100'],
    'lauderdale': ['33100'],
    'diego': ['41740'],
    'chula': ['41740'],
    'vista': ['41740'],
    'california': ['CA'],
    'texas': ['TX'],
    'florida': ['FL'],
    'illinois': ['IL'],
  },
};

/**
 * Create a minimal geocoding data object for testing edge cases.
 */
export function createMinimalGeocodingData(): GeocodingData {
  return {
    zipToMsa: {
      '94123': '41860',
    },
    zipToState: {
      '94123': 'CA',
    },
    msaMetadata: {
      '41860': {
        name: 'San Francisco-Oakland-Berkeley, CA',
        shortName: 'San Francisco, CA',
        states: ['CA'],
        lat: 37.7749,
        lng: -122.4194,
      },
    },
    stateMetadata: {
      'CA': {
        name: 'California',
        lat: 36.7783,
        lng: -119.4179,
      },
    },
    searchIndex: {
      'san': ['41860'],
      'francisco': ['41860'],
    },
  };
}

/**
 * Create geocoding data with missing coordinates for testing fallback behavior.
 */
export function createGeocodingDataWithMissingCoords(): GeocodingData {
  return {
    ...mockGeocodingData,
    msaMetadata: {
      ...mockGeocodingData.msaMetadata,
      '99999': {
        name: 'Test MSA Without Coords',
        shortName: 'Test MSA',
        states: ['XX'],
        lat: null,
        lng: null,
      },
    },
  };
}

export default mockGeocodingData;
