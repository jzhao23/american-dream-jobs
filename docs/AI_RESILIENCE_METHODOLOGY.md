# AI Resilience Classification Methodology

## Overview

The AI Resilience Classification is a 4-tier system that assesses how likely a career is to remain viable and valuable in an AI-augmented economy. Unlike simple automation probability scores, this system considers multiple dimensions including job market trends, task exposure to AI, and the unique human advantages each career possesses.

## The Four Classification Tiers

| Tier | Emoji | Description |
|------|-------|-------------|
| **AI-Resilient** | :green_circle: | Strong human advantage or growing demand protects this career from AI displacement |
| **AI-Augmented** | :yellow_circle: | AI assists this work but human skills remain essential |
| **In Transition** | :orange_circle: | This career is being transformed by AI; adaptation and skill evolution needed |
| **High Disruption Risk** | :red_circle: | High AI exposure combined with declining demand creates significant risk |

## Four Input Dimensions

The classification is computed from four input dimensions:

### 1. Task Exposure

Task exposure measures how much of an occupation's work involves tasks that AI/LLMs can perform or assist with. We use a priority-based fallback system:

#### Primary Source: GPTs are GPTs (Eloundou et al. 2023)

**Paper**: "GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models"
**Authors**: Tyna Eloundou, Sam Manning, Pamela Mishkin, Daniel Rock
**Published**: Science, Vol. 384, Issue 6702 (2024)
**DOI**: 10.1126/science.adj0998
**Data**: https://github.com/openai/GPTs-are-GPTs

**Methodology**: The GPTs are GPTs dataset measures LLM-specific exposure by:
1. Defining exposure rubrics for individual work tasks
2. Using both human annotators and GPT-4 to classify tasks
3. Computing task-level scores for 50% speedup potential (α, β, γ metrics)
4. Aggregating to occupation-level statistics

We use the **β (beta)** metric as the primary score, which measures tasks that can be completed 50% faster using LLMs with access to external tools (code execution, web browsing, etc.).

**Coverage**: 923 occupations

#### Fallback Source: AIOE Dataset (Felten et al. 2021)

For occupations not covered by GPTs are GPTs, we fall back to the AIOE (AI Occupational Exposure) dataset.

**Paper**: "Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses"
**DOI**: 10.1002/smj.3286
**Data**: https://github.com/AIOE-Data/AIOE

**Methodology**: The AIOE index measures general AI exposure by:
1. Identifying 10 AI applications from patents and academic literature
2. Surveying relatedness between AI applications and 52 occupational abilities
3. Weighting by ability importance (from O*NET)
4. Aggregating to occupation-level scores

**Coverage**: 774 occupations

#### Categories (Tercile Split)

Both datasets use the same categorization approach:
- **Low**: Bottom 33% of exposure scores (less text/cognitive work)
- **Medium**: Middle 34% of exposure scores
- **High**: Top 33% of exposure scores (more text/cognitive work)

### 2. Automation Potential

Currently derived from Task Exposure (same categorization). Future versions may incorporate additional signals.

### 3. Job Growth (from BLS Projections)

**Source**: Bureau of Labor Statistics (BLS) Employment Projections 2024-2034

**Data**: Fetched via CareerOneStop API (intermediary for BLS data)

**Categories** (based on percent change 2024-2034):
- **Declining Quickly**: < -10%
- **Declining Slowly**: -10% to 0%
- **Stable**: 0% to 5%
- **Growing Slowly**: 5% to 15%
- **Growing Quickly**: > 15%

### 4. Human Advantage (EPOCH Framework)

**Framework**: Manually curated scores measuring five dimensions of human advantage that are difficult for AI to replicate:

| Letter | Dimension | Description | Examples |
|--------|-----------|-------------|----------|
| **E** | Empathy | Emotional intelligence, patient/customer care, interpersonal sensitivity | Nurses, therapists, counselors |
| **P** | Presence | Physical presence requirements, hands-on work, face-to-face interaction | Surgeons, electricians, teachers |
| **O** | Opinion | Judgment, decision-making, critical thinking, expertise application | Managers, analysts, lawyers |
| **C** | Creativity | Innovation, problem-solving, artistic expression, novel solutions | Designers, engineers, researchers |
| **H** | Hope | Mentorship, motivation, counseling, inspiring others, guidance | Teachers, coaches, social workers |

**Scoring**: Each dimension is scored 1-5 per occupation.

**Categories** (based on sum of 5 dimensions, max 25):
- **Strong**: Sum >= 20 (AI has limited ability to replace this work)
- **Moderate**: Sum >= 12 and < 20 (AI augments but doesn't replace)
- **Weak**: Sum < 12 (Higher risk of AI disruption)

## Classification Algorithm

The algorithm uses a priority-ordered rule system. Earlier rules take precedence over later ones.

### AI-Resilient Rules

1. **Growing Quickly + Limited Exposure**: Fast-growing careers with Low or Medium exposure
2. **Strong Human Advantage**: Strong EPOCH scores with Low or Medium exposure
3. **Growing Slowly + Low Exposure**: Steady demand for work AI can't easily do

### AI-Augmented Rules

4. **Low Exposure + Stable**: AI has limited applicability, job is stable
5. **Medium Exposure + Moderate/Strong Human Advantage**: AI assists but doesn't replace
5b. **High Exposure + Growing Quickly**: Strong demand but AI is transforming the work
6. **Stable + Moderate Human Advantage**: Balanced outlook with AI as tool

### In Transition Rules

7. **High Exposure + Stable**: AI is transforming the work; role is evolving
8. **High Exposure + Declining Slowly + Moderate Human Advantage**: AI impacting but human skills provide some protection
9. **Medium Exposure + Declining Slowly + Weak Human Advantage**: Pressure from both AI and market shifts

### High Disruption Risk Rules

10. **Maximum Risk**: High exposure + Declining Quickly + Weak human advantage
11. **High Risk**: High exposure + any decline + Weak human advantage

### Default Fallback

12. High exposure defaults to "In Transition"; otherwise "AI-Augmented"

## Data Files in Repository

All source data is stored in the repository for full reproducibility:

```
data/sources/
  gpts-are-gpts.json            # GPTs are GPTs LLM exposure (923 occupations) - PRIMARY
  gpts-are-gpts-metadata.json   # Source citation and methodology
  ai-exposure.json              # AIOE dataset (774 occupations) - FALLBACK
  ai-exposure-metadata.json     # Source citation and methodology
  bls-projections.json          # BLS 2024-2034 projections (832 occupations)
  bls-projections-metadata.json # Source citation
  epoch-scores.json             # EPOCH scores for all occupations
```

## Recreating the Data

1. **Fetch GPTs are GPTs Data** (PRIMARY - LLM-specific exposure):
   ```bash
   npx tsx scripts/fetch-gpts-are-gpts.ts
   ```

2. **Process AIOE Dataset** (FALLBACK - download from GitHub first):
   ```bash
   npx tsx scripts/fetch-ai-exposure.ts
   ```

3. **Fetch BLS Projections** (requires CareerOneStop API key):
   ```bash
   npx tsx scripts/fetch-bls-projections.ts
   ```

4. **Generate/Update EPOCH Scores**:
   ```bash
   npx tsx scripts/generate-epoch-scores.ts
   ```

5. **Regenerate Career Data**:
   ```bash
   npm run data:generate-final
   ```

6. **Validate Classifications** (14 required test cases):
   ```bash
   npx tsx scripts/validate-classifications.ts
   ```

## Limitations and Disclaimers

1. **Projections are estimates**: Employment projections are based on current trends and may not account for technological breakthroughs or economic shifts.

2. **Individual careers vary**: The classification represents aggregate trends for occupation categories. Individual job security depends on many factors including employer, location, skill level, and specialization.

3. **AI capabilities are evolving**: The primary AI exposure data (GPTs are GPTs) is based on 2023 research; the fallback (AIOE) is from 2021. AI capabilities continue to advance, potentially affecting exposure levels.

4. **EPOCH scores are subjective**: While based on job requirements from O*NET, the scoring involves subjective assessment of human advantage dimensions.

5. **Data coverage varies**: Not all occupations have complete data for all four dimensions. Careers without sufficient data do not receive an AI Resilience classification.

## Data Refresh Schedule

- **GPTs are GPTs**: Static from 2023 research; may be updated if new versions are published (primary exposure source)
- **AIOE Dataset**: Static from 2021 research; kept as fallback for coverage
- **BLS Projections**: Updated when new BLS projection cycles are released (approximately every 2 years)
- **EPOCH Scores**: Maintained manually; updated when new occupations are added or job characteristics change significantly

## Academic Citations

### GPTs are GPTs (Primary Task Exposure Source)
Eloundou, T., Manning, S., Mishkin, P., & Rock, D. (2023). GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models. Science, Vol. 384, Issue 6702. DOI: 10.1126/science.adj0998. arXiv: 2303.10130

### AIOE Dataset (Fallback Task Exposure Source)
Felten, E. W., Raj, M., & Seamans, R. (2021). Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses. Strategic Management Journal. DOI: 10.1002/smj.3286

### Employment Projections
U.S. Bureau of Labor Statistics. Employment Projections: 2024-34. https://www.bls.gov/emp/

## Code Reference

The classification algorithm is implemented in:
- `/src/lib/ai-resilience.ts` - Core algorithm with detailed comments
- `/scripts/validate-classifications.ts` - 14 validation test cases
- `/scripts/generate-epoch-scores.ts` - EPOCH score generation logic

## Contact

For questions about the methodology or data, please open an issue on the GitHub repository.
