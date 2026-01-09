/**
 * Generate Consolidated Career Content
 *
 * This script generates neutral, category-level descriptions and inside_look content
 * for consolidated careers using Claude API. The generated content is stored in
 * data/consolidation/career-content.json for use by the consolidation script.
 *
 * Run: npx tsx scripts/generate-consolidated-content.ts
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY in .env.local
 * - career-definitions.json exists
 * - specializations.json exists (from prior consolidation run)
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types
interface CareerDefinition {
  id: string;
  title: string;
  category: string;
  groupingStrategy: string;
  displayStrategy: string;
  specializationLabel?: string;
  primaryOnetCode: string;
  onetCodes: string[];
  description: string;
  keywords: string[];
}

interface DefinitionsFile {
  version: string;
  careers: Record<string, CareerDefinition>;
}

interface Specialization {
  slug: string;
  title: string;
  description: string;
  onet_code?: string;
  tasks?: string[];
  technology_skills?: string[];
  inside_look?: { content: string };
}

interface CareerContent {
  description: string;
  inside_look: {
    content: string;
  };
  generated_at: string;
  specialization_count: number;
  model: string;
}

interface ContentFile {
  version: string;
  description: string;
  lastUpdated: string;
  careers: Record<string, CareerContent>;
}

// Rate limiting helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate neutral description for a consolidated career
async function generateDescription(
  title: string,
  category: string,
  specializations: Specialization[]
): Promise<string> {
  const specList = specializations.map(s => `- ${s.title}: ${s.description?.slice(0, 200) || 'No description'}`).join('\n');
  const topTasks = specializations
    .flatMap(s => s.tasks?.slice(0, 3) || [])
    .slice(0, 10)
    .join('\n- ');

  const prompt = `You are writing career descriptions for a job exploration website aimed at Americans considering career changes or starting their careers.

Write a concise 2-3 sentence description for the career category "${title}" that encompasses ${specializations.length} specializations.

The specializations include:
${specList}

Common tasks across these specializations include:
- ${topTasks}

Requirements:
1. Write in third person (e.g., "These professionals..." not "You will...")
2. Be neutral and factual - don't favor any specific specialization
3. Focus on what they do and where they work
4. Keep it between 40-60 words (2-3 sentences only)
5. Don't mention specific salary figures
6. No paragraph breaks - just 2-3 flowing sentences

Return ONLY the description text, no headers or formatting.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || '';
}

// Generate neutral inside_look content for a consolidated career
async function generateInsideLook(
  title: string,
  category: string,
  specializations: Specialization[]
): Promise<string> {
  // Gather existing inside_look content for context
  const existingContent = specializations
    .filter(s => s.inside_look?.content)
    .map(s => `${s.title}: ${s.inside_look?.content.slice(0, 300)}...`)
    .slice(0, 3)
    .join('\n\n');

  const prompt = `You are writing "A Day in the Life" style content for a career category on a job exploration website.

Write engaging, neutral content describing a typical day for professionals in the "${title}" category, which encompasses ${specializations.length} different specializations.

${existingContent ? `Here's context from individual specializations:\n${existingContent}\n\n` : ''}

The specializations in this category include: ${specializations.map(s => s.title).join(', ')}.

Requirements:
1. Write 2-3 paragraphs describing typical work activities
2. Be general enough to apply across specializations, but specific enough to be interesting
3. Include variety - mention different work environments, types of projects, collaboration
4. Write in third person
5. Keep it between 200-300 words
6. Focus on the work itself, not career advice

Return ONLY the content text, no headers or formatting.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || '';
}

// Main function
async function main() {
  console.log('\n🚀 Starting Consolidated Content Generation...\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Missing ANTHROPIC_API_KEY in .env.local');
    process.exit(1);
  }

  // Load career definitions
  const defsPath = path.join(process.cwd(), 'data/consolidation/career-definitions.json');
  if (!fs.existsSync(defsPath)) {
    console.error('❌ career-definitions.json not found. Run generate-career-definitions.ts first.');
    process.exit(1);
  }
  const definitions: DefinitionsFile = JSON.parse(fs.readFileSync(defsPath, 'utf-8'));
  console.log(`✓ Loaded ${Object.keys(definitions.careers).length} career definitions`);

  // Load specializations
  const specsPath = path.join(process.cwd(), 'data/output/specializations.json');
  if (!fs.existsSync(specsPath)) {
    console.error('❌ specializations.json not found. Run consolidate-careers.ts first.');
    process.exit(1);
  }
  const allSpecs: Specialization[] = JSON.parse(fs.readFileSync(specsPath, 'utf-8'));
  console.log(`✓ Loaded ${allSpecs.length} specializations`);

  // Create lookup map for specializations by O*NET code
  const specByOnet = new Map<string, Specialization>();
  allSpecs.forEach(s => {
    if (s.onet_code) {
      specByOnet.set(s.onet_code, s);
    }
  });

  // Load existing content file if it exists
  const contentPath = path.join(process.cwd(), 'data/consolidation/career-content.json');
  let existingContent: ContentFile = {
    version: '1.0',
    description: 'AI-generated neutral content for consolidated careers',
    lastUpdated: new Date().toISOString().split('T')[0],
    careers: {},
  };
  if (fs.existsSync(contentPath)) {
    existingContent = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    console.log(`✓ Loaded existing content for ${Object.keys(existingContent.careers).length} careers`);
  }

  // Filter to careers that need content generation
  const careersToProcess = Object.entries(definitions.careers)
    .filter(([id, def]) => {
      // Only process consolidated careers with multiple specializations
      if (def.onetCodes.length <= 1) return false;
      // Skip if we already have content
      if (existingContent.careers[id]) return false;
      return true;
    });

  console.log(`\n📊 Processing ${careersToProcess.length} careers that need content...\n`);

  if (careersToProcess.length === 0) {
    console.log('✅ All careers already have content!');
    return;
  }

  let processed = 0;
  let errors = 0;

  for (const [id, definition] of careersToProcess) {
    console.log(`📝 [${processed + 1}/${careersToProcess.length}] Generating content for: ${definition.title}`);

    // Get specializations for this career
    const specs = definition.onetCodes
      .map(code => specByOnet.get(code))
      .filter((s): s is Specialization => s !== undefined);

    if (specs.length === 0) {
      console.log(`   ⚠ No specializations found, skipping`);
      errors++;
      continue;
    }

    try {
      // Generate description
      const description = await generateDescription(definition.title, definition.category, specs);
      await sleep(500); // Rate limiting

      // Generate inside_look
      const insideLook = await generateInsideLook(definition.title, definition.category, specs);
      await sleep(500); // Rate limiting

      // Store content
      existingContent.careers[id] = {
        description,
        inside_look: { content: insideLook },
        generated_at: new Date().toISOString(),
        specialization_count: specs.length,
        model: 'claude-sonnet-4-20250514',
      };

      console.log(`   ✓ Generated ${description.length} chars description, ${insideLook.length} chars inside_look`);
      processed++;

      // Save progress every 10 careers
      if (processed % 10 === 0) {
        existingContent.lastUpdated = new Date().toISOString().split('T')[0];
        fs.writeFileSync(contentPath, JSON.stringify(existingContent, null, 2));
        console.log(`   💾 Progress saved (${processed} careers)`);
      }
    } catch (error) {
      console.error(`   ❌ Error generating content: ${error}`);
      errors++;
      await sleep(2000); // Wait longer after error
    }
  }

  // Save final content
  existingContent.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(contentPath, JSON.stringify(existingContent, null, 2));

  console.log('\n✅ Content generation complete!');
  console.log(`   📊 Processed: ${processed}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📁 Saved to: ${contentPath}`);
  console.log(`   📋 Total careers with content: ${Object.keys(existingContent.careers).length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
