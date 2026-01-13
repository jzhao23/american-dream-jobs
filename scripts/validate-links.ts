/**
 * Link Validation Script
 *
 * Validates all career and specialization links across the website:
 * 1. Home page featured careers
 * 2. Career compass matching engine slugs
 * 3. All career references in the codebase
 *
 * Run with: npx tsx scripts/validate-links.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Career {
  slug: string;
  title: string;
}

interface Specialization {
  slug: string;
  title: string;
}

interface ValidationResult {
  type: 'careers' | 'specializations';
  location: string;
  slug: string;
  title?: string;
  exists: boolean;
}

// Load data files
function loadCareers(): Map<string, Career> {
  const careersPath = path.join(process.cwd(), 'data/output/careers.json');
  const careers = JSON.parse(fs.readFileSync(careersPath, 'utf-8')) as Career[];
  return new Map(careers.map(c => [c.slug, c]));
}

function loadSpecializations(): Map<string, Specialization> {
  const specsPath = path.join(process.cwd(), 'data/output/specializations.json');
  const specs = JSON.parse(fs.readFileSync(specsPath, 'utf-8')) as Specialization[];
  return new Map(specs.map(s => [s.slug, s]));
}

function loadEmbeddings(): string[] {
  const embPath = path.join(process.cwd(), 'data/compass/career-embeddings.json');
  const data = JSON.parse(fs.readFileSync(embPath, 'utf-8'));
  return data.embeddings.map((e: { career_slug: string }) => e.career_slug);
}

// Parse home page for featured careers
function parseFeaturedCareers(): Array<{ title: string; href: string }> {
  const pagePath = path.join(process.cwd(), 'src/app/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  // Extract featuredCareers array
  const match = content.match(/const featuredCareers = \[([\s\S]*?)\];/);
  if (!match) return [];

  const entries: Array<{ title: string; href: string }> = [];
  const lineRegex = /title:\s*"([^"]+)"[\s\S]*?href:\s*"([^"]+)"/g;
  let m;
  while ((m = lineRegex.exec(match[1])) !== null) {
    entries.push({ title: m[1], href: m[2] });
  }
  return entries;
}

// Parse curated paths for career references
function parseCuratedPaths(): Array<{ title: string; href: string }> {
  const pagePath = path.join(process.cwd(), 'src/app/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  const match = content.match(/const curatedPaths = \[([\s\S]*?)\];/);
  if (!match) return [];

  const entries: Array<{ title: string; href: string }> = [];
  const lineRegex = /title:\s*"([^"]+)"[\s\S]*?href:\s*"([^"]+)"/g;
  let m;
  while ((m = lineRegex.exec(match[1])) !== null) {
    entries.push({ title: m[1], href: m[2] });
  }
  return entries;
}

// Main validation
async function validate() {
  console.log('🔍 Loading data files...\n');

  const careers = loadCareers();
  const specializations = loadSpecializations();
  const embeddings = loadEmbeddings();

  console.log(`📊 Data summary:`);
  console.log(`   Careers: ${careers.size}`);
  console.log(`   Specializations: ${specializations.size}`);
  console.log(`   Embeddings: ${embeddings.length}`);
  console.log('');

  const results: ValidationResult[] = [];
  const errors: ValidationResult[] = [];

  // 1. Validate home page featured careers
  console.log('📋 Validating home page featured careers...');
  const featuredCareers = parseFeaturedCareers();

  for (const featured of featuredCareers) {
    const urlMatch = featured.href.match(/\/(careers|specializations)\/(.+)/);
    if (!urlMatch) {
      console.log(`   ⚠️  Invalid URL format: ${featured.href}`);
      continue;
    }

    const [, type, slug] = urlMatch;
    const exists = type === 'careers'
      ? careers.has(slug)
      : specializations.has(slug);

    const result: ValidationResult = {
      type: type as 'careers' | 'specializations',
      location: 'home page featured careers',
      slug,
      title: featured.title,
      exists
    };

    results.push(result);
    if (!exists) errors.push(result);

    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${featured.title} -> /${type}/${slug}`);
  }
  console.log('');

  // 2. Validate curated paths
  console.log('📋 Validating curated paths...');
  const curatedPaths = parseCuratedPaths();

  for (const path of curatedPaths) {
    // These link to /paths/ routes, not career/specialization pages
    const isPathsRoute = path.href.startsWith('/paths/');
    if (isPathsRoute) {
      // Check if the paths page exists
      const pathsPagePath = `src/app${path.href}/page.tsx`;
      const exists = fs.existsSync(pathsPagePath);
      console.log(`   ${exists ? '✅' : '❌'} ${path.title} -> ${path.href}`);
      if (!exists) {
        errors.push({
          type: 'careers',
          location: 'curated paths',
          slug: path.href,
          title: path.title,
          exists: false
        });
      }
    }
  }
  console.log('');

  // 3. Validate embedding slugs match careers.json
  console.log('📋 Validating embedding slugs match careers...');
  let embeddingMismatches = 0;

  for (const slug of embeddings) {
    if (!careers.has(slug)) {
      embeddingMismatches++;
      if (embeddingMismatches <= 5) {
        console.log(`   ❌ Embedding slug not in careers.json: ${slug}`);
      }
      errors.push({
        type: 'careers',
        location: 'career embeddings',
        slug,
        exists: false
      });
    }
  }

  if (embeddingMismatches === 0) {
    console.log(`   ✅ All ${embeddings.length} embedding slugs exist in careers.json`);
  } else {
    console.log(`   ❌ ${embeddingMismatches} embedding slugs missing from careers.json`);
  }
  console.log('');

  // 4. Check that all careers have embeddings
  console.log('📋 Validating all careers have embeddings...');
  const embeddingSet = new Set(embeddings);
  let careersMissingEmbeddings = 0;

  for (const [slug, career] of careers) {
    if (!embeddingSet.has(slug)) {
      careersMissingEmbeddings++;
      if (careersMissingEmbeddings <= 5) {
        console.log(`   ⚠️  Career missing embedding: ${career.title} (${slug})`);
      }
    }
  }

  if (careersMissingEmbeddings === 0) {
    console.log(`   ✅ All ${careers.size} careers have embeddings`);
  } else {
    console.log(`   ⚠️  ${careersMissingEmbeddings} careers missing embeddings`);
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════');

  if (errors.length === 0) {
    console.log('✅ All links are valid!');
  } else {
    console.log(`❌ Found ${errors.length} broken links:\n`);

    for (const error of errors) {
      console.log(`   Location: ${error.location}`);
      if (error.title) console.log(`   Title: ${error.title}`);
      console.log(`   Expected: /${error.type}/${error.slug}`);
      console.log('');
    }

    // Exit with error code if there are broken links
    process.exit(1);
  }
}

validate().catch(console.error);
