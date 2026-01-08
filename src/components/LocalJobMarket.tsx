"use client";

/**
 * LocalJobMarket Component
 *
 * Displays local job market information for a career.
 * Shows employment count, wages, and concentration compared to national.
 */

import { useState, useEffect } from "react";
import { useLocation } from "@/lib/location-context";
import { LocationSelector } from "./LocationSelector";
import { formatPay } from "@/types/career";

interface LocalData {
  employment: number;
  medianWage: number;
  locationQuotient: number;
  growth?: string;
  growthPercent?: number;
}

interface ComparisonData {
  vsNational: {
    wagePercent: number;
    wageDescription: string;
  };
  concentrationDescription: string;
}

interface LocalJobMarketProps {
  careerSlug: string;
  careerTitle: string;
  nationalMedianWage?: number;
}

export function LocalJobMarket({
  careerSlug,
  careerTitle,
  nationalMedianWage,
}: LocalJobMarketProps) {
  const { location, isLoading: locationLoading } = useLocation();
  const [localData, setLocalData] = useState<LocalData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch local data when location changes
  useEffect(() => {
    if (!location) {
      setLocalData(null);
      setComparison(null);
      return;
    }

    const locationCode = location.code;

    async function fetchLocalData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/careers/${careerSlug}/local?location=${locationCode}`
        );
        const data = await response.json();

        if (data.success) {
          setLocalData(data.localData);
          setComparison(data.comparison);
        } else {
          setError(data.error?.message || "No local data available");
          setLocalData(null);
        }
      } catch (err) {
        console.error("Failed to fetch local data:", err);
        setError("Failed to load local data");
      }

      setIsLoading(false);
    }

    fetchLocalData();
  }, [location, careerSlug]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // Get concentration bar width (capped at 200%)
  const getConcentrationWidth = (lq: number): number => {
    return Math.min(100, (lq / 2) * 100);
  };

  // Get wage comparison color
  const getWageColor = (percent: number): string => {
    if (percent > 10) return "text-green-600";
    if (percent > 0) return "text-green-500";
    if (percent > -10) return "text-ds-slate";
    return "text-orange-500";
  };

  // Get growth display info
  const getGrowthInfo = (growth: string | undefined, growthPercent: number | undefined): { label: string; emoji: string; color: string; bgColor: string } | null => {
    if (!growth) return null;

    switch (growth) {
      case "growing-quickly":
        return {
          label: `+${growthPercent?.toFixed(1) || "5+"}%`,
          emoji: "📈",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "growing":
        return {
          label: `+${growthPercent?.toFixed(1) || "1-5"}%`,
          emoji: "📈",
          color: "text-green-500",
          bgColor: "bg-green-50",
        };
      case "stable":
        return {
          label: "Stable",
          emoji: "➡️",
          color: "text-ds-slate",
          bgColor: "bg-gray-50",
        };
      case "declining":
        return {
          label: `${growthPercent?.toFixed(1) || "-"}%`,
          emoji: "📉",
          color: "text-orange-500",
          bgColor: "bg-orange-50",
        };
      default:
        return null;
    }
  };

  // Location not set state
  if (locationLoading) {
    return (
      <section className="card-warm p-6 mb-8">
        <div className="flex items-center gap-2 text-ds-slate-muted">
          <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <span>Loading location...</span>
        </div>
      </section>
    );
  }

  if (!location) {
    return (
      <section className="card-warm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-ds-slate flex items-center gap-2">
            <svg
              className="w-5 h-5 text-sage"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Local Job Market
          </h2>
        </div>

        <div className="text-center py-6">
          <p className="text-ds-slate-muted mb-4">
            Set your location to see local job market data for {careerTitle}
          </p>
          <LocationSelector variant="full" />
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="card-warm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-ds-slate flex items-center gap-2">
            <svg
              className="w-5 h-5 text-sage"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Local Job Market
          </h2>
          <span className="text-sm text-ds-slate-muted">{location.name}</span>
        </div>

        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  // Error/no data state
  if (error || !localData) {
    return (
      <section className="card-warm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-ds-slate flex items-center gap-2">
            <svg
              className="w-5 h-5 text-sage"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Local Job Market
          </h2>
          <LocationSelector variant="header" />
        </div>

        <div className="text-center py-6 text-ds-slate-muted">
          <p className="mb-2">Limited local data available for this career in {location.shortName}.</p>
          <p className="text-sm">This may mean few positions exist in your area.</p>
          {nationalMedianWage && (
            <p className="mt-4 text-sm">
              <span className="font-medium text-ds-slate">National median:</span>{" "}
              {formatPay(nationalMedianWage)}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Full data display
  return (
    <section className="card-warm p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-ds-slate flex items-center gap-2">
          <svg
            className="w-5 h-5 text-sage"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Local Job Market
        </h2>
        <LocationSelector variant="header" />
      </div>

      {/* Stats grid */}
      <div className={`grid ${localData.growth ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'} gap-4 mb-6`}>
        {/* Employment */}
        <div className="text-center p-4 bg-cream rounded-lg">
          <div className="text-2xl font-display font-bold text-sage">
            {formatNumber(localData.employment)}
          </div>
          <div className="text-xs text-ds-slate-muted mt-1">
            Jobs in area
          </div>
        </div>

        {/* Local wage */}
        <div className="text-center p-4 bg-cream rounded-lg">
          <div className="text-2xl font-display font-bold text-sage">
            {formatPay(localData.medianWage)}
          </div>
          <div className="text-xs text-ds-slate-muted mt-1">
            Local median
          </div>
          {comparison && (
            <div
              className={`text-xs mt-1 font-medium ${getWageColor(comparison.vsNational.wagePercent)}`}
            >
              {comparison.vsNational.wagePercent > 0 ? "+" : ""}
              {comparison.vsNational.wagePercent}% vs national
            </div>
          )}
        </div>

        {/* Concentration */}
        <div className="text-center p-4 bg-cream rounded-lg">
          <div className="text-2xl font-display font-bold text-sage">
            {localData.locationQuotient.toFixed(1)}x
          </div>
          <div className="text-xs text-ds-slate-muted mt-1">
            vs national avg
          </div>
        </div>

        {/* Growth */}
        {localData.growth && (() => {
          const growthInfo = getGrowthInfo(localData.growth, localData.growthPercent);
          if (!growthInfo) return null;
          return (
            <div className={`text-center p-4 rounded-lg ${growthInfo.bgColor}`}>
              <div className={`text-2xl font-display font-bold ${growthInfo.color}`}>
                {growthInfo.emoji} {growthInfo.label}
              </div>
              <div className="text-xs text-ds-slate-muted mt-1">
                Annual growth
              </div>
            </div>
          );
        })()}
      </div>

      {/* Concentration bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-ds-slate-muted mb-1">
          <span>Job concentration</span>
          <span>
            {localData.locationQuotient > 1
              ? `${((localData.locationQuotient - 1) * 100).toFixed(0)}% more common`
              : localData.locationQuotient < 1
              ? `${((1 - localData.locationQuotient) * 100).toFixed(0)}% less common`
              : "Average"}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              localData.locationQuotient >= 1.2
                ? "bg-green-500"
                : localData.locationQuotient >= 0.8
                ? "bg-sage"
                : "bg-orange-400"
            }`}
            style={{ width: `${getConcentrationWidth(localData.locationQuotient)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
          <span>Rare</span>
          <span>National avg</span>
          <span>Common</span>
        </div>
      </div>

      {/* Insight text */}
      {comparison && (
        <p className="text-sm text-ds-slate-muted bg-cream/50 rounded-lg p-3">
          {comparison.concentrationDescription}
        </p>
      )}
    </section>
  );
}
