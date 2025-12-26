/**
 * Fetch CareerOneStop Career Videos
 *
 * Uses CareerOneStop API to identify occupations with videos,
 * then searches YouTube to get the actual video IDs.
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
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
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

// Check if occupation has a video via CareerOneStop API
async function checkHasVideo(onetCode: string): Promise<boolean> {
  const url = `https://api.careeronestop.org/v1/occupation/${COS_USER_ID}/${onetCode}/US`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${COS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const details = data.OccupationDetail?.[0];

    // Check if COSVideoURL exists and is not empty
    return !!(details?.COSVideoURL && details.COSVideoURL.length > 0);
  } catch {
    return false;
  }
}

// Search YouTube for CareerOneStop video
async function searchYouTubeForVideo(title: string): Promise<string | null> {
  // Clean title for search (remove parenthetical suffixes)
  const cleanTitle = title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const query = `${cleanTitle} CareerOneStop career video`;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const html = await response.text();

    // Find video IDs with their channel names
    const pattern = /"videoId":"([a-zA-Z0-9_-]{11})".*?"ownerText":\{"runs":\[\{"text":"([^"]+)"/g;
    const matches = [...html.matchAll(pattern)];

    // Look for CareerOneStop channel
    for (const match of matches) {
      if (match[2] === "CareerOneStop") {
        return match[1];
      }
    }

    // Alternative: look for video with matching title pattern
    const titlePattern = /"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
    const titleMatches = [...html.matchAll(titlePattern)];

    for (const match of titleMatches) {
      const videoTitle = match[2].toLowerCase();
      const searchTitle = cleanTitle.toLowerCase();

      // Check if video title contains the occupation name and "career video"
      if (videoTitle.includes("career video") &&
          (videoTitle.includes(searchTitle) || searchTitle.includes(videoTitle.replace(" career video", "")))) {
        return match[1];
      }
    }

    return null;
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
  let apiHits = 0;

  // Process careers
  for (let i = 0; i < careers.length; i++) {
    const career = careers[i];
    const progress = `[${i + 1}/${careers.length}]`;

    // Skip if already have video
    if (videos[career.soc_code]) {
      continue;
    }

    checkedCount++;

    // First check if occupation has video via API
    const hasVideo = await checkHasVideo(career.onet_code);
    apiHits++;

    if (!hasVideo) {
      console.log(`${progress} - ${career.title} (no video in API)`);
      await sleep(100); // Small delay for API
      continue;
    }

    // Search YouTube for the video
    await sleep(500); // Longer delay before YouTube search
    const youtubeId = await searchYouTubeForVideo(career.title);

    if (youtubeId) {
      videos[career.soc_code] = {
        source: "careeronestop",
        youtubeId,
        title: career.title,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        lastVerified: new Date().toISOString().split("T")[0],
      };
      successCount++;
      console.log(`${progress} ✓ ${career.title} (${youtubeId})`);
    } else {
      console.log(`${progress} ? ${career.title} (has API video but not found on YouTube)`);
    }

    // Save progress every 25 careers
    if (checkedCount % 25 === 0) {
      const output: VideoOutput = {
        metadata: {
          source: "CareerOneStop",
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

    // Rate limiting for YouTube
    await sleep(300);
  }

  // Final save
  const output: VideoOutput = {
    metadata: {
      source: "CareerOneStop",
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
  console.log(`API calls made: ${apiHits}`);
  console.log(`Output: ${outputFile}\n`);
}

main().catch(console.error);
