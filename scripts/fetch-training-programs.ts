/**
 * Fetch Training Programs from Supabase
 *
 * Fetches training program data from Supabase and exports to normalized JSON
 * for use in the career aggregation pipeline.
 *
 * Run: npx tsx scripts/fetch-training-programs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for Supabase client (ESM compatibility)
async function getSupabaseClient() {
  const { getSupabaseClient: getSupa } = await import('../src/lib/compass/supabase');
  return getSupa();
}

const OUTPUT_DIR = path.join(process.cwd(), 'data/sources/training-programs');

interface TrainingProgram {
  id: string;
  name: string;
  type: string;
  provider: string;
  url: string;
  description: string | null;
  duration_months: number | null;
  format: string | null;
  cost_amount: number | null;
  cost_type: string | null;
  cost_notes: string | null;
  credential_earned: string | null;
  relevance_score: number | null;
  verified: boolean;
  last_verified: string | null;
}

interface CareerProgramLink {
  career_slug: string;
  program_id: string;
  is_primary: boolean;
}

interface CategoryResource {
  id: number;
  category: string;
  name: string;
  url: string;
  description: string | null;
}

interface NormalizedOutput {
  version: string;
  last_updated: string;
  programs: Record<string, TrainingProgram>;
  careerPrograms: Record<string, TrainingProgram[]>;
  categoryResources: Record<string, CategoryResource[]>;
}

async function main() {
  console.log('\n=== Fetching Training Programs ===\n');

  const supabase = await getSupabaseClient();

  // Fetch all training programs
  console.log('Fetching training programs...');
  const { data: programs, error: programsError } = await supabase
    .from('training_programs')
    .select('*')
    .order('name');

  if (programsError) {
    console.error('Error fetching programs:', programsError.message);
    process.exit(1);
  }

  console.log(`  Found ${programs?.length || 0} programs`);

  // Fetch career-program links
  console.log('Fetching career-program links...');
  const { data: links, error: linksError } = await supabase
    .from('career_training_programs')
    .select('*');

  if (linksError) {
    console.error('Error fetching links:', linksError.message);
    process.exit(1);
  }

  console.log(`  Found ${links?.length || 0} career-program links`);

  // Fetch category resources
  console.log('Fetching category resources...');
  const { data: categoryResources, error: resourcesError } = await supabase
    .from('category_training_resources')
    .select('*')
    .order('category');

  if (resourcesError) {
    console.error('Error fetching category resources:', resourcesError.message);
    process.exit(1);
  }

  console.log(`  Found ${categoryResources?.length || 0} category resources`);

  // Build program lookup
  const programsById: Record<string, TrainingProgram> = {};
  (programs || []).forEach((p: TrainingProgram) => {
    programsById[p.id] = p;
  });

  // Build career-to-programs mapping
  const careerPrograms: Record<string, TrainingProgram[]> = {};
  (links || []).forEach((link: CareerProgramLink) => {
    const program = programsById[link.program_id];
    if (program) {
      if (!careerPrograms[link.career_slug]) {
        careerPrograms[link.career_slug] = [];
      }
      careerPrograms[link.career_slug].push({
        ...program,
        is_primary: link.is_primary
      } as TrainingProgram & { is_primary: boolean });
    }
  });

  // Sort each career's programs by relevance
  Object.keys(careerPrograms).forEach(slug => {
    careerPrograms[slug].sort((a, b) => {
      const aScore = (a as TrainingProgram & { is_primary?: boolean }).is_primary ? 100 : 0;
      const bScore = (b as TrainingProgram & { is_primary?: boolean }).is_primary ? 100 : 0;
      return (bScore + (b.relevance_score || 0)) - (aScore + (a.relevance_score || 0));
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

  // Create normalized output
  const output: NormalizedOutput = {
    version: '1.0',
    last_updated: new Date().toISOString().split('T')[0],
    programs: programsById,
    careerPrograms,
    categoryResources: categoryResourcesMap,
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
  console.log(`Total programs: ${Object.keys(programsById).length}`);
  console.log(`Careers with programs: ${Object.keys(careerPrograms).length}`);
  console.log(`Categories with resources: ${Object.keys(categoryResourcesMap).length}`);

  console.log('\n=== Fetch Complete ===\n');
}

main().catch(console.error);
