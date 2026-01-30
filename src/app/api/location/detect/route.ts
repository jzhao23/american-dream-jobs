/**
 * Location Detection API Endpoint
 *
 * GET /api/location/detect
 *
 * Automatically detects user location using Vercel geo headers and maps
 * to the nearest MSA or state for rural users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodingData, GeocodingData } from '@/lib/geocoding-data';

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
  // Note: raw geolocation data (lat/lng, city) is intentionally NOT exposed
  // to the client to protect user privacy. Only the resolved MSA/state is returned.
}

interface DetectErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type DetectResponse = DetectSuccessResponse | DetectErrorResponse;

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

    // Note: raw geolocation data (lat/lng, city) is NOT exposed to protect user privacy
    // We only use it internally to resolve to a coarser-grained MSA or state

    // Only process US locations
    if (country && country !== 'US') {
      return NextResponse.json({
        success: true,
        detected: false,
        locationType: null,
        location: null,
      });
    }

    // Try to find MSA from coordinates
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const nearestMSA = findNearestMSA(lat, lng, geocodingData);

        if (nearestMSA) {
          const msa = geocodingData.msaMetadata[nearestMSA.code];
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
          });
        }

        // Fall back to state
        const state = findStateFromCoords(lat, lng, geocodingData) || region;
        if (state && geocodingData.stateMetadata[state]) {
          return NextResponse.json({
            success: true,
            detected: true,
            locationType: 'state',
            location: {
              code: state,
              name: geocodingData.stateMetadata[state].name,
              shortName: state,
              state,
            },
          });
        }
      }
    }

    // Fall back to region (state) from headers
    if (region && geocodingData.stateMetadata[region]) {
      return NextResponse.json({
        success: true,
        detected: true,
        locationType: 'state',
        location: {
          code: region,
          name: geocodingData.stateMetadata[region].name,
          shortName: region,
          state: region,
        },
      });
    }

    // Could not detect
    return NextResponse.json({
      success: true,
      detected: false,
      locationType: null,
      location: null,
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
