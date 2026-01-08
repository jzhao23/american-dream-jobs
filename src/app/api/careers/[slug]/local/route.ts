/**
 * Career Local Data API Endpoint
 *
 * GET /api/careers/[slug]/local?location=41860
 *
 * Returns local employment and wage data for a specific career in a location.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions
interface LocalCareerData {
  employment: number;
  medianWage: number;
  locationQuotient: number;
  growth?: string;
  growthPercent?: number;
}

interface LocalCareersIndex {
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
  national: {
    [slug: string]: {
      employment: number;
      medianWage: number;
    };
  };
}

interface Career {
  slug: string;
  title: string;
  category: string;
  wages?: {
    annual?: {
      median?: number;
      pct_10?: number;
      pct_90?: number;
    };
  };
}

interface LocalDataSuccessResponse {
  success: true;
  career: {
    slug: string;
    title: string;
  };
  location: {
    code: string;
    name: string;
    type: 'msa' | 'state';
  };
  localData: {
    employment: number;
    medianWage: number;
    locationQuotient: number;
    growth?: string;
    growthPercent?: number;
    wageRange?: {
      pct10: number;
      pct90: number;
    };
  };
  comparison: {
    vsNational: {
      wagePercent: number;
      wageDescription: string;
    };
    concentrationDescription: string;
  };
}

interface LocalDataErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type LocalDataResponse = LocalDataSuccessResponse | LocalDataErrorResponse;

// Cache data
let localIndexCache: LocalCareersIndex | null = null;
let careersCache: Career[] | null = null;

function loadLocalIndex(): LocalCareersIndex | null {
  if (localIndexCache) return localIndexCache;

  try {
    const dataPath = path.join(process.cwd(), 'data/output/local-careers-index.json');
    if (!fs.existsSync(dataPath)) {
      return null;
    }
    localIndexCache = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return localIndexCache;
  } catch (error) {
    console.error('Failed to load local careers index:', error);
    return null;
  }
}

function loadCareers(): Career[] | null {
  if (careersCache) return careersCache;

  try {
    const dataPath = path.join(process.cwd(), 'data/output/careers.json');
    if (!fs.existsSync(dataPath)) {
      return null;
    }
    careersCache = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    return careersCache;
  } catch (error) {
    console.error('Failed to load careers:', error);
    return null;
  }
}

/**
 * Generate description for wage comparison.
 */
function getWageDescription(percentDiff: number): string {
  if (percentDiff > 20) return 'significantly higher';
  if (percentDiff > 10) return 'higher';
  if (percentDiff > 5) return 'slightly higher';
  if (percentDiff > -5) return 'about the same as';
  if (percentDiff > -10) return 'slightly lower';
  if (percentDiff > -20) return 'lower';
  return 'significantly lower';
}

/**
 * Generate description for concentration (location quotient).
 */
function getConcentrationDescription(lq: number): string {
  if (lq > 2.0) return 'This career is highly concentrated in this area (2x+ the national average).';
  if (lq > 1.5) return 'This career is more common in this area than nationally (1.5x average).';
  if (lq > 1.2) return 'This career is somewhat more common here than nationally.';
  if (lq > 0.8) return 'This career has about average concentration in this area.';
  if (lq > 0.5) return 'This career is less common here than nationally.';
  return 'This career is relatively rare in this area compared to nationally.';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<LocalDataResponse>> {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get('location') || '';

    if (!locationCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_LOCATION',
            message: 'Location parameter is required',
          },
        },
        { status: 400 }
      );
    }

    const localIndex = loadLocalIndex();
    const careers = loadCareers();

    if (!localIndex || !careers) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATA_NOT_AVAILABLE',
            message: 'Local data not available',
          },
        },
        { status: 503 }
      );
    }

    // Find career
    const career = careers.find(c => c.slug === slug);
    if (!career) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAREER_NOT_FOUND',
            message: `Career ${slug} not found`,
          },
        },
        { status: 404 }
      );
    }

    // Determine location type and name
    let locationType: 'msa' | 'state';
    let locationName: string;

    if (localIndex.msas[locationCode]) {
      locationType = 'msa';
      locationName = localIndex.msas[locationCode].name;
    } else if (localIndex.states[locationCode]) {
      locationType = 'state';
      locationName = localIndex.states[locationCode].name;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOCATION_NOT_FOUND',
            message: `Location ${locationCode} not found`,
          },
        },
        { status: 404 }
      );
    }

    // Get local data for this career
    const careerLocalData = localIndex.careers[slug]?.[locationCode];
    if (!careerLocalData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_LOCAL_DATA',
            message: `No local data available for ${career.title} in ${locationName}`,
          },
        },
        { status: 404 }
      );
    }

    // Get national baseline
    const nationalData = localIndex.national[slug] || { employment: 0, medianWage: career.wages?.annual?.median || 0 };
    const nationalWage = nationalData.medianWage || career.wages?.annual?.median || 0;

    // Calculate comparison
    const wagePercent = nationalWage > 0
      ? Math.round(((careerLocalData.medianWage - nationalWage) / nationalWage) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      career: {
        slug: career.slug,
        title: career.title,
      },
      location: {
        code: locationCode,
        name: locationName,
        type: locationType,
      },
      localData: {
        employment: careerLocalData.employment,
        medianWage: careerLocalData.medianWage,
        locationQuotient: careerLocalData.locationQuotient,
        growth: careerLocalData.growth,
        growthPercent: careerLocalData.growthPercent,
      },
      comparison: {
        vsNational: {
          wagePercent,
          wageDescription: `Local wages are ${getWageDescription(wagePercent)} the national average`,
        },
        concentrationDescription: getConcentrationDescription(careerLocalData.locationQuotient),
      },
    });
  } catch (error) {
    console.error('Career local data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch local career data',
        },
      },
      { status: 500 }
    );
  }
}
