import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Career {
  slug: string;
  title: string;
  category: string;
  description: string;
  tasks: string[];
  technology_skills: string[];
  abilities: string[];
  inside_look?: { content: string };
}

interface CareerEmbedding {
  slug: string;
  title: string;
  category: string;
  task_embedding: number[];
  narrative_embedding: number[];
  skills_embedding: number[];
}

async function generateEmbeddings() {
  console.log('🚀 Starting Career Embeddings Generation...\n');

  console.log('📂 Loading careers data...');
  const careers: Career[] = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'data/careers.generated.json'),
      'utf-8'
    )
  );

  console.log(`✓ Loaded ${careers.length} careers\n`);

  // Create embeddings directory if it doesn't exist
  const embeddingsDir = path.join(process.cwd(), 'data/embeddings');
  if (!fs.existsSync(embeddingsDir)) {
    fs.mkdirSync(embeddingsDir, { recursive: true });
    console.log(`✓ Created embeddings directory: ${embeddingsDir}\n`);
  }

  const embeddings: Record<string, CareerEmbedding> = {};
  const BATCH_SIZE = 100; // OpenAI allows batching
  const totalBatches = Math.ceil(careers.length / BATCH_SIZE);

  console.log(`📊 Processing ${careers.length} careers in ${totalBatches} batches...\n`);

  for (let i = 0; i < careers.length; i += BATCH_SIZE) {
    const batch = careers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i/BATCH_SIZE) + 1;

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (careers ${i + 1}-${Math.min(i + BATCH_SIZE, careers.length)})`);

    // Prepare text for each embedding type
    const taskTexts = batch.map(c => {
      if (!c.tasks || c.tasks.length === 0) {
        return c.description || 'No task information available';
      }
      return c.tasks.join(' ');
    });

    const narrativeTexts = batch.map(c => {
      if (c.inside_look?.content) {
        // Truncate to 8000 chars to stay within token limits
        return c.inside_look.content.slice(0, 8000);
      }
      return c.description || 'No narrative available';
    });

    const skillTexts = batch.map(c => {
      const skills = [
        ...(c.technology_skills || []),
        ...(c.abilities || [])
      ];
      return skills.length > 0 ? skills.join(', ') : 'General skills required';
    });

    // Generate embeddings (parallel requests)
    try {
      console.log('  ⚡ Generating task embeddings...');
      const taskEmbs = await embedBatch(taskTexts);

      console.log('  ⚡ Generating narrative embeddings...');
      const narrativeEmbs = await embedBatch(narrativeTexts);

      console.log('  ⚡ Generating skills embeddings...');
      const skillEmbs = await embedBatch(skillTexts);

      // Store results
      batch.forEach((career, idx) => {
        embeddings[career.slug] = {
          slug: career.slug,
          title: career.title,
          category: career.category,
          task_embedding: taskEmbs[idx],
          narrative_embedding: narrativeEmbs[idx],
          skills_embedding: skillEmbs[idx]
        };
      });

      console.log(`  ✓ Completed ${Math.min(i + BATCH_SIZE, careers.length)}/${careers.length} careers`);

    } catch (error) {
      console.error(`  ❌ Error processing batch ${batchNum}:`, error);
      throw error;
    }
  }

  // Save to file
  console.log('\n💾 Saving embeddings to file...');

  const output = {
    metadata: {
      model: 'text-embedding-3-small',
      dimensions: 1536,
      generated_at: new Date().toISOString(),
      total_careers: careers.length,
      embedding_strategy: 'multi-field',
      weights: { task: 0.5, narrative: 0.3, skills: 0.2 },
      description: 'Each career has 3 separate embeddings: task (what you do), narrative (work culture/environment), and skills (concrete abilities)'
    },
    embeddings
  };

  const outputPath = path.join(embeddingsDir, 'career-embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ Success! Embeddings generated and saved.`);
  console.log(`   📁 File: ${outputPath}`);
  console.log(`   📊 Size: ${fileSizeMB} MB`);
  console.log(`   🎯 Careers: ${careers.length}`);
  console.log(`   🧮 Total vectors: ${careers.length * 3}`);
  console.log(`\n🎉 Ready to use for Career Compass matching!`);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float'
  });
  return response.data.map(d => d.embedding);
}

// Run script
generateEmbeddings().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
