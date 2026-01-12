/**
 * Fetch Financial Aid from Supabase
 *
 * Fetches scholarship and financial aid data from Supabase and exports
 * to normalized JSON for use in the career aggregation pipeline.
 *
 * Run: npx tsx scripts/fetch-financial-aid.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for Supabase client (ESM compatibility)
async function getSupabaseClient() {
  const { getSupabaseClient: getSupa } = await import('../src/lib/compass/supabase');
  return getSupa();
}

const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/financial-aid');

interface Scholarship {
  id: string;
  name: string;
  url: string;
  provider: string;
  amount_min: number | null;
  amount_max: number | null;
  amount_text: string | null;
  eligibility: string | null;
  deadline: string | null;
  renewable: boolean;
  scope: string | null;
  verified: boolean;
  last_verified: string | null;
}

interface CareerScholarshipLink {
  career_slug: string;
  scholarship_id: string;
}

interface CategoryResource {
  id: number;
  category: string;
  name: string;
  url: string;
  description: string | null;
  resource_type: string | null;
}

interface FederalAidRule {
  education_level: string;
  federal_aid_eligible: boolean;
  typical_aid_sources: string[];
  notes: string | null;
}

interface NormalizedOutput {
  version: string;
  last_updated: string;
  scholarships: Record<string, Scholarship>;
  careerScholarships: Record<string, Scholarship[]>;
  categoryResources: Record<string, CategoryResource[]>;
  federalAidRules: Record<string, FederalAidRule>;
}

async function main() {
  console.log('\n=== Fetching Financial Aid Data ===\n');

  const supabase = await getSupabaseClient();

  // Fetch all scholarships
  console.log('Fetching scholarships...');
  const { data: scholarships, error: scholarshipsError } = await supabase
    .from('scholarships')
    .select('*')
    .order('name');

  if (scholarshipsError) {
    console.error('Error fetching scholarships:', scholarshipsError.message);
    process.exit(1);
  }

  console.log(`  Found ${scholarships?.length || 0} scholarships`);

  // Fetch career-scholarship links
  console.log('Fetching career-scholarship links...');
  const { data: links, error: linksError } = await supabase
    .from('career_scholarships')
    .select('*');

  if (linksError) {
    console.error('Error fetching links:', linksError.message);
    process.exit(1);
  }

  console.log(`  Found ${links?.length || 0} career-scholarship links`);

  // Fetch category resources
  console.log('Fetching category resources...');
  const { data: categoryResources, error: resourcesError } = await supabase
    .from('category_financial_resources')
    .select('*')
    .order('category');

  if (resourcesError) {
    console.error('Error fetching category resources:', resourcesError.message);
    process.exit(1);
  }

  console.log(`  Found ${categoryResources?.length || 0} category resources`);

  // Fetch federal aid rules
  console.log('Fetching federal aid rules...');
  const { data: federalAidRules, error: rulesError } = await supabase
    .from('education_federal_aid')
    .select('*');

  if (rulesError) {
    console.error('Error fetching federal aid rules:', rulesError.message);
    process.exit(1);
  }

  console.log(`  Found ${federalAidRules?.length || 0} federal aid rules`);

  // Build scholarship lookup
  const scholarshipsById: Record<string, Scholarship> = {};
  (scholarships || []).forEach((s: Scholarship) => {
    scholarshipsById[s.id] = s;
  });

  // Build career-to-scholarships mapping
  const careerScholarships: Record<string, Scholarship[]> = {};
  (links || []).forEach((link: CareerScholarshipLink) => {
    const scholarship = scholarshipsById[link.scholarship_id];
    if (scholarship) {
      if (!careerScholarships[link.career_slug]) {
        careerScholarships[link.career_slug] = [];
      }
      careerScholarships[link.career_slug].push(scholarship);
    }
  });

  // Sort each career's scholarships by amount
  Object.keys(careerScholarships).forEach(slug => {
    careerScholarships[slug].sort((a, b) => {
      const aMax = a.amount_max || a.amount_min || 0;
      const bMax = b.amount_max || b.amount_min || 0;
      return bMax - aMax;
    });
  });

  // Build category resources mapping
  const categoryResourcesMap: Record<string, CategoryResource[]> = {};
  (categoryResources || []).forEach((r: CategoryResource) => {
    if (!categoryResourcesMap[r.category]) {
      categoryResourcesMap[r.category] = [];
    }
    categoryResourcesMap[r.category].push(r);
  });

  // Build federal aid rules lookup
  const federalAidRulesMap: Record<string, FederalAidRule> = {};
  (federalAidRules || []).forEach((r: FederalAidRule) => {
    federalAidRulesMap[r.education_level] = r;
  });

  // Create normalized output
  const output: NormalizedOutput = {
    version: '1.0',
    last_updated: new Date().toISOString().split('T')[0],
    scholarships: scholarshipsById,
    careerScholarships,
    categoryResources: categoryResourcesMap,
    federalAidRules: federalAidRulesMap,
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write normalized output
  const outputPath = path.join(OUTPUT_DIR, 'normalized.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved normalized data to: ${outputPath}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total scholarships: ${Object.keys(scholarshipsById).length}`);
  console.log(`Careers with scholarships: ${Object.keys(careerScholarships).length}`);
  console.log(`Categories with resources: ${Object.keys(categoryResourcesMap).length}`);
  console.log(`Federal aid rules: ${Object.keys(federalAidRulesMap).length}`);

  console.log('\n=== Fetch Complete ===\n');
}

main().catch(console.error);
