# Link Validation

## Overview

This document describes the link validation system and the fixes applied to prevent 404 errors in career links across the website.

## Problem Identified

Users were encountering 404 errors when clicking on career links from the Career Compass results page. The root cause was identified in the matching engine:

1. **LLM Response Validation Gap**: The matching engine sends candidate careers to an LLM (Claude) which returns personalized recommendations with slugs. However, there was **no validation** that the returned slugs actually existed in `careers.json`.

2. **Potential Slug Modifications**: The LLM could theoretically:
   - Misspell slugs
   - Return slugs that sound similar but don't match exactly
   - Make formatting changes (case, hyphens, etc.)

## Fix Applied

### Matching Engine Slug Validation

Added validation in `src/lib/compass/matching-engine.ts` to filter out any slugs returned by the LLM that don't exist in `careers.json`:

```typescript
// In stage3LLMReasoning and stage3HaikuReasoning functions:
const careers = loadCareersData();
const careerSlugSet = new Set(careers.map(c => c.slug));

return matches.filter(m => {
  if (!careerSlugSet.has(m.slug)) {
    console.warn(`    ⚠️  LLM returned invalid slug: ${m.slug} - filtering out`);
    return false;
  }
  return m.matchScore >= 60;
});
```

This ensures that only valid career slugs are returned to the user.

## Validation Tests

A comprehensive test suite was added at `test/api/link-validation.test.ts` that validates:

1. **Home Page Featured Careers**: All hard-coded career links on the home page point to valid career/specialization pages
2. **Career Embeddings**: All embedding slugs match careers in `careers.json`
3. **Data Consistency**: Career and specialization data files contain valid slug formats

## Validation Script

A standalone validation script is available at `scripts/validate-links.ts` that can be run manually:

```bash
npx tsx scripts/validate-links.ts
```

This script checks:
- Home page featured careers
- Curated paths
- Embedding slugs
- Career/embedding consistency

## Data Structure

### Valid Link Patterns

| Type | URL Pattern | Data Source |
|------|-------------|-------------|
| Careers | `/careers/{slug}` | `data/output/careers.json` |
| Specializations | `/specializations/{slug}` | `data/output/specializations.json` |
| Paths | `/paths/{path-name}` | Static pages in `src/app/paths/` |

### Current Counts

- **Careers**: 165 entries
- **Specializations**: 1015 entries
- **Embeddings**: 165 entries (matches careers)

## Future Considerations

1. **Monitoring**: Consider adding runtime logging/alerting when invalid slugs are filtered out to detect LLM behavior changes
2. **Embedding Sync**: If careers are added/removed, embeddings should be regenerated
3. **Build-time Validation**: The link validation tests run during CI to catch issues before deployment
