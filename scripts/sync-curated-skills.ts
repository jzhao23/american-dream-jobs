/**
 * Sync Curated Skills
 *
 * Parses all markdown files in docs/curated-tech-skills/ and generates
 * a combined JSON file for use by generate-final.ts
 *
 * Run: npx tsx scripts/sync-curated-skills.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs', 'curated-tech-skills');
const OUTPUT_FILE = path.join(DOCS_DIR, '_combined.json');

interface CuratedData {
  metadata: {
    generated_at: string;
    total_careers: number;
    source: string;
  };
  skills: Record<string, string[]>;
}

function parseMarkdownFile(filePath: string): Record<string, string[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const skills: Record<string, string[]> = {};

  // Match patterns like "## Career Title (XX-XXXX.00)" followed by "**Curated (N items):** skill1, skill2, ..."
  const careerPattern = /##\s+.+?\((\d{2}-\d{4}\.\d{2})\)[\s\S]*?\*\*Curated\s+\(\d+\s+items?\):\*\*\s*([^\n]+)/g;

  let match;
  while ((match = careerPattern.exec(content)) !== null) {
    const onetCode = match[1];
    const skillsText = match[2].trim();

    // Parse skills - split by comma but handle parentheses
    const parsedSkills = parseSkillsList(skillsText);

    if (parsedSkills.length > 0) {
      skills[onetCode] = parsedSkills;
    }
  }

  return skills;
}

function parseSkillsList(skillsText: string): string[] {
  const skills: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (const char of skillsText) {
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      const skill = current.trim();
      if (skill) {
        skills.push(skill);
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last skill
  const lastSkill = current.trim();
  if (lastSkill) {
    skills.push(lastSkill);
  }

  return skills;
}

function main() {
  console.log('\n=== Syncing Curated Technology Skills ===\n');

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: Directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  const allSkills: Record<string, string[]> = {};
  let fileCount = 0;

  // Read all markdown files
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    console.log(`Processing: ${file}`);

    const fileSkills = parseMarkdownFile(filePath);
    const careerCount = Object.keys(fileSkills).length;

    console.log(`  Found ${careerCount} careers`);

    Object.assign(allSkills, fileSkills);
    fileCount++;
  }

  // Generate output
  const output: CuratedData = {
    metadata: {
      generated_at: new Date().toISOString(),
      total_careers: Object.keys(allSkills).length,
      source: 'docs/curated-tech-skills/*.md'
    },
    skills: allSkills
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log('\n=== Sync Complete ===');
  console.log(`Files processed: ${fileCount}`);
  console.log(`Total careers: ${Object.keys(allSkills).length}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  // Show sample
  console.log('Sample entries:');
  const sampleCodes = Object.keys(allSkills).slice(0, 3);
  for (const code of sampleCodes) {
    console.log(`  ${code}: ${allSkills[code].slice(0, 3).join(', ')}...`);
  }
  console.log('');
}

main();
