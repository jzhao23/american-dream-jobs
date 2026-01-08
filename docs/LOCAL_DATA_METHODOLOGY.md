# Local Job Market Data Methodology

This document describes the data sources, processing pipeline, and methodology used for the locally-aware job information feature in American Dream Jobs.

## Overview

The local job market feature provides location-specific employment data, wages, and job concentration for careers across the United States. Users can see how careers compare in their specific area versus national averages.

## Data Sources

### Primary: BLS OEWS Metropolitan Area Data

**Source**: Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS)
**URL**: https://www.bls.gov/oes/special.requests/oesm24ma.zip
**Coverage**: ~530 Metropolitan Statistical Areas (MSAs)
**Occupations**: ~830 detailed SOC occupations
**Update Frequency**: Annual (May reference period, released April following year)
**Data Year**: 2024 (May 2024 estimates)

The OEWS provides firm-reported employment and wage data, which is more precise than survey-based data. Each MSA record includes:
- Total employment count
- Mean and median wages (hourly and annual)
- Wage percentiles (10th, 25th, 75th, 90th)
- Location quotient (concentration vs national average)

### Secondary: BLS OEWS State Data (Rural Fallback)

**Source**: BLS OEWS State-level estimates
**URL**: https://www.bls.gov/oes/special.requests/oesm24st.zip
**Coverage**: 50 states + DC + territories
**Purpose**: Fallback data for users in rural areas outside MSA coverage

Approximately 15% of US employment is outside MSA boundaries. For these users, we fall back to state-level data.

### Geocoding: ZIP-to-MSA Mapping

**Source**: HUD USPS ZIP Code Crosswalk
**URL**: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
**Purpose**: Maps ZIP codes to CBSAs (Core Based Statistical Areas = MSAs + micropolitan areas)

Notes:
- One ZIP code can span multiple MSAs; we use the primary assignment (highest residential ratio)
- Rural ZIPs outside any MSA are mapped to state-level data

## Data Processing Pipeline

### 1. Fetch BLS Data (`scripts/fetch-bls-msa-wages.ts`)

Downloads and parses BLS OEWS data files:

```bash
npm run data:fetch-msa
```

**Input**: BLS ZIP files (oesm24ma.zip, oesm24st.zip)
**Output**:
- `data/sources/bls-msa/msa-wages.json`
- `data/sources/bls-msa/state-wages.json`
- `data/sources/bls-msa/msa-metadata.json`

**Processing**:
1. Download ZIP files from BLS
2. Extract and parse Excel files using `xlsx` library
3. Handle BLS special codes:
   - `#` = Wage estimate not available
   - `*` = Employment estimate not available
   - `**` = Wage above $115.00/hr or $239,200/yr
4. Map 6-digit SOC codes to 8-digit O*NET codes
5. Cache parsed data for subsequent runs

### 2. Build Geocoding Data (`scripts/build-msa-geocoding.ts`)

Creates ZIP-to-MSA mapping and search index:

```bash
npm run data:build-geocoding
```

**Input**:
- MSA metadata from step 1
- HUD ZIP crosswalk (optional, requires manual download)

**Output**: `data/processed/msa-geocoding.json`

**Structure**:
```typescript
{
  zipToMsa: { [zip: string]: string },       // "94102" -> "41860"
  zipToState: { [zip: string]: string },     // "94102" -> "CA"
  msaMetadata: {
    [code: string]: {
      name: string,
      shortName: string,
      states: string[],
      lat: number | null,
      lng: number | null
    }
  },
  stateMetadata: { ... },
  searchIndex: { [term: string]: string[] }  // Search optimization
}
```

### 3. Generate Frontend Index (`scripts/generate-local-careers-index.ts`)

Creates a lightweight, frontend-ready index:

```bash
npm run data:generate-local
```

**Input**:
- MSA and state wage data
- Career data (careers.json)
- Geocoding data

**Output**: `data/output/local-careers-index.json`

**Structure**:
```typescript
{
  metadata: {
    source: string,
    generated_at: string,
    total_careers: number,
    total_msas: number,
    total_states: number
  },
  msas: { [code: string]: { name, shortName, states } },
  states: { [code: string]: { name } },
  careers: {
    [slug: string]: {
      [locationCode: string]: {
        employment: number,
        medianWage: number,
        locationQuotient: number
      }
    }
  },
  localJobs: {
    [locationCode: string]: {
      fastestGrowing: string[],  // Career slugs
      mostJobs: string[],
      highConcentration: string[]
    }
  },
  national: {
    [slug: string]: { employment, medianWage }
  }
}
```

### Full Pipeline

Run the entire local data pipeline:

```bash
npm run data:local
```

This executes: fetch-msa -> build-geocoding -> generate-local

## API Endpoints

### Location Detection

```
GET /api/location/detect
```

Auto-detects user location using Vercel geo headers:
- `x-vercel-ip-city`
- `x-vercel-ip-country-region`
- `x-vercel-ip-latitude`
- `x-vercel-ip-longitude`

Returns nearest MSA or falls back to state for rural users.

### Location Search

```
GET /api/location/search?q=san+francisco
```

Searches MSAs and states by name or ZIP code.

### Career Local Data

```
GET /api/careers/[slug]/local?location=41860
```

Returns local employment, wages, and comparison to national for a specific career.

### Local Jobs Rankings

```
GET /api/local-jobs?location=41860&limit=20
```

Returns ranked lists of careers by employment and concentration for a location.

## Location Quotient

Location quotient (LQ) measures the concentration of an occupation in an area compared to national average:

```
LQ = (Local employment in occupation / Total local employment) /
     (National employment in occupation / Total national employment)
```

**Interpretation**:
- LQ > 1.0: Occupation is more concentrated locally than nationally
- LQ = 1.0: Same concentration as national average
- LQ < 1.0: Occupation is less concentrated locally

**Display thresholds**:
- LQ > 2.0: "Highly concentrated" (2x+ national average)
- LQ > 1.5: "More common" (1.5x average)
- LQ > 1.2: "Somewhat more common"
- LQ 0.8-1.2: "About average"
- LQ < 0.8: "Less common"
- LQ < 0.5: "Relatively rare"

## User Location Handling

### Detection Strategy

1. **Auto-detect**: Use Vercel geo headers (no user prompt needed)
2. **Fallback prompt**: If detection fails, prompt on first visit
3. **Re-prompt**: If user dismisses, prompt again when accessing local features
4. **Persistence**: Save to localStorage (`adj-location` key)

### Rural User Handling

For users outside MSA coverage (~15% of US employment):
1. Detect state from coordinates or IP region
2. Show state-level data instead of MSA data
3. Indicate "Statewide data" in UI

## Limitations

1. **Data Currency**: BLS OEWS is updated annually; data reflects May estimates
2. **MSA Coverage**: Only covers metropolitan areas; rural areas use state-level fallback
3. **Occupation Mapping**: Some O*NET occupations may not have direct BLS SOC matches
4. **Growth Data**: Year-over-year growth requires historical data (future enhancement)
5. **IP Geolocation**: VPN users may see incorrect location detection

## Future Enhancements

1. **Historical Trends**: Add 5-year employment growth data
2. **ACS Integration**: Add county-level data from American Community Survey
3. **Cost of Living**: Adjust wages by local cost of living
4. **Job Postings**: Integrate actual job listings from job boards
5. **Commute Radius**: Filter by commute time from user location

## References

- BLS OEWS Technical Notes: https://www.bls.gov/oes/current/oes_tec.htm
- BLS MSA Data: https://www.bls.gov/oes/current/oessrcma.htm
- HUD ZIP Crosswalk: https://www.huduser.gov/portal/datasets/usps_crosswalk.html
- OMB MSA Definitions: https://www.census.gov/geographies/reference-files/time-series/demo/metro-micro/delineation-files.html
