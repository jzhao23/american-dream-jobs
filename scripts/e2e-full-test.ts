/**
 * Full E2E Testing Script for American Dream Jobs
 *
 * Tests EVERY route, page, career, and specialization in the application.
 * Run with: npx tsx scripts/e2e-full-test.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'https://www.americandreamjobs.org';
const BATCH_SIZE = 10;
const REQUEST_DELAY_MS = 200;
const TIMEOUT_MS = 30000;

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
}

interface Specialization {
  slug: string;
  title: string;
  career_slug: string;
}

interface TestResult {
  url: string;
  status: number;
  success: boolean;
  error?: string;
  responseTime: number;
  category?: string;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  errors: TestResult[];
  avgResponseTime: number;
}

// Bug report structure
interface Bug {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Routes' | 'Data' | 'Performance' | 'Links' | 'UI';
  status: 'Open';
  affectedUrls: string[];
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
}

// Global state
let bugCounter = 0;
const bugs: Bug[] = [];

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AmericanDreamJobs-E2E-Test/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Test a single URL and return result
async function testUrl(url: string, category?: string): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await fetchWithTimeout(url);
    const responseTime = Date.now() - startTime;

    return {
      url,
      status: response.status,
      success: response.status >= 200 && response.status < 400,
      responseTime,
      category,
    };
  } catch (error) {
    return {
      url,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      category,
    };
  }
}

// Test multiple URLs in batches with progress reporting
async function testUrlBatch(
  urls: Array<{ url: string; category?: string }>,
  label: string
): Promise<TestSummary> {
  const results: TestResult[] = [];
  const total = urls.length;

  console.log(`\n${colors.cyan}Testing ${label} (${total} URLs)...${colors.reset}`);

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(({ url, category }) => testUrl(url, category))
    );
    results.push(...batchResults);

    // Progress indicator
    const progress = Math.min(i + BATCH_SIZE, total);
    const percent = Math.round((progress / total) * 100);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    process.stdout.write(
      `\r  Progress: ${progress}/${total} (${percent}%) - ` +
        `${colors.green}${successCount} passed${colors.reset}, ` +
        `${colors.red}${failCount} failed${colors.reset}`
    );

    // Small delay between batches
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  console.log(''); // New line after progress

  const failures = results.filter(r => !r.success);
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  return {
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: failures.length,
    errors: failures,
    avgResponseTime,
  };
}

// Add a bug to the report
function addBug(bug: Omit<Bug, 'id' | 'status'>): void {
  bugCounter++;
  bugs.push({
    ...bug,
    id: `BUG-${String(bugCounter).padStart(3, '0')}`,
    status: 'Open',
  });
}

// Generate bug report markdown
function generateBugReport(
  summaries: { [key: string]: TestSummary },
  totalTime: number
): string {
  const now = new Date().toISOString().split('T')[0];

  // Count bugs by severity
  const severityCounts = {
    Critical: bugs.filter(b => b.severity === 'Critical').length,
    High: bugs.filter(b => b.severity === 'High').length,
    Medium: bugs.filter(b => b.severity === 'Medium').length,
    Low: bugs.filter(b => b.severity === 'Low').length,
  };

  // Count bugs by category
  const categoryCounts = {
    Routes: bugs.filter(b => b.category === 'Routes').length,
    Data: bugs.filter(b => b.category === 'Data').length,
    Performance: bugs.filter(b => b.category === 'Performance').length,
    Links: bugs.filter(b => b.category === 'Links').length,
    UI: bugs.filter(b => b.category === 'UI').length,
  };

  let report = `# American Dream Job Board: E2E Test Bug Report

## Report Generated: ${now}
## Tester: Claude Code E2E Test Script
## Environment: ${BASE_URL}
## Total Test Duration: ${(totalTime / 1000).toFixed(1)} seconds

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Pages Tested | ${Object.values(summaries).reduce((sum, s) => sum + s.totalTests, 0)} |
| Total Passed | ${Object.values(summaries).reduce((sum, s) => sum + s.passed, 0)} |
| Total Failed | ${Object.values(summaries).reduce((sum, s) => sum + s.failed, 0)} |
| Total Bugs Found | ${bugs.length} |

### By Severity

| Severity | Count |
|----------|-------|
| Critical | ${severityCounts.Critical} |
| High | ${severityCounts.High} |
| Medium | ${severityCounts.Medium} |
| Low | ${severityCounts.Low} |

### By Category

| Category | Count |
|----------|-------|
| Routes | ${categoryCounts.Routes} |
| Data | ${categoryCounts.Data} |
| Performance | ${categoryCounts.Performance} |
| Links | ${categoryCounts.Links} |
| UI | ${categoryCounts.UI} |

---

## Test Results by Section

`;

  // Add section summaries
  for (const [section, summary] of Object.entries(summaries)) {
    const passRate = ((summary.passed / summary.totalTests) * 100).toFixed(1);
    const status = summary.failed === 0 ? '✅ PASS' : '❌ FAIL';

    report += `### ${section}

| Metric | Value |
|--------|-------|
| Status | ${status} |
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Pass Rate | ${passRate}% |
| Avg Response Time | ${summary.avgResponseTime.toFixed(0)}ms |

`;

    if (summary.errors.length > 0) {
      report += `**Failed URLs:**\n\n`;
      for (const error of summary.errors.slice(0, 20)) {
        report += `- \`${error.url}\` - Status: ${error.status}${error.error ? ` - Error: ${error.error}` : ''}\n`;
      }
      if (summary.errors.length > 20) {
        report += `- ... and ${summary.errors.length - 20} more\n`;
      }
      report += '\n';
    }
  }

  // Add bugs
  if (bugs.length > 0) {
    report += `---

## Bug Entries

`;

    for (const bug of bugs) {
      report += `### ${bug.id}: ${bug.title}

**Severity**: ${bug.severity}
**Category**: ${bug.category}
**Status**: ${bug.status}
**Affected URLs**: ${bug.affectedUrls.length} page(s)

**Description**:
${bug.description}

**Expected Behavior**:
${bug.expectedBehavior}

**Actual Behavior**:
${bug.actualBehavior}

${bug.affectedUrls.length <= 10 ? `**URLs**:\n${bug.affectedUrls.map(u => `- ${u}`).join('\n')}` : `**Sample URLs** (showing first 10 of ${bug.affectedUrls.length}):\n${bug.affectedUrls.slice(0, 10).map(u => `- ${u}`).join('\n')}`}

---

`;
    }
  }

  // Add recommendations
  report += `## Recommendations

`;

  if (bugs.filter(b => b.severity === 'Critical').length > 0) {
    report += `1. **CRITICAL**: Address all critical bugs before alpha launch\n`;
  }

  if (bugs.filter(b => b.category === 'Routes').length > 0) {
    report += `2. Fix broken routes/404 errors to ensure all pages are accessible\n`;
  }

  if (bugs.filter(b => b.category === 'Performance').length > 0) {
    report += `3. Optimize slow pages to improve user experience\n`;
  }

  report += `
## Launch Readiness Assessment

`;

  const criticalBugs = bugs.filter(b => b.severity === 'Critical').length;
  const highBugs = bugs.filter(b => b.severity === 'High').length;

  if (criticalBugs > 0) {
    report += `**RECOMMENDATION**: ❌ NO-GO

**Reason**: ${criticalBugs} critical bug(s) must be fixed before launch.
`;
  } else if (highBugs > 5) {
    report += `**RECOMMENDATION**: ⚠️ CONDITIONAL GO

**Requirements**:
1. Fix at least the high-severity bugs affecting core functionality
2. Monitor error rates post-launch
`;
  } else {
    report += `**RECOMMENDATION**: ✅ GO

All critical systems functional. Minor issues can be addressed post-launch.
`;
  }

  return report;
}

// Main test runner
async function runFullE2ETests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     American Dream Jobs - Full E2E Test Suite              ║${colors.reset}`);
  console.log(`${colors.cyan}║     Testing: ${BASE_URL.padEnd(42)}║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const startTime = Date.now();
  const summaries: { [key: string]: TestSummary } = {};

  // Load data
  console.log(`\n${colors.dim}Loading test data...${colors.reset}`);

  const careersPath = path.join(process.cwd(), 'data/output/careers-index.json');
  const careers: Career[] = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));

  const specsPath = path.join(process.cwd(), 'data/output/specializations.json');
  const specializations: Specialization[] = JSON.parse(fs.readFileSync(specsPath, 'utf-8'));

  const categories = [...new Set(careers.map(c => c.category))];

  console.log(`  Loaded ${careers.length} careers`);
  console.log(`  Loaded ${specializations.length} specializations`);
  console.log(`  Found ${categories.length} categories`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Main Routes
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 1: Main Routes${colors.reset}`);

  const mainRoutes = [
    { url: `${BASE_URL}/`, category: 'Home' },
    { url: `${BASE_URL}/compass`, category: 'Compass' },
    { url: `${BASE_URL}/compare`, category: 'Compare' },
    { url: `${BASE_URL}/calculator`, category: 'Calculator' },
    { url: `${BASE_URL}/local-jobs`, category: 'Local Jobs' },
    { url: `${BASE_URL}/methodology`, category: 'Methodology' },
    { url: `${BASE_URL}/contribute`, category: 'Contribute' },
    { url: `${BASE_URL}/categories`, category: 'Categories' },
    { url: `${BASE_URL}/legal`, category: 'Legal' },
    { url: `${BASE_URL}/request`, category: 'Request' },
    { url: `${BASE_URL}/compass-results`, category: 'Compass Results' },
    { url: `${BASE_URL}/paths/healthcare-nonclinical`, category: 'Path' },
    { url: `${BASE_URL}/paths/tech-no-degree`, category: 'Path' },
    { url: `${BASE_URL}/paths/skilled-trades`, category: 'Path' },
    { url: `${BASE_URL}/paths/transportation-logistics`, category: 'Path' },
  ];

  summaries['Main Routes'] = await testUrlBatch(mainRoutes, 'Main Routes');

  // Check for failures
  if (summaries['Main Routes'].failed > 0) {
    addBug({
      title: 'Main Route(s) Not Accessible',
      severity: 'Critical',
      category: 'Routes',
      affectedUrls: summaries['Main Routes'].errors.map(e => e.url),
      description: 'One or more main application routes returned non-200 status codes.',
      expectedBehavior: 'All main routes should return HTTP 200 status',
      actualBehavior: `${summaries['Main Routes'].failed} route(s) failed to load`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Category Pages
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 2: Category Pages${colors.reset}`);

  const categoryUrls = categories.map(cat => ({
    url: `${BASE_URL}/categories/${cat}`,
    category: cat,
  }));

  summaries['Category Pages'] = await testUrlBatch(categoryUrls, 'Category Pages');

  if (summaries['Category Pages'].failed > 0) {
    addBug({
      title: 'Category Page(s) Not Accessible',
      severity: 'High',
      category: 'Routes',
      affectedUrls: summaries['Category Pages'].errors.map(e => e.url),
      description: 'One or more category pages returned non-200 status codes.',
      expectedBehavior: 'All category pages should return HTTP 200 status',
      actualBehavior: `${summaries['Category Pages'].failed} category page(s) failed to load`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: ALL Career Pages
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 3: All Career Pages (${careers.length} careers)${colors.reset}`);

  const careerUrls = careers.map(c => ({
    url: `${BASE_URL}/careers/${c.slug}`,
    category: c.category,
  }));

  summaries['Career Pages'] = await testUrlBatch(careerUrls, 'Career Pages');

  if (summaries['Career Pages'].failed > 0) {
    addBug({
      title: 'Career Page(s) Not Accessible',
      severity: summaries['Career Pages'].failed > 10 ? 'Critical' : 'High',
      category: 'Routes',
      affectedUrls: summaries['Career Pages'].errors.map(e => e.url),
      description: 'One or more career pages returned non-200 status codes.',
      expectedBehavior: 'All career pages should return HTTP 200 status',
      actualBehavior: `${summaries['Career Pages'].failed} career page(s) failed to load`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: ALL Specialization Pages
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 4: All Specialization Pages (${specializations.length} specializations)${colors.reset}`);

  const specUrls = specializations.map(s => ({
    url: `${BASE_URL}/specializations/${s.slug}`,
    category: 'specialization',
  }));

  summaries['Specialization Pages'] = await testUrlBatch(specUrls, 'Specialization Pages');

  if (summaries['Specialization Pages'].failed > 0) {
    addBug({
      title: 'Specialization Page(s) Not Accessible',
      severity: summaries['Specialization Pages'].failed > 50 ? 'Critical' : 'High',
      category: 'Routes',
      affectedUrls: summaries['Specialization Pages'].errors.map(e => e.url),
      description: 'One or more specialization pages returned non-200 status codes.',
      expectedBehavior: 'All specialization pages should return HTTP 200 status',
      actualBehavior: `${summaries['Specialization Pages'].failed} specialization page(s) failed to load`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: Performance Checks
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 5: Performance Analysis${colors.reset}`);

  // Check for slow pages
  const allResults = [
    ...summaries['Main Routes'].errors,
    ...summaries['Category Pages'].errors,
    ...summaries['Career Pages'].errors,
    ...summaries['Specialization Pages'].errors,
  ];

  // Find pages with response time > 5 seconds
  const slowPages = Object.values(summaries)
    .flatMap(s => s.errors)
    .filter(r => r.responseTime > 5000);

  if (slowPages.length > 0) {
    addBug({
      title: 'Slow Page Load Times',
      severity: 'Medium',
      category: 'Performance',
      affectedUrls: slowPages.map(p => p.url),
      description: 'Some pages have load times exceeding 5 seconds.',
      expectedBehavior: 'All pages should load in under 5 seconds',
      actualBehavior: `${slowPages.length} page(s) exceeded 5 second load time`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: Data Integrity Checks
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}PHASE 6: Data Integrity Checks${colors.reset}`);

  // Check for careers without required fields
  const careersWithoutSalary = careers.filter(c => !c.median_pay);
  const careersWithoutTrainingTime = careers.filter(c => !c.training_time);
  const careersWithoutAIResilience = careers.filter(c => !c.ai_resilience);

  console.log(`  Careers without salary: ${careersWithoutSalary.length}`);
  console.log(`  Careers without training time: ${careersWithoutTrainingTime.length}`);
  console.log(`  Careers without AI resilience: ${careersWithoutAIResilience.length}`);

  if (careersWithoutSalary.length > 0) {
    addBug({
      title: 'Careers Missing Salary Data',
      severity: 'Medium',
      category: 'Data',
      affectedUrls: careersWithoutSalary.map(c => `${BASE_URL}/careers/${c.slug}`),
      description: 'Some careers are missing median pay information.',
      expectedBehavior: 'All careers should have salary data',
      actualBehavior: `${careersWithoutSalary.length} careers missing salary data`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Generate Report
  // ═══════════════════════════════════════════════════════════════════════════
  const totalTime = Date.now() - startTime;

  console.log(`\n${colors.yellow}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}GENERATING BUG REPORT${colors.reset}`);

  const report = generateBugReport(summaries, totalTime);
  const reportPath = path.join(process.cwd(), 'BUG_REPORT.md');
  fs.writeFileSync(reportPath, report);

  console.log(`\n${colors.green}Bug report saved to: ${reportPath}${colors.reset}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Final Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    TEST SUMMARY                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const totalTests = Object.values(summaries).reduce((sum, s) => sum + s.totalTests, 0);
  const totalPassed = Object.values(summaries).reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = Object.values(summaries).reduce((sum, s) => sum + s.failed, 0);

  console.log(`\n  Total Pages Tested: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`  Total Bugs: ${bugs.length}`);
  console.log(`  Test Duration: ${(totalTime / 1000).toFixed(1)} seconds`);

  if (bugs.filter(b => b.severity === 'Critical').length > 0) {
    console.log(`\n${colors.red}⚠️  CRITICAL ISSUES FOUND - Review BUG_REPORT.md${colors.reset}`);
  } else if (totalFailed === 0) {
    console.log(`\n${colors.green}✅ ALL TESTS PASSED!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some issues found - Review BUG_REPORT.md${colors.reset}`);
  }

  return { totalTests, totalPassed, totalFailed, bugs: bugs.length };
}

// Run the tests
runFullE2ETests()
  .then(result => {
    process.exit(result.totalFailed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
