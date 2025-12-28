/**
 * Curate Technology Skills
 *
 * Uses Claude to review and curate technology skills for each career,
 * filtering out irrelevant items and consolidating redundant entries.
 *
 * Run: npx tsx scripts/curate-technology-skills.ts
 * Options:
 *   --limit=100        Max careers to process
 *   --resume           Resume from last processed career
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const anthropic = new Anthropic();

const DATA_DIR = path.join(process.cwd(), 'data');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
const OUTPUT_FILE = path.join(PROCESSED_DIR, 'curated-tech-skills.json');
const PROGRESS_FILE = path.join(PROCESSED_DIR, 'curate-tech-progress.json');

interface Career {
  onet_code: string;
  title: string;
  description: string;
  technology_skills: string[];
}

interface CuratedOutput {
  metadata: {
    generated_at: string;
    total_careers: number;
    model: string;
  };
  skills: Record<string, string[]>;
}

const CURATION_PROMPT = `You are curating technology skills for a career database.

Career: {title}
Description: {description}

Current technology skills (from O*NET, may include irrelevant items):
{skills}

Return 5-8 technology skills that are:
1. ACTUALLY relevant to this specific occupation (remove anything unrelated)
2. Modern and currently used (remove obsolete software like MapPoint)
3. Consolidated where appropriate (e.g., "Microsoft Office" instead of listing Word, Excel, PowerPoint separately)
4. Practical for someone entering this career today

IMPORTANT: Only return skills from or closely related to the original list. Do not invent new skills.

Format: Return ONLY a JSON array of strings, nothing else. Example:
["Microsoft Excel", "Salesforce CRM", "Python"]`;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function curateSkills(career: Career): Promise<string[]> {
  const prompt = CURATION_PROMPT
    .replace('{title}', career.title)
    .replace('{description}', career.description?.slice(0, 500) || 'No description available')
    .replace('{skills}', career.technology_skills.join(', '));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: prompt
    }],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  // Extract JSON array from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`  Warning: No JSON array in response for ${career.title}`);
    return career.technology_skills.slice(0, 8); // Fallback to first 8
  }

  try {
    const skills = JSON.parse(jsonMatch[0]) as string[];
    return skills.slice(0, 8); // Ensure max 8
  } catch {
    console.error(`  Warning: Failed to parse JSON for ${career.title}`);
    return career.technology_skills.slice(0, 8);
  }
}

function parseArgs(): { limit: number; resume: boolean } {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let resume = false;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--resume') {
      resume = true;
    }
  }

  return { limit, resume };
}

function loadProgress(): Set<string> {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    return new Set(data.processed || []);
  }
  return new Set();
}

function saveProgress(processed: Set<string>): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    processed: Array.from(processed),
    updated_at: new Date().toISOString()
  }, null, 2));
}

function loadExistingOutput(): CuratedOutput {
  if (fs.existsSync(OUTPUT_FILE)) {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  return {
    metadata: {
      generated_at: new Date().toISOString(),
      total_careers: 0,
      model: 'claude-sonnet-4-20250514'
    },
    skills: {}
  };
}

function saveOutput(output: CuratedOutput): void {
  output.metadata.generated_at = new Date().toISOString();
  output.metadata.total_careers = Object.keys(output.skills).length;
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
}

async function main() {
  console.log('\n=== Curating Technology Skills with Claude ===\n');

  const { limit, resume } = parseArgs();

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.');
    console.log('\nTo use this script:');
    console.log('1. Get an API key from https://console.anthropic.com');
    console.log('2. Set the environment variable:');
    console.log('   export ANTHROPIC_API_KEY=your_api_key\n');
    process.exit(1);
  }

  // Load careers data
  const careersPath = path.join(DATA_DIR, 'careers.generated.json');
  if (!fs.existsSync(careersPath)) {
    console.error(`Error: Careers file not found at ${careersPath}`);
    process.exit(1);
  }

  const careers: Career[] = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
  const careersWithSkills = careers.filter(c => c.technology_skills && c.technology_skills.length > 0);
  console.log(`Found ${careersWithSkills.length} careers with technology skills\n`);

  // Load progress if resuming
  const processed = resume ? loadProgress() : new Set<string>();
  const output = resume ? loadExistingOutput() : {
    metadata: {
      generated_at: new Date().toISOString(),
      total_careers: 0,
      model: 'claude-sonnet-4-20250514'
    },
    skills: {}
  };

  if (resume && processed.size > 0) {
    console.log(`Resuming from ${processed.size} already processed careers\n`);
  }

  // Filter to careers not yet processed
  const toProcess = careersWithSkills
    .filter(c => !processed.has(c.onet_code))
    .slice(0, limit);

  console.log(`Processing ${toProcess.length} careers...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const career = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      console.log(`${progress} ${career.title}...`);

      const curatedSkills = await curateSkills(career);

      // Log the change
      const originalCount = career.technology_skills.length;
      const newCount = curatedSkills.length;
      console.log(`  ${originalCount} → ${newCount} skills`);

      // Save result
      output.skills[career.onet_code] = curatedSkills;
      processed.add(career.onet_code);
      successCount++;

      // Save progress every 10 careers
      if (successCount % 10 === 0) {
        saveProgress(processed);
        saveOutput(output);
        console.log(`  [Progress saved: ${processed.size} careers]\n`);
      }

      // Rate limiting - wait between requests
      await sleep(500);

    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;

      // If too many errors, stop
      if (errorCount > 10) {
        console.error('\nToo many errors, stopping. Run with --resume to continue.\n');
        break;
      }

      await sleep(2000); // Longer wait after error
    }
  }

  // Final save
  saveProgress(processed);
  saveOutput(output);

  console.log('\n=== Curation Complete ===');
  console.log(`Processed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total curated: ${Object.keys(output.skills).length}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  // Generate sample diff
  console.log('=== Sample Changes ===\n');
  const samples = Object.entries(output.skills).slice(0, 3);
  for (const [code, skills] of samples) {
    const original = careers.find(c => c.onet_code === code);
    if (original) {
      console.log(`${original.title}:`);
      console.log(`  Before (${original.technology_skills.length}): ${original.technology_skills.slice(0, 5).join(', ')}...`);
      console.log(`  After (${skills.length}): ${skills.join(', ')}\n`);
    }
  }
}

main().catch(console.error);
