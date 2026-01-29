/**
 * Comprehensive E2E Testing Suite for American Dream Jobs
 *
 * This suite tests every route, page, and interactive element in the application.
 * Run with: npx jest test/e2e/comprehensive-e2e.test.ts --testTimeout=60000
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://www.americandreamjobs.org';
const STAGING_URL = 'https://american-dream-jobs.vercel.app';

// Interfaces
interface Career {
  slug: string;
  title: string;
  category: string;
}

interface Specialization {
  slug: string;
  title: string;
  career_slug: string;
}

interface TestResult {
  url: string;
  status: number;
  success: boolean;
  error?: string;
  responseTime?: number;
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AmericanDreamJobs-E2E-Test/1.0',
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Test a single URL and return result
async function testUrl(url: string): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await fetchWithTimeout(url, 30000);
    const responseTime = Date.now() - startTime;

    return {
      url,
      status: response.status,
      success: response.status >= 200 && response.status < 400,
      responseTime,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
  }
}

// Test multiple URLs in batches
async function testUrlBatch(urls: string[], batchSize: number = 5): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(url => testUrl(url)));
    results.push(...batchResults);

    // Small delay between batches to be nice to the server
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

describe('American Dream Jobs - Comprehensive E2E Testing', () => {
  let careers: Career[];
  let specializations: Specialization[];
  let categories: string[];

  beforeAll(() => {
    // Load careers
    const careersPath = path.join(process.cwd(), 'data/output/careers-index.json');
    careers = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));

    // Load specializations
    const specsPath = path.join(process.cwd(), 'data/output/specializations.json');
    specializations = JSON.parse(fs.readFileSync(specsPath, 'utf-8'));

    // Extract unique categories
    categories = [...new Set(careers.map(c => c.category))];
  });

  describe('Phase 1: Main Page Routes', () => {
    const mainRoutes = [
      { path: '/', name: 'Home' },
      { path: '/compass', name: 'Career Compass' },
      { path: '/compare', name: 'Compare Futures' },
      { path: '/calculator', name: 'Net Worth Calculator' },
      { path: '/local-jobs', name: 'Local Jobs' },
      { path: '/methodology', name: 'Methodology' },
      { path: '/contribute', name: 'Contribute' },
      { path: '/categories', name: 'Categories Index' },
      { path: '/legal', name: 'Legal/Privacy' },
      { path: '/request', name: 'Request Career' },
    ];

    test.each(mainRoutes)(
      '$name page ($path) should load successfully',
      async ({ path }) => {
        const result = await testUrl(`${BASE_URL}${path}`);
        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
      },
      30000
    );
  });

  describe('Phase 2: Career Path Pages', () => {
    const pathRoutes = [
      { path: '/paths/healthcare-nonclinical', name: 'Healthcare Non-Clinical' },
      { path: '/paths/tech-no-degree', name: 'Tech No Degree' },
      { path: '/paths/skilled-trades', name: 'Skilled Trades' },
      { path: '/paths/transportation-logistics', name: 'Transportation & Logistics' },
    ];

    test.each(pathRoutes)(
      '$name path page ($path) should load successfully',
      async ({ path }) => {
        const result = await testUrl(`${BASE_URL}${path}`);
        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
      },
      30000
    );
  });

  describe('Phase 3: Category Pages', () => {
    test('should load all category pages', async () => {
      const categoryUrls = categories.map(cat => `${BASE_URL}/categories/${cat}`);
      const results = await testUrlBatch(categoryUrls, 5);

      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        console.error('Failed category pages:', failures);
      }

      expect(failures.length).toBe(0);
    }, 120000);
  });

  describe('Phase 4: Career Pages (Sample)', () => {
    test('should load first 50 career pages', async () => {
      const sampleCareers = careers.slice(0, 50);
      const careerUrls = sampleCareers.map(c => `${BASE_URL}/careers/${c.slug}`);
      const results = await testUrlBatch(careerUrls, 5);

      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        console.error('Failed career pages:', failures);
      }

      expect(failures.length).toBe(0);
    }, 300000);
  });

  describe('Phase 5: Specialization Pages (Sample)', () => {
    test('should load first 50 specialization pages', async () => {
      const sampleSpecs = specializations.slice(0, 50);
      const specUrls = sampleSpecs.map(s => `${BASE_URL}/specializations/${s.slug}`);
      const results = await testUrlBatch(specUrls, 5);

      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        console.error('Failed specialization pages:', failures);
      }

      expect(failures.length).toBe(0);
    }, 300000);
  });

  describe('Phase 6: API Endpoints', () => {
    const apiEndpoints = [
      { path: '/api/location/search?q=new+york', name: 'Location Search' },
    ];

    test.each(apiEndpoints)(
      '$name API ($path) should respond',
      async ({ path }) => {
        const result = await testUrl(`${BASE_URL}${path}`);
        expect(result.success).toBe(true);
      },
      30000
    );
  });

  describe('Phase 7: Data Integrity', () => {
    test('all careers should have valid slugs', () => {
      const invalidSlugs = careers.filter(c => !/^[a-z0-9-]+$/.test(c.slug));
      expect(invalidSlugs.length).toBe(0);
    });

    test('all careers should have categories', () => {
      const missingCategories = careers.filter(c => !c.category);
      expect(missingCategories.length).toBe(0);
    });

    test('career count should be reasonable', () => {
      expect(careers.length).toBeGreaterThanOrEqual(100);
      expect(careers.length).toBeLessThanOrEqual(500);
    });

    test('specialization count should be reasonable', () => {
      expect(specializations.length).toBeGreaterThanOrEqual(500);
      expect(specializations.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('Phase 8: Response Time Benchmarks', () => {
    test('home page should load under 5 seconds', async () => {
      const result = await testUrl(`${BASE_URL}/`);
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeLessThan(5000);
    }, 30000);

    test('career compass should load under 5 seconds', async () => {
      const result = await testUrl(`${BASE_URL}/compass`);
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeLessThan(5000);
    }, 30000);

    test('compare page should load under 5 seconds', async () => {
      const result = await testUrl(`${BASE_URL}/compare`);
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeLessThan(5000);
    }, 30000);
  });
});

// Export for use in other tests
export { testUrl, testUrlBatch, fetchWithTimeout };
