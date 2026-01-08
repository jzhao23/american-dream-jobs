/**
 * Location Detection API Endpoint
 *
 * GET /api/location/detect
 *
 * Automatically detects user location using Vercel geo headers and maps
 * to the nearest MSA or state for rural users.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface MSAMetadata {
  name: string;
  shortName: string;
  states: string[];
  lat?: number | null;
  lng?: number | null;
}

interface StateMetadata {
  name: string;
  lat?: number | null;
  lng?: number | null;
}

interface GeocodingData {
  msaMetadata: { [code: string]: MSAMetadata };
  stateMetadata: { [code: string]: StateMetadata };
  zipToMsa: { [zip: string]: string };
  zipToState: { [zip: string]: string };
}

interface DetectSuccessResponse {
  success: true;
  detected: boolean;
  locationType: 'msa' | 'state' | null;
  location: {
    code: string;
    name: string;
    shortName: string;
    state: string;
  } | null;
  raw?: {
    city: string | null;
    region: string | null;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
  };
}

interface DetectErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type DetectResponse = DetectSuccessResponse | DetectErrorResponse;

// Cache geocoding data
let geocodingCache: GeocodingData | null = null;

function loadGeocodingData(): GeocodingData | null {
  if (geocodingCache) return geocodingCache;

  try {
    const dataPath = path.join(process.cwd(), 'data/processed/msa-geocoding.json');
    if (!fs.existsSync(dataPath)) {
      console.log('Geocoding data not found at', dataPath);
      return null;
    }
    geocodingCache = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return geocodingCache;
  } catch (error) {
    console.error('Failed to load geocoding data:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest MSA to given coordinates.
 */
function findNearestMSA(
  lat: number,
  lng: number,
  geocoding: GeocodingData
): { code: string; distance: number } | null {
  let nearestMSA: string | null = null;
  let nearestDistance = Infinity;

  for (const [code, msa] of Object.entries(geocoding.msaMetadata)) {
    if (msa.lat && msa.lng) {
      const distance = calculateDistance(lat, lng, msa.lat, msa.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMSA = code;
      }
    }
  }

  if (nearestMSA && nearestDistance < 150) { // Within 150km of MSA center
    return { code: nearestMSA, distance: nearestDistance };
  }

  return null;
}

/**
 * Find state from coordinates.
 */
function findStateFromCoords(
  lat: number,
  lng: number,
  geocoding: GeocodingData
): string | null {
  // Simple approach: find nearest state centroid
  let nearestState: string | null = null;
  let nearestDistance = Infinity;

  for (const [code, state] of Object.entries(geocoding.stateMetadata)) {
    if (state.lat && state.lng) {
      const distance = calculateDistance(lat, lng, state.lat, state.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestState = code;
      }
    }
  }

  return nearestState;
}

export async function GET(request: NextRequest): Promise<NextResponse<DetectResponse>> {
  try {
    // Extract Vercel geo headers
    const city = request.headers.get('x-vercel-ip-city');
    const region = request.headers.get('x-vercel-ip-country-region');
    const country = request.headers.get('x-vercel-ip-country');
    const latitude = request.headers.get('x-vercel-ip-latitude');
    const longitude = request.headers.get('x-vercel-ip-longitude');

    const raw = { city, region, country, latitude, longitude };

    // Only process US locations
    if (country && country !== 'US') {
      return NextResponse.json({
        success: true,
        detected: false,
        locationType: null,
        location: null,
        raw,
      });
    }

    // Load geocoding data
    const geocoding = loadGeocodingData();
    if (!geocoding) {
      return NextResponse.json({
        success: true,
        detected: false,
        locationType: null,
        location: null,
        raw,
      });
    }

    // Try to find MSA from coordinates
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const nearestMSA = findNearestMSA(lat, lng, geocoding);

        if (nearestMSA) {
          const msa = geocoding.msaMetadata[nearestMSA.code];
          return NextResponse.json({
            success: true,
            detected: true,
            locationType: 'msa',
            location: {
              code: nearestMSA.code,
              name: msa.name,
              shortName: msa.shortName,
              state: msa.states[0] || region || '',
            },
            raw,
          });
        }

        // Fall back to state
        const state = findStateFromCoords(lat, lng, geocoding) || region;
        if (state && geocoding.stateMetadata[state]) {
          return NextResponse.json({
            success: true,
            detected: true,
            locationType: 'state',
            location: {
              code: state,
              name: geocoding.stateMetadata[state].name,
              shortName: state,
              state,
            },
            raw,
          });
        }
      }
    }

    // Fall back to region (state) from headers
    if (region && geocoding.stateMetadata[region]) {
      return NextResponse.json({
        success: true,
        detected: true,
        locationType: 'state',
        location: {
          code: region,
          name: geocoding.stateMetadata[region].name,
          shortName: region,
          state: region,
        },
        raw,
      });
    }

    // Could not detect
    return NextResponse.json({
      success: true,
      detected: false,
      locationType: null,
      location: null,
      raw,
    });
  } catch (error) {
    console.error('Location detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DETECTION_FAILED',
          message: 'Failed to detect location',
        },
      },
      { status: 500 }
    );
  }
}
