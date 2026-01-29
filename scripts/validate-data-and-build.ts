/**
 * Comprehensive Data Validation and Static Build Testing
 *
 * Tests all data files, validates the static build, and checks for issues
 * that don't require network access.
 *
 * Run with: npx tsx scripts/validate-data-and-build.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// Interfaces
interface Career {
  slug: string;
  title: string;
  category: string;
  median_pay?: number;
  training_time?: string;
  ai_resilience?: string;
  ai_risk?: number;
  description?: string;
  typical_education?: string;
}

interface Specialization {
  slug: string;
  title: string;
  career_slug: string;
  category?: string;
  median_salary?: number;
}

interface Bug {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  description: string;
  details?: string[];
}

// Global state
let bugCounter = 0;
const bugs: Bug[] = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function addBug(bug: Omit<Bug, 'id'>): void {
  bugCounter++;
  bugs.push({
    ...bug,
    id: `BUG-${String(bugCounter).padStart(3, '0')}`,
  });
}

function test(description: string, fn: () => boolean | string[]): void {
  totalTests++;
  try {
    const result = fn();
    if (result === true || (Array.isArray(result) && result.length === 0)) {
      passedTests++;
      console.log(`  ${colors.green}✓${colors.reset} ${description}`);
    } else {
      failedTests++;
      console.log(`  ${colors.red}✗${colors.reset} ${description}`);
      if (Array.isArray(result) && result.length > 0) {
        result.slice(0, 5).forEach(r => console.log(`    ${colors.dim}- ${r}${colors.reset}`));
        if (result.length > 5) {
          console.log(`    ${colors.dim}... and ${result.length - 5} more${colors.reset}`);
        }
      }
    }
  } catch (error) {
    failedTests++;
    console.log(`  ${colors.red}✗${colors.reset} ${description}`);
    console.log(`    ${colors.dim}Error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

async function runValidation() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     Data Validation & Static Build Testing                 ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const startTime = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Critical Data Files
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 1: Critical Data Files${colors.reset}\n`);

  const criticalFiles = [
    'data/output/careers.json',
    'data/output/careers-index.json',
    'data/output/specializations.json',
    'data/output/local-careers-index.json',
    'data/compass/career-dwas.json',
    'data/compass/dwa-list.json',
    'data/compass/dwa-taxonomy.json',
    'data/consolidation/career-definitions.json',
    'data/consolidation/career-content.json',
    'data/videos/career-videos.json',
  ];

  criticalFiles.forEach(file => {
    test(`${file} exists`, () => {
      const exists = fileExists(path.join(process.cwd(), file));
      if (!exists) {
        addBug({
          title: `Missing critical data file: ${file}`,
          severity: 'Critical',
          category: 'Data',
          description: `The file ${file} is missing from the repository.`,
        });
      }
      return exists;
    });
  });

  // Check for embeddings file (identified as missing earlier)
  test('data/compass/career-embeddings.json exists', () => {
    const exists = fileExists(path.join(process.cwd(), 'data/compass/career-embeddings.json'));
    if (!exists) {
      addBug({
        title: 'Missing career-embeddings.json file',
        severity: 'High',
        category: 'Data',
        description: 'The career-embeddings.json file is missing. This is required for the Career Compass AI matching functionality.',
        details: [
          'Run: npm run compass:generate-embeddings',
          'This file is needed for AI-powered career matching',
        ],
      });
    }
    return exists;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Career Data Validation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 2: Career Data Validation${colors.reset}\n`);

  const careersIndex = readJsonFile<Career[]>(path.join(process.cwd(), 'data/output/careers-index.json')) || [];
  const careers = readJsonFile<Career[]>(path.join(process.cwd(), 'data/output/careers.json')) || [];

  test('careers-index.json has at least 100 careers', () => careersIndex.length >= 100);
  test('careers.json has at least 100 careers', () => careers.length >= 100);
  test('Career count matches between files', () => Math.abs(careersIndex.length - careers.length) === 0);

  // Check for missing fields
  test('All careers have slugs', () => {
    const missing = careersIndex.filter(c => !c.slug);
    return missing.length === 0 ? true : missing.map(c => c.title || 'Unknown');
  });

  test('All careers have titles', () => {
    const missing = careersIndex.filter(c => !c.title);
    return missing.length === 0 ? true : missing.map(c => c.slug || 'Unknown');
  });

  test('All careers have categories', () => {
    const missing = careersIndex.filter(c => !c.category);
    if (missing.length > 0) {
      addBug({
        title: 'Careers missing category',
        severity: 'Medium',
        category: 'Data',
        description: `${missing.length} career(s) are missing category assignment.`,
        details: missing.slice(0, 10).map(c => c.slug),
      });
    }
    return missing.length === 0 ? true : missing.map(c => c.slug);
  });

  test('All careers have median_pay', () => {
    const missing = careersIndex.filter(c => !c.median_pay || c.median_pay <= 0);
    if (missing.length > 0) {
      addBug({
        title: 'Careers missing salary data',
        severity: 'Medium',
        category: 'Data',
        description: `${missing.length} career(s) are missing median_pay data.`,
        details: missing.slice(0, 10).map(c => c.slug),
      });
    }
    return missing.length === 0 ? true : missing.map(c => c.slug);
  });

  test('All careers have training_time', () => {
    const missing = careersIndex.filter(c => !c.training_time);
    return missing.length === 0 ? true : missing.map(c => c.slug);
  });

  test('All careers have ai_resilience', () => {
    const missing = careersIndex.filter(c => !c.ai_resilience);
    return missing.length === 0 ? true : missing.map(c => c.slug);
  });

  test('All careers have descriptions', () => {
    const missing = careersIndex.filter(c => !c.description || c.description.length < 50);
    if (missing.length > 0) {
      addBug({
        title: 'Careers missing or short descriptions',
        severity: 'Low',
        category: 'Data',
        description: `${missing.length} career(s) have missing or very short descriptions.`,
        details: missing.slice(0, 10).map(c => c.slug),
      });
    }
    return missing.length === 0 ? true : missing.map(c => c.slug);
  });

  // Slug validation
  test('All career slugs are valid (lowercase, hyphens only)', () => {
    const invalid = careersIndex.filter(c => !/^[a-z0-9-]+$/.test(c.slug));
    return invalid.length === 0 ? true : invalid.map(c => c.slug);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Specialization Data Validation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 3: Specialization Data Validation${colors.reset}\n`);

  const specializations = readJsonFile<Specialization[]>(path.join(process.cwd(), 'data/output/specializations.json')) || [];

  test('specializations.json has at least 500 entries', () => specializations.length >= 500);

  test('All specializations have slugs', () => {
    const missing = specializations.filter(s => !s.slug);
    return missing.length === 0 ? true : missing.map(s => s.title || 'Unknown');
  });

  test('All specializations have titles', () => {
    const missing = specializations.filter(s => !s.title);
    return missing.length === 0 ? true : missing.map(s => s.slug || 'Unknown');
  });

  test('All specializations have career_slug', () => {
    const missing = specializations.filter(s => !s.career_slug);
    if (missing.length > 0) {
      addBug({
        title: 'Specializations missing career_slug',
        severity: 'High',
        category: 'Data',
        description: `${missing.length} specialization(s) are missing career_slug link.`,
        details: missing.slice(0, 10).map(s => s.slug),
      });
    }
    return missing.length === 0 ? true : missing.map(s => s.slug);
  });

  // Validate career_slug links exist
  test('All specialization career_slugs link to valid careers', () => {
    const careerSlugs = new Set(careersIndex.map(c => c.slug));
    const invalid = specializations.filter(s => s.career_slug && !careerSlugs.has(s.career_slug));
    if (invalid.length > 0) {
      addBug({
        title: 'Specializations with broken career links',
        severity: 'High',
        category: 'Data',
        description: `${invalid.length} specialization(s) link to non-existent careers.`,
        details: invalid.slice(0, 10).map(s => `${s.slug} -> ${s.career_slug}`),
      });
    }
    return invalid.length === 0 ? true : invalid.map(s => `${s.slug} -> ${s.career_slug}`);
  });

  test('All specialization slugs are valid (lowercase, hyphens only)', () => {
    const invalid = specializations.filter(s => !/^[a-z0-9-]+$/.test(s.slug));
    return invalid.length === 0 ? true : invalid.map(s => s.slug);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Category Coverage
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 4: Category Coverage${colors.reset}\n`);

  const expectedCategories = [
    'agriculture', 'arts-media', 'building-grounds', 'business-finance',
    'construction', 'education', 'engineering', 'food-service',
    'healthcare-clinical', 'healthcare-technical', 'installation-repair',
    'legal', 'management', 'military', 'office-admin', 'personal-care',
    'production', 'protective-services', 'sales', 'science',
    'social-services', 'technology', 'transportation'
  ];

  const actualCategories = [...new Set(careersIndex.map(c => c.category))];

  test('All expected categories are present', () => {
    const missing = expectedCategories.filter(cat => !actualCategories.includes(cat));
    if (missing.length > 0) {
      addBug({
        title: 'Missing categories',
        severity: 'Medium',
        category: 'Data',
        description: `${missing.length} expected category(ies) have no careers.`,
        details: missing,
      });
    }
    return missing.length === 0 ? true : missing;
  });

  test('Each category has at least one career', () => {
    const categoryCounts = new Map<string, number>();
    careersIndex.forEach(c => {
      categoryCounts.set(c.category, (categoryCounts.get(c.category) || 0) + 1);
    });
    const empty = expectedCategories.filter(cat => !categoryCounts.get(cat));
    return empty.length === 0 ? true : empty;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: Static Build Validation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 5: Static Build Validation${colors.reset}\n`);

  const buildDir = path.join(process.cwd(), '.next');

  test('.next build directory exists', () => fileExists(buildDir));

  if (fileExists(buildDir)) {
    // Check for prerendered routes
    const routesManifest = path.join(buildDir, 'routes-manifest.json');
    test('routes-manifest.json exists', () => fileExists(routesManifest));

    const buildManifest = path.join(buildDir, 'build-manifest.json');
    test('build-manifest.json exists', () => fileExists(buildManifest));

    // Check static pages
    const staticDir = path.join(buildDir, 'server/app');
    if (fileExists(staticDir)) {
      test('Main pages are prerendered', () => {
        const mainPages = ['page.html', 'compass/page.html', 'compare/page.html', 'calculator/page.html'];
        const missing = mainPages.filter(p => !fileExists(path.join(staticDir, p)));
        return missing.length === 0 ? true : missing;
      });

      // Check category pages
      test('All category pages are prerendered', () => {
        const missing = expectedCategories.filter(cat =>
          !fileExists(path.join(staticDir, 'categories', cat, 'page.html'))
        );
        return missing.length === 0 ? true : missing;
      });

      // Check career pages
      test('All career pages are prerendered', () => {
        const missing = careersIndex.filter(c =>
          !fileExists(path.join(staticDir, 'careers', c.slug, 'page.html'))
        );
        if (missing.length > 0) {
          addBug({
            title: 'Career pages not prerendered',
            severity: 'High',
            category: 'Build',
            description: `${missing.length} career page(s) were not prerendered during build.`,
            details: missing.slice(0, 10).map(c => c.slug),
          });
        }
        return missing.length === 0 ? true : missing.map(c => c.slug);
      });

      // Check specialization pages (sample)
      test('Specialization pages are prerendered (sample of 50)', () => {
        const sample = specializations.slice(0, 50);
        const missing = sample.filter(s =>
          !fileExists(path.join(staticDir, 'specializations', s.slug, 'page.html'))
        );
        return missing.length === 0 ? true : missing.map(s => s.slug);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: Component Code Analysis
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 6: Component Code Analysis${colors.reset}\n`);

  // Check for console.log statements in production code
  test('No console.log in production components', () => {
    const componentFiles = findFiles(path.join(process.cwd(), 'src/components'), '.tsx');
    const withConsoleLogs: string[] = [];

    componentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Exclude console.warn and console.error which may be intentional
      if (/console\.log\(/.test(content)) {
        withConsoleLogs.push(path.relative(process.cwd(), file));
      }
    });

    if (withConsoleLogs.length > 0) {
      addBug({
        title: 'Console.log statements in production code',
        severity: 'Low',
        category: 'Code Quality',
        description: `${withConsoleLogs.length} component file(s) contain console.log statements.`,
        details: withConsoleLogs,
      });
    }

    return withConsoleLogs.length === 0 ? true : withConsoleLogs;
  });

  // Check for TODO comments
  test('TODO comments in code (informational)', () => {
    const srcFiles = findFiles(path.join(process.cwd(), 'src'), '.tsx');
    const withTodos: string[] = [];

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\/\/.*TODO/i.test(content) || /\/\*.*TODO/i.test(content)) {
        withTodos.push(path.relative(process.cwd(), file));
      }
    });

    return withTodos.length === 0 ? true : withTodos;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: Video Data Validation
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}PHASE 7: Video Data Validation${colors.reset}\n`);

  const videosPath = path.join(process.cwd(), 'data/videos/career-videos.json');
  const videos = readJsonFile<Record<string, string[]>>(videosPath);

  if (videos) {
    test('Video data is loaded', () => true);

    const videoCareerSlugs = Object.keys(videos);
    test('Video data covers at least 50 careers', () => videoCareerSlugs.length >= 50);

    // Check video slugs match actual careers
    test('All video career slugs link to valid careers', () => {
      const careerSlugs = new Set(careersIndex.map(c => c.slug));
      const specSlugs = new Set(specializations.map(s => s.slug));
      const invalid = videoCareerSlugs.filter(slug => !careerSlugs.has(slug) && !specSlugs.has(slug));
      return invalid.length === 0 ? true : invalid;
    });
  } else {
    test('Video data is loaded', () => {
      addBug({
        title: 'Career videos data not found',
        severity: 'Low',
        category: 'Data',
        description: 'The career-videos.json file could not be loaded.',
      });
      return false;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Generate Report
  // ═══════════════════════════════════════════════════════════════════════════
  const totalTime = Date.now() - startTime;

  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    TEST SUMMARY                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`  Bugs Found: ${bugs.length}`);
  console.log(`  Duration: ${(totalTime / 1000).toFixed(1)}s`);

  // Generate bug report
  generateBugReport(totalTime);

  return { totalTests, passedTests, failedTests, bugs: bugs.length };
}

function findFiles(dir: string, ext: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, ext));
    } else if (item.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function generateBugReport(totalTime: number): void {
  const now = new Date().toISOString().split('T')[0];

  let report = `# American Dream Jobs: Data Validation & Build Test Report

## Report Generated: ${now}
## Tester: Claude Code Validation Script
## Test Duration: ${(totalTime / 1000).toFixed(1)} seconds

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tests | ${totalTests} |
| Passed | ${passedTests} |
| Failed | ${failedTests} |
| Pass Rate | ${((passedTests / totalTests) * 100).toFixed(1)}% |
| Bugs Found | ${bugs.length} |

### Bugs by Severity

| Severity | Count |
|----------|-------|
| Critical | ${bugs.filter(b => b.severity === 'Critical').length} |
| High | ${bugs.filter(b => b.severity === 'High').length} |
| Medium | ${bugs.filter(b => b.severity === 'Medium').length} |
| Low | ${bugs.filter(b => b.severity === 'Low').length} |

---

## Bug Entries

`;

  if (bugs.length === 0) {
    report += `*No bugs found during validation.*\n`;
  } else {
    for (const bug of bugs) {
      report += `### ${bug.id}: ${bug.title}

**Severity**: ${bug.severity}
**Category**: ${bug.category}

**Description**:
${bug.description}

`;
      if (bug.details && bug.details.length > 0) {
        report += `**Details**:\n`;
        bug.details.forEach(d => {
          report += `- ${d}\n`;
        });
        report += '\n';
      }
      report += `---\n\n`;
    }
  }

  // Recommendations
  report += `## Recommendations

`;

  const criticalBugs = bugs.filter(b => b.severity === 'Critical');
  const highBugs = bugs.filter(b => b.severity === 'High');

  if (criticalBugs.length > 0) {
    report += `### Critical Issues (Must Fix Before Launch)\n\n`;
    criticalBugs.forEach(b => {
      report += `1. **${b.id}**: ${b.title}\n`;
    });
    report += '\n';
  }

  if (highBugs.length > 0) {
    report += `### High Priority Issues (Should Fix Before Launch)\n\n`;
    highBugs.forEach(b => {
      report += `1. **${b.id}**: ${b.title}\n`;
    });
    report += '\n';
  }

  report += `## Launch Readiness Assessment

`;

  if (criticalBugs.length > 0) {
    report += `**RECOMMENDATION**: ❌ NO-GO

**Reason**: ${criticalBugs.length} critical issue(s) must be resolved before launch.
`;
  } else if (highBugs.length > 3) {
    report += `**RECOMMENDATION**: ⚠️ CONDITIONAL GO

**Requirements**:
1. Address high-priority issues
2. Regenerate missing data files
`;
  } else {
    report += `**RECOMMENDATION**: ✅ GO

Data validation passed. Core functionality should work correctly.
`;
  }

  const reportPath = path.join(process.cwd(), 'BUG_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n${colors.green}Bug report saved to: ${reportPath}${colors.reset}`);
}

// Run the validation
runValidation()
  .then(result => {
    process.exit(result.failedTests > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
