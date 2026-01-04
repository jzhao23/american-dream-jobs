/**
 * Validate AI Resilience Classifications v2.0
 *
 * This script tests the additive scoring classification algorithm against 14 required
 * test cases to ensure the AI Resilience system produces expected results.
 *
 * ## Scoring System (v2.0)
 * - AI Exposure: β < 0.25 → +2 (Low), 0.25-0.50 → +1 (Medium), > 0.50 → +0 (High)
 * - Job Growth: > 5% → +2 (Growing), 0-5% → +1 (Stable), < 0% → +0 (Declining)
 * - Human Advantage: ≥ 20 → +2 (Strong), 12-19 → +1 (Moderate), < 12 → +0 (Weak)
 *
 * ## Classification from Total Score
 * - 5-6: AI-Resilient
 * - 3-4: AI-Augmented
 * - 2: In Transition
 * - 0-1: High Disruption Risk
 *
 * ## Usage
 * ```bash
 * npx tsx scripts/validate-classifications.ts
 * ```
 *
 * ## Exit Codes
 * - 0: All tests passed
 * - 1: One or more tests failed
 */

import {
  calculateAIResilience,
  scoreExposure,
  scoreGrowth,
  scoreEpoch,
  type AIResilienceClassification
} from '../src/lib/ai-resilience';

// ============================================================================
// Test Case Definitions
// ============================================================================

interface TestCase {
  name: string;
  onetCode: string;
  inputs: {
    exposureBeta: number;     // 0-1 (GPTs β score)
    growthPercent: number;    // BLS projection %
    epochSum: number;         // 5-25 (EPOCH sum)
  };
  expectedScoring: {
    exposurePoints: number;
    exposureLabel: 'Low' | 'Medium' | 'High';
    growthPoints: number;
    growthLabel: 'Declining' | 'Stable' | 'Growing';
    epochPoints: number;
    epochLabel: 'Weak' | 'Moderate' | 'Strong';
    totalScore: number;
  };
  expectedClassification: AIResilienceClassification;
  notes?: string;
}

/**
 * 14 Required Test Cases from PRD
 *
 * These cases are specified in the AI Resilience v2.0 PRD
 * and must all pass for the classification system to be valid.
 */
const TEST_CASES: TestCase[] = [
  // TEST 1: Electricians → 🟢 AI-Resilient (Score 6)
  {
    name: 'Electricians',
    onetCode: '47-2111.00',
    inputs: {
      exposureBeta: 0.04,    // Low (<0.25)
      growthPercent: 6,      // Growing (>5%)
      epochSum: 21,          // Strong (≥20)
    },
    expectedScoring: {
      exposurePoints: 2, exposureLabel: 'Low',
      growthPoints: 2, growthLabel: 'Growing',
      epochPoints: 2, epochLabel: 'Strong',
      totalScore: 6,
    },
    expectedClassification: 'AI-Resilient',
    notes: 'Low exposure + Growing + Strong EPOCH = Perfect score',
  },

  // TEST 2: Registered Nurses → 🟢 AI-Resilient (Score 5)
  {
    name: 'Registered Nurses',
    onetCode: '29-1141.00',
    inputs: {
      exposureBeta: 0.35,    // Medium (0.25-0.50)
      growthPercent: 6,      // Growing (>5%)
      epochSum: 22,          // Strong (≥20)
    },
    expectedScoring: {
      exposurePoints: 1, exposureLabel: 'Medium',
      growthPoints: 2, growthLabel: 'Growing',
      epochPoints: 2, epochLabel: 'Strong',
      totalScore: 5,
    },
    expectedClassification: 'AI-Resilient',
    notes: 'Medium exposure offset by Growing + Strong human advantage',
  },

  // TEST 3: Surgeons → 🟢 AI-Resilient (Score 5)
  {
    name: 'Surgeons',
    onetCode: '29-1241.00',
    inputs: {
      exposureBeta: 0.12,    // Low (<0.25)
      growthPercent: 3,      // Stable (0-5%)
      epochSum: 23,          // Strong (≥20)
    },
    expectedScoring: {
      exposurePoints: 2, exposureLabel: 'Low',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 2, epochLabel: 'Strong',
      totalScore: 5,
    },
    expectedClassification: 'AI-Resilient',
    notes: 'Low exposure + Strong EPOCH compensates for stable growth',
  },

  // TEST 4: Software Developers → 🟡 AI-Augmented (Score 4)
  {
    name: 'Software Developers',
    onetCode: '15-1252.00',
    inputs: {
      exposureBeta: 0.34,    // Medium (0.25-0.50)
      growthPercent: 17,     // Growing (>5%)
      epochSum: 16,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 1, exposureLabel: 'Medium',
      growthPoints: 2, growthLabel: 'Growing',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 4,
    },
    expectedClassification: 'AI-Augmented',
    notes: 'Growing demand but medium exposure and moderate EPOCH',
  },

  // TEST 5: Lawyers → 🟡 AI-Augmented (Score 3)
  {
    name: 'Lawyers',
    onetCode: '23-1011.00',
    inputs: {
      exposureBeta: 0.40,    // Medium (0.25-0.50)
      growthPercent: 4,      // Stable (0-5%)
      epochSum: 17,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 1, exposureLabel: 'Medium',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 3,
    },
    expectedClassification: 'AI-Augmented',
    notes: 'All moderate scores = Augmented',
  },

  // TEST 6: Accountants → 🟠 In Transition (Score 2)
  {
    name: 'Accountants',
    onetCode: '13-2011.00',
    inputs: {
      exposureBeta: 0.65,    // High (>0.50)
      growthPercent: 4,      // Stable (0-5%)
      epochSum: 15,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 2,
    },
    expectedClassification: 'In Transition',
    notes: 'High exposure with only stable growth and moderate EPOCH',
  },

  // TEST 7: Writers and Authors → 🔴 High Disruption Risk (Score 1)
  {
    name: 'Writers and Authors',
    onetCode: '27-3043.00',
    inputs: {
      exposureBeta: 0.82,    // High (>0.50)
      growthPercent: -5,     // Declining (<0%)
      epochSum: 14,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 0, growthLabel: 'Declining',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 1,
    },
    expectedClassification: 'High Disruption Risk',
    notes: 'High exposure + declining demand, only moderate EPOCH',
  },

  // TEST 8: Data Entry Keyers → 🔴 High Disruption Risk (Score 0)
  {
    name: 'Data Entry Keyers',
    onetCode: '43-9021.00',
    inputs: {
      exposureBeta: 0.85,    // High (>0.50)
      growthPercent: -25,    // Declining (<0%)
      epochSum: 8,           // Weak (<12)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 0, growthLabel: 'Declining',
      epochPoints: 0, epochLabel: 'Weak',
      totalScore: 0,
    },
    expectedClassification: 'High Disruption Risk',
    notes: 'Maximum risk - all factors negative',
  },

  // TEST 9: Interpreters/Translators → 🔴 High Disruption Risk (Score 1)
  {
    name: 'Interpreters and Translators',
    onetCode: '27-3091.00',
    inputs: {
      exposureBeta: 0.75,    // High (>0.50)
      growthPercent: -4,     // Declining (<0%)
      epochSum: 15,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 0, growthLabel: 'Declining',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 1,
    },
    expectedClassification: 'High Disruption Risk',
    notes: 'High LLM exposure + declining demand',
  },

  // TEST 10: Mathematicians → 🟠 In Transition (Score 2)
  {
    name: 'Mathematicians',
    onetCode: '15-2021.00',
    inputs: {
      exposureBeta: 0.60,    // High (>0.50)
      growthPercent: 3,      // Stable (0-5%)
      epochSum: 17,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 2,
    },
    expectedClassification: 'In Transition',
    notes: 'High exposure but stable demand and moderate EPOCH',
  },

  // TEST 11: Plumbers → 🟢 AI-Resilient (Score 5)
  {
    name: 'Plumbers',
    onetCode: '47-2152.00',
    inputs: {
      exposureBeta: 0.05,    // Low (<0.25)
      growthPercent: 4,      // Stable (0-5%)
      epochSum: 20,          // Strong (≥20)
    },
    expectedScoring: {
      exposurePoints: 2, exposureLabel: 'Low',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 2, epochLabel: 'Strong',
      totalScore: 5,
    },
    expectedClassification: 'AI-Resilient',
    notes: 'Low exposure + Strong EPOCH = resilient despite stable growth',
  },

  // TEST 12: Marketing Managers → 🟠 In Transition (Score 2)
  {
    name: 'Marketing Managers',
    onetCode: '11-2021.00',
    inputs: {
      exposureBeta: 0.50,    // High (>0.50, edge case at boundary)
      growthPercent: 4,      // Stable (0-5%)
      epochSum: 16,          // Moderate (12-19)
    },
    expectedScoring: {
      exposurePoints: 1, exposureLabel: 'Medium', // At boundary, 0.50 is Medium
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 1, epochLabel: 'Moderate',
      totalScore: 3,
    },
    expectedClassification: 'AI-Augmented',
    notes: 'Edge case - 0.50 is Medium exposure (boundary)',
  },

  // TEST 13: Elementary Teachers → 🟡 AI-Augmented (Score 4)
  {
    name: 'Elementary Teachers',
    onetCode: '25-2021.00',
    inputs: {
      exposureBeta: 0.30,    // Medium (0.25-0.50)
      growthPercent: 2,      // Stable (0-5%)
      epochSum: 22,          // Strong (≥20)
    },
    expectedScoring: {
      exposurePoints: 1, exposureLabel: 'Medium',
      growthPoints: 1, growthLabel: 'Stable',
      epochPoints: 2, epochLabel: 'Strong',
      totalScore: 4,
    },
    expectedClassification: 'AI-Augmented',
    notes: 'Strong EPOCH but medium exposure and stable growth',
  },

  // TEST 14: Tax Preparers → 🔴 High Disruption Risk (Score 0)
  {
    name: 'Tax Preparers',
    onetCode: '13-2082.00',
    inputs: {
      exposureBeta: 0.90,    // High (>0.50)
      growthPercent: -5,     // Declining (<0%)
      epochSum: 10,          // Weak (<12)
    },
    expectedScoring: {
      exposurePoints: 0, exposureLabel: 'High',
      growthPoints: 0, growthLabel: 'Declining',
      epochPoints: 0, epochLabel: 'Weak',
      totalScore: 0,
    },
    expectedClassification: 'High Disruption Risk',
    notes: 'All factors negative = maximum risk',
  },
];

// ============================================================================
// Test Runner
// ============================================================================

interface TestResult {
  test: TestCase;
  actual: {
    exposurePoints: number;
    exposureLabel: string;
    growthPoints: number;
    growthLabel: string;
    epochPoints: number;
    epochLabel: string;
    totalScore: number;
    classification: AIResilienceClassification;
  };
  passed: boolean;
  scoringMatch: boolean;
}

function runTests(): { passed: number; failed: number; results: TestResult[] } {
  console.log('\n=== AI Resilience Classification Validation (v2.0) ===\n');
  console.log('Testing additive scoring algorithm...\n');

  let passed = 0;
  let failed = 0;
  const results: TestResult[] = [];

  for (const test of TEST_CASES) {
    const result = calculateAIResilience({
      gptsExposureBeta: test.inputs.exposureBeta,
      aioeExposure: null,
      blsGrowthPercent: test.inputs.growthPercent,
      epochSum: test.inputs.epochSum,
    });

    // Check if classification matches
    const classificationMatch = result.classification === test.expectedClassification;

    // Check if scoring matches
    const scoringMatch =
      result.exposurePoints === test.expectedScoring.exposurePoints &&
      result.growthPoints === test.expectedScoring.growthPoints &&
      result.humanAdvantagePoints === test.expectedScoring.epochPoints &&
      result.totalScore === test.expectedScoring.totalScore;

    const testPassed = classificationMatch && scoringMatch;

    results.push({
      test,
      actual: {
        exposurePoints: result.exposurePoints,
        exposureLabel: result.exposureLabel,
        growthPoints: result.growthPoints,
        growthLabel: result.growthLabel,
        epochPoints: result.humanAdvantagePoints,
        epochLabel: result.humanAdvantageLabel,
        totalScore: result.totalScore,
        classification: result.classification,
      },
      passed: testPassed,
      scoringMatch,
    });

    if (testPassed) {
      passed++;
      console.log(`✅ ${test.name}: ${result.totalScore}/6 → ${result.classification}`);
    } else {
      failed++;
      console.log(`❌ ${test.name}:`);
      console.log(`   Expected: ${test.expectedScoring.totalScore}/6 → ${test.expectedClassification}`);
      console.log(`   Actual:   ${result.totalScore}/6 → ${result.classification}`);
      console.log(`   Scoring breakdown:`);
      console.log(`     Exposure: ${result.exposureLabel} (${result.exposurePoints}pts) expected ${test.expectedScoring.exposureLabel} (${test.expectedScoring.exposurePoints}pts)`);
      console.log(`     Growth:   ${result.growthLabel} (${result.growthPoints}pts) expected ${test.expectedScoring.growthLabel} (${test.expectedScoring.growthPoints}pts)`);
      console.log(`     EPOCH:    ${result.humanAdvantageLabel} (${result.humanAdvantagePoints}pts) expected ${test.expectedScoring.epochLabel} (${test.expectedScoring.epochPoints}pts)`);
    }
  }

  return { passed, failed, results };
}

// ============================================================================
// Test Scoring Functions Directly
// ============================================================================

function testScoringFunctions(): boolean {
  console.log('\n=== Testing Scoring Functions ===\n');

  let allPassed = true;

  // Test scoreExposure
  const exposureTests = [
    { beta: 0.10, expected: { points: 2, label: 'Low' } },
    { beta: 0.24, expected: { points: 2, label: 'Low' } },
    { beta: 0.25, expected: { points: 1, label: 'Medium' } },
    { beta: 0.50, expected: { points: 1, label: 'Medium' } },
    { beta: 0.51, expected: { points: 0, label: 'High' } },
    { beta: 0.90, expected: { points: 0, label: 'High' } },
  ];

  for (const t of exposureTests) {
    const result = scoreExposure(t.beta);
    const passed = result.points === t.expected.points && result.label === t.expected.label;
    if (!passed) {
      console.log(`❌ scoreExposure(${t.beta}): got ${result.label}(${result.points}), expected ${t.expected.label}(${t.expected.points})`);
      allPassed = false;
    }
  }

  // Test scoreGrowth
  const growthTests = [
    { percent: 10, expected: { points: 2, label: 'Growing' } },
    { percent: 6, expected: { points: 2, label: 'Growing' } },
    { percent: 5, expected: { points: 1, label: 'Stable' } },
    { percent: 0, expected: { points: 1, label: 'Stable' } },
    { percent: -1, expected: { points: 0, label: 'Declining' } },
    { percent: -10, expected: { points: 0, label: 'Declining' } },
  ];

  for (const t of growthTests) {
    const result = scoreGrowth(t.percent);
    const passed = result.points === t.expected.points && result.label === t.expected.label;
    if (!passed) {
      console.log(`❌ scoreGrowth(${t.percent}): got ${result.label}(${result.points}), expected ${t.expected.label}(${t.expected.points})`);
      allPassed = false;
    }
  }

  // Test scoreEpoch
  const epochTests = [
    { sum: 22, expected: { points: 2, label: 'Strong' } },
    { sum: 20, expected: { points: 2, label: 'Strong' } },
    { sum: 19, expected: { points: 1, label: 'Moderate' } },
    { sum: 12, expected: { points: 1, label: 'Moderate' } },
    { sum: 11, expected: { points: 0, label: 'Weak' } },
    { sum: 5, expected: { points: 0, label: 'Weak' } },
  ];

  for (const t of epochTests) {
    const result = scoreEpoch(t.sum);
    const passed = result.points === t.expected.points && result.label === t.expected.label;
    if (!passed) {
      console.log(`❌ scoreEpoch(${t.sum}): got ${result.label}(${result.points}), expected ${t.expected.label}(${t.expected.points})`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('✅ All scoring function tests passed');
  }

  return allPassed;
}

// ============================================================================
// Main
// ============================================================================

function main() {
  // First test the scoring functions
  const scoringPassed = testScoringFunctions();

  // Then run the full classification tests
  const { passed, failed, results } = runTests();

  console.log('\n=== Summary ===');
  console.log(`Classification Tests: ${passed}/${TEST_CASES.length} passed`);

  if (failed > 0 || !scoringPassed) {
    console.log('\n❌ VALIDATION FAILED');

    if (failed > 0) {
      console.log('\nFailed classification tests:');
      for (const result of results) {
        if (!result.passed) {
          console.log(`  - ${result.test.name}: expected ${result.test.expectedClassification}, got ${result.actual.classification}`);
        }
      }
    }

    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED');
    console.log('All 14 test cases produce expected classifications with correct scoring');
    process.exit(0);
  }
}

main();
