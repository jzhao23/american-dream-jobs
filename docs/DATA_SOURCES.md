# Data Sources

This document describes all data sources used in American Dream Jobs and how they are processed.

## Overview

| Source | What It Provides | Update Frequency |
|--------|------------------|------------------|
| O*NET 30.1 | Occupation definitions, tasks, skills, education | Annual |
| BLS OES | Wage data (median, percentiles) | Annual (May) |
| **GPTs are GPTs** | LLM task exposure scores (PRIMARY) | Static (2023 study) |
| **AIOE Dataset** | AI occupational exposure scores (FALLBACK) | Static (2021 study) |
| **BLS Employment Projections** | Job growth forecasts 2024-2034 | Biennial |
| **EPOCH Scores** | Human advantage assessment | Maintained manually |
| Frey & Osborne (2013) | Legacy AI risk probabilities | Static (2013) - **LEGACY** |
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

## AI Resilience Data Sources

The AI Resilience classification uses multiple data sources combined into a 4-tier system. See [AI_RESILIENCE_METHODOLOGY.md](./AI_RESILIENCE_METHODOLOGY.md) for the complete algorithm.

### Task Exposure Fallback Hierarchy

The system uses a priority-based fallback for task exposure:

1. **GPTs are GPTs** (PRIMARY) - Most current LLM-specific data (2023)
2. **AIOE Dataset** (FALLBACK) - Broader coverage, older data (2021)
3. **Default "Medium"** (LAST RESORT) - When no exposure data exists

This ensures all 1,016 occupations receive a classification while prioritizing the most current and relevant exposure data.

---

### GPTs are GPTs - LLM Task Exposure (PRIMARY)

**Source**: OpenAI GPTs are GPTs Dataset
**Paper**: "GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models"
**Authors**: Eloundou, T., Manning, S., Mishkin, P., & Rock, D.
**Year**: 2023 (published Science 2024)
**DOI**: 10.1126/science.adj0998
**arXiv**: 2303.10130
**Data**: https://github.com/openai/GPTs-are-GPTs

#### What We Use
- **LLM exposure scores**: β (beta) metric measuring tasks that can be completed 50% faster using LLMs with external tools
- **Coverage**: 923 occupations

#### Methodology
The GPTs are GPTs dataset measures LLM-specific exposure by:
1. Defining exposure rubrics for individual work tasks
2. Using both human annotators and GPT-4 to classify tasks
3. Computing task-level scores for 50% speedup potential (α, β, γ metrics)
4. Aggregating to occupation-level statistics

We use the **gpt4_beta** metric because it reflects practical LLM impact: tasks that can be sped up 50% using LLMs with access to external tools (code execution, web browsing, etc.).

#### Processing Pipeline
```
data/sources/gpts-are-gpts.json (923 occupations)
    → scripts/generate-final.ts
    → Categorized as Low/Medium/High (tercile thresholds: <0.22, 0.22-0.47, >0.47)
```

---

### AIOE Dataset - AI Occupational Exposure (FALLBACK)

**Source**: AI Occupational Exposure (AIOE) Dataset
**Paper**: "Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses"
**Authors**: Felten, E. W., Raj, M., & Seamans, R.
**Year**: 2021
**DOI**: 10.1002/smj.3286
**Data**: https://github.com/AIOE-Data/AIOE

> **Note**: This dataset is used as a fallback for occupations not covered by GPTs are GPTs.

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
    → scripts/generate-final.ts (used when GPTs are GPTs data unavailable)
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

## Data Refresh Schedule

| Data | Command | When to Run |
|------|---------|-------------|
| O*NET | `npm run data:process-onet` | When new O*NET version releases |
| BLS Wages | `npm run data:fetch-wages` | After May OES release |
| GPTs are GPTs | `npx tsx scripts/fetch-gpts-are-gpts.ts` | If new version published (PRIMARY exposure) |
| BLS Projections | `npx tsx scripts/fetch-bls-projections.ts` | When new projection cycle releases (~2 years) |
| AIOE Dataset | `npx tsx scripts/fetch-ai-exposure.ts` | If new version published (FALLBACK) |
| EPOCH Scores | `npx tsx scripts/generate-epoch-scores.ts` | When new occupations added |
| Reddit Reviews | `npm run fetch-reviews` | Monthly or on-demand |
| Full Regenerate | `npm run data:generate-final` | After any source update |

---

## File Locations

### Source Data
```
data/sources/
├── onet/                        # Raw O*NET database files
├── oxford/                      # Frey-Osborne AI risk data (LEGACY)
├── bls/                         # BLS wage data
├── gpts-are-gpts.json           # GPTs are GPTs LLM exposure (923 occupations) - PRIMARY
├── gpts-are-gpts-metadata.json  # GPTs are GPTs source citation
├── ai-exposure.json             # AIOE dataset (774 occupations) - FALLBACK
├── ai-exposure-metadata.json    # AIOE source citation
├── bls-projections.json         # BLS 2024-2034 projections (832 occupations)
├── bls-projections-metadata.json
└── epoch-scores.json            # EPOCH scores for all 1,016 occupations
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
└── careers.generated.json  # Full data with AI Resilience classifications
```
