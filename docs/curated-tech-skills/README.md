# Curated Technology Skills

This directory contains curated technology skills for all careers in American Dream Jobs.

## Why Curate?

The raw O*NET data includes technology skills that are:
- **Too numerous** - Often 15-20 items per career
- **Sometimes irrelevant** - e.g., "Autodesk AutoCAD" for Investment Fund Managers
- **Outdated** - Obsolete software like "Microsoft MapPoint"
- **Redundant** - Listing Word, Excel, PowerPoint separately instead of "Microsoft Office"

## Curation Goals

Each career should have **5-8 technology skills** that are:
1. Actually relevant to the specific occupation
2. Modern and currently used in the field
3. Consolidated where appropriate
4. Practical for someone entering this career today

## File Structure

```
docs/curated-tech-skills/
├── README.md                 # This file
├── technology.md             # Technology & Computing careers
├── engineering.md            # Engineering careers
├── healthcare-clinical.md    # Healthcare: Clinical careers
├── ... (one file per category)
└── _combined.json            # All curated skills as JSON
```

## Markdown Format

Each category file follows this format:

```markdown
# Technology Skills: [Category Name]

## [Career Title] (XX-XXXX.00)
**Original (N items):** skill1, skill2, skill3, ...
**Curated (M items):** skill1, skill2, skill3, ...

## [Next Career] (XX-XXXX.00)
...
```

## How It's Used

The `scripts/generate-final.ts` script reads `_combined.json` and applies the curated skills to the final career data. Careers without curated skills keep their original O*NET data.

## Contributing

To update curations:
1. Edit the appropriate category `.md` file
2. Run `node scripts/sync-curated-skills.js` to regenerate `_combined.json`
3. Run `npm run data:generate-final` to apply changes

## Statistics

- **Total careers with tech skills:** 923
- **Categories:** 23
- **Target skills per career:** 5-8
