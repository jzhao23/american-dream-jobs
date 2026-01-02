# AI Risk Methodology

> **LEGACY DOCUMENTATION**
>
> This methodology has been superseded by the **[AI Resilience Classification](AI_RESILIENCE_METHODOLOGY.md)**, which provides a more nuanced 4-tier assessment incorporating:
> - AI task exposure (AIOE dataset, 2021)
> - Job growth trends (BLS 2024-2034 projections)
> - Human advantage factors (EPOCH framework)
>
> The Frey & Osborne data below is retained for fallback classification of careers missing newer data sources.

---

This document explains how the legacy AI risk scores were calculated for each occupation in American Dream Jobs.

## Source Study

**Paper**: "The Future of Employment: How Susceptible Are Jobs to Computerisation?"
**Authors**: Carl Benedikt Frey & Michael A. Osborne
**Institution**: Oxford Martin School, University of Oxford
**Year**: 2013 (published in Technological Forecasting and Social Change, 2017)
**URL**: https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment

### Key Findings
- Examined 702 US occupations using O*NET data
- Estimated probability of computerisation for each occupation (0.0 to 1.0)
- Found 47% of US employment at high risk of automation
- Used Gaussian process classifier based on 9 task characteristics

### The 9 "Bottleneck" Variables
Frey & Osborne identified tasks that are difficult to automate:

**Perception and Manipulation**
1. Finger Dexterity
2. Manual Dexterity
3. Cramped Work Space

**Creative Intelligence**
4. Originality
5. Fine Arts

**Social Intelligence**
6. Social Perceptiveness
7. Negotiation
8. Persuasion
9. Assisting and Caring for Others

Occupations requiring high levels of these skills received lower automation probabilities.

---

## Data Files

| File | Location | Description |
|------|----------|-------------|
| Raw Oxford data | `data/sources/oxford/frey-osborne-2013-raw.csv` | Original 702 occupations from study |
| Parsed JSON | `data/sources/oxford/frey-osborne-2013.json` | Cleaned format with SOC codes |
| Full mapping | `data/processed/oxford_ai_risk_mapping.json` | All 1,016 O*NET occupations mapped |

---

## Mapping Methodology

### Step 1: SOC Code Matching

O*NET codes are SOC codes with an added suffix:
```
O*NET: 11-1011.00  →  SOC: 11-1011 (Chief Executives)
O*NET: 11-1011.03  →  SOC: 11-1011 (Chief Sustainability Officers)
```

We extract the base SOC code and match to Oxford data.

### Step 2: Match Types

| Match Type | Description | Count | Percentage |
|------------|-------------|-------|------------|
| **Exact** | O*NET occupation has same SOC code AND similar title | 470 | 46.3% |
| **Parent SOC** | O*NET occupation shares SOC code with Oxford (different title) | 251 | 24.7% |
| **Category Median** | No SOC match; use median of matched occupations in same category | 276 | 27.2% |
| **Global Median** | No SOC match and no category data; use global median | 19 | 1.9% |

### Step 3: Score Normalization

Oxford probabilities (0.0 to 1.0) are converted to AI risk scores (1 to 10):

```
ai_risk = 1 + (probability × 9)
```

| Oxford Probability | AI Risk Score | Label |
|-------------------|---------------|-------|
| 0.00 (0%) | 1.0 | Very Low |
| 0.11 (11%) | 2.0 | Very Low |
| 0.33 (33%) | 4.0 | Low |
| 0.55 (55%) | 6.0 | Medium |
| 0.77 (77%) | 8.0 | High |
| 0.99 (99%) | 9.9 | Very High |

### Step 4: Risk Labels

| AI Risk Score | Label | Color |
|---------------|-------|-------|
| 1.0 - 2.0 | Very Low | Green |
| 2.1 - 4.0 | Low | Emerald |
| 4.1 - 6.0 | Medium | Yellow |
| 6.1 - 8.0 | High | Orange |
| 8.1 - 10.0 | Very High | Red |

---

## Examples

### Exact Match
```
O*NET: 11-1011.00 "Chief Executives"
Oxford: 11-1011 "Chief Executives"
Probability: 0.015 (1.5%)
AI Risk: 1.1/10 (Very Low)
Match Type: exact
```

### Parent SOC Match
```
O*NET: 11-1011.03 "Chief Sustainability Officers"
Oxford: 11-1011 "Chief Executives"
Probability: 0.015 (1.5%)
AI Risk: 1.1/10 (Very Low)
Match Type: parent_soc
Note: CSO inherits probability from parent "Chief Executives"
```

### Category Median Fallback
```
O*NET: 11-1031.00 "Legislators"
Oxford: (no match)
Category: management
Category Median Probability: 0.12
AI Risk: 2.1/10 (Low)
Match Type: category_median
Note: Used median of all matched management occupations
```

---

## Reproducing the Mapping

To regenerate the AI risk mapping:

```bash
# 1. Ensure Oxford source data exists
ls data/sources/oxford/frey-osborne-2013-raw.csv

# 2. Run the mapping script
npx tsx scripts/map-oxford-ai-risk.ts

# 3. Regenerate final career data
npx tsx scripts/generate-final.ts

# 4. Rebuild the website
npm run build
```

---

## Distribution Summary

After mapping all 1,016 occupations:

| Risk Level | Count | Percentage | Example Occupations |
|------------|-------|------------|---------------------|
| Very Low (1-2) | 341 | 33.6% | Physicians, Teachers, Social Workers |
| Low (2-4) | 125 | 12.3% | Engineers, Managers, Designers |
| Medium (4-6) | 101 | 9.9% | Technicians, Sales Reps |
| High (6-8) | 127 | 12.5% | Clerks, Drivers, Assemblers |
| Very High (8-10) | 322 | 31.7% | Cashiers, Data Entry, Telemarketers |

---

## Limitations

### 1. Temporal Gap
The Oxford study used 2010 O*NET data; we use O*NET 30.1 (2024). Approximately 300 occupations didn't have direct matches due to:
- New occupations added (e.g., "Sustainability Officers")
- Occupations removed or merged
- Title changes

### 2. Technology Evolution
The 2013 predictions don't account for:
- Large Language Models (ChatGPT, etc.)
- Advanced robotics developments
- Remote work changes post-COVID

### 3. Fallback Uncertainty
~27% of occupations use category median, which is less precise than direct matching. These scores should be interpreted with more uncertainty.

### 4. Binary Training Data
Frey & Osborne trained their model on only 70 hand-labeled occupations (as definitely automatable or not), then extrapolated to all 702. This introduces model uncertainty.

---

## References

1. Frey, C. B., & Osborne, M. A. (2017). The future of employment: How susceptible are jobs to computerisation? *Technological Forecasting and Social Change*, 114, 254-280.

2. O*NET Resource Center: https://www.onetcenter.org/

3. Original data extracted from: https://github.com/plotly/datasets/blob/master/job-automation-probability.csv

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-25 | Initial implementation using Oxford/Frey-Osborne data |
