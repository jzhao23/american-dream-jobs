# Career Compass

This document explains the Career Compass feature, its UI design integrated into the main page, and the dual-model matching algorithm (Model A & Model B).

## Overview

Career Compass is an AI-powered career recommendation system that helps users discover career paths tailored to their background, preferences, and timeline. It uses a sophisticated 3-stage matching algorithm with two model variants optimized for different user scenarios.

---

## UI Design: Inline Wizard Flow

The Career Compass wizard is integrated directly into the main homepage (`/`) as an inline step-by-step flow, replacing the traditional separate page approach.

### Location in App

```
src/app/page.tsx                    → Main page (imports CareerCompassWizard)
src/components/CareerCompassWizard.tsx → The wizard component
src/app/compass-results/page.tsx    → Results display page
```

### Visual Design

The wizard uses a warm, welcoming design consistent with the American Dream Jobs brand:

- **Card Container**: `bg-warm-white rounded-2xl p-6 md:p-8 shadow-soft`
- **Progress Dots**: Visual step indicators (3 steps)
- **Timeline Badge**: Shows selected timeline with change option
- **Smooth Animations**: 150ms transitions between steps

### Wizard Steps

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Step 1: TIMELINE                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │    ⚡    │  │    📅    │  │    🎯    │  │    🎓    │       │
│  │   ASAP   │  │ 6-24 mo  │  │ 2-4 yrs  │  │ Flexible │       │
│  │ <6 mos   │  │  Certs   │  │ Degrees  │  │ Explore  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ● ○ ○  Step 1 of 3                      [⚡ ASAP] change      │
│                                                                │
│  Step 2a: PRIORITIES - What matters most to you?               │
│  ☑ Higher earning potential                                    │
│  ☐ Work-life balance                                           │
│  ☑ Job stability & security                                    │
│  ☐ Career growth opportunities                                 │
│  ☐ Meaningful / impactful work                                 │
│                                                                │
│  [Skip this question]                     [Continue →]         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ● ● ○  Step 2 of 3                      [⚡ ASAP] change      │
│                                                                │
│  Step 2b: ENVIRONMENT - What work setting suits you?           │
│  ☐ Remote / Work from home                                     │
│  ☐ Office-based / Indoor                                       │
│  ☑ Hands-on / Fieldwork / Outdoors                             │
│  ☐ Mix of different settings                                   │
│                                                                │
│  [Skip this question]                     [Continue →]         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ● ● ○  Step 2 of 3                      [⚡ ASAP] change      │
│                                                                │
│  Step 2c: INDUSTRIES - Which fields interest you?              │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ ☑ Healthcare    │  │ ☐ Technology    │                      │
│  └─────────────────┘  └─────────────────┘                      │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ ☐ Skilled Trades│  │ ☐ Business      │                      │
│  └─────────────────┘  └─────────────────┘                      │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ ☐ Transportation│  │ ☐ Public Service│                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                │
│  [Skip this question]                     [Continue →]         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ● ● ● Step 3 of 3                       [⚡ ASAP] change      │
│                                                                │
│  RESUME UPLOAD (Optional)                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │     📄 Click to upload your resume                     │    │
│  │     PDF, DOC, DOCX, or TXT (max 5MB)                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ✨ Resume helps us match your skills to career requirements   │
│                                                                │
│  [Skip, continue without resume]          [Continue →]         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ● ● ● Step 3 of 3                       [⚡ ASAP] change      │
│                                                                │
│  REVIEW - Almost there!                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Anything else we should know? (optional)              │    │
│  │  ┌────────────────────────────────────────────────┐    │    │
│  │  │ e.g., I'm a single parent, need flexible hrs  │    │    │
│  │  └────────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  YOUR SELECTIONS:                                              │
│  ⏱️ Timeline: ASAP                                             │
│  🎯 Priorities: Higher earning potential, Job stability        │
│  🏢 Environment: Hands-on / Fieldwork / Outdoors               │
│  💼 Industries: Healthcare                                     │
│  📄 Resume: resume_jane.pdf                                    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ✨ We'll use AI-powered matching with your resume      │    │
│  │    for personalized results                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       Get My Career Recommendations  →                 │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

---

## Model A vs Model B Architecture

The Career Compass uses two distinct models optimized for different user scenarios:

### Model Selection Logic

```typescript
// In CareerCompassWizard.tsx
const hasResume = resumeText.length >= 100;
const model = hasResume ? 'model-a' : 'model-b';
```

| Scenario | Model | LLM Used | Cost | Processing Time |
|----------|-------|----------|------|-----------------|
| User uploads resume | **Model A** | Claude Sonnet 4 | ~$0.01 | ~5-10s |
| No resume uploaded | **Model B** | Claude Haiku 3.5 | ~$0.001 | ~2-4s |

---

## Workflow Diagrams

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAREER COMPASS WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   User       │    │   Wizard     │    │   API        │    │   Matching   │
│   Browser    │───▶│   Steps      │───▶│   Routes     │───▶│   Engine     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                           │                   │                    │
                           │                   │                    │
                           ▼                   ▼                    ▼
                    ┌────────────┐      ┌────────────┐       ┌────────────┐
                    │ Timeline   │      │ /parse-file│       │ Stage 1:   │
                    │ Priorities │      │ /analyze   │       │ Embeddings │
                    │ Environment│      │ /recommend │       │ Stage 2:   │
                    │ Industries │      │            │       │ Structured │
                    │ Resume     │      │            │       │ Stage 3:   │
                    │ Review     │      │            │       │ LLM        │
                    └────────────┘      └────────────┘       └────────────┘
                                                                   │
                                                                   ▼
                                                            ┌────────────┐
                                                            │ Results    │
                                                            │ Page       │
                                                            │ 10-15      │
                                                            │ Matches    │
                                                            └────────────┘
```

### Model A Workflow (With Resume)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODEL A: FULL SONNET PIPELINE                             │
│                    (For users with resumes)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   Resume    │
    │   File      │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │  STEP 1: FILE PARSING                                               │
    │  POST /api/compass/parse-file                                       │
    │                                                                     │
    │  • Accepts: PDF, DOCX, DOC, MD, TXT (max 5MB)                       │
    │  • Extracts raw text content                                        │
    │  • Returns: { success: true, text: "..." }                          │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ▼ resumeText
    ┌─────────────────────────────────────────────────────────────────────┐
    │  STEP 2: RESUME ANALYSIS                                            │
    │  POST /api/compass/analyze                                          │
    │                                                                     │
    │  • AI extracts structured profile:                                  │
    │    - skills: ["Python", "SQL", "Project Management", ...]           │
    │    - jobTitles: ["Software Engineer", "Tech Lead", ...]             │
    │    - education: { level: "bachelors", fields: ["CS"] }              │
    │    - industries: ["Technology", "Finance"]                          │
    │    - experienceYears: 5                                             │
    │    - confidence: 0.92                                               │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ▼ profile + preferences
    ┌─────────────────────────────────────────────────────────────────────┐
    │  STEP 3: CAREER MATCHING                                            │
    │  POST /api/compass/recommend                                        │
    │  { model: "model-a", timelineBucket: "asap" }                       │
    │                                                                     │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 1: Embedding Similarity (Fast Filter)                  │  │
    │  │  • Generate query embeddings from profile + preferences       │  │
    │  │  • Search Supabase pgvector or local embeddings               │  │
    │  │  • Apply timeline filter                                      │  │
    │  │  • OUTPUT: Top 50 candidates                                  │  │
    │  │  • Cost: ~$0.0004 (embedding generation)                      │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    │                          │                                          │
    │                          ▼                                          │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 2: O*NET Structured Matching                           │  │
    │  │  • Jaccard similarity on skills                               │  │
    │  │  • Education level fit scoring                                │  │
    │  │  • Salary expectations match                                  │  │
    │  │  • AI resilience bonus/penalty                                │  │
    │  │  • OUTPUT: Top 30 candidates (re-ranked)                      │  │
    │  │  • Cost: $0 (local computation)                               │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    │                          │                                          │
    │                          ▼                                          │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 3: Claude Sonnet 4 Reasoning                           │  │
    │  │  • Full context prompt with:                                  │  │
    │  │    - User's explicit priority selections                      │  │
    │  │    - Environment preferences                                  │  │
    │  │    - Industry interests                                       │  │
    │  │    - Additional context                                       │  │
    │  │    - Complete skill list                                      │  │
    │  │    - Career details for 30 candidates                         │  │
    │  │  • Generates personalized reasoning                           │  │
    │  │  • Identifies 3 specific skills gaps per career               │  │
    │  │  • OUTPUT: 10-15 matches with reasoning                       │  │
    │  │  • Cost: ~$0.01                                               │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │  RESULTS PAGE                                                       │
    │  /compass-results                                                   │
    │                                                                     │
    │  • Profile summary (skills identified, experience, education)       │
    │  • 10-15 ranked career matches                                      │
    │  • Each match shows:                                                │
    │    - Match score (60-100%)                                          │
    │    - Median salary                                                  │
    │    - Transition timeline                                            │
    │    - AI resilience status                                           │
    │    - Personalized "Why It's a Good Fit" reasoning                   │
    │    - 3 specific skills to develop                                   │
    │    - Link to full career page                                       │
    └─────────────────────────────────────────────────────────────────────┘
```

### Model B Workflow (Without Resume)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODEL B: LIGHTWEIGHT HAIKU PIPELINE                       │
│                    (For users without resumes)                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   User      │
    │   Skips     │
    │   Resume    │
    └──────┬──────┘
           │
           ▼ No parsing/analysis needed
    ┌─────────────────────────────────────────────────────────────────────┐
    │  MINIMAL PROFILE CONSTRUCTION                                       │
    │                                                                     │
    │  profile = {                                                        │
    │    skills: [],                    // Empty - no resume              │
    │    jobTitles: [],                                                   │
    │    education: { level: 'high_school', fields: [] },                 │
    │    industries: selectedIndustries,  // From wizard selection        │
    │    experienceYears: 0,                                              │
    │    confidence: 0.5                 // Lower confidence              │
    │  }                                                                  │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ▼ profile + preferences
    ┌─────────────────────────────────────────────────────────────────────┐
    │  CAREER MATCHING (Model B)                                          │
    │  POST /api/compass/recommend                                        │
    │  { model: "model-b", timelineBucket: "flexible" }                   │
    │                                                                     │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 1: Embedding Similarity                                │  │
    │  │  • Uses preferences text for embedding generation             │  │
    │  │  • Same vector search as Model A                              │  │
    │  │  • OUTPUT: Top 50 candidates                                  │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    │                          │                                          │
    │                          ▼                                          │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 2: Structured Matching                                 │  │
    │  │  • Reduced weighting on skill overlap (no skills!)            │  │
    │  │  • Focuses on:                                                │  │
    │  │    - Timeline compatibility                                   │  │
    │  │    - Industry alignment                                       │  │
    │  │    - AI resilience                                            │  │
    │  │  • OUTPUT: Top 30 candidates                                  │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    │                          │                                          │
    │                          ▼                                          │
    │  ┌───────────────────────────────────────────────────────────────┐  │
    │  │  STAGE 3: Claude Haiku 3.5 Reasoning                          │  │
    │  │  • Lighter prompt (~50% smaller)                              │  │
    │  │  • Focuses on:                                                │  │
    │  │    - Priority alignment                                       │  │
    │  │    - Environment match                                        │  │
    │  │    - Industry fit                                             │  │
    │  │  • Shorter, encouraging reasoning                             │  │
    │  │  • OUTPUT: 10-15 matches                                      │  │
    │  │  • Cost: ~$0.001 (90% cheaper than Sonnet)                    │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    └─────────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │  RESULTS PAGE (Same as Model A)                                     │
    │  /compass-results                                                   │
    │                                                                     │
    │  • No profile summary (no resume to analyze)                        │
    │  • 10-15 ranked career matches                                      │
    │  • Reasoning focuses on preferences alignment                       │
    └─────────────────────────────────────────────────────────────────────┘
```

### Combined Decision Flow

```
                              ┌─────────────────┐
                              │  User Completes │
                              │  Wizard Steps   │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Resume Uploaded?│
                              │ (≥100 chars)    │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │ YES                                  │ NO
                    ▼                                      ▼
            ┌───────────────┐                      ┌───────────────┐
            │   MODEL A     │                      │   MODEL B     │
            │   Full Flow   │                      │   Light Flow  │
            └───────┬───────┘                      └───────┬───────┘
                    │                                      │
                    ▼                                      ▼
            ┌───────────────┐                      ┌───────────────┐
            │ /parse-file   │                      │ Skip parsing  │
            │ /analyze      │                      │ Minimal       │
            │ /recommend    │                      │ /recommend    │
            │ (model-a)     │                      │ (model-b)     │
            └───────┬───────┘                      └───────┬───────┘
                    │                                      │
                    ▼                                      ▼
            ┌───────────────┐                      ┌───────────────┐
            │ Sonnet 4      │                      │ Haiku 3.5     │
            │ ~$0.01        │                      │ ~$0.001       │
            │ ~5-10 sec     │                      │ ~2-4 sec      │
            └───────┬───────┘                      └───────┬───────┘
                    │                                      │
                    └──────────────┬───────────────────────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │ Results Page  │
                           │ 10-15 Matches │
                           │ with Scores   │
                           │ and Reasoning │
                           └───────────────┘
```

---

## 3-Stage Matching Algorithm

### Stage 1: Embedding Similarity (Fast Filter)

**Purpose**: Quickly narrow down from 1,000+ careers to ~50 strong candidates

**How it works**:
1. Generate three embedding vectors from user data:
   - **Task embedding**: Based on work experience and job titles
   - **Narrative embedding**: Based on career goals and preferences
   - **Skills embedding**: Based on extracted skills
2. Calculate weighted cosine similarity against all career embeddings
3. Apply timeline filter (exclude careers requiring more time than user has)
4. Return top 50 candidates

**Embeddings Storage**:
- Primary: Supabase pgvector for fast similarity search
- Fallback: Local JSON file (`data/compass/career-embeddings.json`)

### Stage 2: O*NET Structured Matching

**Purpose**: Re-rank candidates using structured O*NET data

**Scoring formula**:
```typescript
structuredScore =
  skillOverlap * 0.35 +
  educationFit * 0.15 +
  salaryFit * 0.15 +
  embeddingSimilarity * 0.35 +
  aiResilienceBonus;  // +0.1 for resilient, -0.1 for high risk
```

**Skill Overlap**: Jaccard similarity between user skills and career requirements
**Education Fit**: Based on gap between user's level and required level
**Salary Fit**: 1.0 if career meets expectations, decreases proportionally

### Stage 3: LLM Reasoning

**Purpose**: Generate personalized reasoning and final ranking

**Model A (Sonnet)**:
- Full context with complete skill list
- Detailed 2-3 sentence reasoning per career
- Considers all user selections heavily
- Returns 10-15 matches

**Model B (Haiku)**:
- Lighter prompt (~50% smaller)
- Brief 1-2 sentence reasoning
- Focuses on preference alignment
- Returns 10-15 matches

**LLM Scoring Weights**:
| Factor | Weight |
|--------|--------|
| Priority alignment | 30% |
| Environment match | 20% |
| Industry fit | 15% |
| Skills transferability | 20% |
| Transition feasibility | 15% |

---

## API Endpoints

### POST /api/compass/parse-file

**Purpose**: Extract text from uploaded resume files

**Request**:
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, DOCX, DOC, MD, TXT, max 5MB)

**Response**:
```json
{
  "success": true,
  "text": "Extracted resume text content..."
}
```

### POST /api/compass/analyze

**Purpose**: AI extraction of structured profile from resume text

**Request**:
```json
{
  "resumeText": "Full resume text content..."
}
```

**Response**:
```json
{
  "success": true,
  "profile": {
    "skills": ["Python", "SQL", "Project Management"],
    "jobTitles": ["Software Engineer", "Tech Lead"],
    "education": { "level": "bachelors", "fields": ["Computer Science"] },
    "industries": ["Technology", "Finance"],
    "experienceYears": 5,
    "confidence": 0.92
  }
}
```

### POST /api/compass/recommend

**Purpose**: Generate career recommendations using 3-stage matching

**Request**:
```json
{
  "profile": {
    "skills": ["Python", "SQL"],
    "jobTitles": ["Software Engineer"],
    "education": { "level": "bachelors", "fields": ["CS"] },
    "industries": ["Technology"],
    "experienceYears": 5
  },
  "preferences": {
    "careerGoals": "Higher earning potential, stability",
    "skillsToDevelop": "Leadership, cloud technologies",
    "workEnvironment": "Remote / Work from home",
    "salaryExpectations": "$100,000+",
    "industryInterests": "Technology, Healthcare",
    "priorityIds": ["earning", "stability"],
    "environmentIds": ["remote"],
    "industryIds": ["technology", "healthcare"],
    "additionalContext": "Transitioning from backend to fullstack"
  },
  "options": {
    "timelineBucket": "6-24-months",
    "model": "model-a"
  }
}
```

**Response**:
```json
{
  "success": true,
  "recommendations": [
    {
      "slug": "software-developers-applications",
      "title": "Software Developer, Applications",
      "category": "technology",
      "matchScore": 94,
      "medianPay": 127260,
      "aiResilience": "AI-Augmented",
      "reasoning": "Your Python and SQL skills are directly applicable here...",
      "skillsGap": ["Cloud Architecture", "React/Vue", "CI/CD"],
      "transitionTimeline": "6-12 months",
      "education": "Bachelor's degree"
    }
    // ... 9-14 more matches
  ],
  "metadata": {
    "stage1Candidates": 50,
    "stage2Candidates": 30,
    "finalMatches": 15,
    "processingTimeMs": 5234,
    "costUsd": 0.0104
  }
}
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/components/CareerCompassWizard.tsx` | Wizard UI component with all steps |
| `src/lib/compass/matching-engine.ts` | 3-stage matching algorithm |
| `src/lib/compass/embedding-service.ts` | Embedding generation and similarity |
| `src/lib/compass/resume-parser.ts` | Resume text extraction |
| `src/lib/compass/supabase.ts` | Supabase pgvector integration |
| `src/app/api/compass/parse-file/route.ts` | File parsing endpoint |
| `src/app/api/compass/analyze/route.ts` | Resume analysis endpoint |
| `src/app/api/compass/recommend/route.ts` | Recommendation endpoint |
| `src/app/compass-results/page.tsx` | Results display page |
| `src/app/compass/page.tsx` | Standalone compass page (alternative entry) |

---

## Data Dependencies

| File | Purpose |
|------|---------|
| `data/output/careers.json` | Full career data (O*NET + enrichments) |
| `data/compass/career-embeddings.json` | Pre-computed career embeddings (local fallback) |
| `data/compass/career-dwas.json` | Detailed Work Activities mapping |

---

## Cost Estimates

| Component | Cost per Request |
|-----------|-----------------|
| OpenAI Embeddings | ~$0.0004 |
| Claude Sonnet 4 (Model A) | ~$0.01 |
| Claude Haiku 3.5 (Model B) | ~$0.001 |
| **Total Model A** | ~$0.0104 |
| **Total Model B** | ~$0.0014 |

---

## Performance

| Metric | Model A | Model B |
|--------|---------|---------|
| Total Processing Time | 5-10 seconds | 2-4 seconds |
| Stage 1 | ~1-2s | ~1-2s |
| Stage 2 | ~100ms | ~100ms |
| Stage 3 (LLM) | 3-8s | 1-2s |

---

## Future Improvements

1. **Caching**: Cache embedding results for common queries
2. **Streaming**: Stream LLM responses for faster perceived performance
3. **A/B Testing**: Track which model produces better user satisfaction
4. **Resume History**: Allow users to save/reuse parsed resumes
5. **Refinement Loop**: "Not quite right" feedback to refine matches
