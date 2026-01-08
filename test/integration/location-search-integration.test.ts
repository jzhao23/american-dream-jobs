/**
 * Location Search Integration Tests
 *
 * These tests verify the complete location search flow including:
 * - ZIP code to MSA resolution
 * - City name to MSA matching
 * - State abbreviation lookup
 * - Search index word matching
 * - Result ranking and ordering
 *
 * These tests use the actual search algorithm but with mock data.
 */

import { NextRequest } from 'next/server';
import * as fs from 'fs';
import { mockGeocodingData, mockLocalCareersIndex, mockCareers } from '../fixtures';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import { GET as searchLocation } from '@/app/api/location/search/route';
import { GET as getLocalJobs } from '@/app/api/local-jobs/route';
import { GET as getCareerLocal } from '@/app/api/careers/[slug]/local/route';

describe('Location Search Integration', () => {
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
  const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      const pathStr = String(filePath);
      if (pathStr.includes('msa-geocoding.json')) {
        return JSON.stringify(mockGeocodingData);
      }
      if (pathStr.includes('local-careers-index.json')) {
        return JSON.stringify(mockLocalCareersIndex);
      }
      if (pathStr.includes('careers.json')) {
        return JSON.stringify(mockCareers);
      }
      throw new Error(`Unexpected file: ${filePath}`);
    });
  });

  // =====================================================
  // END-TO-END FLOW TESTS
  // =====================================================

  describe('End-to-End: Search to Job Data Flow', () => {
    /**
     * Test Name: Complete flow from ZIP search to local jobs
     * Category: Integration
     * Intent: Verify user can search by ZIP and get local job data
     * Setup: Search for ZIP, get location code, fetch local jobs
     * Expected Behavior: Complete flow returns valid job data
     * Failure Impact: Users couldn't navigate the full location flow
     */
    it('should complete flow from ZIP search to local job data', async () => {
      // Step 1: Search for ZIP code
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=94123'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);
      expect(searchData.results.length).toBeGreaterThan(0);

      const locationCode = searchData.results[0].code;
      expect(locationCode).toBe('41860'); // San Francisco

      // Step 2: Get local jobs for this location
      const jobsRequest = new NextRequest(
        `http://localhost:3000/api/local-jobs?location=${locationCode}`
      );
      const jobsResponse = await getLocalJobs(jobsRequest);
      const jobsData = await jobsResponse.json();

      expect(jobsData.success).toBe(true);
      expect(jobsData.location.code).toBe(locationCode);
      expect(jobsData.fastestGrowing.length).toBeGreaterThan(0);
      expect(jobsData.mostJobs.length).toBeGreaterThan(0);
      expect(jobsData.highConcentration.length).toBeGreaterThan(0);
    });

    /**
     * Test Name: Complete flow from city search to career data
     * Category: Integration
     * Intent: Verify user can search by city and get specific career data
     * Setup: Search for city, get location, fetch career-specific data
     * Expected Behavior: Returns detailed career data for location
     * Failure Impact: Users couldn't see career-specific local data
     */
    it('should complete flow from city search to career-specific data', async () => {
      // Step 1: Search for city
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=Seattle'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);
      const seattleResult = searchData.results.find(
        (r: { code: string }) => r.code === '42660'
      );
      expect(seattleResult).toBeDefined();

      // Step 2: Get career data for this location
      const careerRequest = new NextRequest(
        `http://localhost:3000/api/careers/software-developers/local?location=${seattleResult.code}`
      );
      const careerResponse = await getCareerLocal(careerRequest, {
        params: Promise.resolve({ slug: 'software-developers' }),
      });
      const careerData = await careerResponse.json();

      expect(careerData.success).toBe(true);
      expect(careerData.career.slug).toBe('software-developers');
      expect(careerData.location.code).toBe('42660');
      expect(careerData.localData.employment).toBe(82000);
      expect(careerData.localData.medianWage).toBe(165000);
    });

    /**
     * Test Name: State fallback flow
     * Category: Integration
     * Intent: Verify rural users can search by state and get job data
     * Setup: Search for state abbreviation, get state-level job data
     * Expected Behavior: State search leads to state-level job data
     * Failure Impact: Rural users would have no job market info
     */
    it('should complete flow for state-level search and jobs', async () => {
      // Step 1: Search for state
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=CA'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);
      const caResult = searchData.results.find(
        (r: { type: string; code: string }) => r.type === 'state' && r.code === 'CA'
      );
      expect(caResult).toBeDefined();

      // Step 2: Get state-level jobs
      const jobsRequest = new NextRequest(
        `http://localhost:3000/api/local-jobs?location=CA`
      );
      const jobsResponse = await getLocalJobs(jobsRequest);
      const jobsData = await jobsResponse.json();

      expect(jobsData.success).toBe(true);
      expect(jobsData.location.type).toBe('state');
      expect(jobsData.location.code).toBe('CA');
    });
  });

  // =====================================================
  // SEARCH ALGORITHM INTEGRATION TESTS
  // =====================================================

  describe('Search Algorithm: Multi-Criteria Matching', () => {
    /**
     * Test Name: Search combines multiple matching strategies
     * Category: Integration
     * Intent: Verify search uses prefix, word, and fuzzy matching
     * Setup: Search for partial term that should match multiple ways
     * Expected Behavior: Results combine all matching strategies
     * Failure Impact: Search would miss relevant results
     */
    it('should combine multiple matching strategies for comprehensive results', async () => {
      // "San" should match via:
      // 1. Prefix match on shortName (San Francisco, San Jose, San Diego)
      // 2. Search index (san -> [41860, 41940, 41740])
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=San'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);
      expect(searchData.results.length).toBeGreaterThan(0);

      // Should include SF, San Jose, San Diego
      const codes = searchData.results.map((r: { code: string }) => r.code);
      const hasSanFrancisco = codes.includes('41860');
      const hasSanJose = codes.includes('41940');
      const hasSanDiego = codes.includes('41740');

      expect(hasSanFrancisco).toBe(true);
      expect(hasSanJose).toBe(true);
      expect(hasSanDiego).toBe(true);
    });

    /**
     * Test Name: Search deduplicates results
     * Category: Integration
     * Intent: Verify same location doesn't appear multiple times
     * Setup: Search for term that matches via multiple strategies
     * Expected Behavior: Each location appears only once
     * Failure Impact: Duplicate results would confuse users
     */
    it('should not return duplicate locations', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=New%20York'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);

      // Check for duplicates
      const codes = searchData.results.map((r: { code: string; type: string }) => `${r.type}:${r.code}`);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    /**
     * Test Name: Search prioritizes exact matches
     * Category: Integration
     * Intent: Verify exact prefix matches appear before fuzzy matches
     * Setup: Search for exact city name prefix
     * Expected Behavior: Exact prefix matches should be first
     * Failure Impact: Autocomplete would show wrong suggestion first
     */
    it('should prioritize exact prefix matches over partial matches', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=Chicago'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);

      // Chicago should be first or very high in results
      const chicagoIndex = searchData.results.findIndex(
        (r: { code: string }) => r.code === '16980'
      );
      expect(chicagoIndex).toBeGreaterThanOrEqual(0);
      expect(chicagoIndex).toBeLessThan(3); // Should be in top 3
    });
  });

  // =====================================================
  // DATA CONSISTENCY TESTS
  // =====================================================

  describe('Data Consistency: Cross-Endpoint Validation', () => {
    /**
     * Test Name: Location codes are consistent across endpoints
     * Category: Integration
     * Intent: Verify location code from search works in local-jobs
     * Setup: Get location from search, use in local-jobs
     * Expected Behavior: Same location code works across endpoints
     * Failure Impact: Broken navigation between features
     */
    it('should use consistent location codes across endpoints', async () => {
      // Get all locations from search
      const searchTerms = ['San Francisco', 'New York', 'Seattle', 'CA', 'TX'];

      for (const term of searchTerms) {
        const searchRequest = new NextRequest(
          `http://localhost:3000/api/location/search?q=${encodeURIComponent(term)}`
        );
        const searchResponse = await searchLocation(searchRequest);
        const searchData = await searchResponse.json();

        if (searchData.results.length > 0) {
          const location = searchData.results[0];

          // Try to use this location code in local-jobs
          const jobsRequest = new NextRequest(
            `http://localhost:3000/api/local-jobs?location=${location.code}`
          );
          const jobsResponse = await getLocalJobs(jobsRequest);
          const jobsData = await jobsResponse.json();

          // Should either succeed or return NOT_FOUND, not crash
          expect(jobsData.success || jobsData.error.code === 'LOCATION_NOT_FOUND').toBe(true);
        }
      }
    });

    /**
     * Test Name: Career slugs from local-jobs work in career-local
     * Category: Integration
     * Intent: Verify career slugs are consistent across endpoints
     * Setup: Get careers from local-jobs, use in career-local
     * Expected Behavior: Career slugs work in both endpoints
     * Failure Impact: Clicking on career would fail
     */
    it('should use consistent career slugs across endpoints', async () => {
      // Get jobs for SF
      const jobsRequest = new NextRequest(
        'http://localhost:3000/api/local-jobs?location=41860'
      );
      const jobsResponse = await getLocalJobs(jobsRequest);
      const jobsData = await jobsResponse.json();

      expect(jobsData.success).toBe(true);

      // Try each career slug in career-local endpoint
      for (const job of jobsData.mostJobs.slice(0, 3)) {
        const careerRequest = new NextRequest(
          `http://localhost:3000/api/careers/${job.slug}/local?location=41860`
        );
        const careerResponse = await getCareerLocal(careerRequest, {
          params: Promise.resolve({ slug: job.slug }),
        });
        const careerData = await careerResponse.json();

        expect(careerData.success).toBe(true);
        expect(careerData.career.slug).toBe(job.slug);
        expect(careerData.localData.employment).toBe(job.employment);
        expect(careerData.localData.medianWage).toBe(job.medianWage);
      }
    });
  });

  // =====================================================
  // EDGE CASE INTEGRATION TESTS
  // =====================================================

  describe('Edge Cases: Multi-State MSAs', () => {
    /**
     * Test Name: Multi-state MSA handling
     * Category: Edge Case
     * Intent: Verify MSAs spanning multiple states work correctly
     * Setup: Search for NYC which spans NY-NJ-PA
     * Expected Behavior: Returns single MSA with all states listed
     * Failure Impact: Multi-state metro users get wrong state
     */
    it('should handle multi-state MSAs correctly', async () => {
      const searchRequest = new NextRequest(
        'http://localhost:3000/api/location/search?q=10001'
      );
      const searchResponse = await searchLocation(searchRequest);
      const searchData = await searchResponse.json();

      expect(searchData.success).toBe(true);
      expect(searchData.results.length).toBe(1);

      const nycResult = searchData.results[0];
      expect(nycResult.code).toBe('35620');
      expect(nycResult.states).toContain('NY');
      expect(nycResult.states).toContain('NJ');
      expect(nycResult.states).toContain('PA');

      // Verify local jobs works
      const jobsRequest = new NextRequest(
        'http://localhost:3000/api/local-jobs?location=35620'
      );
      const jobsResponse = await getLocalJobs(jobsRequest);
      const jobsData = await jobsResponse.json();

      expect(jobsData.success).toBe(true);
      expect(jobsData.location.name).toContain('New York');
    });
  });

  describe('Edge Cases: Career Availability', () => {
    /**
     * Test Name: Career not available in all locations
     * Category: Edge Case
     * Intent: Verify handling when career exists in some locations
     * Setup: Try to get data-scientists in location without that data
     * Expected Behavior: Returns NO_LOCAL_DATA error gracefully
     * Failure Impact: Users see crash instead of helpful message
     */
    it('should handle careers not available in specific locations', async () => {
      // Data scientists don't exist in Chicago in our mock
      const careerRequest = new NextRequest(
        'http://localhost:3000/api/careers/data-scientists/local?location=16980'
      );
      const careerResponse = await getCareerLocal(careerRequest, {
        params: Promise.resolve({ slug: 'data-scientists' }),
      });
      const careerData = await careerResponse.json();

      expect(careerData.success).toBe(false);
      expect(careerData.error.code).toBe('NO_LOCAL_DATA');
    });

    /**
     * Test Name: Location with limited career data
     * Category: Edge Case
     * Intent: Verify locations with sparse data work correctly
     * Setup: Request jobs for state with limited data
     * Expected Behavior: Returns available data without error
     * Failure Impact: Sparse locations would crash
     */
    it('should handle locations with limited career data', async () => {
      // NY state only has accountants in our mock
      const jobsRequest = new NextRequest(
        'http://localhost:3000/api/local-jobs?location=NY'
      );
      const jobsResponse = await getLocalJobs(jobsRequest);
      const jobsData = await jobsResponse.json();

      expect(jobsData.success).toBe(true);
      expect(jobsData.location.code).toBe('NY');
      // Should have some jobs even if limited
      expect(jobsData.mostJobs).toBeDefined();
    });
  });
});
