# Career Progression Methodology

This document explains how career progression and salary timeline data are calculated for each occupation.

## Overview

Career progression shows how earnings change over a 20-year career, from entry-level to expert. We use two data sources:

| Source | Coverage | Confidence | Used For |
|--------|----------|------------|----------|
| Levels.fyi | 41 tech occupations | High | Software, Data, Product roles |
| BLS Percentiles | 975 other occupations | Medium | All non-tech roles |

---

## Levels.fyi Progression (Tech Roles)

For technology occupations with Levels.fyi mappings, we use industry-standard level progressions:

| Level | Years Experience | Salary Multiplier |
|-------|------------------|-------------------|
| Junior (L3) | 0-2 | 0.75x median |
| Mid (L4) | 2-5 | 1.0x median |
| Senior (L5) | 4-8 | 1.3x median |
| Staff (L6) | 7-12 | 1.6x median |
| Principal (L7) | 10-18 | 2.0x median |
| Distinguished (L8) | 15-25 | 2.5x median |

### Mapping Confidence

| Confidence | Description | Example |
|------------|-------------|---------|
| **Exact** | Title matches exactly | "Software Engineer" → "Software Engineer" |
| **Close** | Similar role in same field | "Frontend Engineer" → "Software Engineer" |
| **Approximate** | Related but different role | "Product Manager" → closest tech equivalent |

---

## BLS Percentile Progression (Non-Tech Roles)

For occupations without Levels.fyi data (975 of 1,016), we map BLS wage percentiles to career stages:

| Level | BLS Percentile | Typical Years Experience |
|-------|----------------|-------------------------|
| Entry | 10th percentile | 0-2 years |
| Early Career | 25th percentile | 2-6 years |
| Mid-Career | Median (50th) | 5-15 years |
| Experienced | 75th percentile | 10-20 years |
| Expert | 90th percentile | 15-30 years |

### Timeline Generation

For each career year (0-20), we assign the compensation from the appropriate level:

```
Years 0-2:  Entry (10th percentile)
Years 3-6:  Early Career (25th percentile)
Years 7-15: Mid-Career (Median)
Years 16-20: Experienced (75th percentile)
Year 20+:   Expert (90th percentile)
```

---

## BLS High-Earner Data Limitation

### The Problem

BLS does not report exact wages for very high earners. When the 75th or 90th percentile exceeds approximately $208,000/year, BLS reports `null` instead of actual values.

**Affected occupations include:**
- Physicians and Surgeons (Pediatricians, Cardiologists, etc.)
- Chief Executives
- Lawyers (high-earning)
- Dentists and Orthodontists
- Anesthesiologists

**Example: Pediatricians, General**
```json
{
  "pct_10": 85120,    // Reported
  "pct_25": 141050,   // Reported
  "median": 198690,   // Reported
  "pct_75": null,     // BLS ceiling exceeded
  "pct_90": null,     // BLS ceiling exceeded
  "mean": 205860      // Reported (key for estimation!)
}
```

### Impact Without Correction

If null values are used directly:
- **56 careers** have null 75th percentile
- **77 careers** have null 90th percentile
- Timeline shows `$0` for years 16-20
- Compare page calculations become wildly incorrect

**Example Bug (Before Fix):**
| Age | Career Years | Expected | Buggy Result |
|-----|--------------|----------|--------------|
| 34-39 | 10-14 | $1,033,400 | $1,033,400 ✓ |
| 39-44 | 15-19 | $1,300,000+ | **$206,680** ✗ |

The $206,680 is wrong because only year 15 has data; years 16-19 are `$0`.

---

## Estimation Methodology for Missing Percentiles

When BLS data has null values, we **estimate** the missing percentiles using available data. This is implemented in `scripts/create-progression-mappings.ts`.

### Algorithm

```typescript
function estimateMissingPercentiles(wages) {
  // Step 1: Use available lower percentiles
  const pct_10 = wages.pct_10 ?? 30000;
  const pct_25 = wages.pct_25 ?? pct_10 * 1.2;
  const median = wages.median ?? pct_25 * 1.25;

  let pct_75 = wages.pct_75;
  let pct_90 = wages.pct_90;

  // Step 2: Estimate 75th percentile if null
  if (pct_75 === null) {
    if (wages.mean > median) {
      // Use mean as indicator of right-skewed distribution
      pct_75 = median + (wages.mean - median) * 0.8;
    } else {
      // Use ratio between 25th and median
      const ratio = median / pct_25;
      pct_75 = median * min(ratio, 1.5);
    }
  }

  // Step 3: Estimate 90th percentile if null
  if (pct_90 === null) {
    if (wages.mean > pct_75) {
      // Mean still exceeds 75th, use as floor for 90th
      pct_90 = wages.mean * 1.15;
    } else {
      // Use ratio between median and 75th
      const ratio = pct_75 / median;
      pct_90 = pct_75 * min(ratio, 1.4);
    }
  }

  return { pct_10, pct_25, median, pct_75, pct_90 };
}
```

### Why This Works

1. **BLS Mean is Reported**: Even when high percentiles are null, BLS reports the `mean`. For right-skewed distributions (high earners), mean > median, giving us information about the upper tail.

2. **Ratio Extrapolation**: The ratio between lower percentiles (25th to median) often mirrors the ratio between higher percentiles (median to 75th).

3. **Conservative Caps**: We cap ratios at 1.5x and 1.4x to prevent extreme outliers.

### Example: Chief Executives (After Estimation)

| Level | BLS Raw | Estimated | Method |
|-------|---------|-----------|--------|
| Entry (10th) | $80,000 | $80,000 | Direct |
| Early Career (25th) | $130,840 | $130,840 | Direct |
| Mid-Career (Median) | $206,680 | $206,680 | Direct |
| Experienced (75th) | **null** | $248,456 | Estimated from mean |
| Expert (90th) | **null** | $297,735 | Estimated from 75th ratio |

---

## Data Validation

The `scripts/generate-final.ts` script validates that no careers have zero compensation in their timeline:

```typescript
const careersWithZeros = occupations.filter(o =>
  o.career_progression?.timeline?.some(t => t.expected_compensation === 0)
);

if (careersWithZeros.length > 0) {
  console.error('WARNING: Found careers with $0 in timeline');
  // Lists affected careers
}
```

This catches the BLS null problem if the estimation logic ever fails.

---

## Processing Pipeline

```
BLS API (May 2023)
    ↓
scripts/fetch-bls-wages.ts
    ↓
occupations_complete.json (raw percentiles, some null)
    ↓
scripts/create-progression-mappings.ts
    ├── Levels.fyi mapping (41 tech roles)
    └── BLS percentile mapping (975 roles)
        └── estimateMissingPercentiles() for null handling
    ↓
occupations_complete.json (with career_progression)
    ↓
scripts/generate-final.ts
    └── Validation: check for $0 in timelines
    ↓
careers.generated.json (website data)
```

---

## Reproducing the Data

```bash
# 1. Fetch fresh BLS wages (annual, after May release)
npx tsx scripts/fetch-bls-wages.ts

# 2. Generate career progressions with estimation
npx tsx scripts/create-progression-mappings.ts

# 3. Generate final data with validation
npx tsx scripts/generate-final.ts

# 4. Verify no zeros remain
cat data/careers.generated.json | jq '[.[] | select(.career_progression.timeline[-1].expected_compensation == 0)] | length'
# Should output: 0

# 5. Rebuild website
npm run build
```

---

## Limitations

### 1. Estimation Uncertainty
For 56-77 careers, the 75th and 90th percentile values are **estimated**, not ground truth. These should be interpreted as reasonable approximations, not exact figures.

### 2. BLS Ceiling Changes
The BLS reporting ceiling may change over time. If more high-paying careers start hitting the ceiling, more estimation will be required.

### 3. Levels.fyi Coverage
Only 41 of 1,016 occupations have Levels.fyi mappings. The tech industry is overrepresented in detailed progression data.

### 4. Linear Career Assumption
The timeline assumes steady progression through levels. Real careers often have:
- Faster or slower advancement
- Career changes
- Geographic salary differences
- Industry-specific variations

---

## Manual Career Progression (v2.1)

For manually-sourced careers (careers not from O*NET, such as AI/ML Engineers, Product Managers, DevOps Engineers), we generate career progression using the same BLS percentile methodology:

### Source: Wage Percentiles from YAML

Manual careers define wage percentiles in their YAML files:

```yaml
wages:
  source: "Editorial estimate based on Levels.fyi, Glassdoor, and LinkedIn Salary"
  year: 2024
  annual:
    pct_10: 115000    # Entry level
    pct_25: 140000    # Early career
    median: 175000    # Mid-career
    pct_75: 225000    # Experienced
    pct_90: 300000    # Expert
```

### Transformation to Career Progression

The `generateCareerProgression()` function in `scripts/load-manual-careers.ts` converts these percentiles:

| Level | Percentile | Years Experience Range |
|-------|------------|------------------------|
| Entry | pct_10 (10th) | 0-2 years |
| Early Career | pct_25 (25th) | 2-6 years |
| Mid-Career | median (50th) | 5-15 years |
| Experienced | pct_75 (75th) | 10-20 years |
| Expert | pct_90 (90th) | 15-30 years |

### Compensation Range Generation

Each level includes a compensation range (±10% from the percentile):

```typescript
{
  level_name: "Mid-Career",
  level_number: 3,
  years_experience: { min: 5, typical: 10, max: 15 },
  compensation: {
    total: {
      min: Math.round(median * 0.9),    // 90% of median
      median: median,
      max: Math.round(median * 1.1),    // 110% of median
    },
    breakdown: null  // No base/bonus/equity breakdown for manual careers
  }
}
```

### Timeline Year Mapping

Year-by-year expected compensation (years 0-20):

| Year Range | Level | Compensation Source |
|------------|-------|---------------------|
| 0-2 | Entry | pct_10 |
| 3-5 | Early Career | pct_25 |
| 6-12 | Mid-Career | median |
| 13-17 | Experienced | pct_75 |
| 18-20 | Expert | pct_90 |

### Missing Percentile Handling

If a manual career is missing pct_25 or pct_75, they are interpolated:

```typescript
const earlyCareer = pct_25 || Math.round(pct_10 + (median - pct_10) * 0.4);
const experienced = pct_75 || Math.round(median + (pct_90 - median) * 0.5);
```

### Output Schema

Manual careers produce the same `career_progression` structure as O*NET careers:

```json
{
  "source": "manual_percentiles",
  "source_title": null,
  "match_confidence": "approximate",
  "levels": [...],     // 5 ProgressionLevel objects
  "timeline": [...]    // 21 TimelineEntry objects (years 0-20)
}
```

### Example: AI/ML Engineers

Input wages:
- pct_10: $115,000
- pct_25: $140,000
- median: $175,000
- pct_75: $225,000
- pct_90: $300,000

Generated 20-year earnings projection:
- Years 0-2 (Entry): $115,000 × 3 = $345,000
- Years 3-5 (Early Career): $140,000 × 3 = $420,000
- Years 6-12 (Mid-Career): $175,000 × 7 = $1,225,000
- Years 13-17 (Experienced): $225,000 × 5 = $1,125,000
- Years 18-20 (Expert): $300,000 × 3 = $900,000
- **Total 20-year earnings: ~$4.0M**

### Differences from O*NET Careers

| Aspect | O*NET Careers | Manual Careers |
|--------|---------------|----------------|
| Data Source | BLS OES API | Editorial research |
| Levels.fyi Integration | 41 tech roles have it | Not used |
| Compensation Breakdown | May include base/bonus/equity | Total only |
| Source Confidence | High (government data) | Approximate (editorial) |

---

## References

1. Bureau of Labor Statistics OES: https://www.bls.gov/oes/
2. Levels.fyi: https://www.levels.fyi
3. BLS Wage Methodology: https://www.bls.gov/oes/oes_ques.htm

---

## Changelog

| Date | Change |
|------|--------|
| 2025-01-08 | Added Manual Career Progression methodology (v2.1) |
| 2025-12-26 | Added `estimateMissingPercentiles()` to handle BLS null values |
| 2025-12-26 | Added validation in generate-final.ts to detect zeros |
| 2025-12-25 | Initial implementation with Levels.fyi + BLS fallback |
