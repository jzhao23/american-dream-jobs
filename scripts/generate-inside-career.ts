/**
 * Helper script for Inside Career content generation
 *
 * This script:
 * 1. Reads careers data and identifies those without inside_look content
 * 2. Outputs career data for content generation
 * 3. Saves generated content to MD files and JSON
 *
 * Usage:
 *   npx tsx scripts/generate-inside-career.ts --list          # List careers needing content
 *   npx tsx scripts/generate-inside-career.ts --batch N       # Get batch N (50 careers each)
 *   npx tsx scripts/generate-inside-career.ts --save          # Compile MD files to JSON
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const INSIDE_CAREER_DIR = path.join(DATA_DIR, "inside-career");
const CAREERS_FILE = path.join(DATA_DIR, "careers.generated.json");
const REVIEWS_DIR = path.join(DATA_DIR, "reviews/reviews-by-career");
const OUTPUT_JSON = path.join(INSIDE_CAREER_DIR, "inside-career.json");

interface Career {
  onet_code: string;
  soc_code: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tasks: string[];
  abilities: string[];
  ai_risk?: {
    score: number;
    rationale?: string;
  };
}

interface Review {
  id: string;
  text: string;
  score: number;
  subreddit: string;
}

// Ensure directory exists
if (!fs.existsSync(INSIDE_CAREER_DIR)) {
  fs.mkdirSync(INSIDE_CAREER_DIR, { recursive: true });
}

// Load careers
const careers: Career[] = JSON.parse(fs.readFileSync(CAREERS_FILE, "utf-8"));

// Get careers that don't have MD files yet
function getCareersNeedingContent(): Career[] {
  return careers.filter((career) => {
    const mdPath = path.join(INSIDE_CAREER_DIR, `${career.slug}.md`);
    return !fs.existsSync(mdPath);
  });
}

// Load reviews for a career
function loadReviews(slug: string): Review[] {
  const reviewsPath = path.join(REVIEWS_DIR, `${slug}.json`);
  if (fs.existsSync(reviewsPath)) {
    return JSON.parse(fs.readFileSync(reviewsPath, "utf-8"));
  }
  return [];
}

// List all careers needing content
function listCareers() {
  const needed = getCareersNeedingContent();
  console.log(`\n=== Careers Needing Inside Content ===`);
  console.log(`Total: ${needed.length} of ${careers.length} careers\n`);

  // Group by category
  const byCategory = new Map<string, number>();
  for (const c of needed) {
    byCategory.set(c.category, (byCategory.get(c.category) || 0) + 1);
  }

  for (const [cat, count] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

// Get a batch of careers for processing
function getBatch(batchNum: number, batchSize: number = 50) {
  const needed = getCareersNeedingContent();
  const start = batchNum * batchSize;
  const batch = needed.slice(start, start + batchSize);

  console.log(`\n=== Batch ${batchNum} (${batch.length} careers) ===\n`);

  for (const career of batch) {
    const reviews = loadReviews(career.slug);

    console.log(`--- ${career.title} (${career.soc_code}) ---`);
    console.log(`Slug: ${career.slug}`);
    console.log(`Category: ${career.category}`);
    console.log(`Description: ${career.description}`);
    console.log(`\nTasks:`);
    career.tasks.slice(0, 8).forEach(t => console.log(`  - ${t}`));
    console.log(`\nAbilities: ${career.abilities.slice(0, 6).join(", ")}`);

    if (reviews.length > 0) {
      console.log(`\nReddit Reviews (${reviews.length} total):`);
      reviews.slice(0, 3).forEach(r => {
        const snippet = r.text.slice(0, 300).replace(/\n/g, " ");
        console.log(`  [${r.score} upvotes] "${snippet}..."`);
      });
    }

    if (career.ai_risk) {
      console.log(`\nAI Risk: ${career.ai_risk.score}/10`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }

  console.log(`Remaining after this batch: ${needed.length - start - batch.length}`);
}

// Save a single career's content
function saveContent(slug: string, content: string) {
  const mdPath = path.join(INSIDE_CAREER_DIR, `${slug}.md`);
  fs.writeFileSync(mdPath, content);
  console.log(`Saved: ${mdPath}`);
}

// Compile all MD files to JSON
function compileToJson() {
  const output: {
    metadata: { generated_at: string; total_careers: number };
    careers: Record<string, { content: string; generated_at: string }>;
  } = {
    metadata: {
      generated_at: new Date().toISOString().split("T")[0],
      total_careers: 0,
    },
    careers: {},
  };

  const mdFiles = fs.readdirSync(INSIDE_CAREER_DIR).filter(f => f.endsWith(".md"));

  for (const file of mdFiles) {
    const slug = file.replace(".md", "");
    const career = careers.find(c => c.slug === slug);
    if (!career) continue;

    const content = fs.readFileSync(path.join(INSIDE_CAREER_DIR, file), "utf-8");
    output.careers[career.soc_code] = {
      content,
      generated_at: new Date().toISOString().split("T")[0],
    };
  }

  output.metadata.total_careers = Object.keys(output.careers).length;

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  console.log(`\nCompiled ${output.metadata.total_careers} careers to ${OUTPUT_JSON}`);
}

// Main
const args = process.argv.slice(2);

if (args.includes("--list")) {
  listCareers();
} else if (args.includes("--batch")) {
  const batchIdx = args.indexOf("--batch");
  const batchNum = parseInt(args[batchIdx + 1] || "0", 10);
  getBatch(batchNum);
} else if (args.includes("--save")) {
  compileToJson();
} else {
  console.log(`
Usage:
  npx tsx scripts/generate-inside-career.ts --list          # List careers needing content
  npx tsx scripts/generate-inside-career.ts --batch N       # Get batch N (50 careers each)
  npx tsx scripts/generate-inside-career.ts --save          # Compile MD files to JSON
  `);
}
