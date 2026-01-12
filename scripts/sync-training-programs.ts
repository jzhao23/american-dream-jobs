/**
 * Sync Training Programs to Supabase
 *
 * Seeds training program data from local JSON files to Supabase.
 * Use this for initial seeding or updating from curated data files.
 *
 * Run: npx tsx scripts/sync-training-programs.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for Supabase client (ESM compatibility)
async function getSupabaseClient() {
  const { getSupabaseClient: getSupa } = await import('../src/lib/compass/supabase');
  return getSupa();
}

const DATA_DIR = path.join(process.cwd(), 'data/sources/training-programs');

interface TrainingProgramInput {
  id: string;
  name: string;
  type: string;
  provider: string;
  url: string;
  description?: string;
  duration_months?: number;
  format?: string;
  cost_amount?: number;
  cost_type?: string;
  cost_notes?: string;
  credential_earned?: string;
  relevance_score?: number;
  verified?: boolean;
}

interface CategoryResourceInput {
  category: string;
  name: string;
  url: string;
  description?: string;
}

interface CareerMappingInput {
  career_slug: string;
  program_ids: string[];
  primary_program_id?: string;
}

async function main() {
  console.log('\n=== Syncing Training Programs to Supabase ===\n');

  const supabase = await getSupabaseClient();

  // Load programs.json if it exists
  const programsPath = path.join(DATA_DIR, 'programs.json');
  if (fs.existsSync(programsPath)) {
    console.log('Loading programs.json...');
    const programs: TrainingProgramInput[] = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));
    console.log(`  Found ${programs.length} programs`);

    // Upsert programs
    for (const program of programs) {
      const { error } = await supabase
        .from('training_programs')
        .upsert({
          id: program.id,
          name: program.name,
          type: program.type,
          provider: program.provider,
          url: program.url,
          description: program.description || null,
          duration_months: program.duration_months || null,
          format: program.format || null,
          cost_amount: program.cost_amount || null,
          cost_type: program.cost_type || null,
          cost_notes: program.cost_notes || null,
          credential_earned: program.credential_earned || null,
          relevance_score: program.relevance_score || null,
          verified: program.verified || false,
          last_verified: program.verified ? new Date().toISOString() : null,
        });

      if (error) {
        console.error(`  Error upserting ${program.id}: ${error.message}`);
      }
    }
    console.log(`  Synced ${programs.length} programs`);
  } else {
    console.log('No programs.json found, skipping program sync');
  }

  // Load category-resources.json if it exists
  const categoryResourcesPath = path.join(DATA_DIR, 'category-resources.json');
  if (fs.existsSync(categoryResourcesPath)) {
    console.log('\nLoading category-resources.json...');
    const resources: CategoryResourceInput[] = JSON.parse(fs.readFileSync(categoryResourcesPath, 'utf-8'));
    console.log(`  Found ${resources.length} category resources`);

    // Clear existing and insert new
    const { error: deleteError } = await supabase
      .from('category_training_resources')
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) {
      console.error(`  Error clearing existing resources: ${deleteError.message}`);
    }

    for (const resource of resources) {
      const { error } = await supabase
        .from('category_training_resources')
        .insert({
          category: resource.category,
          name: resource.name,
          url: resource.url,
          description: resource.description || null,
        });

      if (error) {
        console.error(`  Error inserting resource: ${error.message}`);
      }
    }
    console.log(`  Synced ${resources.length} category resources`);
  } else {
    console.log('No category-resources.json found, skipping category resource sync');
  }

  // Load career-mappings.json if it exists
  const mappingsPath = path.join(DATA_DIR, 'career-mappings.json');
  if (fs.existsSync(mappingsPath)) {
    console.log('\nLoading career-mappings.json...');
    const mappings: CareerMappingInput[] = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));
    console.log(`  Found ${mappings.length} career mappings`);

    // Clear existing links
    const { error: deleteError } = await supabase
      .from('career_training_programs')
      .delete()
      .neq('career_slug', ''); // Delete all

    if (deleteError) {
      console.error(`  Error clearing existing links: ${deleteError.message}`);
    }

    // Insert new links
    let linkCount = 0;
    for (const mapping of mappings) {
      for (const programId of mapping.program_ids) {
        const { error } = await supabase
          .from('career_training_programs')
          .insert({
            career_slug: mapping.career_slug,
            program_id: programId,
            is_primary: programId === mapping.primary_program_id,
          });

        if (error) {
          console.error(`  Error linking ${mapping.career_slug} to ${programId}: ${error.message}`);
        } else {
          linkCount++;
        }
      }
    }
    console.log(`  Created ${linkCount} career-program links`);
  } else {
    console.log('No career-mappings.json found, skipping career mapping sync');
  }

  console.log('\n=== Sync Complete ===\n');
}

main().catch(console.error);
