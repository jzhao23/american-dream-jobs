# American Dream Jobs

A CareerOneStop-quality data product with modern UX, focused on economic ROI, time to employability, AI resilience, and importance to US industrial capacity.

## Features

- **Career Explorer**: Filter and sort 25+ careers by pay, training time, AI resilience, and category
- **Detailed Career Pages**: Comprehensive information including wage trajectories, entry paths, and fit assessment
- **Contribution System**: Allow practitioners to submit corrections and share experiences
- **Career Requests**: Users can request new careers to be added
- **Email Capture**: Newsletter signup for updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Data**: Static JSON generated from CareerOneStop API
- **Deployment**: Vercel (recommended) or Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd american-dream-jobs

# Install dependencies
npm install

# Generate career data (uses seed data if no API keys set)
npm run fetch-careers

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

#### CareerOneStop API (Optional)

To fetch real-time data from CareerOneStop:

1. Register at [CareerOneStop Web API](https://www.careeronestop.org/Developers/WebAPI/registration.aspx)
2. Set environment variables:

```env
COS_API_KEY=your_api_key
COS_USER_ID=your_user_id
```

#### Analytics (Optional)

```env
# Plausible (recommended)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Project Structure

```
american-dream-jobs/
├── data/
│   ├── seed_careers.json      # Seed data with O*NET codes
│   ├── careers.generated.json # Generated full career data
│   └── careers-index.json     # Lightweight index for explorer
├── scripts/
│   └── fetch-careers.ts       # Data ingestion script
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage with explorer
│   │   ├── careers/[slug]/    # Career detail pages
│   │   ├── contribute/        # Contribution form
│   │   ├── request/           # Career request form
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── CareerExplorer.tsx # Filter/sort table
│   │   ├── EmailCapture.tsx   # Newsletter signup
│   │   ├── Header.tsx         # Site header with mobile menu
│   │   └── Analytics.tsx      # Analytics scripts
│   └── types/
│       └── career.ts          # Zod schemas and types
└── package.json
```

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Data Pipeline
- `npm run data:process-onet` - Process O*NET occupation data
- `npm run data:fetch-wages` - Fetch BLS wage data
- `npm run data:fetch-education` - Calculate education costs
- `npm run data:score-ai-risk` - Calculate AI automation risk scores
- `npm run data:score-importance` - Calculate industrial importance scores
- `npm run data:generate-final` - Generate final JSON files
- `npm run data:refresh` - Run full data pipeline

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Netlify

1. Push to GitHub
2. Import project in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables
6. Deploy

## Data Sources

### Occupational Data
- [O*NET OnLine](https://www.onetonline.org/) - Occupational database (education requirements, job zones)
- [Bureau of Labor Statistics](https://www.bls.gov/) - Wage and employment data
- [CareerOneStop](https://www.careeronestop.org/) - U.S. Department of Labor

### Education Cost Data
- [College Board Trends in College Pricing](https://research.collegeboard.org/trends/college-pricing) - National average tuition by institution type
- [NCES CIP-SOC Crosswalk](https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56) - Maps occupations to educational programs
- [AAMC](https://www.aamc.org/) - Medical school costs
- [ABA/LSAC](https://www.lsac.org/) - Law school costs
- Professional association data for specialized programs

See [docs/education-cost-methodology.md](docs/education-cost-methodology.md) for detailed methodology.

## Adding New Careers

1. Add entry to `data/seed_careers.json`:
   ```json
   {
     "slug": "career-slug",
     "title": "Official O*NET Title",
     "onetCode": "XX-XXXX.XX",
     "category": "trades|healthcare|operations|office|technology",
     "flagship": true
   }
   ```

2. Run data ingestion:
   ```bash
   npm run fetch-careers:refresh
   ```

3. Rebuild the site

## Contributing

Contributions are welcome! Please see our contribution guidelines.

## License

MIT

---

Built with data from the U.S. Department of Labor. This site is not affiliated with the federal government.
