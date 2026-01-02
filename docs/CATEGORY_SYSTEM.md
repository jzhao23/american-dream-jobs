# Category System

This document explains how occupations are organized into categories in American Dream Jobs.

## Overview

We organize 1,016 O*NET occupations into **22 user-friendly categories**. This is based on the BLS Standard Occupational Classification (SOC) system but with modifications to improve usability.

## The 22 Categories

| Category | ID | Icon | SOC Groups | Count |
|----------|----|----|------------|-------|
| Management & Executive | `management` | 👔 | 11 (partial) | ~24 |
| Business & Finance | `business-finance` | 📊 | 13 | ~59 |
| Legal | `legal` | ⚖️ | 23 | ~8 |
| Technology & Computing | `technology` | 💻 | 15 | ~39 |
| Engineering | `engineering` | ⚙️ | 17 | ~66 |
| Science & Research | `science` | 🔬 | 19 | ~68 |
| Social Services & Community | `social-services` | 🤝 | 21 | ~19 |
| Education & Library | `education` | 📚 | 25 | ~72 |
| Arts, Design & Media | `arts-media` | 🎨 | 27 | ~47 |
| Healthcare: Clinical | `healthcare-clinical` | 🩺 | 29-1, 29-9 | ~69 |
| Healthcare: Technical | `healthcare-technical` | 🏥 | 29-2, 31 | ~49 |
| Protective Services | `protective-services` | 🛡️ | 33 | ~29 |
| Food Service & Hospitality | `food-service` | 🍳 | 35 | ~19 |
| Building & Grounds | `building-grounds` | 🏢 | 37 | ~10 |
| Personal Care & Service | `personal-care` | 💈 | 39 | ~34 |
| Sales | `sales` | 🛒 | 41 | ~24 |
| Office & Administrative | `office-admin` | 📋 | 43 | ~55 |
| Agriculture & Natural Resources | `agriculture` | 🌾 | 45 | ~15 |
| Construction & Extraction | `construction` | 🏗️ | 47 | ~66 |
| Installation, Maintenance & Repair | `installation-repair` | 🔧 | 49 | ~52 |
| Manufacturing & Production | `production` | 🏭 | 51 | ~114 |
| Transportation & Logistics | `transportation` | 🚛 | 53 | ~59 |
| Military | `military` | 🎖️ | 55 | ~19 |

---

## Key Design Decisions

### 1. Healthcare Split

We split healthcare into two categories:

- **Healthcare: Clinical** (🩺) - Practitioners who diagnose and treat patients directly
  - Physicians, Nurses, Therapists, Dentists
  - SOC: 29-1xxx, 29-9xxx

- **Healthcare: Technical** (🏥) - Support roles and technicians
  - Medical Technicians, Health Aides, Lab Technicians
  - SOC: 29-2xxx, 31-xxxx

**Rationale**: These have very different education requirements, pay scales, and career paths.

### 2. Manager Redistribution (Genealogical Principle)

BLS groups all managers in SOC 11-xxxx. We redistribute domain-specific managers to their functional categories.

**The Genealogical Principle**: A manager belongs in the category where they likely got promoted from.

| Manager Title | BLS Category | Our Category | Rationale |
|--------------|--------------|--------------|-----------|
| Engineering Manager | Management (11) | Engineering | Promoted from engineer |
| Nursing Manager | Management (11) | Healthcare: Clinical | Promoted from nurse |
| IT Manager | Management (11) | Technology | Promoted from developer |
| Sales Manager | Management (11) | Sales | Promoted from salesperson |
| Construction Manager | Management (11) | Construction | Promoted from tradesperson |

**Managers that stay in Management**:
- Chief Executives (general leadership)
- General and Operations Managers
- Administrative Services Managers
- Human Resources Managers

See `src/lib/categories/manager-redistribution.ts` for the complete mapping.

### 3. Career-Specific Overrides

Some non-manager occupations are miscategorized by their SOC major group. We override these individually.

| Career | SOC Code | Default Category | Override To | Rationale |
|--------|----------|------------------|-------------|-----------|
| Models | 41-9012 | Sales | Arts & Media | Creative/performance work, not transactional sales |

**To add a new override:**
1. Find the career's O*NET-SOC code (e.g., "41-9012.00")
2. Add an entry to `CAREER_OVERRIDES` in `src/lib/categories/career-overrides.ts`
3. Update this documentation
4. Run `npm run data:generate-final` to regenerate data

See `src/lib/categories/career-overrides.ts` for the complete mapping.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/categories/onet-category-mapping.ts` | SOC → Category mapping logic |
| `src/lib/categories/manager-redistribution.ts` | Manager reassignment rules |
| `src/lib/categories/career-overrides.ts` | Non-manager career overrides |
| `src/lib/categories/category-metadata.ts` | Names, icons, colors, descriptions |
| `src/lib/categories/category-content.ts` | Extended content for category pages |
| `src/lib/categories/category-stats.ts` | Statistics computation |

---

## SOC to Category Mapping

The mapping follows the BLS SOC major groups:

```typescript
const SOC_TO_CATEGORY: Record<string, CategoryId> = {
  '11': 'management',        // Management (with redistribution)
  '13': 'business-finance',  // Business and Financial Operations
  '15': 'technology',        // Computer and Mathematical
  '17': 'engineering',       // Architecture and Engineering
  '19': 'science',           // Life, Physical, and Social Science
  '21': 'social-services',   // Community and Social Service
  '23': 'legal',             // Legal
  '25': 'education',         // Educational Instruction and Library
  '27': 'arts-media',        // Arts, Design, Entertainment, Sports, Media
  '29': 'healthcare-*',      // Healthcare Practitioners (split)
  '31': 'healthcare-technical', // Healthcare Support
  '33': 'protective-services',  // Protective Service
  '35': 'food-service',      // Food Preparation and Serving
  '37': 'building-grounds',  // Building and Grounds Cleaning
  '39': 'personal-care',     // Personal Care and Service
  '41': 'sales',             // Sales and Related
  '43': 'office-admin',      // Office and Administrative Support
  '45': 'agriculture',       // Farming, Fishing, and Forestry
  '47': 'construction',      // Construction and Extraction
  '49': 'installation-repair', // Installation, Maintenance, Repair
  '51': 'production',        // Production
  '53': 'transportation',    // Transportation and Material Moving
  '55': 'military',          // Military Specific
};
```

---

## Category Pages

Each category has a landing page at `/categories/[id]` with:

1. **Overview Statistics**
   - Number of careers
   - Median pay
   - Average AI risk

2. **What You'll Do**
   - Typical tasks in this field

3. **Education & Training**
   - Typical path (degree, certification, apprenticeship)
   - Time investment
   - Common credentials

4. **Who This Is For**
   - Good fit traits
   - Not ideal if...

5. **Career Explorer**
   - Filtered table of all careers in this category

---

## Adding a New Category

If O*NET adds a new major group or we want to split an existing category:

1. Add the category ID to `CategoryId` type in `onet-category-mapping.ts`
2. Add to `ALL_CATEGORY_IDS` array
3. Add SOC mapping in `SOC_TO_CATEGORY`
4. Add metadata in `category-metadata.ts`
5. Add extended content in `category-content.ts`
6. Run `npm run build` to regenerate pages

---

## References

- BLS SOC 2018 Structure: https://www.bls.gov/soc/2018/major_groups.htm
- O*NET Taxonomy: https://www.onetcenter.org/taxonomy.html
