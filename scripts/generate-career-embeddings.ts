/**
 * Generate Career Embeddings for Career Compass
 *
 * This script generates vector embeddings for all careers and stores them in Supabase.
 * It uses OpenAI's text-embedding-3-small model (1536 dimensions).
 *
 * Run: npx tsx scripts/generate-career-embeddings.ts
 *
 * Prerequisites:
 * - OPENAI_API_KEY in .env.local
 * - SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 * - Supabase migration run (career_embeddings table exists)
 * - DWA extraction complete (data/compass/career-dwas.json exists)
 */

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase is optional - if not configured, we'll save to JSON
let supabase: ReturnType<typeof createClient> | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// Types
interface Career {
  onet_code: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  job_zone: number;
  tasks: string[];
  technology_skills: string[];
  abilities: string[];
  inside_look?: { content: string };
  wages?: { annual?: { median?: number } };
  ai_resilience?: string;
}

interface CareerDWAMapping {
  onet_code: string;
  dwa_ids: string[];
}

interface DWA {
  id: string;
  title: string;
}

interface EmbeddingData {
  career_slug: string;
  onet_code: string;
  title: string;
  category: string;
  task_embedding: number[];
  narrative_embedding: number[];
  skills_embedding: number[];
  combined_embedding: number[];
  median_salary: number | null;
  ai_resilience: string | null;
  job_zone: number;
  embedding_input: {
    task_text: string;
    narrative_text: string;
    skills_text: string;
  };
}

// Build embedding texts
function buildTaskText(career: Career, dwaTexts: string[]): string {
  const parts: string[] = [];
  parts.push(`Career: ${career.title}`);
  parts.push(`Description: ${career.description}`);

  if (career.tasks.length > 0) {
    parts.push('Key Tasks:');
    career.tasks.slice(0, 10).forEach(task => {
      parts.push(`- ${task}`);
    });
  }

  if (dwaTexts.length > 0) {
    parts.push('Work Activities:');
    dwaTexts.slice(0, 10).forEach(dwa => {
      parts.push(`- ${dwa}`);
    });
  }

  return parts.join('\n').slice(0, 8000);
}

function buildNarrativeText(career: Career): string {
  const parts: string[] = [];
  parts.push(`Career: ${career.title}`);

  if (career.inside_look?.content) {
    parts.push('Work Environment and Culture:');
    parts.push(career.inside_look.content.slice(0, 4000));
  } else {
    parts.push(`Description: ${career.description}`);
    if (career.tasks.length > 0) {
      parts.push('Daily activities include:');
      career.tasks.slice(0, 5).forEach(task => {
        parts.push(`- ${task}`);
      });
    }
  }

  return parts.join('\n').slice(0, 8000);
}

function buildSkillsText(career: Career): string {
  const parts: string[] = [];
  parts.push(`Career: ${career.title}`);

  if (career.technology_skills.length > 0) {
    parts.push('Technology Skills:');
    parts.push(career.technology_skills.slice(0, 20).join(', '));
  }

  if (career.abilities.length > 0) {
    parts.push('Key Abilities:');
    parts.push(career.abilities.slice(0, 10).join(', '));
  }

  return parts.join('\n').slice(0, 4000);
}

function buildCombinedText(career: Career): string {
  const parts: string[] = [];
  parts.push(`${career.title}: ${career.description}`);

  if (career.tasks.length > 0) {
    parts.push('Tasks: ' + career.tasks.slice(0, 5).join('. '));
  }

  if (career.technology_skills.length > 0) {
    parts.push('Skills: ' + career.technology_skills.slice(0, 10).join(', '));
  }

  return parts.join(' ').slice(0, 4000);
}

// Generate embeddings for a batch of texts
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float'
  });

  return response.data.map(d => d.embedding);
}

// Rate limiting helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🚀 Starting Career Embeddings Generation...\n');

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Missing OPENAI_API_KEY in .env.local');
    process.exit(1);
  }

  // Load careers data
  console.log('📂 Loading careers data...');
  const careersPath = path.join(process.cwd(), 'data/careers.generated.json');
  if (!fs.existsSync(careersPath)) {
    console.error('❌ careers.generated.json not found. Run npm run data:generate-final first.');
    process.exit(1);
  }
  const careers: Career[] = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  console.log(`✓ Loaded ${careers.length} careers`);

  // Load DWA mappings
  console.log('📂 Loading DWA mappings...');
  const dwaMappingsPath = path.join(process.cwd(), 'data/compass/career-dwas.json');
  const dwaListPath = path.join(process.cwd(), 'data/compass/dwa-list.json');

  let careerDWAs: Record<string, string[]> = {};
  let dwaLookup: Record<string, string> = {};

  if (fs.existsSync(dwaMappingsPath) && fs.existsSync(dwaListPath)) {
    const dwaMappings = JSON.parse(fs.readFileSync(dwaMappingsPath, 'utf-8'));
    const dwaList = JSON.parse(fs.readFileSync(dwaListPath, 'utf-8'));

    // Build career -> DWA IDs mapping
    Object.values(dwaMappings.careers as Record<string, CareerDWAMapping>).forEach(mapping => {
      careerDWAs[mapping.onet_code] = mapping.dwa_ids;
    });

    // Build DWA ID -> title lookup
    dwaList.dwas.forEach((dwa: DWA) => {
      dwaLookup[dwa.id] = dwa.title;
    });

    console.log(`✓ Loaded DWA mappings for ${Object.keys(careerDWAs).length} careers`);
  } else {
    console.log('⚠ DWA mappings not found, proceeding without DWAs');
  }

  // Process careers in batches
  const BATCH_SIZE = 10; // Process 10 careers at a time
  const totalBatches = Math.ceil(careers.length / BATCH_SIZE);
  const allEmbeddings: EmbeddingData[] = [];

  let totalTokens = 0;
  const startTime = Date.now();

  console.log(`\n📊 Processing ${careers.length} careers in ${totalBatches} batches...\n`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, careers.length);
    const batch = careers.slice(batchStart, batchEnd);

    console.log(`📦 Batch ${batchIndex + 1}/${totalBatches} (careers ${batchStart + 1}-${batchEnd})`);

    // Build texts for all careers in batch
    const allTexts: string[] = [];
    const careerTextMap: { career: Career; textIndices: number[] }[] = [];

    for (const career of batch) {
      const dwaIds = careerDWAs[career.onet_code] || [];
      const dwaTexts = dwaIds.map(id => dwaLookup[id]).filter(Boolean);

      const taskText = buildTaskText(career, dwaTexts);
      const narrativeText = buildNarrativeText(career);
      const skillsText = buildSkillsText(career);
      const combinedText = buildCombinedText(career);

      const startIndex = allTexts.length;
      allTexts.push(taskText, narrativeText, skillsText, combinedText);

      careerTextMap.push({
        career,
        textIndices: [startIndex, startIndex + 1, startIndex + 2, startIndex + 3]
      });
    }

    try {
      // Generate embeddings for all texts in batch
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: allTexts,
        encoding_format: 'float'
      });

      totalTokens += response.usage.total_tokens;
      const embeddings = response.data.map(d => d.embedding);

      // Map embeddings back to careers
      for (const { career, textIndices } of careerTextMap) {
        const dwaIds = careerDWAs[career.onet_code] || [];
        const dwaTexts = dwaIds.map(id => dwaLookup[id]).filter(Boolean);

        allEmbeddings.push({
          career_slug: career.slug,
          onet_code: career.onet_code,
          title: career.title,
          category: career.category,
          task_embedding: embeddings[textIndices[0]],
          narrative_embedding: embeddings[textIndices[1]],
          skills_embedding: embeddings[textIndices[2]],
          combined_embedding: embeddings[textIndices[3]],
          median_salary: career.wages?.annual?.median || null,
          ai_resilience: career.ai_resilience || null,
          job_zone: career.job_zone,
          embedding_input: {
            task_text: buildTaskText(career, dwaTexts).slice(0, 1000),
            narrative_text: buildNarrativeText(career).slice(0, 1000),
            skills_text: buildSkillsText(career).slice(0, 1000)
          }
        });
      }

      console.log(`  ✓ Generated ${batch.length * 4} embeddings (${response.usage.total_tokens} tokens)`);

      // Rate limiting: wait between batches to avoid hitting rate limits
      if (batchIndex < totalBatches - 1) {
        await sleep(200); // 200ms between batches
      }
    } catch (error) {
      console.error(`  ❌ Error processing batch ${batchIndex + 1}:`, error);
      // Continue with next batch
      await sleep(1000);
    }
  }

  const elapsedTime = (Date.now() - startTime) / 1000;
  const costUSD = (totalTokens / 1000) * 0.00002;

  console.log(`\n✅ Embedding generation complete!`);
  console.log(`   📊 Total embeddings: ${allEmbeddings.length * 4}`);
  console.log(`   🧮 Total tokens: ${totalTokens.toLocaleString()}`);
  console.log(`   💵 Estimated cost: $${costUSD.toFixed(4)}`);
  console.log(`   ⏱️  Time: ${elapsedTime.toFixed(1)}s`);

  // Save to Supabase if configured
  if (supabase) {
    console.log('\n📤 Uploading to Supabase...');

    try {
      // Clear existing embeddings
      const { error: deleteError } = await supabase
        .from('career_embeddings')
        .delete()
        .neq('id', 0); // Delete all

      if (deleteError) {
        console.warn(`⚠ Warning: Could not clear existing embeddings: ${deleteError.message}`);
      }

      // Insert in batches
      const UPLOAD_BATCH_SIZE = 50;
      for (let i = 0; i < allEmbeddings.length; i += UPLOAD_BATCH_SIZE) {
        const batch = allEmbeddings.slice(i, i + UPLOAD_BATCH_SIZE);
        const { error } = await supabase
          .from('career_embeddings')
          .insert(batch);

        if (error) {
          console.error(`❌ Error uploading batch: ${error.message}`);
        } else {
          console.log(`  ✓ Uploaded ${i + batch.length}/${allEmbeddings.length} embeddings`);
        }
      }

      console.log('✅ Supabase upload complete!');
    } catch (error) {
      console.error('❌ Supabase upload failed:', error);
    }
  } else {
    console.log('\n⚠ Supabase not configured, saving to JSON file...');
  }

  // Always save to JSON as backup
  const outputPath = path.join(process.cwd(), 'data/compass/career-embeddings.json');
  const outputData = {
    metadata: {
      source: 'OpenAI text-embedding-3-small',
      generated_at: new Date().toISOString(),
      total_careers: allEmbeddings.length,
      total_embeddings: allEmbeddings.length * 4,
      total_tokens: totalTokens,
      cost_usd: costUSD,
      embedding_dimensions: 1536
    },
    embeddings: allEmbeddings
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\n📁 Saved to: data/compass/career-embeddings.json (${fileSizeMB} MB)`);

  console.log('\n🎉 Career embeddings generation complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
