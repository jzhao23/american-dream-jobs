# Data Sources

This document describes all data sources used in American Dream Jobs and how they are processed.

## Overview

| Source | What It Provides | Update Frequency |
|--------|------------------|------------------|
| O*NET 30.1 | Occupation definitions, tasks, skills, education | Annual |
| BLS OES | Wage data (median, percentiles) | Annual (May) |
| **AIOE Dataset** | AI occupational exposure scores | Static (2021 study) |
| **BLS Employment Projections** | Job growth forecasts 2024-2034 | Biennial |
| **EPOCH Scores** | Human advantage assessment | Maintained manually |
| Frey & Osborne (2013) | Legacy AI risk probabilities | Static (2013) - **LEGACY** |
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

## AI Resilience Data Sources

The AI Resilience classification uses three data sources combined into a 4-tier system. See [AI_RESILIENCE_METHODOLOGY.md](./AI_RESILIENCE_METHODOLOGY.md) for the complete algorithm.

---

### AIOE Dataset - AI Occupational Exposure

**Source**: AI Occupational Exposure (AIOE) Dataset
**Paper**: "Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses"
**Authors**: Felten, E. W., Raj, M., & Seamans, R.
**Year**: 2021
**DOI**: 10.1002/smj.3286
**Data**: https://github.com/AIOE-Data/AIOE

#### What We Use
- **AI exposure scores**: Measures how exposed each occupation is to AI capabilities
- **Coverage**: 774 occupations with SOC codes

#### Methodology
The AIOE index measures AI exposure by:
1. Identifying 10 AI applications from patents and academic literature
2. Surveying relatedness between AI applications and 52 occupational abilities (from O*NET)
3. Weighting by ability importance
4. Aggregating across applications to produce occupation-level scores

#### Processing Pipeline
```
data/sources/ai-exposure.json
    → scripts/generate-final.ts
    → Categorized as Low/Medium/High (33rd percentile thresholds)
```

---

### BLS Employment Projections

**Source**: Bureau of Labor Statistics Employment Projections
**Data**: 2024-2034 projections (fetched via CareerOneStop API)
**URL**: https://www.bls.gov/emp/

#### What We Use
- **Projected employment change**: Percent change 2024-2034
- **Coverage**: 832 occupations

#### Categories
| Category | Percent Change |
|----------|----------------|
| Declining Quickly | < -10% |
| Declining Slowly | -10% to 0% |
| Stable | 0% to 5% |
| Growing Slowly | 5% to 15% |
| Growing Quickly | > 15% |

#### Processing Pipeline
```
CareerOneStop API
    → scripts/fetch-bls-projections.ts
    → data/sources/bls-projections.json
    → Applied in scripts/generate-final.ts
```

---

### EPOCH Scores - Human Advantage Framework

**Framework**: Proprietary assessment of human advantages that are difficult for AI to replicate

#### The EPOCH Dimensions

| Letter | Dimension | Description | Examples |
|--------|-----------|-------------|----------|
| **E** | Empathy | Emotional intelligence, patient/customer care | Nurses, therapists |
| **P** | Presence | Physical presence, hands-on work | Surgeons, electricians |
| **O** | Opinion | Judgment, decision-making, expertise | Managers, lawyers |
| **C** | Creativity | Innovation, artistic expression | Designers, researchers |
| **H** | Hope | Mentorship, motivation, counseling | Teachers, coaches |

#### Scoring
- Each dimension scored 1-5 per occupation
- **Strong** (sum ≥ 20): AI has limited ability to replace
- **Moderate** (sum 12-19): AI augments but doesn't replace
- **Weak** (sum < 12): Higher risk of AI disruption

#### Processing Pipeline
```
data/sources/epoch-scores.json (manually curated, 1,016 occupations)
    → scripts/generate-epoch-scores.ts (for bulk generation)
    → Applied in scripts/generate-final.ts
```

---

## Frey & Osborne - AI Risk Probabilities (LEGACY)

> **Note**: This data source has been superseded by the AI Resilience classification system above.
> It remains in the codebase for fallback classification of careers missing AIOE or BLS data.
> See [AI_RESILIENCE_METHODOLOGY.md](./AI_RESILIENCE_METHODOLOGY.md) for the current methodology.

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
    → Used as fallback in scripts/generate-final.ts
```

### Legacy Documentation
See [AI_RISK_METHODOLOGY.md](./AI_RISK_METHODOLOGY.md) for the original mapping documentation.

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

## Career Compass - AI-Powered Recommendations

**Feature**: Personalized career matching using RAG (Retrieval-Augmented Generation)
**Implementation**: 2026-01-02

### What It Does
Analyzes user resumes and questionnaire responses to recommend careers from the database of 1,016 occupations. Returns top 7 matches with personalized reasoning, skills gaps, and transition timelines.

### Data Sources Used
- **Career Data**: All fields from `careers.generated.json` (tasks, inside_look, skills, abilities)
- **AI Resilience**: Classification, EPOCH scores, job growth from AI Resilience methodology
- **Salary Data**: Median pay, percentiles for financial viability checking
- **Education**: Requirements and costs for transition timeline estimation

### Processing Pipeline
```
User Resume + 5 Questions
    ↓
1. PDF Parsing (pdf-parse + GPT-4o-mini)
    ↓
2. Generate Embeddings (OpenAI text-embedding-3-small)
    ↓
3. Vector Search (in-memory cosine similarity)
    ↓
4. LLM Ranking (GPT-4o-mini evaluates top 50)
    ↓
Return Top 7 Matches
```

### Pre-Generated Data
```
data/embeddings/
└── career-embeddings.json    # 3 embeddings per career (task, narrative, skills)
                              # Generated once via: npx tsx scripts/generate-career-embeddings.ts
                              # Size: ~19MB
                              # Cost: $0.03 one-time
```

### Runtime Cost
- **Per recommendation**: ~$0.035 (3.5 cents)
- **Breakdown**: Resume parsing ($0.0003) + Query embeddings ($0.000006) + Ranking ($0.034)

### Documentation
See [CAREER_COMPASS_METHODOLOGY.md](./CAREER_COMPASS_METHODOLOGY.md) for complete technical details.

---

## Data Refresh Schedule

| Data | Command | When to Run |
|------|---------|-------------|
| O*NET | `npm run data:process-onet` | When new O*NET version releases |
| BLS Wages | `npm run data:fetch-wages` | After May OES release |
| BLS Projections | `npx tsx scripts/fetch-bls-projections.ts` | When new projection cycle releases (~2 years) |
| AIOE Dataset | Download from GitHub | If new version published |
| EPOCH Scores | `npx tsx scripts/generate-epoch-scores.ts` | When new occupations added |
| Reddit Reviews | `npm run fetch-reviews` | Monthly or on-demand |
| Companies | `npx tsx scripts/scrape-theorg.ts` | On-demand or when adding new companies |
| **Career Compass Embeddings** | `npx tsx scripts/generate-career-embeddings.ts` | **Once after initial setup, or when career data changes significantly** |
| Full Regenerate | `npm run data:generate-final` | After any source update |

---

## File Locations

### Source Data
```
data/sources/
├── onet/                      # Raw O*NET database files
├── oxford/                    # Frey-Osborne AI risk data (LEGACY)
├── bls/                       # BLS wage data
├── ai-exposure.json           # AIOE dataset (774 occupations)
├── ai-exposure-metadata.json  # AIOE source citation
├── bls-projections.json       # BLS 2024-2034 projections (832 occupations)
├── bls-projections-metadata.json
└── epoch-scores.json          # EPOCH scores for all 1,016 occupations
```

### Processed Data
```
data/processed/
├── onet_occupations_list.json      # Parsed O*NET occupations
├── occupations_complete.json       # Full enriched data
├── oxford_ai_risk_mapping.json     # Legacy AI risk mappings
└── career_progression_mappings.json # Salary progressions
```

### Website Data (tracked in git)
```
data/
├── careers-index.json      # Lightweight index for explorer
├── careers.generated.json  # Full data with AI Resilience classifications
├── companies.json          # Company organizational data and career ladders
└── embeddings/
    └── career-embeddings.json  # Pre-built vectors for Career Compass (~19MB)
```
