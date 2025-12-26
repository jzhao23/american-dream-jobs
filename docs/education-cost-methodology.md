# Education Cost Methodology

This document describes how education costs are calculated for each occupation in the American Dream Jobs platform.

## Overview

Education costs are estimated using a combination of:
1. **CIP-SOC Crosswalk** - Maps occupations to educational programs
2. **College Board Tuition Data** - National average tuition by institution type
3. **Professional Association Data** - Costs for specialized programs (MD, JD, etc.)
4. **Trade Program Data** - Costs for apprenticeships and vocational training

## Data Sources

### Primary Sources

| Source | Data Provided | URL |
|--------|--------------|-----|
| **CIP-SOC Crosswalk** | Maps SOC occupation codes to CIP education program codes | [NCES CIP-SOC Crosswalk](https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx) |
| **College Board** | National average tuition & fees by institution type | [Trends in College Pricing](https://research.collegeboard.org/trends/college-pricing) |

### Supplementary Sources

| Source | Data Provided |
|--------|--------------|
| **AAMC** | Medical school costs (~$236k total) |
| **ABA/LSAC** | Law school costs (~$138k total) |
| **ADA** | Dental school costs |
| **AACP** | Pharmacy school costs |
| **Trade associations** | Apprenticeship and vocational program data |

## Methodology

### Step 1: Map Occupation to Educational Programs

Each occupation (identified by SOC code) is mapped to one or more educational programs (identified by CIP code) using the NCES CIP-SOC Crosswalk.

Example:
- Software Developer (SOC 15-1252) → Computer Science (CIP 11.0701)
- Registered Nurse (SOC 29-1141) → Nursing (CIP 51.3801)

### Step 2: Determine Credential Level

Based on O*NET's "typical entry education" field, we identify the required credential level:
- High school diploma
- Certificate
- Associate's degree
- Bachelor's degree
- Master's degree
- Doctoral degree
- Professional degree (MD, JD, etc.)

### Step 3: Calculate Costs by Institution Type

Using College Board 2024-25 national average data:

| Institution Type | Annual Tuition & Fees |
|------------------|----------------------|
| Public 2-year (in-district) | $3,990 |
| Public 4-year (in-state) | $11,610 |
| Public 4-year (out-of-state) | $24,030 |
| Private nonprofit 4-year | $43,350 |

Costs are multiplied by program duration:
- Certificate: 1 year
- Associate's: 2 years
- Bachelor's: 4 years
- Master's: 2 years (after bachelor's)
- Doctoral: 5+ years (often funded)

### Step 4: Apply Field-Specific Adjustments

Certain fields have higher or lower costs. We apply multipliers based on CIP code prefix:

| Field | CIP Prefix | Cost Multiplier |
|-------|-----------|-----------------|
| Engineering | 14 | 1.20x |
| Computer Science | 11 | 1.15x |
| Health Professions | 51 | 1.15x |
| Education | 13 | 0.90x |
| Construction Trades | 46 | 0.70x |

### Step 5: Handle Special Cases

#### Professional Programs (MD, JD, etc.)
Professional programs use data from their respective associations:
- Medical school (MD): Public ~$170k, Private ~$256k
- Law school (JD): Public ~$87k, Private ~$159k
- Dental school (DDS): Public ~$180k, Private ~$320k

These costs are added to bachelor's degree costs since most require a prior degree.

#### Trade Programs & Apprenticeships
Trade programs use specific cost data:
- Electrician apprenticeship: $0 tuition (earn while you learn)
- HVAC technician: $10k-$25k trade school
- Commercial driver (CDL): $3k-$10k

## Output Schema

Each occupation receives an education cost estimate with:

```typescript
{
  min_cost: number;       // Public in-state path
  max_cost: number;       // Private path
  typical_cost: number;   // Out-of-state or average

  cost_breakdown: [{
    item: string;         // e.g., "Bachelor's degree"
    min: number;
    max: number;
    typical: number;
  }];

  by_institution_type: {
    public_in_state: { total: number; per_year: number } | null;
    public_out_of_state: { total: number; per_year: number } | null;
    private_nonprofit: { total: number; per_year: number } | null;
    community_college: { total: number; per_year: number } | null;
    trade_school: { total: number; program_length_months: number } | null;
    apprenticeship: { cost: number; earn_while_learning: boolean } | null;
  };

  data_source: {
    primary: 'college_board' | 'professional_association' | 'trade_data' | 'estimated';
    cip_codes: string[];
    year: number;
    confidence: 'high' | 'medium' | 'low';
  };
}
```

## Confidence Levels

- **High**: Professional programs with association data, apprenticeships
- **Medium**: Standard degree programs with CIP mapping and College Board data
- **Low**: Fallback estimates without CIP mapping or specific program data

## Known Limitations

1. **National Averages Only**: Costs vary significantly by state and region
2. **No Financial Aid**: Estimates are sticker prices before scholarships/grants
3. **Simplified Durations**: Actual time to degree varies by student
4. **Annual Updates Needed**: College Board data is updated annually (October)

## Update Schedule

| Data Source | Update Frequency | Typical Release |
|-------------|-----------------|-----------------|
| College Board | Annual | October |
| CIP-SOC Crosswalk | Every 5-7 years | With SOC updates |
| Professional Programs | Annual | Manual review |

## Files

- `scripts/fetch-education-costs.ts` - Main processing script
- `data/sources/education/cip_soc_crosswalk.xlsx` - CIP-SOC mapping
- `data/sources/education/professional_programs.json` - Manual program data
- `data/processed/education_costs.json` - Generated cost data
- `data/processed/cip_soc_mapping.json` - Parsed SOC-to-CIP mapping

## Running the Script

```bash
npm run data:fetch-education
```

Or as part of the full data refresh:

```bash
npm run data:refresh
```
