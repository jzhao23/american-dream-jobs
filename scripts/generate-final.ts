/**
 * Generate Final Dataset
 *
 * Creates the final occupations_final.json and priority_occupations.json files.
 * Also generates website-ready data files.
 *
 * Run: npx tsx scripts/generate-final.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getCategory } from '../src/lib/categories';

const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');
const DATA_DIR = path.join(process.cwd(), 'data');
const OXFORD_MAPPING_FILE = path.join(PROCESSED_DIR, 'oxford_ai_risk_mapping.json');

// Type for Oxford mapping
interface OxfordMapping {
  onet_code: string;
  ai_risk: number;
  ai_risk_label: string;
  oxford_probability: number | null;
  match_type: string;
}

// Type for career video
interface CareerVideo {
  source: 'careeronestop' | 'practitioner';
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  lastVerified: string;
}

// Type for inside career content
interface InsideCareer {
  content: string;
  generated_at: string;
}

async function main() {
  console.log('\n=== Generating Final Dataset ===\n');

  // Load completed occupations
  const occupationsFile = path.join(PROCESSED_DIR, 'occupations_complete.json');
  const occupationsData = JSON.parse(fs.readFileSync(occupationsFile, 'utf-8'));
  const occupations = occupationsData.occupations;
  console.log(`Processing ${occupations.length} occupations...`);

  // Re-apply category mapping (to pick up any overrides from career-overrides.ts)
  let categoryOverrides = 0;
  for (const occ of occupations) {
    const newCategory = getCategory(occ.onet_code);
    if (newCategory !== occ.category) {
      console.log(`  Category override: ${occ.title} (${occ.onet_code}): ${occ.category} → ${newCategory}`);
      occ.category = newCategory;
      categoryOverrides++;
    }
  }
  if (categoryOverrides > 0) {
    console.log(`Applied ${categoryOverrides} category override(s)`);
  }

  // Load curated technology skills (if available)
  const curatedTechSkillsFile = path.join(PROCESSED_DIR, 'curated-tech-skills.json');
  let techSkillOverrides = 0;
  if (fs.existsSync(curatedTechSkillsFile)) {
    const curatedData = JSON.parse(fs.readFileSync(curatedTechSkillsFile, 'utf-8'));
    const curatedSkills = curatedData.skills as Record<string, string[]>;
    console.log(`Loading curated tech skills for ${Object.keys(curatedSkills).length} careers...`);

    for (const occ of occupations) {
      if (curatedSkills[occ.onet_code]) {
        occ.technology_skills = curatedSkills[occ.onet_code];
        techSkillOverrides++;
      }
    }
    console.log(`Applied ${techSkillOverrides} curated technology skill sets`);
  }

  // Load Oxford AI risk mapping
  console.log('Loading Oxford AI risk mapping...');
  const oxfordData = JSON.parse(fs.readFileSync(OXFORD_MAPPING_FILE, 'utf-8'));
  const oxfordMappings = new Map<string, OxfordMapping>();
  for (const mapping of oxfordData.mappings) {
    oxfordMappings.set(mapping.onet_code, mapping);
  }
  console.log(`Loaded ${oxfordMappings.size} Oxford AI risk mappings`);

  // Load career videos
  const videosFile = path.join(DATA_DIR, 'videos/career-videos.json');
  const videosMap = new Map<string, CareerVideo>();
  if (fs.existsSync(videosFile)) {
    const videosData = JSON.parse(fs.readFileSync(videosFile, 'utf-8'));
    if (videosData.videos) {
      for (const [socCode, video] of Object.entries(videosData.videos)) {
        videosMap.set(socCode, video as CareerVideo);
      }
    }
    console.log(`Loaded ${videosMap.size} career videos`);
  } else {
    console.log('No career videos file found (data/videos/career-videos.json)');
  }

  // Load inside career content
  const insideCareerFile = path.join(DATA_DIR, 'inside-career/inside-career.json');
  const insideCareerMap = new Map<string, InsideCareer>();
  if (fs.existsSync(insideCareerFile)) {
    const insideCareerData = JSON.parse(fs.readFileSync(insideCareerFile, 'utf-8'));
    if (insideCareerData.careers) {
      for (const [socCode, content] of Object.entries(insideCareerData.careers)) {
        insideCareerMap.set(socCode, content as InsideCareer);
      }
    }
    console.log(`Loaded ${insideCareerMap.size} inside career entries`);
  } else {
    console.log('No inside career file found (data/inside-career/inside-career.json)');
  }

  // Apply Oxford AI risk scores to occupations
  let oxfordApplied = 0;
  for (const occ of occupations) {
    const oxfordMapping = oxfordMappings.get(occ.onet_code);
    if (oxfordMapping) {
      // Update AI risk with Oxford data (maintaining schema compatibility)
      occ.ai_risk = {
        score: oxfordMapping.ai_risk,
        label: oxfordMapping.ai_risk_label,
        confidence: oxfordMapping.match_type === 'exact' || oxfordMapping.match_type === 'parent_soc' ? 'high' : 'medium',
        rationale: {
          summary: oxfordMapping.oxford_probability !== null
            ? `Based on Frey & Osborne (2013) probability of ${(oxfordMapping.oxford_probability * 100).toFixed(1)}%`
            : `Based on category median from Frey & Osborne (2013) data`,
          factors_increasing_risk: oxfordMapping.oxford_probability !== null && oxfordMapping.oxford_probability > 0.5
            ? ['Routine cognitive or manual tasks', 'Structured work environment']
            : [],
          factors_decreasing_risk: oxfordMapping.oxford_probability !== null && oxfordMapping.oxford_probability < 0.5
            ? ['Complex decision-making', 'Human interaction required', 'Creative problem-solving']
            : [],
        },
        last_assessed: new Date().toISOString().split('T')[0],
        assessor: 'claude' as const,
        // Additional Oxford metadata
        oxford_source: {
          probability: oxfordMapping.oxford_probability,
          match_type: oxfordMapping.match_type,
          paper: 'Frey & Osborne (2013) "The Future of Employment"',
        },
      };
      oxfordApplied++;
    }

    // Add video data if available
    const video = videosMap.get(occ.soc_code);
    if (video) {
      occ.video = video;
    } else {
      occ.video = null;
    }

    // Add inside career content if available
    const insideLook = insideCareerMap.get(occ.soc_code);
    if (insideLook) {
      occ.inside_look = insideLook;
    } else {
      occ.inside_look = null;
    }
  }
  console.log(`Applied Oxford AI risk to ${oxfordApplied} occupations`);
  console.log(`Applied videos to ${videosMap.size} occupations`);
  console.log(`Applied inside career content to ${insideCareerMap.size} occupations`);

  // Validate all occupations have required fields
  let validCount = 0;
  let incompleteCount = 0;

  occupations.forEach((occ: {
    data_completeness: { completeness_score: number; has_wages: boolean; has_tasks: boolean };
    wages: unknown;
    ai_risk: unknown;
    national_importance: unknown;
    career_progression: unknown;
  }) => {
    // Update completeness score
    let score = 0;
    if (occ.wages) score += 25;
    if (occ.ai_risk) score += 25;
    if (occ.national_importance) score += 25;
    if (occ.career_progression) score += 25;
    occ.data_completeness.completeness_score = score;
    occ.data_completeness.has_wages = !!occ.wages;
    occ.data_completeness.has_tasks = true;

    if (score >= 75) {
      validCount++;
    } else {
      incompleteCount++;
    }
  });

  console.log(`Complete occupations: ${validCount}`);
  console.log(`Incomplete occupations: ${incompleteCount}`);

  // Validate: Check for zeros in career progression timeline (indicates BLS null handling bug)
  const careersWithZeros = occupations.filter((o: {
    title: string;
    career_progression?: { timeline?: { expected_compensation: number }[] };
  }) =>
    o.career_progression?.timeline?.some(t => t.expected_compensation === 0)
  );

  if (careersWithZeros.length > 0) {
    console.error(`\n⚠️  WARNING: Found ${careersWithZeros.length} careers with $0 in timeline:`);
    careersWithZeros.slice(0, 10).forEach((c: { title: string }) => {
      console.error(`    - ${c.title}`);
    });
    if (careersWithZeros.length > 10) {
      console.error(`    ... and ${careersWithZeros.length - 10} more`);
    }
    console.error(`\n   This usually means BLS percentile data has nulls that weren't estimated.`);
    console.error(`   Run 'npx tsx scripts/create-progression-mappings.ts' to fix.\n`);
    // Don't fail the build, but warn loudly
  } else {
    console.log('✓ All career progressions have valid (non-zero) compensation data');
  }

  // Generate final dataset
  const finalOutput = {
    metadata: {
      version: '1.0',
      generated_at: new Date().toISOString(),
      total_occupations: occupations.length,
      data_sources: [
        { name: 'O*NET 30.1', url: 'https://www.onetcenter.org' },
        { name: 'BLS OES', url: 'https://www.bls.gov/oes/' },
        { name: 'Levels.fyi (mapped)', url: 'https://www.levels.fyi' },
        { name: 'Frey & Osborne (2013) - AI Risk', url: 'https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment' },
        { name: 'CareerOneStop Videos', url: 'https://www.careeronestop.org/Videos/' },
      ],
      completeness: {
        wages: occupations.filter((o: { wages: unknown }) => o.wages).length,
        ai_risk: occupations.filter((o: { ai_risk: unknown }) => o.ai_risk).length,
        national_importance: occupations.filter((o: { national_importance: unknown }) => o.national_importance).length,
        career_progression: occupations.filter((o: { career_progression: unknown }) => o.career_progression).length,
        videos: occupations.filter((o: { video: unknown }) => o.video).length,
        inside_look: occupations.filter((o: { inside_look: unknown }) => o.inside_look).length,
      },
    },
    occupations,
  };

  fs.writeFileSync(
    path.join(PROCESSED_DIR, 'occupations_final.json'),
    JSON.stringify(finalOutput, null, 2)
  );
  console.log('Generated: occupations_final.json');

  // Generate priority occupations (200 most important/interesting)
  // ARCHIVED: national_importance removed from priority scoring - see data/archived/importance-scores-backup.json
  const priorityOccupations = occupations
    .map((occ: {
      onet_code: string;
      title: string;
      category: string;
      wages: { annual: { median: number } };
      // national_importance: { score: number }; // ARCHIVED
      ai_risk: { score: number };
    }) => ({
      ...occ,
      priority_score: (
        // (occ.national_importance?.score || 0) * 2 + // ARCHIVED
        (10 - (occ.ai_risk?.score || 5)) * 2 +
        (occ.wages?.annual?.median || 0) / 10000
      ),
    }))
    .sort((a: { priority_score: number }, b: { priority_score: number }) => b.priority_score - a.priority_score)
    .slice(0, 200)
    .map(({ priority_score, ...occ }: { priority_score: number; [key: string]: unknown }) => occ);

  fs.writeFileSync(
    path.join(PROCESSED_DIR, 'priority_occupations.json'),
    JSON.stringify({
      metadata: {
        generated_at: new Date().toISOString(),
        total: priorityOccupations.length,
        selection_criteria: 'Low AI risk + Good wages', // ARCHIVED: was 'High national importance + Low AI risk + Good wages'
      },
      occupations: priorityOccupations,
    }, null, 2)
  );
  console.log('Generated: priority_occupations.json (200 priority occupations)');

  // Generate website-ready index file (lightweight version for explorer)
  const careerIndex = occupations.map((occ: {
    title: string;
    slug: string;
    category: string;
    subcategory: string;
    wages: { annual: { median: number } };
    education: {
      education_duration?: { min_years: number; typical_years: number; max_years: number };
      time_to_job_ready: { min_years: number; typical_years: number; max_years: number };
      typical_entry_education: string;
    };
    ai_risk: { score: number; label: string };
    // ARCHIVED: national_importance removed from UI - see data/archived/importance-scores-backup.json
    // national_importance: { score: number; label: string; flag_count: number };
    description: string;
  }) => {
    // Use education_duration (ground truth) if available, fall back to time_to_job_ready
    const eduDuration = occ.education?.education_duration || occ.education?.time_to_job_ready;

    return {
      title: occ.title,
      slug: occ.slug,
      category: occ.category,
      subcategory: occ.subcategory,
      median_pay: occ.wages?.annual?.median || 0,
      training_time: getTrainingTimeCategory(eduDuration?.typical_years ?? 2),
      training_years: eduDuration ? {
        min: eduDuration.min_years,
        typical: eduDuration.typical_years,
        max: eduDuration.max_years,
      } : null,
      typical_education: occ.education?.typical_entry_education || 'High school diploma',
      ai_risk: occ.ai_risk?.score || 5,
      ai_risk_label: occ.ai_risk?.label || 'medium',
      // ARCHIVED: importance fields removed from UI - see data/archived/importance-scores-backup.json
      // importance: occ.national_importance?.score || 5,
      // importance_label: occ.national_importance?.label || 'important',
      // flag_count: occ.national_importance?.flag_count || 2,
      description: occ.description?.substring(0, 200) || '',
    };
  });

  fs.writeFileSync(
    path.join(DATA_DIR, 'careers-index.json'),
    JSON.stringify(careerIndex, null, 2)
  );
  console.log('Generated: careers-index.json (website index)');

  // Generate careers.generated.json (full data for detail pages)
  fs.writeFileSync(
    path.join(DATA_DIR, 'careers.generated.json'),
    JSON.stringify(occupations, null, 2)
  );
  console.log('Generated: careers.generated.json (full career data)');

  // Print category breakdown
  const categoryStats: Record<string, { count: number; avgPay: number; avgAIRisk: number }> = {};
  occupations.forEach((occ: {
    category: string;
    wages: { annual: { median: number } };
    ai_risk: { score: number };
  }) => {
    if (!categoryStats[occ.category]) {
      categoryStats[occ.category] = { count: 0, avgPay: 0, avgAIRisk: 0 };
    }
    categoryStats[occ.category].count++;
    categoryStats[occ.category].avgPay += occ.wages?.annual?.median || 0;
    categoryStats[occ.category].avgAIRisk += occ.ai_risk?.score || 5;
  });

  console.log('\nCategory Statistics:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([cat, stats]) => {
      const avgPay = Math.round(stats.avgPay / stats.count);
      const avgRisk = (stats.avgAIRisk / stats.count).toFixed(1);
      console.log(`  ${cat.padEnd(20)} ${stats.count.toString().padStart(4)} jobs | Avg: $${avgPay.toLocaleString().padStart(7)} | AI Risk: ${avgRisk}`);
    });

  // Print top priority occupations
  console.log('\nTop 10 Priority Occupations:');
  priorityOccupations.slice(0, 10).forEach((occ: {
    title: string;
    // national_importance: { flag_count: number }; // ARCHIVED
    wages: { annual: { median: number } };
    ai_risk: { score: number };
  }, i: number) => {
    // ARCHIVED: flags removed - see data/archived/importance-scores-backup.json
    // const flags = '🇺🇸'.repeat(occ.national_importance?.flag_count || 1);
    console.log(`  ${i + 1}. ${occ.title} - $${(occ.wages?.annual?.median || 0).toLocaleString()} (AI Risk: ${occ.ai_risk?.score})`);
  });

  console.log('\n=== Final Dataset Generation Complete ===\n');
}

function getTrainingTimeCategory(years: number): string {
  if (years < 0.5) return '<6mo';
  if (years < 2) return '6-24mo';
  if (years < 4) return '2-4yr';
  return '4+yr';
}

main().catch(console.error);
