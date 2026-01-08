/**
 * Local Careers Index Test Fixture
 *
 * Provides mock local career employment data for testing.
 * This fixture mirrors the structure of data/output/local-careers-index.json
 * but with a smaller, controlled dataset for predictable testing.
 *
 * Data Source: Mock data based on BLS OEWS May 2024
 */

export interface LocalCareerData {
  employment: number;
  medianWage: number;
  locationQuotient: number;
}

export interface LocalCareersIndex {
  metadata: {
    source: string;
    generated_at: string;
    total_careers: number;
    total_msas: number;
    total_states: number;
  };
  msas: {
    [code: string]: {
      name: string;
      shortName: string;
      states: string[];
    };
  };
  states: {
    [code: string]: {
      name: string;
    };
  };
  careers: {
    [slug: string]: {
      [locationCode: string]: LocalCareerData;
    };
  };
  localJobs: {
    [locationCode: string]: {
      fastestGrowing: string[];
      mostJobs: string[];
      highConcentration: string[];
    };
  };
  national: {
    [slug: string]: {
      employment: number;
      medianWage: number;
    };
  };
}

/**
 * Mock local careers index for testing.
 */
export const mockLocalCareersIndex: LocalCareersIndex = {
  metadata: {
    source: 'Mock BLS OEWS Data for Testing',
    generated_at: '2025-01-08T00:00:00Z',
    total_careers: 10,
    total_msas: 5,
    total_states: 5,
  },

  msas: {
    '41860': {
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco, CA',
      states: ['CA'],
    },
    '35620': {
      name: 'New York-Newark-Jersey City, NY-NJ-PA',
      shortName: 'New York, NY',
      states: ['NY', 'NJ', 'PA'],
    },
    '31080': {
      name: 'Los Angeles-Long Beach-Anaheim, CA',
      shortName: 'Los Angeles, CA',
      states: ['CA'],
    },
    '42660': {
      name: 'Seattle-Tacoma-Bellevue, WA',
      shortName: 'Seattle, WA',
      states: ['WA'],
    },
    '16980': {
      name: 'Chicago-Naperville-Elgin, IL-IN-WI',
      shortName: 'Chicago, IL',
      states: ['IL', 'IN', 'WI'],
    },
  },

  states: {
    'CA': { name: 'California' },
    'NY': { name: 'New York' },
    'TX': { name: 'Texas' },
    'WA': { name: 'Washington' },
    'IL': { name: 'Illinois' },
  },

  careers: {
    'software-developers': {
      '41860': { employment: 89450, medianWage: 175000, locationQuotient: 2.3 },
      '35620': { employment: 134500, medianWage: 145000, locationQuotient: 1.8 },
      '31080': { employment: 98000, medianWage: 140000, locationQuotient: 1.5 },
      '42660': { employment: 82000, medianWage: 165000, locationQuotient: 2.1 },
      'CA': { employment: 450000, medianWage: 160000, locationQuotient: 2.1 },
    },
    'registered-nurses': {
      '41860': { employment: 42000, medianWage: 145000, locationQuotient: 1.1 },
      '35620': { employment: 185000, medianWage: 98000, locationQuotient: 1.3 },
      '31080': { employment: 125000, medianWage: 110000, locationQuotient: 1.0 },
      '16980': { employment: 98000, medianWage: 82000, locationQuotient: 1.1 },
      'CA': { employment: 350000, medianWage: 120000, locationQuotient: 1.2 },
    },
    'electricians': {
      '41860': { employment: 12500, medianWage: 95000, locationQuotient: 1.2 },
      '35620': { employment: 38000, medianWage: 78000, locationQuotient: 1.4 },
      '31080': { employment: 28000, medianWage: 72000, locationQuotient: 1.1 },
      '16980': { employment: 24000, medianWage: 75000, locationQuotient: 1.3 },
      'CA': { employment: 85000, medianWage: 78000, locationQuotient: 1.1 },
    },
    'data-scientists': {
      '41860': { employment: 12000, medianWage: 165000, locationQuotient: 3.2 },
      '35620': { employment: 18000, medianWage: 135000, locationQuotient: 2.0 },
      '42660': { employment: 8500, medianWage: 155000, locationQuotient: 2.8 },
      'CA': { employment: 48000, medianWage: 155000, locationQuotient: 2.5 },
    },
    'web-developers': {
      '41860': { employment: 15000, medianWage: 125000, locationQuotient: 2.0 },
      '35620': { employment: 28000, medianWage: 95000, locationQuotient: 1.5 },
      '31080': { employment: 22000, medianWage: 90000, locationQuotient: 1.3 },
      '42660': { employment: 18000, medianWage: 110000, locationQuotient: 1.8 },
      'CA': { employment: 75000, medianWage: 105000, locationQuotient: 1.6 },
    },
    'accountants': {
      '35620': { employment: 95000, medianWage: 92000, locationQuotient: 1.5 },
      '16980': { employment: 55000, medianWage: 78000, locationQuotient: 1.2 },
      'CA': { employment: 185000, medianWage: 85000, locationQuotient: 1.2 },
      'NY': { employment: 120000, medianWage: 90000, locationQuotient: 1.4 },
    },
    'plumbers': {
      '41860': { employment: 8500, medianWage: 88000, locationQuotient: 1.1 },
      '35620': { employment: 28000, medianWage: 72000, locationQuotient: 1.2 },
      '31080': { employment: 19000, medianWage: 68000, locationQuotient: 1.0 },
      'CA': { employment: 62000, medianWage: 72000, locationQuotient: 1.0 },
    },
    'truck-drivers': {
      '31080': { employment: 85000, medianWage: 52000, locationQuotient: 1.3 },
      '16980': { employment: 68000, medianWage: 55000, locationQuotient: 1.2 },
      'CA': { employment: 185000, medianWage: 55000, locationQuotient: 1.1 },
      'TX': { employment: 220000, medianWage: 48000, locationQuotient: 1.5 },
    },
    'medical-assistants': {
      '35620': { employment: 45000, medianWage: 42000, locationQuotient: 1.0 },
      '31080': { employment: 52000, medianWage: 40000, locationQuotient: 1.1 },
      '41860': { employment: 18000, medianWage: 52000, locationQuotient: 0.9 },
      'CA': { employment: 125000, medianWage: 45000, locationQuotient: 1.0 },
    },
    'cybersecurity-analysts': {
      '41860': { employment: 8500, medianWage: 145000, locationQuotient: 1.8 },
      '35620': { employment: 18000, medianWage: 115000, locationQuotient: 1.4 },
      '42660': { employment: 6500, medianWage: 135000, locationQuotient: 1.9 },
      'CA': { employment: 32000, medianWage: 135000, locationQuotient: 1.6 },
    },
  },

  localJobs: {
    '41860': {
      fastestGrowing: ['data-scientists', 'cybersecurity-analysts', 'software-developers'],
      mostJobs: ['software-developers', 'registered-nurses', 'medical-assistants'],
      highConcentration: ['data-scientists', 'software-developers', 'web-developers'],
    },
    '35620': {
      fastestGrowing: ['data-scientists', 'cybersecurity-analysts', 'web-developers'],
      mostJobs: ['registered-nurses', 'software-developers', 'accountants'],
      highConcentration: ['data-scientists', 'software-developers', 'accountants'],
    },
    '31080': {
      fastestGrowing: ['software-developers', 'data-scientists', 'web-developers'],
      mostJobs: ['registered-nurses', 'software-developers', 'truck-drivers'],
      highConcentration: ['software-developers', 'web-developers', 'electricians'],
    },
    '42660': {
      fastestGrowing: ['data-scientists', 'cybersecurity-analysts', 'software-developers'],
      mostJobs: ['software-developers', 'web-developers', 'data-scientists'],
      highConcentration: ['data-scientists', 'software-developers', 'cybersecurity-analysts'],
    },
    'CA': {
      fastestGrowing: ['data-scientists', 'cybersecurity-analysts', 'software-developers'],
      mostJobs: ['software-developers', 'registered-nurses', 'truck-drivers'],
      highConcentration: ['data-scientists', 'software-developers', 'web-developers'],
    },
    'NY': {
      fastestGrowing: ['data-scientists', 'software-developers', 'accountants'],
      mostJobs: ['accountants', 'registered-nurses', 'software-developers'],
      highConcentration: ['accountants', 'data-scientists', 'software-developers'],
    },
  },

  national: {
    'software-developers': { employment: 1850000, medianWage: 130000 },
    'registered-nurses': { employment: 3100000, medianWage: 81000 },
    'electricians': { employment: 750000, medianWage: 60500 },
    'data-scientists': { employment: 190000, medianWage: 108000 },
    'web-developers': { employment: 180000, medianWage: 78000 },
    'accountants': { employment: 1400000, medianWage: 78000 },
    'plumbers': { employment: 480000, medianWage: 60000 },
    'truck-drivers': { employment: 2100000, medianWage: 48000 },
    'medical-assistants': { employment: 750000, medianWage: 38000 },
    'cybersecurity-analysts': { employment: 165000, medianWage: 112000 },
  },
};

/**
 * Mock careers data array (simulating careers.json).
 */
export const mockCareers = [
  {
    slug: 'software-developers',
    title: 'Software Developer',
    category: 'technology',
    ai_resilience: 'AI-Augmented',
    median_pay: 130000,
    training_time: '4+yr',
  },
  {
    slug: 'registered-nurses',
    title: 'Registered Nurse',
    category: 'healthcare',
    ai_resilience: 'AI-Resilient',
    median_pay: 81000,
    training_time: '2-4yr',
  },
  {
    slug: 'electricians',
    title: 'Electrician',
    category: 'trades',
    ai_resilience: 'AI-Resilient',
    median_pay: 60500,
    training_time: '2-4yr',
  },
  {
    slug: 'data-scientists',
    title: 'Data Scientist',
    category: 'technology',
    ai_resilience: 'AI-Augmented',
    median_pay: 108000,
    training_time: '4+yr',
  },
  {
    slug: 'web-developers',
    title: 'Web Developer',
    category: 'technology',
    ai_resilience: 'In Transition',
    median_pay: 78000,
    training_time: '6-24mo',
  },
  {
    slug: 'accountants',
    title: 'Accountant',
    category: 'business',
    ai_resilience: 'In Transition',
    median_pay: 78000,
    training_time: '4+yr',
  },
  {
    slug: 'plumbers',
    title: 'Plumber',
    category: 'trades',
    ai_resilience: 'AI-Resilient',
    median_pay: 60000,
    training_time: '2-4yr',
  },
  {
    slug: 'truck-drivers',
    title: 'Truck Driver',
    category: 'transportation',
    ai_resilience: 'High Disruption Risk',
    median_pay: 48000,
    training_time: '<6mo',
  },
  {
    slug: 'medical-assistants',
    title: 'Medical Assistant',
    category: 'healthcare',
    ai_resilience: 'AI-Resilient',
    median_pay: 38000,
    training_time: '<6mo',
  },
  {
    slug: 'cybersecurity-analysts',
    title: 'Cybersecurity Analyst',
    category: 'technology',
    ai_resilience: 'AI-Augmented',
    median_pay: 112000,
    training_time: '4+yr',
  },
];

/**
 * Create a minimal local careers index for testing edge cases.
 */
export function createMinimalLocalCareersIndex(): LocalCareersIndex {
  return {
    metadata: {
      source: 'Minimal Mock Data',
      generated_at: '2025-01-08T00:00:00Z',
      total_careers: 1,
      total_msas: 1,
      total_states: 1,
    },
    msas: {
      '41860': {
        name: 'San Francisco-Oakland-Berkeley, CA',
        shortName: 'San Francisco, CA',
        states: ['CA'],
      },
    },
    states: {
      'CA': { name: 'California' },
    },
    careers: {
      'software-developers': {
        '41860': { employment: 89450, medianWage: 175000, locationQuotient: 2.3 },
        'CA': { employment: 450000, medianWage: 160000, locationQuotient: 2.1 },
      },
    },
    localJobs: {
      '41860': {
        fastestGrowing: ['software-developers'],
        mostJobs: ['software-developers'],
        highConcentration: ['software-developers'],
      },
    },
    national: {
      'software-developers': { employment: 1850000, medianWage: 130000 },
    },
  };
}

/**
 * Create local careers index with missing data for testing error handling.
 */
export function createLocalCareersIndexWithGaps(): LocalCareersIndex {
  return {
    ...mockLocalCareersIndex,
    careers: {
      ...mockLocalCareersIndex.careers,
      'rare-career': {
        // Only exists in one location
        '41860': { employment: 100, medianWage: 50000, locationQuotient: 0.5 },
      },
    },
    localJobs: {
      ...mockLocalCareersIndex.localJobs,
      '99999': {
        // Location with no career data
        fastestGrowing: [],
        mostJobs: [],
        highConcentration: [],
      },
    },
  };
}

export default mockLocalCareersIndex;
