/**
 * Fetch CareerOneStop Career Videos
 *
 * Uses CareerOneStop API to identify occupations with videos,
 * then fetches the video page to extract the actual CDN URL.
 *
 * The CDN video URLs don't always match our O*NET codes, so we need
 * to fetch the actual video page and parse the <video src="..."> tag.
 *
 * Run: npx tsx scripts/fetch-career-videos.ts
 */

import * as fs from "fs";
import * as path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "data/videos");
const CAREERS_FILE = path.join(process.cwd(), "data/careers.generated.json");

// CareerOneStop API credentials
const COS_USER_ID = "yAYGeWGIiBJXpF5";
const COS_TOKEN = "Cpk6q1X9ogtZPqnvU/mvUiMlUhPYmy0JSH0BO7mn0REXgweezMMKJN+2DcadSlTCadiL1DwuVTFZ9Z5RJJpjZA==";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface CareerVideo {
  source: "careeronestop";
  videoUrl: string;
  posterUrl: string;
  title: string;
  lastVerified: string;
}

interface Career {
  onet_code: string;
  soc_code: string;
  title: string;
  slug: string;
}

interface VideoOutput {
  metadata: {
    source: string;
    generated_at: string;
    total_videos: number;
    total_careers: number;
    coverage: string;
  };
  videos: Record<string, CareerVideo>;
}

// Get actual video URL by fetching the CareerOneStop video page
async function getVideoUrl(onetCode: string): Promise<{ videoUrl: string; posterUrl: string } | null> {
  // First get the video page URL from the API
  const apiUrl = `https://api.careeronestop.org/v1/occupation/${COS_USER_ID}/${onetCode}/US`;

  try {
    const apiResponse = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${COS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!apiResponse.ok) {
      return null;
    }

    const data = await apiResponse.json();
    const cosVideoUrl = data.OccupationDetail?.[0]?.COSVideoURL;

    if (!cosVideoUrl) {
      return null;
    }

    // Fetch the video page to get actual CDN URL
    const pageResponse = await fetch(cosVideoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!pageResponse.ok) {
      return null;
    }

    const html = await pageResponse.text();

    // Extract video URL from <video src="...">
    const videoMatch = html.match(/<video src="([^"]+\.mp4)"/);
    const posterMatch = html.match(/poster="([^"]+\.jpg)"/);

    if (!videoMatch) {
      return null;
    }

    return {
      videoUrl: videoMatch[1],
      posterUrl: posterMatch?.[1] || videoMatch[1].replace(".mp4", ".jpg"),
    };
  } catch {
    return null;
  }
}

// Rate limiter
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("\n=== Fetching CareerOneStop Videos ===\n");

  // Load careers
  if (!fs.existsSync(CAREERS_FILE)) {
    console.error("Error: careers.generated.json not found. Run data generation first.");
    process.exit(1);
  }

  const careers: Career[] = JSON.parse(fs.readFileSync(CAREERS_FILE, "utf-8"));
  console.log(`Loaded ${careers.length} careers to check for videos`);

  // Load existing cache
  const outputFile = path.join(OUTPUT_DIR, "career-videos.json");
  let existingVideos: Record<string, CareerVideo> = {};

  if (fs.existsSync(outputFile)) {
    const existing = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    existingVideos = existing.videos || {};
    console.log(`Found existing cache with ${Object.keys(existingVideos).length} videos`);
  }

  const videos: Record<string, CareerVideo> = { ...existingVideos };
  let successCount = Object.keys(existingVideos).length;
  let checkedCount = 0;

  // Process careers
  for (let i = 0; i < careers.length; i++) {
    const career = careers[i];
    const progress = `[${i + 1}/${careers.length}]`;

    // Skip if already have video
    if (videos[career.soc_code]) {
      continue;
    }

    checkedCount++;

    // Get video URL from API + page fetch
    const videoData = await getVideoUrl(career.onet_code);

    if (!videoData) {
      console.log(`${progress} - ${career.title} (no video)`);
      await sleep(150); // Rate limiting
      continue;
    }

    videos[career.soc_code] = {
      source: "careeronestop",
      videoUrl: videoData.videoUrl,
      posterUrl: videoData.posterUrl,
      title: career.title,
      lastVerified: new Date().toISOString().split("T")[0],
    };
    successCount++;
    console.log(`${progress} ✓ ${career.title}`);

    // Save progress every 25 careers
    if (checkedCount % 25 === 0) {
      const output: VideoOutput = {
        metadata: {
          source: "CareerOneStop CDN",
          generated_at: new Date().toISOString(),
          total_videos: successCount,
          total_careers: careers.length,
          coverage: `${((successCount / careers.length) * 100).toFixed(1)}%`,
        },
        videos,
      };
      fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
      console.log(`\n  [Saved progress: ${successCount} videos]\n`);
    }

    // Rate limiting - be nice to their servers
    await sleep(200);
  }

  // Final save
  const output: VideoOutput = {
    metadata: {
      source: "CareerOneStop CDN",
      generated_at: new Date().toISOString(),
      total_videos: successCount,
      total_careers: careers.length,
      coverage: `${((successCount / careers.length) * 100).toFixed(1)}%`,
    },
    videos,
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log("\n=== Complete ===");
  console.log(`Videos found: ${successCount}/${careers.length}`);
  console.log(`Coverage: ${((successCount / careers.length) * 100).toFixed(1)}%`);
  console.log(`Output: ${outputFile}\n`);
}

main().catch(console.error);
