/**
 * Update Reviews Pipeline
 *
 * Master script to fetch, enrich, and generate review data.
 *
 * Run: npx tsx scripts/update-reviews.ts
 * Options:
 *   --skip-fetch      Skip Reddit fetching (use existing raw data)
 *   --skip-enrich     Skip AI enrichment (use existing enriched data)
 *   --limit=100       Limit number of reviews to enrich
 */

import { execSync } from 'child_process';

function parseArgs(): { skipFetch: boolean; skipEnrich: boolean; limit?: number } {
  const args = process.argv.slice(2);
  let skipFetch = false;
  let skipEnrich = false;
  let limit: number | undefined;

  for (const arg of args) {
    if (arg === '--skip-fetch') {
      skipFetch = true;
    } else if (arg === '--skip-enrich') {
      skipEnrich = true;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
  }

  return { skipFetch, skipEnrich, limit };
}

async function main() {
  const { skipFetch, skipEnrich, limit } = parseArgs();

  console.log('\n========================================');
  console.log('     Reviews Update Pipeline');
  console.log('========================================\n');

  const startTime = Date.now();

  // Step 1: Fetch Reddit data
  if (!skipFetch) {
    console.log('Step 1/3: Fetching Reddit data...');
    console.log('----------------------------------------\n');
    try {
      execSync('npx tsx scripts/fetch-reddit-reviews.ts', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error('Warning: Reddit fetch encountered errors, continuing...\n');
    }
  } else {
    console.log('Step 1/3: Skipping Reddit fetch (--skip-fetch)\n');
  }

  // Step 2: Enrich with Claude
  if (!skipEnrich) {
    console.log('Step 2/3: Enriching reviews with Claude...');
    console.log('----------------------------------------\n');
    try {
      const limitArg = limit ? `--limit=${limit}` : '';
      execSync(`npx tsx scripts/enrich-reviews.ts --skip-existing ${limitArg}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
    } catch (error) {
      console.error('Warning: Enrichment encountered errors, continuing...\n');
    }
  } else {
    console.log('Step 2/3: Skipping enrichment (--skip-enrich)\n');
  }

  // Step 3: Generate index
  console.log('Step 3/3: Generating reviews index...');
  console.log('----------------------------------------\n');
  try {
    execSync('npx tsx scripts/generate-reviews-index.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('Error: Index generation failed\n');
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('     Reviews Update Complete!');
  console.log(`     Duration: ${duration}s`);
  console.log('========================================\n');
}

main().catch(console.error);
