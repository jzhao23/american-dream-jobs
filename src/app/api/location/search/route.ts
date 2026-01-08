/**
 * Location Search API Endpoint
 *
 * GET /api/location/search?q=san+francisco
 *
 * Searches for MSAs and states by name or ZIP code.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface MSAMetadata {
  name: string;
  shortName: string;
  states: string[];
}

interface StateMetadata {
  name: string;
}

interface GeocodingData {
  msaMetadata: { [code: string]: MSAMetadata };
  stateMetadata: { [code: string]: StateMetadata };
  zipToMsa: { [zip: string]: string };
  searchIndex: { [term: string]: string[] };
}

interface LocationResult {
  type: 'msa' | 'state';
  code: string;
  name: string;
  shortName: string;
  states: string[];
}

interface SearchSuccessResponse {
  success: true;
  query: string;
  results: LocationResult[];
}

interface SearchErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type SearchResponse = SearchSuccessResponse | SearchErrorResponse;

// Cache geocoding data
let geocodingCache: GeocodingData | null = null;

function loadGeocodingData(): GeocodingData | null {
  if (geocodingCache) return geocodingCache;

  try {
    const dataPath = path.join(process.cwd(), 'data/processed/msa-geocoding.json');
    if (!fs.existsSync(dataPath)) {
      console.log('Geocoding data not found');
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
 * Search for locations matching the query.
 */
function searchLocations(query: string, geocoding: GeocodingData): LocationResult[] {
  const results: LocationResult[] = [];
  const seen = new Set<string>();
  const normalizedQuery = query.toLowerCase().trim();

  // Check if query looks like a ZIP code
  if (/^\d{5}$/.test(normalizedQuery)) {
    const msaCode = geocoding.zipToMsa[normalizedQuery];
    if (msaCode && geocoding.msaMetadata[msaCode]) {
      const msa = geocoding.msaMetadata[msaCode];
      results.push({
        type: 'msa',
        code: msaCode,
        name: msa.name,
        shortName: msa.shortName,
        states: msa.states,
      });
      seen.add(`msa:${msaCode}`);
    }
  }

  // Search MSAs by name
  const queryWords = normalizedQuery.split(/\s+/);

  // First pass: exact prefix match on short name
  for (const [code, msa] of Object.entries(geocoding.msaMetadata)) {
    if (seen.has(`msa:${code}`)) continue;

    const shortNameLower = msa.shortName.toLowerCase();
    if (shortNameLower.startsWith(normalizedQuery)) {
      results.push({
        type: 'msa',
        code,
        name: msa.name,
        shortName: msa.shortName,
        states: msa.states,
      });
      seen.add(`msa:${code}`);
    }
  }

  // Second pass: word match using search index
  if (geocoding.searchIndex && queryWords.length > 0) {
    const matchingCodes = new Map<string, number>();

    for (const word of queryWords) {
      if (word.length < 2) continue;

      // Find all MSAs matching this word
      const matchedCodes = geocoding.searchIndex[word] || [];
      for (const code of matchedCodes) {
        matchingCodes.set(code, (matchingCodes.get(code) || 0) + 1);
      }

      // Also check partial word matches
      for (const [term, codes] of Object.entries(geocoding.searchIndex)) {
        if (term.startsWith(word) || word.startsWith(term)) {
          for (const code of codes) {
            matchingCodes.set(code, (matchingCodes.get(code) || 0) + 0.5);
          }
        }
      }
    }

    // Sort by match score and add to results
    const sortedMatches = [...matchingCodes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    for (const [code] of sortedMatches) {
      if (seen.has(`msa:${code}`)) continue;

      const msa = geocoding.msaMetadata[code];
      if (msa) {
        results.push({
          type: 'msa',
          code,
          name: msa.name,
          shortName: msa.shortName,
          states: msa.states,
        });
        seen.add(`msa:${code}`);
      }
    }
  }

  // Third pass: fuzzy match on full name
  for (const [code, msa] of Object.entries(geocoding.msaMetadata)) {
    if (seen.has(`msa:${code}`)) continue;

    const nameLower = msa.name.toLowerCase();
    if (nameLower.includes(normalizedQuery)) {
      results.push({
        type: 'msa',
        code,
        name: msa.name,
        shortName: msa.shortName,
        states: msa.states,
      });
      seen.add(`msa:${code}`);
    }
  }

  // Search states
  for (const [code, state] of Object.entries(geocoding.stateMetadata)) {
    if (seen.has(`state:${code}`)) continue;

    const nameLower = state.name.toLowerCase();
    const codeLower = code.toLowerCase();

    if (nameLower.startsWith(normalizedQuery) || codeLower === normalizedQuery) {
      results.push({
        type: 'state',
        code,
        name: state.name,
        shortName: code,
        states: [code],
      });
      seen.add(`state:${code}`);
    }
  }

  // Limit results
  return results.slice(0, 15);
}

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        query,
        results: [],
      });
    }

    const geocoding = loadGeocodingData();
    if (!geocoding) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATA_NOT_AVAILABLE',
            message: 'Location data not available',
          },
        },
        { status: 503 }
      );
    }

    const results = searchLocations(query, geocoding);

    return NextResponse.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search locations',
        },
      },
      { status: 500 }
    );
  }
}
