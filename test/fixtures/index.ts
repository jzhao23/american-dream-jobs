/**
 * Test Fixtures Index
 *
 * Central export point for all test fixtures.
 */

export {
  mockGeocodingData,
  createMinimalGeocodingData,
  createGeocodingDataWithMissingCoords,
  type GeocodingData,
  type MSAMetadata,
  type StateMetadata,
} from './msa-geocoding.fixture';

export {
  mockLocalCareersIndex,
  mockCareers,
  createMinimalLocalCareersIndex,
  createLocalCareersIndexWithGaps,
  type LocalCareersIndex,
  type LocalCareerData,
} from './local-careers-index.fixture';
