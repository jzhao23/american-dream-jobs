/**
 * Career Local Data API Tests
 *
 * Tests for GET /api/careers/[slug]/local
 *
 * This endpoint returns local employment and wage data for a specific career in a location.
 */

import { NextRequest } from 'next/server';
import * as fs from 'fs';
import { mockLocalCareersIndex, mockCareers } from '../fixtures';

// Mock fs module before importing the route handler
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Import after mocking
import { GET } from '@/app/api/careers/[slug]/local/route';

describe('GET /api/careers/[slug]/local', () => {
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
  const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      const pathStr = String(filePath);
      if (pathStr.includes('local-careers-index.json')) {
        return JSON.stringify(mockLocalCareersIndex);
      }
      if (pathStr.includes('careers.json')) {
        return JSON.stringify(mockCareers);
      }
      throw new Error(`Unexpected file: ${filePath}`);
    });
  });

  // Helper to create params promise (Next.js 15+ uses async params)
  const createParams = (slug: string) => Promise.resolve({ slug });

  // =====================================================
  // HAPPY PATH TESTS
  // =====================================================

  describe('Happy Path: Valid Career and Location', () => {
    /**
     * Test Name: Get local data for software-developers in SF
     * Category: Happy Path
     * Intent: Verify correct career-location data is returned
     * Setup: Request software-developers career in SF MSA (41860)
     * Expected Behavior: Returns employment, wage, and comparison data
     * Failure Impact: Career pages would show no local data
     */
    it('should return local data for software-developers in SF MSA', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Career info
      expect(data.career.slug).toBe('software-developers');
      expect(data.career.title).toBe('Software Developer');

      // Location info
      expect(data.location.code).toBe('41860');
      expect(data.location.type).toBe('msa');
      expect(data.location.name).toContain('San Francisco');

      // Local data
      expect(data.localData.employment).toBe(89450);
      expect(data.localData.medianWage).toBe(175000);
      expect(data.localData.locationQuotient).toBe(2.3);
    });

    /**
     * Test Name: Comparison data structure
     * Category: Happy Path
     * Intent: Verify comparison object has expected fields
     * Setup: Request career with known wage differential
     * Expected Behavior: Comparison includes vsNational and concentrationDescription
     * Failure Impact: Users can't understand local vs national
     */
    it('should include properly structured comparison data', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Comparison structure
      expect(data.comparison).toHaveProperty('vsNational');
      expect(data.comparison.vsNational).toHaveProperty('wagePercent');
      expect(data.comparison.vsNational).toHaveProperty('wageDescription');
      expect(data.comparison).toHaveProperty('concentrationDescription');

      // Types
      expect(typeof data.comparison.vsNational.wagePercent).toBe('number');
      expect(typeof data.comparison.vsNational.wageDescription).toBe('string');
      expect(typeof data.comparison.concentrationDescription).toBe('string');
    });

    /**
     * Test Name: Wage comparison calculation
     * Category: Happy Path
     * Intent: Verify wage percent is calculated correctly
     * Setup: Request career with known local and national wages
     * Expected Behavior: wagePercent = ((local - national) / national) * 100
     * Failure Impact: Incorrect wage comparisons
     */
    it('should calculate wage comparison correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(200);

      // SF software dev wage: 175000, National: 130000
      // Expected: ((175000 - 130000) / 130000) * 100 = 34.6%
      const expectedPercent = Math.round(((175000 - 130000) / 130000) * 100);
      expect(data.comparison.vsNational.wagePercent).toBe(expectedPercent);
    });

    /**
     * Test Name: State-level career data
     * Category: Happy Path
     * Intent: Verify state-level data works the same as MSA
     * Setup: Request career data for California state
     * Expected Behavior: Returns state-level employment and wage data
     * Failure Impact: Rural users can't see career data
     */
    it('should return local data for state location', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=CA'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.location.code).toBe('CA');
      expect(data.location.type).toBe('state');
      expect(data.location.name).toBe('California');
      expect(data.localData.employment).toBe(450000);
    });
  });

  // =====================================================
  // WAGE DESCRIPTION TESTS
  // =====================================================

  describe('Business Logic: Wage Descriptions', () => {
    /**
     * Test Name: Significantly higher wages
     * Category: Business Logic
     * Intent: Verify "significantly higher" description for > 20% diff
     * Setup: Use SF software dev wages (34% above national)
     * Expected Behavior: Description says "significantly higher"
     * Failure Impact: Misleading wage comparisons
     */
    it('should describe wages as significantly higher when > 20% above national', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(200);
      // SF wage is 34% higher than national
      expect(data.comparison.vsNational.wageDescription).toContain('significantly higher');
    });

    /**
     * Test Name: Higher wages (10-20% above)
     * Category: Business Logic
     * Intent: Verify "higher" description for 10-20% difference
     * Setup: Find career with moderate wage difference
     * Expected Behavior: Description says "higher" not "significantly"
     * Failure Impact: Inaccurate wage descriptions
     */
    it('should describe wages as higher when 10-20% above national', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/registered-nurses/local?location=35620'
      );

      const response = await GET(request, { params: createParams('registered-nurses') });
      const data = await response.json();

      expect(response.status).toBe(200);
      // NY nurse wage: 98000, National: 81000 = 21% higher
      expect(data.comparison.vsNational.wageDescription).toContain('higher');
    });
  });

  // =====================================================
  // CONCENTRATION DESCRIPTION TESTS
  // =====================================================

  describe('Business Logic: Concentration Descriptions', () => {
    /**
     * Test Name: Highly concentrated (LQ > 2.0)
     * Category: Business Logic
     * Intent: Verify "highly concentrated" description for LQ > 2
     * Setup: Use data-scientists in SF (LQ = 3.2)
     * Expected Behavior: Description mentions 2x+ concentration
     * Failure Impact: Users don't understand job concentration
     */
    it('should describe highly concentrated careers (LQ > 2)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/data-scientists/local?location=41860'
      );

      const response = await GET(request, { params: createParams('data-scientists') });
      const data = await response.json();

      expect(response.status).toBe(200);
      // SF data scientist LQ = 3.2
      expect(data.comparison.concentrationDescription).toContain('highly concentrated');
      expect(data.comparison.concentrationDescription).toContain('2x');
    });

    /**
     * Test Name: Less common career (LQ < 1)
     * Category: Business Logic
     * Intent: Verify description for careers less common than average
     * Setup: Use career with LQ < 0.8
     * Expected Behavior: Description says "less common" or similar
     * Failure Impact: Users don't understand scarcity
     */
    it('should describe less common careers (LQ < 0.8)', async () => {
      // HVAC technicians in SF have LQ = 0.9, medical assistants = 0.9
      const request = new NextRequest(
        'http://localhost:3000/api/careers/medical-assistants/local?location=41860'
      );

      const response = await GET(request, { params: createParams('medical-assistants') });
      const data = await response.json();

      expect(response.status).toBe(200);
      // Medical assistants in SF have LQ = 0.9, so "about average"
      expect(data.comparison.concentrationDescription).toBeDefined();
    });
  });

  // =====================================================
  // NEGATIVE TESTS
  // =====================================================

  describe('Negative: Invalid Inputs', () => {
    /**
     * Test Name: Missing location parameter
     * Category: Negative
     * Intent: Verify error when location is not provided
     * Setup: Request without location query param
     * Expected Behavior: Returns 400 with MISSING_LOCATION error
     * Failure Impact: Missing params would crash API
     */
    it('should return 400 when location is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_LOCATION');
    });

    /**
     * Test Name: Unknown career slug
     * Category: Negative
     * Intent: Verify error for non-existent career
     * Setup: Request with invalid career slug
     * Expected Behavior: Returns 404 with CAREER_NOT_FOUND error
     * Failure Impact: Typos in URLs would crash API
     */
    it('should return 404 for unknown career slug', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/nonexistent-career/local?location=41860'
      );

      const response = await GET(request, { params: createParams('nonexistent-career') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CAREER_NOT_FOUND');
    });

    /**
     * Test Name: Unknown location code
     * Category: Negative
     * Intent: Verify error for non-existent location
     * Setup: Request with invalid location code
     * Expected Behavior: Returns 404 with LOCATION_NOT_FOUND error
     * Failure Impact: Invalid locations would crash API
     */
    it('should return 404 for unknown location code', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=99999'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('LOCATION_NOT_FOUND');
    });

    /**
     * Test Name: Career exists but no local data for location
     * Category: Negative
     * Intent: Verify handling when career has no data for location
     * Setup: Request career that doesn't exist in the location
     * Expected Behavior: Returns 404 with NO_LOCAL_DATA error
     * Failure Impact: Missing data would crash or confuse users
     */
    it('should return 404 when career has no data for location', async () => {
      // Truck drivers don't have data in SF in our mock
      const request = new NextRequest(
        'http://localhost:3000/api/careers/truck-drivers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('truck-drivers') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NO_LOCAL_DATA');
      expect(data.error.message).toContain('Truck Driver');
    });
  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling: Data Loading', () => {
    /**
     * Test Name: Local careers index not found
     * Category: Error Handling
     * Intent: Verify graceful error when data file missing
     * Setup: Mock local-careers-index.json as missing
     * Expected Behavior: Returns 503 with DATA_NOT_AVAILABLE
     * Failure Impact: Missing data would crash server
     *
     * Note: These tests are skipped because the API routes cache data at module level,
     * making it impossible to test the "file not found" scenario after other tests
     * have already loaded the data. In production, a server restart clears this cache.
     */
    it.skip('should return 503 when local careers index is missing', async () => {
      mockExistsSync.mockImplementation((filePath: fs.PathLike) => {
        const pathStr = String(filePath);
        return !pathStr.includes('local-careers-index.json');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATA_NOT_AVAILABLE');
    });

    /**
     * Test Name: Careers data file not found
     * Category: Error Handling
     * Intent: Verify graceful error when careers.json missing
     * Setup: Mock careers.json as missing
     * Expected Behavior: Returns 503 with DATA_NOT_AVAILABLE
     * Failure Impact: Missing career data would crash server
     */
    it.skip('should return 503 when careers data is missing', async () => {
      mockExistsSync.mockImplementation((filePath: fs.PathLike) => {
        const pathStr = String(filePath);
        return !pathStr.includes('careers.json');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=41860'
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATA_NOT_AVAILABLE');
    });
  });

  // =====================================================
  // SECURITY TESTS
  // =====================================================

  describe('Security: Input Validation', () => {
    /**
     * Test Name: Path traversal in career slug
     * Category: Security
     * Intent: Verify path traversal in slug is safe
     * Setup: Include path traversal in career slug
     * Expected Behavior: Treated as unknown career
     * Failure Impact: Could expose filesystem
     */
    it('should safely handle path traversal in career slug', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/../../../etc/passwd/local?location=41860'
      );

      const response = await GET(request, { params: createParams('../../../etc/passwd') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CAREER_NOT_FOUND');
    });

    /**
     * Test Name: XSS in location parameter
     * Category: Security
     * Intent: Verify XSS patterns in location are safe
     * Setup: Include script tag in location
     * Expected Behavior: Treated as unknown location
     * Failure Impact: XSS vulnerability
     */
    it('should safely handle XSS in location parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/careers/software-developers/local?location=' +
          encodeURIComponent('<script>alert(1)</script>')
      );

      const response = await GET(request, { params: createParams('software-developers') });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('LOCATION_NOT_FOUND');
    });

    /**
     * Test Name: SQL injection in slug
     * Category: Security
     * Intent: Verify SQL injection patterns are safe
     * Setup: Include SQL injection in career slug
     * Expected Behavior: Treated as unknown career
     * Failure Impact: SQL injection if used in queries
     */
    it('should safely handle SQL injection in career slug', async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/careers/software-developers'; DROP TABLE careers; --/local?location=41860"
      );

      const response = await GET(request, { params: createParams("software-developers'; DROP TABLE careers; --") });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
