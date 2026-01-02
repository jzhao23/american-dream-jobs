/**
 * Validate AI Resilience Classifications
 *
 * This script tests the classification algorithm against 14 required test cases
 * to ensure the AI Resilience system produces expected results.
 *
 * ## Test Cases
 * The test cases cover a range of occupations across all four classification tiers,
 * validating that the algorithm correctly weighs task exposure, job growth, and
 * human advantage factors.
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

import * as fs from 'fs';
import * as path from 'path';
import {
  classifyCareer,
  getJobGrowthCategory,
  type TaskExposure,
  type AutomationPotential,
  type HumanAdvantageCategory,
  type AIResilienceClassification
} from '../src/lib/ai-resilience';

// ============================================================================
// Test Case Definitions
// ============================================================================

interface TestCase {
  name: string;
  onetCode: string;
  inputs: {
    taskExposure: TaskExposure;
    automationPotential: AutomationPotential;
    jobGrowthPercent: number;
    humanAdvantage: HumanAdvantageCategory;
  };
  expected: AIResilienceClassification;
  notes?: string;
}

/**
 * 14 Required Test Cases
 *
 * These cases are specified in the AI Resilience implementation requirements
 * and must all pass for the classification system to be considered valid.
 */
const TEST_CASES: TestCase[] = [
  // AI-AUGMENTED expectations
  {
    name: 'Software Developer',
    onetCode: '15-1252.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'Medium',
      jobGrowthPercent: 17, // Growing Quickly
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Augmented',
    notes: 'High exposure but growing quickly - Rule 1 gives Resilient, but moderate EPOCH suggests Augmented'
  },

  // AI-RESILIENT expectations
  {
    name: 'Registered Nurse',
    onetCode: '29-1141.00',
    inputs: {
      taskExposure: 'Medium',
      automationPotential: 'Low',
      jobGrowthPercent: 6, // Growing Slowly
      humanAdvantage: 'Strong'
    },
    expected: 'AI-Resilient',
    notes: 'Strong human advantage + not high exposure = Rule 2'
  },

  // HIGH DISRUPTION RISK expectations
  {
    name: 'Data Entry Clerk',
    onetCode: '43-9021.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'High',
      jobGrowthPercent: -25, // Declining Quickly
      humanAdvantage: 'Weak'
    },
    expected: 'High Disruption Risk',
    notes: 'Maximum risk factors aligned - Rule 10'
  },

  // AI-RESILIENT expectations
  {
    name: 'Electrician',
    onetCode: '47-2111.00',
    inputs: {
      taskExposure: 'Low',
      automationPotential: 'Low',
      jobGrowthPercent: 11, // Growing Slowly
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Resilient',
    notes: 'Low exposure + growing slowly = Rule 3'
  },

  // IN TRANSITION expectations
  {
    name: 'Paralegal',
    onetCode: '23-2011.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'Medium',
      jobGrowthPercent: -5, // Declining Slowly
      humanAdvantage: 'Moderate'
    },
    expected: 'In Transition',
    notes: 'High exposure + declining slowly + moderate = Rule 7'
  },

  // HIGH DISRUPTION RISK expectations
  {
    name: 'Truck Driver',
    onetCode: '53-3032.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'High',
      jobGrowthPercent: -8, // Declining Slowly
      humanAdvantage: 'Weak'
    },
    expected: 'High Disruption Risk',
    notes: 'High exposure + decline + weak human advantage = Rule 11'
  },

  // AI-RESILIENT expectations
  {
    name: 'Physical Therapist',
    onetCode: '29-1123.00',
    inputs: {
      taskExposure: 'Low',
      automationPotential: 'Low',
      jobGrowthPercent: 14, // Growing Slowly
      humanAdvantage: 'Strong'
    },
    expected: 'AI-Resilient',
    notes: 'Strong human advantage + low exposure = Rule 2'
  },

  // AI-AUGMENTED expectations
  {
    name: 'Accountant',
    onetCode: '13-2011.00',
    inputs: {
      taskExposure: 'Medium',
      automationPotential: 'Medium',
      jobGrowthPercent: 4, // Stable
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Augmented',
    notes: 'Medium exposure + moderate human advantage = Rule 5'
  },

  // IN TRANSITION expectations
  {
    name: 'Radiologist',
    onetCode: '29-1224.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'High',
      jobGrowthPercent: 3, // Stable
      humanAdvantage: 'Moderate'
    },
    expected: 'In Transition',
    notes: 'High exposure + stable = Rule 8 (role evolving)'
  },

  // AI-RESILIENT expectations
  {
    name: 'Plumber',
    onetCode: '47-2152.00',
    inputs: {
      taskExposure: 'Low',
      automationPotential: 'Low',
      jobGrowthPercent: 6, // Growing Slowly
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Resilient',
    notes: 'Low exposure + growing slowly = Rule 3'
  },

  // HIGH DISRUPTION RISK expectations
  {
    name: 'Customer Service Rep',
    onetCode: '43-4051.00',
    inputs: {
      taskExposure: 'High',
      automationPotential: 'High',
      jobGrowthPercent: -12, // Declining Quickly
      humanAdvantage: 'Weak'
    },
    expected: 'High Disruption Risk',
    notes: 'High exposure + declining quickly + weak = Rule 10'
  },

  // AI-AUGMENTED expectations
  {
    name: 'Graphic Designer',
    onetCode: '27-1024.00',
    inputs: {
      taskExposure: 'Medium',
      automationPotential: 'Medium',
      jobGrowthPercent: 3, // Stable
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Augmented',
    notes: 'Stable + moderate human advantage = Rule 6'
  },

  // AI-RESILIENT expectations
  {
    name: 'Teacher',
    onetCode: '25-2021.00',
    inputs: {
      taskExposure: 'Low',
      automationPotential: 'Low',
      jobGrowthPercent: 1, // Stable
      humanAdvantage: 'Strong'
    },
    expected: 'AI-Resilient',
    notes: 'Strong human advantage + low exposure = Rule 2'
  },

  // AI-AUGMENTED expectations
  {
    name: 'Financial Analyst',
    onetCode: '13-2051.00',
    inputs: {
      taskExposure: 'Medium',
      automationPotential: 'Medium',
      jobGrowthPercent: 8, // Growing Slowly
      humanAdvantage: 'Moderate'
    },
    expected: 'AI-Augmented',
    notes: 'Medium exposure + moderate human advantage = Rule 5'
  }
];

// ============================================================================
// Test Runner
// ============================================================================

function runTests(): { passed: number; failed: number; results: Array<{ test: TestCase; actual: AIResilienceClassification; passed: boolean }> } {
  console.log('\n=== AI Resilience Classification Validation ===\n');

  let passed = 0;
  let failed = 0;
  const results: Array<{ test: TestCase; actual: AIResilienceClassification; passed: boolean }> = [];

  for (const test of TEST_CASES) {
    const jobGrowth = getJobGrowthCategory(test.inputs.jobGrowthPercent);
    const { classification, rationale } = classifyCareer(
      test.inputs.taskExposure,
      test.inputs.automationPotential,
      jobGrowth,
      test.inputs.humanAdvantage
    );

    const testPassed = classification === test.expected;
    results.push({ test, actual: classification, passed: testPassed });

    if (testPassed) {
      passed++;
      console.log(`✅ ${test.name}: ${classification}`);
    } else {
      failed++;
      console.log(`❌ ${test.name}:`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Actual:   ${classification}`);
      console.log(`   Rationale: ${rationale}`);
      console.log(`   Inputs: Exposure=${test.inputs.taskExposure}, Growth=${jobGrowth}, Human=${test.inputs.humanAdvantage}`);
    }
  }

  return { passed, failed, results };
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const { passed, failed, results } = runTests();

  console.log('\n=== Summary ===');
  console.log(`Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`Failed: ${failed}/${TEST_CASES.length}`);

  if (failed > 0) {
    console.log('\n❌ VALIDATION FAILED - Some test cases did not produce expected results');
    console.log('\nFailed cases:');
    for (const result of results) {
      if (!result.passed) {
        console.log(`  - ${result.test.name}: expected ${result.test.expected}, got ${result.actual}`);
      }
    }
    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED - All 14 test cases produce expected classifications');
    process.exit(0);
  }
}

main();
