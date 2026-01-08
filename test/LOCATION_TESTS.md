# Location-Based Features Test Suite

This document describes the comprehensive test suite for the location-based job market features in American Dream Jobs.

## Overview

The location features allow users to:
1. Auto-detect their location from Vercel geo headers
2. Search for locations by ZIP code, city name, or state
3. View local job market data for their selected location
4. See career-specific employment and wage data for their area

## Test Structure

```
test/
  api/                      # API route unit tests
    location-detect.test.ts   # /api/location/detect
    location-search.test.ts   # /api/location/search
    local-jobs.test.ts        # /api/local-jobs
    career-local.test.ts      # /api/careers/[slug]/local
  components/               # React component tests
    LocationSelector.test.tsx
    LocalJobMarket.test.tsx
  integration/              # End-to-end flow tests
    location-search-integration.test.ts
  fixtures/                 # Mock data
    msa-geocoding.fixture.ts
    local-careers-index.fixture.ts
    index.ts
  utils/                    # Test utilities
    api-test-helpers.ts
  setup.ts                  # Jest setup (node tests)
  setup-dom.ts              # Jest setup (DOM tests)
  tsconfig.json             # TypeScript config for tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only API tests
npm run test:api

# Run only component tests
npm run test:components
```

## Test Categories

### 1. Happy Path Tests
Tests that verify the core functionality works correctly with valid inputs.

**Location Detection (`location-detect.test.ts`):**
- Detect MSA from coordinates within 150km
- Fallback to state for rural locations
- Detect from region header when no coordinates

**Location Search (`location-search.test.ts`):**
- Search by valid ZIP code (e.g., 94123 -> San Francisco)
- Search by city name (partial and full)
- Search by state name or abbreviation
- Case-insensitive matching

**Local Jobs (`local-jobs.test.ts`):**
- Get ranked job lists for MSA
- Get ranked job lists for state
- Include employment, wage, and concentration data

**Career Local Data (`career-local.test.ts`):**
- Get career-specific data for location
- Include national comparison data
- Calculate wage percentage differences

### 2. Boundary Tests
Tests that verify behavior at limits and edge values.

**Distance Thresholds:**
- MSA detection at exactly 150km boundary
- State fallback beyond 150km

**Query Length:**
- Minimum 2 character search query
- Single character returns empty results
- Results capped at 15

**Limit Parameter:**
- Limit of 0 returns empty arrays
- Maximum limit capped at 50
- Negative limit handled gracefully

### 3. Negative Tests
Tests that verify proper handling of invalid inputs.

**Invalid Locations:**
- Non-US countries return not detected
- Unknown ZIP codes return empty results
- Unknown location codes return 404

**Missing Parameters:**
- Missing location parameter returns 400
- Empty search query returns empty results
- Missing required fields handled gracefully

### 4. Error Handling Tests
Tests that verify graceful degradation on failures.

**Data Loading:**
- Missing geocoding data file
- Missing local careers index
- Malformed JSON data
- File read permission errors

**API Errors:**
- Network failures in fetch
- Corrupted response data

### 5. Security Tests
Tests that verify inputs are handled safely.

**Input Sanitization:**
- XSS attempts in headers/parameters
- SQL injection patterns
- Path traversal attempts
- Unicode edge cases
- Extremely long inputs

### 6. Business Logic Tests
Tests that verify correct implementation of business rules.

**Wage Descriptions:**
- "significantly higher" for > 20% above national
- "higher" for 10-20% above
- "about the same" for -5% to +5%
- "significantly lower" for > 20% below

**Concentration Descriptions:**
- "highly concentrated" for LQ > 2.0
- "more common" for LQ > 1.5
- "about average" for LQ 0.8-1.2
- "less common" for LQ < 0.8

**Search Ranking:**
- Exact prefix matches prioritized
- No duplicate results
- Results ordered by relevance

## Data Sources

### Mock Geocoding Data
Located in `fixtures/msa-geocoding.fixture.ts`:
- ZIP codes for major metros (SF, NYC, LA, Chicago, Seattle, etc.)
- MSA metadata with coordinates
- State metadata with coordinates
- Search index for word matching

### Mock Local Careers Index
Located in `fixtures/local-careers-index.fixture.ts`:
- 10 representative careers
- 5 MSAs with full data
- 5 states with data
- National baseline wages
- Pre-computed job rankings per location

## Testing Approach

### Mocking Strategy

**File System Mocking:**
All API routes that read from disk have `fs.existsSync` and `fs.readFileSync` mocked to return fixture data or simulate errors.

**Fetch Mocking:**
Component tests mock `global.fetch` to simulate API responses without making actual network calls.

**Context Mocking:**
React context providers are mocked to provide controlled state for component testing.

### Test Isolation

Each test uses `beforeEach` to:
1. Clear all mock call history
2. Reset mock implementations to defaults
3. Ensure no state leaks between tests

### Coverage Goals

The test suite aims for:
- 95%+ line coverage on API routes
- 90%+ branch coverage for business logic
- Key user flows fully covered in integration tests

## Key Test Scenarios

### ZIP Code Search Flow
```
User types "94123"
  -> API returns SF MSA (41860)
  -> UI displays "San Francisco, CA"
  -> User can get local jobs for SF
```

### Location Auto-Detection Flow
```
Vercel headers provide lat/lng
  -> Find nearest MSA within 150km
  -> If none, fallback to state from region header
  -> Save to localStorage for persistence
```

### Career Page Local Data Flow
```
User on Software Developer page
  -> Location context provides code "41860"
  -> Fetch /api/careers/software-developers/local?location=41860
  -> Display employment (89,450), wage ($175K), concentration (2.3x)
  -> Show comparison to national (+35%)
```

### Rural User Flow
```
User in rural Wyoming (no nearby MSA)
  -> Detection returns state: WY
  -> Search shows Wyoming as option
  -> State-level job data displayed
```

## Error Scenarios Tested

1. **No geocoding data file**: Returns graceful "not detected" response
2. **Career not in location**: Returns 404 with NO_LOCAL_DATA error
3. **Unknown location code**: Returns 404 with LOCATION_NOT_FOUND error
4. **API network failure**: Component shows fallback UI
5. **Invalid coordinates**: Falls back to state/region detection

## Future Test Enhancements

1. **Performance tests**: Add tests for data loading time
2. **Accessibility tests**: Expand a11y coverage for components
3. **Visual regression**: Add screenshot tests for key states
4. **Load testing**: Verify handling of many concurrent requests
5. **Real data tests**: Optional tests against actual data files

## Maintenance Notes

When adding new features:
1. Add mock data to appropriate fixture files
2. Create tests following the category structure above
3. Document any new test scenarios in this file
4. Verify coverage doesn't regress

When updating data structures:
1. Update fixture files to match new schema
2. Update type definitions in fixtures
3. Run full test suite to catch breaking changes
