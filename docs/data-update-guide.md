# Data Update Guide

This guide explains how to refresh the education cost data for the American Dream Jobs platform.

## Quick Start

To refresh all education cost data:

```bash
npm run data:fetch-education
```

Or refresh all data including wages, AI risk scores, etc.:

```bash
npm run data:refresh
```

## Annual Update Procedure

### 1. Update College Board Tuition Data (October each year)

The College Board releases new "Trends in College Pricing" data each October.

**Steps:**
1. Visit [College Board Trends](https://research.collegeboard.org/trends/college-pricing)
2. Find the latest tuition and fees data
3. Update `scripts/fetch-education-costs.ts`:

```typescript
const COLLEGE_BOARD_2024_25 = {
  year: 2025,  // Update year
  tuition_and_fees: {
    public_2year_in_district: 4100,    // Update values
    public_4year_in_state: 12000,
    public_4year_out_of_state: 25000,
    private_nonprofit_4year: 45000,
  },
  // ...
};
```

4. Run the script:
```bash
npm run data:fetch-education
```

### 2. Update Professional Program Costs (Annually)

Update `data/sources/education/professional_programs.json` with latest costs from:

- **Medical schools**: [AAMC Tuition Reports](https://www.aamc.org/data-reports/reporting-tools/report/tuition-and-student-fees-reports)
- **Law schools**: [ABA/LSAC Data](https://www.lsac.org/)
- **Dental schools**: [ADA Data](https://www.ada.org/)
- **Pharmacy schools**: [AACP Data](https://www.aacp.org/)

### 3. Update CIP-SOC Crosswalk (Every 5-7 years)

The CIP-SOC crosswalk is updated when either the CIP or SOC classification systems change.

**Steps:**
1. Check for new version at [NCES CIP Resources](https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56)
2. Download new crosswalk Excel file
3. Replace `data/sources/education/cip_soc_crosswalk.xlsx`
4. Run the script to regenerate mappings

## File Locations

| File | Purpose |
|------|---------|
| `scripts/fetch-education-costs.ts` | Main processing script |
| `data/sources/education/cip_soc_crosswalk.xlsx` | CIP-SOC mapping (download from NCES) |
| `data/sources/education/professional_programs.json` | Manual program cost data |
| `data/processed/education_costs.json` | Generated education cost data |
| `data/processed/cip_soc_mapping.json` | Parsed SOC-to-CIP mapping |
| `data/processed/occupations_complete.json` | Main occupations data (updated with costs) |

## Quality Checks

After running the update:

### 1. Check Coverage

```bash
npx tsx -e "
const data = require('./data/processed/education_costs.json');
const costs = Object.values(data.costs);
console.log('Total occupations:', costs.length);
console.log('High confidence:', costs.filter(c => c.data_source.confidence === 'high').length);
console.log('Medium confidence:', costs.filter(c => c.data_source.confidence === 'medium').length);
console.log('Low confidence:', costs.filter(c => c.data_source.confidence === 'low').length);
"
```

### 2. Spot Check Specific Occupations

```bash
npx tsx -e "
const data = require('./data/processed/education_costs.json');
const codes = ['15-1252.00', '29-1211.00', '47-2111.00'];
codes.forEach(code => {
  const c = data.costs[code];
  if (c) {
    console.log(code + ': $' + c.typical_cost.toLocaleString());
  }
});
"
```

Expected ranges:
- Software Developer (15-1252): ~$50k-$200k
- Physician (29-1211): ~$200k-$450k
- Electrician (47-2111): ~$0-$2k (apprenticeship)

### 3. Verify Build

```bash
npm run build
```

## Troubleshooting

### "CIP-SOC crosswalk not found"

Download the crosswalk:
```bash
curl -o data/sources/education/cip_soc_crosswalk.xlsx \
  "https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx"
```

### "occupations_complete.json not found"

Run the O*NET processing first:
```bash
npm run data:process-onet
```

### Low CIP mapping count

The crosswalk should map ~800+ SOC codes. If significantly fewer:
1. Check the Excel file isn't corrupted
2. Verify the "SOC-CIP" sheet exists
3. Check for format changes in column headers

## Career Progression Data

After updating BLS wages, regenerate career progression data:

```bash
npx tsx scripts/create-progression-mappings.ts
```

### Important: BLS High-Earner Data

BLS does not report exact wages above ~$208,000. The script automatically estimates missing 75th and 90th percentiles for affected careers (56-77 occupations including physicians, executives, lawyers).

See [CAREER_PROGRESSION_METHODOLOGY.md](./CAREER_PROGRESSION_METHODOLOGY.md) for details.

### Validation

The generate-final.ts script validates that no careers have $0 in their timeline:

```bash
npx tsx scripts/generate-final.ts
# Look for: "✓ All career progressions have valid (non-zero) compensation data"
```

If you see warnings about $0 values, the estimation logic may need updating.

---

## Future Enhancements

When College Scorecard API access is available:

1. Register for API key at [api.data.gov](https://api.data.gov/signup)
2. Add API integration to fetch field-of-study-specific costs
3. Replace College Board averages with actual median costs by program

This would enable:
- Institution-specific cost lookups
- Median debt by program
- Earnings outcomes by field
