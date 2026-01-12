/**
 * Sync Financial Aid to Supabase
 *
 * Seeds scholarship and financial aid data from local JSON files to Supabase.
 * Use this for initial seeding or updating from curated data files.
 *
 * Run: npx tsx scripts/sync-financial-aid.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for Supabase client (ESM compatibility)
async function getSupabaseClient() {
  const { getSupabaseClient: getSupa } = await import('../src/lib/compass/supabase');
  return getSupa();
}

const DATA_DIR = path.join(process.cwd(), 'data/sources/financial-aid');

interface ScholarshipInput {
  id: string;
  name: string;
  url: string;
  provider: string;
  amount_min?: number;
  amount_max?: number;
  amount_text?: string;
  eligibility?: string;
  deadline?: string;
  renewable?: boolean;
  scope?: string;
  verified?: boolean;
}

interface CategoryResourceInput {
  category: string;
  name: string;
  url: string;
  description?: string;
  resource_type?: string;
}

interface CareerMappingInput {
  career_slug: string;
  scholarship_ids: string[];
}

async function main() {
  console.log('\n=== Syncing Financial Aid to Supabase ===\n');

  const supabase = await getSupabaseClient();

  // Load scholarships.json if it exists
  const scholarshipsPath = path.join(DATA_DIR, 'scholarships.json');
  if (fs.existsSync(scholarshipsPath)) {
    console.log('Loading scholarships.json...');
    const scholarships: ScholarshipInput[] = JSON.parse(fs.readFileSync(scholarshipsPath, 'utf-8'));
    console.log(`  Found ${scholarships.length} scholarships`);

    // Upsert scholarships
    for (const scholarship of scholarships) {
      const { error } = await supabase
        .from('scholarships')
        .upsert({
          id: scholarship.id,
          name: scholarship.name,
          url: scholarship.url,
          provider: scholarship.provider,
          amount_min: scholarship.amount_min || null,
          amount_max: scholarship.amount_max || null,
          amount_text: scholarship.amount_text || null,
          eligibility: scholarship.eligibility || null,
          deadline: scholarship.deadline || null,
          renewable: scholarship.renewable || false,
          scope: scholarship.scope || null,
          verified: scholarship.verified || false,
          last_verified: scholarship.verified ? new Date().toISOString() : null,
        });

      if (error) {
        console.error(`  Error upserting ${scholarship.id}: ${error.message}`);
      }
    }
    console.log(`  Synced ${scholarships.length} scholarships`);
  } else {
    console.log('No scholarships.json found, skipping scholarship sync');
  }

  // Load category-resources.json if it exists
  const categoryResourcesPath = path.join(DATA_DIR, 'category-resources.json');
  if (fs.existsSync(categoryResourcesPath)) {
    console.log('\nLoading category-resources.json...');
    const resources: CategoryResourceInput[] = JSON.parse(fs.readFileSync(categoryResourcesPath, 'utf-8'));
    console.log(`  Found ${resources.length} category resources`);

    // Clear existing and insert new
    const { error: deleteError } = await supabase
      .from('category_financial_resources')
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) {
      console.error(`  Error clearing existing resources: ${deleteError.message}`);
    }

    for (const resource of resources) {
      const { error } = await supabase
        .from('category_financial_resources')
        .insert({
          category: resource.category,
          name: resource.name,
          url: resource.url,
          description: resource.description || null,
          resource_type: resource.resource_type || 'general',
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
      .from('career_scholarships')
      .delete()
      .neq('career_slug', ''); // Delete all

    if (deleteError) {
      console.error(`  Error clearing existing links: ${deleteError.message}`);
    }

    // Insert new links
    let linkCount = 0;
    for (const mapping of mappings) {
      for (const scholarshipId of mapping.scholarship_ids) {
        const { error } = await supabase
          .from('career_scholarships')
          .insert({
            career_slug: mapping.career_slug,
            scholarship_id: scholarshipId,
          });

        if (error) {
          console.error(`  Error linking ${mapping.career_slug} to ${scholarshipId}: ${error.message}`);
        } else {
          linkCount++;
        }
      }
    }
    console.log(`  Created ${linkCount} career-scholarship links`);
  } else {
    console.log('No career-mappings.json found, skipping career mapping sync');
  }

  console.log('\n=== Sync Complete ===\n');
}

main().catch(console.error);
