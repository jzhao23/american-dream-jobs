# Data Sources

This document describes all data sources used in American Dream Jobs and how they are processed.

## Overview

| Source | What It Provides | Update Frequency |
|--------|------------------|------------------|
| O*NET 30.1 | Occupation definitions, tasks, skills, education | Annual |
| BLS OES | Wage data (median, percentiles) | Annual (May) |
| Frey & Osborne (2013) | AI/automation risk probabilities | Static (2013 study) |
| Levels.fyi | Tech salary progressions | Quarterly |
| Reddit | Real worker experiences | On-demand |

---

## O*NET (Occupational Information Network)

**Source**: https://www.onetcenter.org/database.html
**Version**: 30.1 (2024)
**License**: Public Domain

### What We Use
- **Occupation definitions**: 1,016 occupations with titles, descriptions, alternate titles
- **Tasks**: Detailed task statements for each occupation
- **Skills & Abilities**: Required competencies
- **Education requirements**: Typical entry education, job zones
- **SOC codes**: Standard Occupational Classification codes for cross-referencing

### Processing Pipeline
```
data/sources/onet/ → scripts/process-onet.ts → data/processed/onet_occupations_list.json
```

### O*NET Data Corrections

Some O*NET records have incorrect `typical_entry_education` values. We maintain manual overrides in `scripts/process-onet.ts`:

| O*NET Code | Career | O*NET Says | We Override To |
|------------|--------|------------|----------------|
| 29-1029.00 | Dentists, All Other Specialists | Bachelor's | Post-doctoral training |
| 29-1212.00 | Cardiologists | Bachelor's | Post-doctoral training |
| 29-1229.00 | Physicians, All Other | Bachelor's | Post-doctoral training |
| 29-1242.00 | Orthopedic Surgeons | Bachelor's | Post-doctoral training |
| 29-1243.00 | Pediatric Surgeons | Bachelor's | Post-doctoral training |
| 29-1249.00 | Surgeons, All Other | Bachelor's | Post-doctoral training |

See [data-update-guide.md](./data-update-guide.md#onet-education-data-overrides) for details.

---

## BLS Occupational Employment and Wage Statistics (OES)

**Source**: https://www.bls.gov/oes/
**Version**: May 2023
**License**: Public Domain

### What We Use
- **Wage data**: Annual median, mean, and percentile wages (10th, 25th, 75th, 90th)
- **Employment counts**: Number of workers in each occupation

### Processing Pipeline
```
BLS API → scripts/fetch-bls-wages.ts → Merged into occupations_complete.json
```

---

## Frey & Osborne - AI Risk Probabilities

**Source**: Oxford Martin School
**Paper**: "The Future of Employment: How Susceptible Are Jobs to Computerisation?"
**Authors**: Carl Benedikt Frey & Michael A. Osborne
**Year**: 2013 (published 2017)
**URL**: https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment

### What We Use
- **Computerisation probability**: 0.0 to 1.0 for 702 occupations
- **SOC codes**: For matching to our O*NET occupations

### Processing Pipeline
```
data/sources/oxford/frey-osborne-2013.json
    → scripts/map-oxford-ai-risk.ts
    → data/processed/oxford_ai_risk_mapping.json
    → Applied in scripts/generate-final.ts
```

### Detailed Methodology
See [AI_RISK_METHODOLOGY.md](./AI_RISK_METHODOLOGY.md) for complete mapping documentation.

---

## Levels.fyi - Career Progression Data

**Source**: https://www.levels.fyi
**Access**: Public salary data
**Coverage**: Primarily tech industry (41 occupations mapped)

### What We Use
- **Salary by level**: Entry → Senior → Staff → Principal progressions
- **Company compensation**: Base, equity, bonus breakdowns

### Processing Pipeline
```
Levels.fyi data → scripts/create-progression-mappings.ts → data/processed/career_progression_mappings.json
```

### Mapping Approach
- **Exact match**: Occupation title matches Levels.fyi title
- **Close match**: Similar role (e.g., "Software Developer" → "Software Engineer")
- **Approximate**: Same job family
- **Fallback**: Use BLS percentiles for progression estimates (975 occupations)

### BLS Percentile Estimation
For occupations without Levels.fyi data, we use BLS wage percentiles (10th, 25th, 50th, 75th, 90th) to estimate career progression. However, BLS does not report exact wages for high earners (~$208,000+ threshold), returning `null` instead.

For these high-earning careers (56-77 occupations including physicians, executives, lawyers), we **estimate** the missing 75th and 90th percentiles using the BLS `mean` and ratio extrapolation.

### Detailed Methodology
See [CAREER_PROGRESSION_METHODOLOGY.md](./CAREER_PROGRESSION_METHODOLOGY.md) for complete documentation including:
- Estimation algorithm for missing percentiles
- Validation approach
- Limitations and uncertainty

---

## Reddit - Real Worker Experiences

**Source**: Reddit API (various career subreddits)
**Access**: OAuth API
**Content**: First-person accounts from workers

### What We Use
- **Job experiences**: Day-in-the-life descriptions
- **Pros and cons**: What workers like/dislike
- **Career advice**: Tips for entering the field

### Processing Pipeline
```
Reddit API → scripts/fetch-reddit-reviews.ts → data/reviews/sources/
    → scripts/enrich-reviews.ts → data/reviews/
```

### Subreddits Searched
- r/jobs, r/careerguidance, r/cscareerquestions
- Industry-specific subreddits (r/nursing, r/electricians, etc.)

---

## Data Refresh Schedule

| Data | Command | When to Run |
|------|---------|-------------|
| O*NET | `npm run fetch-careers` | When new O*NET version releases |
| BLS Wages | `npm run fetch-wages` | After May OES release |
| AI Risk | `npx tsx scripts/map-oxford-ai-risk.ts` | Only if mapping logic changes |
| Reddit Reviews | `npm run fetch-reviews` | Monthly or on-demand |
| Full Regenerate | `npx tsx scripts/generate-final.ts` | After any source update |

---

## File Locations

### Source Data (gitignored, can be regenerated)
```
data/sources/
├── onet/              # Raw O*NET database files
├── oxford/            # Frey-Osborne AI risk data (TRACKED - small)
└── bls/               # BLS wage data
```

### Processed Data (gitignored, can be regenerated)
```
data/processed/
├── onet_occupations_list.json      # Parsed O*NET occupations
├── occupations_complete.json       # Full enriched data
├── oxford_ai_risk_mapping.json     # AI risk mappings
└── career_progression_mappings.json # Salary progressions
```

### Website Data (tracked in git)
```
data/
├── careers-index.json      # Lightweight index for explorer
└── careers.generated.json  # Full data for detail pages
```
