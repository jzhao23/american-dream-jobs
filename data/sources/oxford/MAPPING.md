# Oxford AI Risk Data

> **Full documentation**: See [docs/AI_RISK_METHODOLOGY.md](../../../docs/AI_RISK_METHODOLOGY.md)

## Files in This Folder

| File | Description |
|------|-------------|
| `frey-osborne-2013-raw.csv` | Original data from Oxford study (702 occupations) |
| `frey-osborne-2013.json` | Parsed JSON format |

## Quick Reference

**Source**: Frey & Osborne (2013) "The Future of Employment"
**URL**: https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment

**Formula**: `ai_risk = 1 + (probability × 9)`

| Oxford Probability | AI Risk | Label |
|-------------------|---------|-------|
| 0.00 | 1.0 | Very Low |
| 0.50 | 5.5 | Medium |
| 1.00 | 10.0 | Very High |

## Regenerate Mapping

```bash
npx tsx scripts/map-oxford-ai-risk.ts
```
