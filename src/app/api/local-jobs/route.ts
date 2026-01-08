/**
 * Local Jobs API Endpoint
 *
 * GET /api/local-jobs?location=41860&limit=20
 *
 * Returns top careers for a given location (MSA code or state abbreviation).
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
  metadata: {
    source: string;
    generated_at: string;
  };
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
  localJobs: {
    [locationCode: string]: {
      fastestGrowing: string[];
      mostJobs: string[];
      highConcentration: string[];
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
  ai_resilience?: string;
}

interface LocalJobEntry {
  slug: string;
  title: string;
  category: string;
  employment: number;
  medianWage: number;
  locationQuotient: number;
  aiResilience?: string;
  vsNational?: {
    wagePercent: number;
  };
}

interface LocalJobsSuccessResponse {
  success: true;
  location: {
    code: string;
    name: string;
    type: 'msa' | 'state';
  };
  fastestGrowing: LocalJobEntry[];
  mostJobs: LocalJobEntry[];
  highGrowth: LocalJobEntry[];
}

interface LocalJobsErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type LocalJobsResponse = LocalJobsSuccessResponse | LocalJobsErrorResponse;

// Cache data
let localIndexCache: LocalCareersIndex | null = null;
let careersCache: Career[] | null = null;

function loadLocalIndex(): LocalCareersIndex | null {
  if (localIndexCache) return localIndexCache;

  try {
    const dataPath = path.join(process.cwd(), 'data/output/local-careers-index.json');
    if (!fs.existsSync(dataPath)) {
      console.log('Local careers index not found');
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
      console.log('Careers data not found');
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
 * Build a LocalJobEntry from career data.
 */
function buildJobEntry(
  slug: string,
  localData: LocalCareerData,
  careers: Career[],
  nationalData: { employment: number; medianWage: number } | undefined
): LocalJobEntry | null {
  const career = careers.find(c => c.slug === slug);
  if (!career) return null;

  const entry: LocalJobEntry = {
    slug,
    title: career.title,
    category: career.category,
    employment: localData.employment,
    medianWage: localData.medianWage,
    locationQuotient: localData.locationQuotient,
    aiResilience: career.ai_resilience,
  };

  // Calculate vs national
  if (nationalData && nationalData.medianWage > 0) {
    entry.vsNational = {
      wagePercent: Math.round(((localData.medianWage - nationalData.medianWage) / nationalData.medianWage) * 100),
    };
  }

  return entry;
}

export async function GET(request: NextRequest): Promise<NextResponse<LocalJobsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const locationCode = searchParams.get('location') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

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
            message: 'Local jobs data not available',
          },
        },
        { status: 503 }
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

    // Get rankings for this location
    const rankings = localIndex.localJobs[locationCode] || {
      fastestGrowing: [],
      mostJobs: [],
    };

    // Build response lists
    const buildList = (slugs: string[]): LocalJobEntry[] => {
      return slugs
        .slice(0, limit)
        .map(slug => {
          const localData = localIndex.careers[slug]?.[locationCode];
          if (!localData) return null;

          return buildJobEntry(slug, localData, careers, localIndex.national[slug]);
        })
        .filter((entry): entry is LocalJobEntry => entry !== null);
    };

    // Build most jobs list dynamically (sorted by employment)
    const buildMostJobsList = (): LocalJobEntry[] => {
      const careersByEmployment: { slug: string; employment: number; entry: LocalJobEntry }[] = [];

      for (const [slug, locations] of Object.entries(localIndex.careers)) {
        const localData = locations[locationCode];
        if (localData && localData.employment) {
          const entry = buildJobEntry(slug, localData, careers, localIndex.national[slug]);
          if (entry) {
            careersByEmployment.push({ slug, employment: localData.employment, entry });
          }
        }
      }

      // Sort by employment descending
      careersByEmployment.sort((a, b) => b.employment - a.employment);

      return careersByEmployment.slice(0, limit).map(c => c.entry);
    };

    // Build high growth list dynamically (careers with >5% annual growth)
    const buildHighGrowthList = (): LocalJobEntry[] => {
      const highGrowthCareers: { slug: string; growthPercent: number; entry: LocalJobEntry }[] = [];

      for (const [slug, locations] of Object.entries(localIndex.careers)) {
        const localData = locations[locationCode];
        if (localData && localData.growthPercent && localData.growthPercent > 5) {
          const entry = buildJobEntry(slug, localData, careers, localIndex.national[slug]);
          if (entry) {
            highGrowthCareers.push({ slug, growthPercent: localData.growthPercent, entry });
          }
        }
      }

      // Sort by growth rate descending
      highGrowthCareers.sort((a, b) => b.growthPercent - a.growthPercent);

      return highGrowthCareers.slice(0, limit).map(c => c.entry);
    };

    return NextResponse.json({
      success: true,
      location: {
        code: locationCode,
        name: locationName,
        type: locationType,
      },
      fastestGrowing: buildList(rankings.fastestGrowing),
      mostJobs: buildMostJobsList(),
      highGrowth: buildHighGrowthList(),
    });
  } catch (error) {
    console.error('Local jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch local jobs',
        },
      },
      { status: 500 }
    );
  }
}
