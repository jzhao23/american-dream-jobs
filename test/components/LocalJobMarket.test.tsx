/**
 * LocalJobMarket Component Tests
 *
 * Tests for the LocalJobMarket component that displays
 * local job market information for a career.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the location context
const mockUseLocation = jest.fn();

jest.mock('@/lib/location-context', () => ({
  useLocation: () => mockUseLocation(),
}));

// Mock the LocationSelector component
jest.mock('@/components/LocationSelector', () => ({
  LocationSelector: () => <div data-testid="location-selector">LocationSelector</div>,
}));

// Mock fetch
global.fetch = jest.fn();

// Import after mocking
import { LocalJobMarket } from '@/components/LocalJobMarket';

describe('LocalJobMarket Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // =====================================================
  // RENDERING TESTS: NO LOCATION
  // =====================================================

  describe('Rendering: No Location Selected', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: null,
        isLoading: false,
      });
    });

    /**
     * Test Name: Shows prompt to set location
     * Category: Rendering
     * Intent: Verify users are prompted to set location
     * Setup: Render with no location in context
     * Expected Behavior: Shows message prompting location selection
     * Failure Impact: Users wouldn't know to set location
     */
    it('should show prompt to set location when none selected', () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      expect(screen.getByText(/set your location/i)).toBeInTheDocument();
      expect(screen.getByTestId('location-selector')).toBeInTheDocument();
    });

    /**
     * Test Name: Includes career title in prompt
     * Category: Rendering
     * Intent: Verify prompt mentions the career
     * Setup: Render with specific career title
     * Expected Behavior: Prompt includes career name
     * Failure Impact: Users wouldn't understand what they're seeing
     */
    it('should include career title in the location prompt', () => {
      render(
        <LocalJobMarket
          careerSlug="registered-nurses"
          careerTitle="Registered Nurse"
        />
      );

      expect(screen.getByText(/Registered Nurse/)).toBeInTheDocument();
    });
  });

  // =====================================================
  // RENDERING TESTS: LOADING STATE
  // =====================================================

  describe('Rendering: Loading State', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: null,
        isLoading: true,
      });
    });

    /**
     * Test Name: Shows loading spinner when location loading
     * Category: Rendering
     * Intent: Verify loading state is communicated
     * Setup: Render with isLoading=true
     * Expected Behavior: Shows "Loading location..." message
     * Failure Impact: Users would see empty/broken UI
     */
    it('should show loading state when location is loading', () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      expect(screen.getByText(/loading location/i)).toBeInTheDocument();
    });
  });

  // =====================================================
  // RENDERING TESTS: WITH DATA
  // =====================================================

  describe('Rendering: With Location and Data', () => {
    const mockLocation = {
      code: '41860',
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco',
      state: 'CA',
      type: 'msa' as const,
    };

    const mockLocalData = {
      success: true,
      career: { slug: 'software-developers', title: 'Software Developer' },
      location: { code: '41860', name: 'San Francisco-Oakland-Berkeley, CA', type: 'msa' },
      localData: {
        employment: 89450,
        medianWage: 175000,
        locationQuotient: 2.3,
      },
      comparison: {
        vsNational: {
          wagePercent: 35,
          wageDescription: 'Local wages are significantly higher the national average',
        },
        concentrationDescription: 'This career is highly concentrated in this area (2x+ the national average).',
      },
    };

    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: mockLocation,
        isLoading: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockLocalData),
      });
    });

    /**
     * Test Name: Displays employment count
     * Category: Rendering
     * Intent: Verify employment data is shown
     * Setup: Render with mock local data
     * Expected Behavior: Shows formatted employment count
     * Failure Impact: Users couldn't see job count
     */
    it('should display employment count', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        // 89450 should be formatted as 89.5K
        expect(screen.getByText(/89\.5K/)).toBeInTheDocument();
        expect(screen.getByText(/jobs in area/i)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Displays local median wage
     * Category: Rendering
     * Intent: Verify wage data is shown formatted
     * Setup: Render with mock local data
     * Expected Behavior: Shows formatted wage (e.g., $175,000 or $175K)
     * Failure Impact: Users couldn't see wage info
     */
    it('should display local median wage', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        // formatPay uses Intl.NumberFormat which produces "$175,000" format
        expect(screen.getByText(/\$175/)).toBeInTheDocument();
        expect(screen.getByText(/local median/i)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Displays location quotient
     * Category: Rendering
     * Intent: Verify concentration metric is shown
     * Setup: Render with LQ = 2.3
     * Expected Behavior: Shows "2.3x vs national avg"
     * Failure Impact: Users couldn't understand job concentration
     */
    it('should display location quotient', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2\.3x/)).toBeInTheDocument();
        expect(screen.getByText(/vs national avg/i)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Displays wage comparison percentage
     * Category: Rendering
     * Intent: Verify wage comparison to national is shown
     * Setup: Render with wagePercent = 35
     * Expected Behavior: Shows "+35% vs national"
     * Failure Impact: Users couldn't compare to national wages
     */
    it('should display wage comparison', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        // The component shows "+35%" in the wage comparison area
        const wageComparisonElement = screen.getByText(/35%.*national|national.*35%/i);
        expect(wageComparisonElement).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Displays concentration description
     * Category: Rendering
     * Intent: Verify human-readable concentration insight
     * Setup: Render with mock comparison data
     * Expected Behavior: Shows concentration explanation
     * Failure Impact: Users wouldn't understand the metrics
     */
    it('should display concentration description', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/highly concentrated/i)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Shows LocationSelector in header
     * Category: Rendering
     * Intent: Verify users can change location from component
     * Setup: Render with location
     * Expected Behavior: LocationSelector is present
     * Failure Impact: Users couldn't change location
     */
    it('should show LocationSelector when data is loaded', async () => {
      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('location-selector')).toBeInTheDocument();
      });
    });
  });

  // =====================================================
  // RENDERING TESTS: ERROR STATES
  // =====================================================

  describe('Rendering: Error States', () => {
    const mockLocation = {
      code: '41860',
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco',
      state: 'CA',
      type: 'msa' as const,
    };

    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: mockLocation,
        isLoading: false,
      });
    });

    /**
     * Test Name: Shows error message when API fails
     * Category: Error Handling
     * Intent: Verify API errors are communicated
     * Setup: Mock fetch to return error
     * Expected Behavior: Shows error message
     * Failure Impact: Users would see broken UI on API error
     */
    it('should show error message when API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NO_LOCAL_DATA',
            message: 'No local data available',
          },
        }),
      });

      render(
        <LocalJobMarket
          careerSlug="rare-career"
          careerTitle="Rare Career"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/limited local data/i)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Shows national wage fallback when no local data
     * Category: Error Handling
     * Intent: Verify fallback info is shown when local data unavailable
     * Setup: Render with no local data but national wage provided
     * Expected Behavior: Shows national median as fallback
     * Failure Impact: Users would see nothing instead of useful info
     */
    it('should show national wage fallback when no local data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: false,
          error: {
            code: 'NO_LOCAL_DATA',
            message: 'No local data available',
          },
        }),
      });

      render(
        <LocalJobMarket
          careerSlug="rare-career"
          careerTitle="Rare Career"
          nationalMedianWage={65000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/national median/i)).toBeInTheDocument();
        // Component may show "$65,000" or "$65K" depending on formatPay function
        expect(screen.getByText(/\$65/)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Handles network errors gracefully
     * Category: Error Handling
     * Intent: Verify network errors don't crash the component
     * Setup: Mock fetch to throw
     * Expected Behavior: Shows error state without crashing
     * Failure Impact: Network issues would crash the page
     */
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/limited local data/i)).toBeInTheDocument();
      });
    });
  });

  // =====================================================
  // DATA FETCHING TESTS
  // =====================================================

  describe('Data Fetching', () => {
    const mockLocation = {
      code: '41860',
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco',
      state: 'CA',
      type: 'msa' as const,
    };

    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: mockLocation,
        isLoading: false,
      });
    });

    /**
     * Test Name: Fetches data with correct URL
     * Category: Data Fetching
     * Intent: Verify correct API endpoint is called
     * Setup: Render with location
     * Expected Behavior: fetch called with correct slug and location
     * Failure Impact: Wrong data would be fetched
     */
    it('should fetch data with correct URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          career: { slug: 'software-developers', title: 'Software Developer' },
          location: { code: '41860', name: 'SF', type: 'msa' },
          localData: { employment: 1000, medianWage: 100000, locationQuotient: 1.0 },
          comparison: {
            vsNational: { wagePercent: 0, wageDescription: 'about the same' },
            concentrationDescription: 'Average',
          },
        }),
      });

      render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/careers/software-developers/local?location=41860'
        );
      });
    });

    /**
     * Test Name: Refetches when location changes
     * Category: Data Fetching
     * Intent: Verify data updates when location changes
     * Setup: Render, then change location
     * Expected Behavior: New fetch is triggered
     * Failure Impact: Location changes wouldn't update data
     */
    it('should refetch when location changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          career: { slug: 'software-developers', title: 'Software Developer' },
          location: { code: '41860', name: 'SF', type: 'msa' },
          localData: { employment: 1000, medianWage: 100000, locationQuotient: 1.0 },
          comparison: {
            vsNational: { wagePercent: 0, wageDescription: 'about the same' },
            concentrationDescription: 'Average',
          },
        }),
      });

      const { rerender } = render(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Change location
      mockUseLocation.mockReturnValue({
        location: {
          code: '35620',
          name: 'New York',
          shortName: 'New York',
          state: 'NY',
          type: 'msa',
        },
        isLoading: false,
      });

      rerender(
        <LocalJobMarket
          careerSlug="software-developers"
          careerTitle="Software Developer"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenLastCalledWith(
          '/api/careers/software-developers/local?location=35620'
        );
      });
    });
  });

  // =====================================================
  // FORMATTING TESTS
  // =====================================================

  describe('Formatting: Numbers', () => {
    const mockLocation = {
      code: '41860',
      name: 'San Francisco-Oakland-Berkeley, CA',
      shortName: 'San Francisco',
      state: 'CA',
      type: 'msa' as const,
    };

    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        location: mockLocation,
        isLoading: false,
      });
    });

    /**
     * Test Name: Formats large employment numbers
     * Category: Formatting
     * Intent: Verify large numbers are readable
     * Setup: Render with 1M+ employment
     * Expected Behavior: Shows "1.5M" format
     * Failure Impact: Large numbers would be hard to read
     */
    it('should format million-scale employment as M', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          career: { slug: 'test', title: 'Test' },
          location: { code: '41860', name: 'SF', type: 'msa' },
          localData: { employment: 1500000, medianWage: 50000, locationQuotient: 1.0 },
          comparison: {
            vsNational: { wagePercent: 0, wageDescription: 'about the same' },
            concentrationDescription: 'Average',
          },
        }),
      });

      render(
        <LocalJobMarket
          careerSlug="test"
          careerTitle="Test"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/1\.5M/)).toBeInTheDocument();
      });
    });

    /**
     * Test Name: Formats thousand-scale employment
     * Category: Formatting
     * Intent: Verify thousands are formatted correctly
     * Setup: Render with 45K employment
     * Expected Behavior: Shows "45K" or "45.0K"
     * Failure Impact: Numbers would be hard to read
     */
    it('should format thousand-scale employment as K', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          career: { slug: 'test', title: 'Test' },
          location: { code: '41860', name: 'SF', type: 'msa' },
          localData: { employment: 45000, medianWage: 50000, locationQuotient: 1.0 },
          comparison: {
            vsNational: { wagePercent: 0, wageDescription: 'about the same' },
            concentrationDescription: 'Average',
          },
        }),
      });

      render(
        <LocalJobMarket
          careerSlug="test"
          careerTitle="Test"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/45.*K/)).toBeInTheDocument();
      });
    });
  });
});
