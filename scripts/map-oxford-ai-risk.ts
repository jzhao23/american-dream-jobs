/**
 * Oxford AI Risk Mapping Script
 *
 * Maps Frey & Osborne (2013) "The Future of Employment" computerisation probabilities
 * to our O*NET-based career database.
 *
 * Source: https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment
 * Paper: "The Future of Employment: How Susceptible Are Jobs to Computerisation?"
 * Authors: Carl Benedikt Frey & Michael A. Osborne
 *
 * Methodology:
 * 1. Load Oxford data (702 occupations with SOC codes and probabilities)
 * 2. Load our O*NET occupations (1,016 occupations)
 * 3. Match by SOC code (O*NET code = SOC code + suffix)
 * 4. For unmatched: use category median probability
 * 5. Normalize probability (0-1) to AI risk score (1-10)
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

// Paths
const OXFORD_CSV_PATH = path.join(
  __dirname,
  "../data/sources/oxford/frey-osborne-2013-raw.csv"
);
const ONET_LIST_PATH = path.join(
  __dirname,
  "../data/processed/onet_occupations_list.json"
);
const OCCUPATIONS_PATH = path.join(
  __dirname,
  "../data/processed/occupations_complete.json"
);
const OUTPUT_JSON_PATH = path.join(
  __dirname,
  "../data/sources/oxford/frey-osborne-2013.json"
);
const MAPPING_OUTPUT_PATH = path.join(
  __dirname,
  "../data/processed/oxford_ai_risk_mapping.json"
);

// Types
interface OxfordOccupation {
  soc_code: string;
  title: string;
  probability: number;
  rank: number;
}

interface ONetOccupation {
  onet_code: string;
  title: string;
  category: string;
  subcategory: string;
}

interface MappingResult {
  onet_code: string;
  title: string;
  category: string;
  oxford_soc: string | null;
  oxford_title: string | null;
  oxford_probability: number | null;
  ai_risk: number;
  ai_risk_label: string;
  match_type: "exact" | "parent_soc" | "category_median" | "global_median";
  fallback_reason?: string;
}

interface MappingOutput {
  metadata: {
    source: string;
    paper: string;
    authors: string;
    url: string;
    methodology: string;
    generated_at: string;
  };
  statistics: {
    total_occupations: number;
    oxford_occupations: number;
    exact_matches: number;
    parent_soc_matches: number;
    category_median_matches: number;
    global_median_matches: number;
  };
  mappings: MappingResult[];
}

/**
 * Normalize Oxford probability (0-1) to AI risk score (1-10)
 * Formula: ai_risk = 1 + (probability * 9)
 */
function normalizeToAIRisk(probability: number): number {
  const score = 1 + probability * 9;
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Get AI risk label from score
 */
function getAIRiskLabel(score: number): string {
  if (score <= 2) return "very_low";
  if (score <= 4) return "low";
  if (score <= 6) return "medium";
  if (score <= 8) return "high";
  return "very_high";
}

/**
 * Extract base SOC code from O*NET code
 * O*NET: "11-1011.00" -> SOC: "11-1011"
 */
function extractSOCCode(onetCode: string): string {
  return onetCode.split(".")[0];
}

/**
 * Calculate median of an array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0.5; // Default to middle probability
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  console.log("🎓 Oxford AI Risk Mapping Script");
  console.log("================================\n");

  // Step 1: Load and parse Oxford CSV
  console.log("📖 Loading Oxford/Frey-Osborne data...");
  const csvContent = fs.readFileSync(OXFORD_CSV_PATH, "utf-8");
  const csvRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const oxfordData: OxfordOccupation[] = csvRecords.map((row: Record<string, string>) => ({
    soc_code: row["_ - code"],
    title: row["occupation"],
    probability: parseFloat(row["probability"] || row["prob"]),
    rank: parseInt(row["_ - rank"]),
  }));

  console.log(`   Loaded ${oxfordData.length} Oxford occupations`);

  // Create SOC lookup map
  const oxfordBySoc = new Map<string, OxfordOccupation>();
  for (const occ of oxfordData) {
    oxfordBySoc.set(occ.soc_code, occ);
  }

  // Step 2: Save Oxford data as JSON
  console.log("\n💾 Saving Oxford data as JSON...");
  const oxfordJson = {
    metadata: {
      source: "Frey & Osborne (2013)",
      paper: "The Future of Employment: How Susceptible Are Jobs to Computerisation?",
      authors: "Carl Benedikt Frey & Michael A. Osborne",
      url: "https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment",
      total_occupations: oxfordData.length,
      extracted_from: "Plotly datasets (GitHub)",
      original_source: "Oxford Martin School / Technological Forecasting and Social Change (2017)",
    },
    occupations: oxfordData.map((occ) => ({
      soc_code: occ.soc_code,
      title: occ.title,
      probability: occ.probability,
    })),
  };
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(oxfordJson, null, 2));
  console.log(`   Saved to ${OUTPUT_JSON_PATH}`);

  // Step 3: Load O*NET occupations
  console.log("\n📖 Loading O*NET occupations...");
  const onetListRaw = JSON.parse(fs.readFileSync(ONET_LIST_PATH, "utf-8"));
  const occupationsRaw = JSON.parse(fs.readFileSync(OCCUPATIONS_PATH, "utf-8"));

  // Build occupation list with categories
  const onetOccupations: ONetOccupation[] = onetListRaw.occupations.map(
    (occ: { onet_code: string; title: string; category: string; subcategory: string }) => ({
      onet_code: occ.onet_code,
      title: occ.title,
      category: occ.category,
      subcategory: occ.subcategory,
    })
  );
  console.log(`   Loaded ${onetOccupations.length} O*NET occupations`);

  // Step 4: Perform mapping
  console.log("\n🔗 Mapping occupations...");

  const mappings: MappingResult[] = [];
  const categoryProbabilities = new Map<string, number[]>();
  const allProbabilities: number[] = [];

  // First pass: collect probabilities by category for fallback calculation
  for (const occ of onetOccupations) {
    const socCode = extractSOCCode(occ.onet_code);
    const oxfordMatch = oxfordBySoc.get(socCode);

    if (oxfordMatch) {
      if (!categoryProbabilities.has(occ.category)) {
        categoryProbabilities.set(occ.category, []);
      }
      categoryProbabilities.get(occ.category)!.push(oxfordMatch.probability);
      allProbabilities.push(oxfordMatch.probability);
    }
  }

  // Calculate category medians
  const categoryMedians = new Map<string, number>();
  for (const [category, probs] of categoryProbabilities) {
    categoryMedians.set(category, median(probs));
  }
  const globalMedian = median(allProbabilities);

  console.log(`   Category medians calculated for ${categoryMedians.size} categories`);
  console.log(`   Global median probability: ${globalMedian.toFixed(3)}`);

  // Second pass: create mappings
  let exactMatches = 0;
  let parentSocMatches = 0;
  let categoryMedianMatches = 0;
  let globalMedianMatches = 0;

  for (const occ of onetOccupations) {
    const socCode = extractSOCCode(occ.onet_code);
    const oxfordMatch = oxfordBySoc.get(socCode);

    let mapping: MappingResult;

    if (oxfordMatch) {
      // Check if exact title match or parent SOC match
      const isExact = oxfordMatch.title.toLowerCase() === occ.title.toLowerCase();
      const matchType = isExact ? "exact" : "parent_soc";

      if (isExact) exactMatches++;
      else parentSocMatches++;

      mapping = {
        onet_code: occ.onet_code,
        title: occ.title,
        category: occ.category,
        oxford_soc: oxfordMatch.soc_code,
        oxford_title: oxfordMatch.title,
        oxford_probability: oxfordMatch.probability,
        ai_risk: normalizeToAIRisk(oxfordMatch.probability),
        ai_risk_label: getAIRiskLabel(normalizeToAIRisk(oxfordMatch.probability)),
        match_type: matchType,
      };
    } else {
      // Use category median or global median
      const catMedian = categoryMedians.get(occ.category);

      if (catMedian !== undefined) {
        categoryMedianMatches++;
        mapping = {
          onet_code: occ.onet_code,
          title: occ.title,
          category: occ.category,
          oxford_soc: null,
          oxford_title: null,
          oxford_probability: null,
          ai_risk: normalizeToAIRisk(catMedian),
          ai_risk_label: getAIRiskLabel(normalizeToAIRisk(catMedian)),
          match_type: "category_median",
          fallback_reason: `No Oxford SOC match; used ${occ.category} category median (${catMedian.toFixed(3)})`,
        };
      } else {
        globalMedianMatches++;
        mapping = {
          onet_code: occ.onet_code,
          title: occ.title,
          category: occ.category,
          oxford_soc: null,
          oxford_title: null,
          oxford_probability: null,
          ai_risk: normalizeToAIRisk(globalMedian),
          ai_risk_label: getAIRiskLabel(normalizeToAIRisk(globalMedian)),
          match_type: "global_median",
          fallback_reason: `No Oxford SOC match and no category data; used global median (${globalMedian.toFixed(3)})`,
        };
      }
    }

    mappings.push(mapping);
  }

  // Step 5: Generate output
  console.log("\n📊 Generating mapping output...");

  const output: MappingOutput = {
    metadata: {
      source: "Frey & Osborne (2013)",
      paper: "The Future of Employment: How Susceptible Are Jobs to Computerisation?",
      authors: "Carl Benedikt Frey & Michael A. Osborne",
      url: "https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment",
      methodology: `
Oxford probabilities (0-1) are normalized to AI risk scores (1-10) using:
  ai_risk = 1 + (probability × 9)

Mapping priority:
1. Exact match: O*NET SOC code matches Oxford SOC code exactly
2. Parent SOC: Multiple O*NET occupations share same parent SOC code
3. Category median: No SOC match; use median probability of matched occupations in same category
4. Global median: No SOC match and no category data; use global median probability
      `.trim(),
      generated_at: new Date().toISOString(),
    },
    statistics: {
      total_occupations: mappings.length,
      oxford_occupations: oxfordData.length,
      exact_matches: exactMatches,
      parent_soc_matches: parentSocMatches,
      category_median_matches: categoryMedianMatches,
      global_median_matches: globalMedianMatches,
    },
    mappings: mappings,
  };

  fs.writeFileSync(MAPPING_OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`   Saved to ${MAPPING_OUTPUT_PATH}`);

  // Print summary
  console.log("\n✅ Mapping Complete!");
  console.log("===================");
  console.log(`Total occupations:     ${mappings.length}`);
  console.log(`Oxford occupations:    ${oxfordData.length}`);
  console.log(`Exact matches:         ${exactMatches} (${((exactMatches / mappings.length) * 100).toFixed(1)}%)`);
  console.log(`Parent SOC matches:    ${parentSocMatches} (${((parentSocMatches / mappings.length) * 100).toFixed(1)}%)`);
  console.log(`Category median:       ${categoryMedianMatches} (${((categoryMedianMatches / mappings.length) * 100).toFixed(1)}%)`);
  console.log(`Global median:         ${globalMedianMatches} (${((globalMedianMatches / mappings.length) * 100).toFixed(1)}%)`);

  // Print AI risk distribution
  console.log("\n📈 AI Risk Distribution:");
  const riskBuckets = { very_low: 0, low: 0, medium: 0, high: 0, very_high: 0 };
  for (const m of mappings) {
    riskBuckets[m.ai_risk_label as keyof typeof riskBuckets]++;
  }
  console.log(`   Very Low (1-2):  ${riskBuckets.very_low}`);
  console.log(`   Low (2-4):       ${riskBuckets.low}`);
  console.log(`   Medium (4-6):    ${riskBuckets.medium}`);
  console.log(`   High (6-8):      ${riskBuckets.high}`);
  console.log(`   Very High (8-10): ${riskBuckets.very_high}`);

  // Print some example mappings
  console.log("\n📋 Example Mappings:");
  const examples = mappings.slice(0, 5);
  for (const ex of examples) {
    console.log(`   ${ex.title}`);
    console.log(`     O*NET: ${ex.onet_code} -> Oxford: ${ex.oxford_soc || "N/A"}`);
    console.log(`     Probability: ${ex.oxford_probability?.toFixed(3) || "N/A"} -> AI Risk: ${ex.ai_risk}/10 (${ex.match_type})`);
  }
}

main().catch(console.error);
