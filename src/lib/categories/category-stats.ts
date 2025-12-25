/**
 * Category Statistics Computation
 *
 * Utility functions to compute aggregate statistics for career categories.
 */

import type { CareerIndex, TrainingTime } from '@/types/career';
import type { CategoryId } from './onet-category-mapping';

export interface CategoryStats {
  totalCareers: number;
  medianPay: number;
  avgAIRisk: number;
  avgImportance: number;
  trainingDistribution: Record<TrainingTime, number>;
  topCareers: CareerIndex[];
}

/**
 * Compute statistics for a specific category from career data
 */
export function computeCategoryStats(
  careers: CareerIndex[],
  categoryId: CategoryId
): CategoryStats {
  const categoryCarers = careers.filter((c) => c.category === categoryId);

  if (categoryCarers.length === 0) {
    return {
      totalCareers: 0,
      medianPay: 0,
      avgAIRisk: 0,
      avgImportance: 0,
      trainingDistribution: {
        '<6mo': 0,
        '6-24mo': 0,
        '2-4yr': 0,
        '4+yr': 0,
      },
      topCareers: [],
    };
  }

  // Calculate median pay
  const sortedPays = categoryCarers
    .map((c) => c.median_pay)
    .sort((a, b) => a - b);
  const midIndex = Math.floor(sortedPays.length / 2);
  const medianPay =
    sortedPays.length % 2 === 0
      ? (sortedPays[midIndex - 1] + sortedPays[midIndex]) / 2
      : sortedPays[midIndex];

  // Calculate averages
  const avgAIRisk =
    categoryCarers.reduce((sum, c) => sum + c.ai_risk, 0) / categoryCarers.length;
  const avgImportance =
    categoryCarers.reduce((sum, c) => sum + c.importance, 0) / categoryCarers.length;

  // Training distribution
  const trainingDistribution: Record<TrainingTime, number> = {
    '<6mo': 0,
    '6-24mo': 0,
    '2-4yr': 0,
    '4+yr': 0,
  };
  categoryCarers.forEach((c) => {
    trainingDistribution[c.training_time]++;
  });

  // Top careers by importance
  const topCareers = [...categoryCarers]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5);

  return {
    totalCareers: categoryCarers.length,
    medianPay: Math.round(medianPay),
    avgAIRisk: Math.round(avgAIRisk * 10) / 10,
    avgImportance: Math.round(avgImportance * 10) / 10,
    trainingDistribution,
    topCareers,
  };
}

/**
 * Get careers filtered by category
 */
export function getCareersByCategory(
  careers: CareerIndex[],
  categoryId: CategoryId
): CareerIndex[] {
  return careers.filter((c) => c.category === categoryId);
}

/**
 * Get AI risk level label
 */
export function getAIRiskLevel(avgRisk: number): string {
  if (avgRisk <= 3) return 'Low';
  if (avgRisk <= 6) return 'Medium';
  return 'High';
}

/**
 * Format category stats for display in header
 */
export function formatCategoryStatsSummary(stats: CategoryStats): string[] {
  return [
    `${stats.totalCareers} careers`,
    `$${Math.round(stats.medianPay / 1000)}k median pay`,
    `${getAIRiskLevel(stats.avgAIRisk)} AI risk`,
  ];
}
