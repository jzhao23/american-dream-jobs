/**
 * Career Data Ingestion Script
 *
 * Fetches career data from CareerOneStop API and generates static JSON files
 * for the Next.js build process.
 *
 * Usage:
 *   npm run fetch-careers          # Use cached data if available
 *   npm run fetch-careers:refresh  # Force refresh from API
 *
 * Required environment variables:
 *   COS_API_KEY  - CareerOneStop API key
 *   COS_USER_ID  - CareerOneStop user ID
 */

import * as fs from "fs";
import * as path from "path";
import {
  type Career,
  type CareerIndex,
  type Category,
  type TrainingTime,
  type Level,
  CareerSchema,
  CareersArraySchema,
} from "../src/types/career";

// Configuration
const COS_BASE_URL = "https://api.careeronestop.org";
const CACHE_DIR = path.join(process.cwd(), "data", "cache", "careeronestop");
const OUTPUT_FILE = path.join(process.cwd(), "data", "careers.generated.json");
const INDEX_FILE = path.join(process.cwd(), "data", "careers-index.json");
// Note: This seed file contains O*NET source codes for data generation.
// The slugs here do NOT match the final website URLs (careers are consolidated during processing).
// For actual website career slugs, see data/output/careers-index.json
const SEED_FILE = path.join(process.cwd(), "data", "pipeline_seed_careers.json");

// Rate limiting
const CONCURRENCY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

interface SeedCareer {
  slug: string;
  title: string;
  onetCode: string;
  category: Category;
  flagship?: boolean;
}

interface COSOccupationResponse {
  OnetTitle?: string;
  OnetDescription?: string;
  OnetCode?: string;
  Tasks?: string[];
  Wages?: {
    NationalWagesList?: Array<{
      Pct10?: number;
      Pct25?: number;
      Median?: number;
      Pct75?: number;
      Pct90?: number;
    }>;
  };
  EducationTraining?: {
    EducationType?: string;
    ExperienceRequired?: string;
  };
  BrightOutlook?: boolean;
  Green?: boolean;
  Projections?: {
    PercentChange?: number;
  };
}

// Check if we should refresh data
const shouldRefresh = process.argv.includes("--refresh");

// Ensure cache directory exists
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Get cache file path for an endpoint
function getCachePath(endpoint: string, key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9-]/g, "_");
  return path.join(CACHE_DIR, `${endpoint}-${safeKey}.json`);
}

// Read from cache
function readCache<T>(endpoint: string, key: string): T | null {
  const cachePath = getCachePath(endpoint, key);
  if (fs.existsSync(cachePath) && !shouldRefresh) {
    try {
      const data = fs.readFileSync(cachePath, "utf-8");
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return null;
}

// Write to cache
function writeCache<T>(endpoint: string, key: string, data: T): void {
  ensureCacheDir();
  const cachePath = getCachePath(endpoint, key);
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch with retry and exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 || response.status >= 500) {
        if (i < retries - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, i);
          console.log(`  Rate limited or server error, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }
      return response;
    } catch (error) {
      if (i < retries - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, i);
        console.log(`  Network error, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

// Fetch occupation details from CareerOneStop
async function fetchOccupationDetails(
  onetCode: string,
  apiKey: string,
  userId: string
): Promise<COSOccupationResponse | null> {
  // Check cache first
  const cached = readCache<COSOccupationResponse>("occupation", onetCode);
  if (cached) {
    return cached;
  }

  const url = `${COS_BASE_URL}/v1/occupation/${userId}/${onetCode}/US`;

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`  Failed to fetch ${onetCode}: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as COSOccupationResponse;
    writeCache("occupation", onetCode, data);
    return data;
  } catch (error) {
    console.error(`  Error fetching ${onetCode}:`, error);
    return null;
  }
}

// Map education type to training time enum
function mapEducationToTrainingTime(education?: string): TrainingTime {
  if (!education) return "6-24mo";

  const lower = education.toLowerCase();

  if (
    lower.includes("less than high school") ||
    lower.includes("no formal") ||
    lower.includes("short-term")
  ) {
    return "<6mo";
  }
  if (
    lower.includes("high school") ||
    lower.includes("some college") ||
    lower.includes("moderate-term")
  ) {
    return "6-24mo";
  }
  if (
    lower.includes("associate") ||
    lower.includes("postsecondary") ||
    lower.includes("apprenticeship")
  ) {
    return "2-4yr";
  }
  if (
    lower.includes("bachelor") ||
    lower.includes("master") ||
    lower.includes("doctoral")
  ) {
    return "4+yr";
  }

  return "6-24mo";
}

// Estimate AI resilience based on occupation characteristics
function estimateAIResilience(
  tasks: string[],
  title: string
): { level: Level; rationale: string[] } {
  const rationale: string[] = [];
  let score = 0;

  // Physical/manual work indicators
  const physicalKeywords = [
    "install",
    "repair",
    "operate",
    "maintain",
    "construct",
    "assemble",
    "inspect",
    "physical",
    "hands-on",
    "manual",
    "lift",
    "climb",
    "weld",
    "plumb",
    "wire",
  ];

  // Human interaction indicators
  const humanKeywords = [
    "patient",
    "customer",
    "client",
    "communicate",
    "negotiate",
    "care",
    "treat",
    "counsel",
    "teach",
    "supervise",
  ];

  // Unpredictable environment indicators
  const unpredictableKeywords = [
    "emergency",
    "troubleshoot",
    "diagnose",
    "adapt",
    "custom",
    "variable",
    "site",
    "field",
  ];

  const taskText = tasks.join(" ").toLowerCase();
  const titleLower = title.toLowerCase();

  // Check for physical work
  const physicalMatches = physicalKeywords.filter(
    (k) => taskText.includes(k) || titleLower.includes(k)
  );
  if (physicalMatches.length >= 3) {
    score += 2;
    rationale.push("Requires hands-on physical work that robots cannot easily replicate");
  } else if (physicalMatches.length >= 1) {
    score += 1;
    rationale.push("Involves some physical tasks");
  }

  // Check for human interaction
  const humanMatches = humanKeywords.filter(
    (k) => taskText.includes(k) || titleLower.includes(k)
  );
  if (humanMatches.length >= 2) {
    score += 2;
    rationale.push("Requires direct human interaction and relationship building");
  } else if (humanMatches.length >= 1) {
    score += 1;
    rationale.push("Involves some human interaction");
  }

  // Check for unpredictable environments
  const unpredictableMatches = unpredictableKeywords.filter(
    (k) => taskText.includes(k) || titleLower.includes(k)
  );
  if (unpredictableMatches.length >= 2) {
    score += 1;
    rationale.push("Works in variable, unpredictable environments");
  }

  // Determine level
  let level: Level;
  if (score >= 4) {
    level = "high";
    if (rationale.length === 0) {
      rationale.push("This role requires physical presence and human judgment");
    }
  } else if (score >= 2) {
    level = "medium";
    if (rationale.length === 0) {
      rationale.push("Some aspects of this role may be augmented by AI");
    }
  } else {
    level = "low";
    if (rationale.length === 0) {
      rationale.push("This role may face significant automation pressure");
    }
  }

  return { level, rationale };
}

// Estimate importance to America based on occupation
function estimateImportance(
  title: string,
  category: Category
): { level: Level; rationale: string[] } {
  const rationale: string[] = [];
  let level: Level = "medium";

  const titleLower = title.toLowerCase();

  // Infrastructure critical roles
  if (
    titleLower.includes("power") ||
    titleLower.includes("electric") ||
    titleLower.includes("water") ||
    titleLower.includes("air traffic") ||
    titleLower.includes("linework")
  ) {
    level = "high";
    rationale.push("Critical infrastructure that keeps America running");
    rationale.push("Directly supports national security and public safety");
  }
  // Healthcare roles
  else if (category === "healthcare") {
    level = "high";
    rationale.push("Essential for public health and community wellbeing");
    rationale.push("Aging population increases demand for healthcare workers");
  }
  // Trades that build physical infrastructure
  else if (
    titleLower.includes("construct") ||
    titleLower.includes("carpenter") ||
    titleLower.includes("plumb") ||
    titleLower.includes("hvac") ||
    titleLower.includes("welder")
  ) {
    level = "high";
    rationale.push("Builds and maintains America's physical infrastructure");
    rationale.push("Cannot be outsourced overseas");
  }
  // Transportation
  else if (titleLower.includes("truck") || titleLower.includes("transport")) {
    level = "high";
    rationale.push("Keeps supply chains moving across the country");
    rationale.push("Essential for commerce and daily life");
  }
  // Technology roles
  else if (category === "technology") {
    level = "medium";
    rationale.push("Supports America's digital infrastructure");
    rationale.push("Growing demand as technology becomes more essential");
  }
  // Default
  else {
    rationale.push("Contributes to the American economy");
  }

  return { level, rationale };
}

// Generate day-to-day description from tasks
function generateDayToDay(tasks: string[]): string[] {
  if (!tasks || tasks.length === 0) {
    return ["Daily tasks vary based on specific role and employer"];
  }

  // Take top 5 tasks and clean them up
  return tasks.slice(0, 5).map((task) => {
    // Clean up task text
    let cleaned = task.trim();
    // Ensure it ends with a period
    if (!cleaned.endsWith(".")) {
      cleaned += ".";
    }
    return cleaned;
  });
}

// Generate entry paths based on education and training
function generateEntryPaths(education?: string): string[] {
  const paths: string[] = [];

  if (!education) {
    paths.push("High school diploma or equivalent typically required");
    paths.push("On-the-job training often available");
    return paths;
  }

  const lower = education.toLowerCase();

  if (lower.includes("apprenticeship")) {
    paths.push("Complete a registered apprenticeship program (typically 3-5 years)");
    paths.push("Combine paid on-the-job training with classroom instruction");
  }

  if (lower.includes("certificate") || lower.includes("postsecondary")) {
    paths.push("Complete a postsecondary certificate program");
    paths.push("Programs available at community colleges and trade schools");
  }

  if (lower.includes("associate")) {
    paths.push("Earn an associate degree from an accredited program");
    paths.push("Typical program length is 2 years");
  }

  if (lower.includes("bachelor")) {
    paths.push("Earn a bachelor's degree in a related field");
    paths.push("Typical program length is 4 years");
  }

  if (paths.length === 0) {
    paths.push("High school diploma or equivalent typically required");
    paths.push("Additional training or certification may be beneficial");
  }

  return paths;
}

// Generate wage progression
function generateWageProgression(
  wages: COSOccupationResponse["Wages"]
): string[] {
  const progression: string[] = [];
  const nationalWages = wages?.NationalWagesList?.[0];

  if (!nationalWages) {
    return ["Wages vary by location, experience, and employer"];
  }

  if (nationalWages.Pct10) {
    progression.push(`Entry level (10th percentile): $${nationalWages.Pct10.toLocaleString()}/year`);
  }
  if (nationalWages.Pct25) {
    progression.push(`Early career (25th percentile): $${nationalWages.Pct25.toLocaleString()}/year`);
  }
  if (nationalWages.Median) {
    progression.push(`Mid-career (median): $${nationalWages.Median.toLocaleString()}/year`);
  }
  if (nationalWages.Pct75) {
    progression.push(`Experienced (75th percentile): $${nationalWages.Pct75.toLocaleString()}/year`);
  }
  if (nationalWages.Pct90) {
    progression.push(`Top earners (90th percentile): $${nationalWages.Pct90.toLocaleString()}/year`);
  }

  return progression;
}

// Generate good fit / bad fit
function generateFitCriteria(
  tasks: string[],
  category: Category
): { goodFit: string[]; badFit: string[] } {
  const goodFit: string[] = [];
  const badFit: string[] = [];

  // Category-specific traits
  switch (category) {
    case "trades":
      goodFit.push("Enjoy working with your hands");
      goodFit.push("Like solving practical problems");
      goodFit.push("Comfortable with physical work");
      badFit.push("Prefer desk work");
      badFit.push("Uncomfortable with heights, confined spaces, or outdoor conditions");
      break;
    case "healthcare":
      goodFit.push("Genuinely care about helping others");
      goodFit.push("Can remain calm under pressure");
      goodFit.push("Good at communicating with diverse people");
      badFit.push("Uncomfortable around illness or bodily fluids");
      badFit.push("Struggle with irregular hours or shift work");
      break;
    case "operations":
      goodFit.push("Reliable and safety-conscious");
      goodFit.push("Comfortable with routine and procedures");
      goodFit.push("Can stay focused during long shifts");
      badFit.push("Easily bored by repetitive tasks");
      badFit.push("Prefer creative or highly variable work");
      break;
    case "technology":
      goodFit.push("Enjoy problem-solving and troubleshooting");
      goodFit.push("Willing to continuously learn new technologies");
      goodFit.push("Detail-oriented and systematic");
      badFit.push("Frustrated by rapid change");
      badFit.push("Prefer face-to-face over screen time");
      break;
    default:
      goodFit.push("Reliable and motivated");
      badFit.push("Looking for highly creative work");
  }

  return { goodFit, badFit };
}

// Process a single career
async function processCareer(
  seed: SeedCareer,
  apiKey: string,
  userId: string
): Promise<Career | null> {
  console.log(`Processing: ${seed.title}`);

  const occupationData = await fetchOccupationDetails(
    seed.onetCode,
    apiKey,
    userId
  );

  const today = new Date().toISOString().split("T")[0];
  const tasks = occupationData?.Tasks || [];
  const education = occupationData?.EducationTraining?.EducationType;
  const nationalWages = occupationData?.Wages?.NationalWagesList?.[0];
  const medianPay = nationalWages?.Median || 50000;

  const aiResilience = estimateAIResilience(tasks, seed.title);
  const importance = estimateImportance(seed.title, seed.category);
  const { goodFit, badFit } = generateFitCriteria(tasks, seed.category);

  const career: Career = {
    title: seed.title,
    slug: seed.slug,
    onetCode: seed.onetCode,
    category: seed.category,
    median_pay: medianPay,
    pay_range: nationalWages
      ? [nationalWages.Pct10 || medianPay * 0.6, nationalWages.Pct90 || medianPay * 1.5]
      : undefined,
    training_time: mapEducationToTrainingTime(education),
    description: occupationData?.OnetDescription,
    entry_paths: generateEntryPaths(education),
    day_to_day: generateDayToDay(tasks),
    wage_progression: generateWageProgression(occupationData?.Wages),
    ai_resilience: aiResilience,
    importance: importance,
    good_fit: goodFit,
    bad_fit: badFit,
    sources: [
      {
        label: "CareerOneStop",
        url: `https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=${seed.onetCode}`,
        retrieved_at: today,
      },
      {
        label: "O*NET OnLine",
        url: `https://www.onetonline.org/link/summary/${seed.onetCode}`,
        retrieved_at: today,
      },
    ],
    last_updated: today,
    confidence_label: "ai-draft",
    outlook: occupationData?.BrightOutlook ? "Bright Outlook" : undefined,
    growth_rate: occupationData?.Projections?.PercentChange,
  };

  // Validate with Zod
  const result = CareerSchema.safeParse(career);
  if (!result.success) {
    console.error(`  Validation failed for ${seed.slug}:`, result.error.errors);
    return null;
  }

  return career;
}

// Process careers with concurrency limit
async function processCareersWithLimit(
  seeds: SeedCareer[],
  apiKey: string,
  userId: string
): Promise<Career[]> {
  const careers: Career[] = [];
  const chunks: SeedCareer[][] = [];

  // Split into chunks for concurrency control
  for (let i = 0; i < seeds.length; i += CONCURRENCY_LIMIT) {
    chunks.push(seeds.slice(i, i + CONCURRENCY_LIMIT));
  }

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map((seed) => processCareer(seed, apiKey, userId))
    );

    for (const career of results) {
      if (career) {
        careers.push(career);
      }
    }

    // Small delay between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await sleep(500);
    }
  }

  return careers;
}

// Generate index file (lightweight version for explorer)
function generateIndex(careers: Career[]): CareerIndex[] {
  return careers.map((career) => ({
    title: career.title,
    slug: career.slug,
    category: career.category,
    median_pay: career.median_pay,
    training_time: career.training_time,
    ai_resilience: career.ai_resilience?.level || "medium",
    importance: career.importance?.level || "medium",
    description: career.description?.substring(0, 200),
  }));
}

// Main function
async function main(): Promise<void> {
  console.log("\n=== Career Data Ingestion ===\n");

  const apiKey = process.env.COS_API_KEY;
  const userId = process.env.COS_USER_ID;

  // Load seed careers
  if (!fs.existsSync(SEED_FILE)) {
    console.error("Error: pipeline_seed_careers.json not found");
    process.exit(1);
  }

  const seeds: SeedCareer[] = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
  console.log(`Loaded ${seeds.length} seed careers`);

  let careers: Career[];

  if (!apiKey || !userId) {
    console.log("\nWarning: COS_API_KEY or COS_USER_ID not set");
    console.log("Generating careers from seed data with estimated values...\n");

    // Generate careers from seed data without API calls
    careers = seeds.map((seed) => {
      const today = new Date().toISOString().split("T")[0];
      const estimatedPay = getEstimatedPay(seed.category);
      const aiResilience = estimateAIResilience([], seed.title);
      const importance = estimateImportance(seed.title, seed.category);
      const { goodFit, badFit } = generateFitCriteria([], seed.category);

      return {
        title: seed.title,
        slug: seed.slug,
        onetCode: seed.onetCode,
        category: seed.category,
        median_pay: estimatedPay,
        training_time: getEstimatedTrainingTime(seed.category) as TrainingTime,
        entry_paths: [
          "Training requirements vary by employer and state",
          "Contact local trade schools or community colleges for programs",
        ],
        day_to_day: ["Daily tasks vary based on specific role and employer"],
        wage_progression: [
          `Entry level: ~$${Math.round(estimatedPay * 0.7).toLocaleString()}/year`,
          `Mid-career: ~$${estimatedPay.toLocaleString()}/year`,
          `Experienced: ~$${Math.round(estimatedPay * 1.3).toLocaleString()}/year`,
        ],
        ai_resilience: aiResilience,
        importance: importance,
        good_fit: goodFit,
        bad_fit: badFit,
        sources: [
          {
            label: "O*NET OnLine",
            url: `https://www.onetonline.org/link/summary/${seed.onetCode}`,
            retrieved_at: today,
          },
        ],
        last_updated: today,
        confidence_label: "ai-draft" as const,
      };
    });
  } else {
    console.log("Using CareerOneStop API...\n");
    careers = await processCareersWithLimit(seeds, apiKey, userId);
  }

  // Validate all careers
  const validationResult = CareersArraySchema.safeParse(careers);
  if (!validationResult.success) {
    console.error("\nValidation errors:");
    console.error(validationResult.error.errors);
    process.exit(1);
  }

  // Check required minimum
  const missingPayCount = careers.filter((c) => !c.median_pay).length;
  if (missingPayCount / careers.length > 0.2) {
    console.error(`\nError: More than 20% of careers missing median_pay`);
    process.exit(1);
  }

  // Generate index
  const index = generateIndex(careers);

  // Write output files
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(careers, null, 2));
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

  // Print summary
  console.log("\n=== Summary ===");
  console.log(`Total careers: ${careers.length}`);
  console.log(`Successful: ${careers.length}`);
  console.log(`Cache hits: ${shouldRefresh ? 0 : "used cached data where available"}`);
  console.log(`\nOutput files:`);
  console.log(`  ${OUTPUT_FILE}`);
  console.log(`  ${INDEX_FILE}`);
  console.log("\nDone!\n");
}

// Helper functions for estimated values when API is not available
function getEstimatedPay(category: Category): number {
  const estimates: Record<Category, number> = {
    trades: 56000,
    healthcare: 65000,
    operations: 52000,
    office: 45000,
    technology: 75000,
  };
  return estimates[category];
}

function getEstimatedTrainingTime(category: Category): string {
  const estimates: Record<Category, TrainingTime> = {
    trades: "2-4yr",
    healthcare: "2-4yr",
    operations: "6-24mo",
    office: "6-24mo",
    technology: "6-24mo",
  };
  return estimates[category];
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
