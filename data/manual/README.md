# Manually Added Careers

This directory contains careers that are manually sourced from industry data rather than O*NET.

## Why Manual Careers?

O*NET's taxonomy lags 5-7 years behind the job market. High-demand careers are missing or poorly represented:

| Market Reality | O*NET Says | Problem |
|----------------|------------|---------|
| "AI Engineer" ($165K median, #1 on LinkedIn) | "Software Developer" | Vastly different skills, pay, training |
| "Data Annotator" (#4 on LinkedIn) | Doesn't exist | New role created by AI boom |
| "Product Manager" (ubiquitous in tech) | Scattered across codes | No coherent career page |

## Directory Structure

```
data/manual/
├── README.md              # This file
└── careers/               # Individual career YAML files
    ├── _template.yaml     # Template for new careers
    ├── ai-ml-engineers.yaml
    ├── product-managers.yaml
    └── ...
```

## How to Add a New Career

1. Copy `careers/_template.yaml` to a new file named `[slug].yaml`
2. Fill in all required fields following the PRD methodology
3. Run `npm run data:generate-final` to include the new career
4. Verify the career appears correctly in the explorer

## Data Sourcing Methodology

See `/docs/MANUALLY_ADDED_CAREERS_METHODOLOGY.md` for full details.

### Required Data (Must Have Before Publishing)

| Field | Source |
|-------|--------|
| Wages | Triangulate 2+ sources: Glassdoor, Levels.fyi, LinkedIn, Indeed |
| Tasks | Job posting analysis (50+ postings) |
| Skills | LinkedIn job postings + Indeed requirements |
| AI Resilience | Editorial EPOCH assessment with written reasoning |

### AI Resilience Assessment (Editorial)

For manual careers, use the same 4-tier system as O*NET careers:

1. **Score AI Exposure (0-2 points)** - Based on task analysis
2. **Score Job Growth (0-2 points)** - Based on LinkedIn/Indeed trends
3. **Score Human Advantage (0-2 points)** - Based on EPOCH framework

Total 5-6 = AI-Resilient, 3-4 = AI-Augmented, 2 = In Transition, 0-1 = High Disruption Risk

## Maintenance

Manual careers require 6-month review cycles:

| Field | Update Frequency |
|-------|------------------|
| Wages | Every 6 months |
| Skills | Every 6 months |
| Tasks | Annually |
| AI Resilience | Annually |

Always update the `last_updated` field when making changes.
