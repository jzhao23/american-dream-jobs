# Career Embeddings

This directory contains pre-generated vector embeddings for the Career Compass recommendation system.

## File: career-embeddings.json

**Purpose:** Vector representations of all 1,016 careers for semantic similarity search

**Generation:** Run once via `npx tsx scripts/generate-career-embeddings.ts`

**Size:** ~19MB

**Structure:**
- Each career has 3 separate embeddings:
  - **Task embedding** (50% weight): What you do day-to-day
  - **Narrative embedding** (30% weight): Work culture and environment
  - **Skills embedding** (20% weight): Technical and cognitive abilities

**Model:** OpenAI `text-embedding-3-small` (1,536 dimensions)

**Cost:** $0.03 one-time generation

**When to Regenerate:**
- After significant changes to career data
- When task descriptions, inside_look content, or skills are updated
- After adding new careers to the database

## Quick Start

1. Ensure you have `OPENAI_API_KEY` in `.env.local`
2. Run generation script:
   ```bash
   npx tsx scripts/generate-career-embeddings.ts
   ```
3. Wait ~10 minutes for completion
4. Verify `career-embeddings.json` exists (~19MB)

## Documentation

See [CAREER_COMPASS_METHODOLOGY.md](../../docs/CAREER_COMPASS_METHODOLOGY.md) for complete technical details.
