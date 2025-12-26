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
| TheOrg.com | Company org charts, departments, career ladders | On-demand / Manual |

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
**Coverage**: Primarily tech industry

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
- **Fallback**: Use BLS percentiles for progression estimates

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

## TheOrg.com - Company Organizational Data

**Source**: https://theorg.com
**Access**: Web scraping via Firecrawl
**Coverage**: 20 major companies across tech, finance, healthcare, retail, and aerospace

### What We Use
- **Company information**: Name, industry, employee count, headquarters, description
- **Organizational structure**: Departments and roles within each company
- **Career ladders**: Role progression paths with level codes (e.g., L3 → L4 → L5 for tech)
- **Career mapping**: Links company roles to O*NET occupations via `career_slug`

### Processing Pipeline
```
TheOrg.com → scripts/scrape-theorg.ts → data/companies.json
```

### Target Companies (20 total)
- **Tech (8)**: Google, Amazon, Meta, Apple, Microsoft, Netflix, Salesforce, Stripe
- **Finance (4)**: JPMorgan Chase, Goldman Sachs, Morgan Stanley, Bank of America
- **Healthcare (3)**: UnitedHealth Group, Johnson & Johnson, Pfizer
- **Retail/Consumer (3)**: Walmart, Nike, Disney
- **Other (2)**: Boeing, SpaceX

### Data Structure
Each company entry includes:
- Basic info (slug, name, industry, employee count, headquarters)
- Departments with associated roles
- Career ladders with progression levels and experience ranges
- Links to careers via `career_slug` field
- `data_source` field indicating "manual" for curated entries or "scraped" for automated

### Career Ladder Templates
Industry-specific templates define progression paths:
- **Tech**: Software Engineering (L3-L7), Product Management (APM → Dir), Data Science (L3-L6)
- **Finance**: Investment Banking (Analyst → MD), Technology roles
- **Healthcare**: Clinical roles, Research & Development
- **Retail**: Store Operations, Supply Chain, Corporate roles

### Manual Curation
Some entries are marked `"data_source": "manual"` indicating:
- Manual verification of scraped data
- Custom career ladder definitions
- Industry-specific role mappings

---

## Data Refresh Schedule

| Data | Command | When to Run |
|------|---------|-------------|
| O*NET | `npm run fetch-careers` | When new O*NET version releases |
| BLS Wages | `npm run fetch-wages` | After May OES release |
| AI Risk | `npx tsx scripts/map-oxford-ai-risk.ts` | Only if mapping logic changes |
| Reddit Reviews | `npm run fetch-reviews` | Monthly or on-demand |
| Companies | `npx tsx scripts/scrape-theorg.ts` | On-demand or when adding new companies |
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
├── careers.generated.json  # Full data for detail pages
└── companies.json          # Company organizational data and career ladders
```
