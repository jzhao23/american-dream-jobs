"use client";

/**
 * Local Jobs Page
 *
 * Discovery page showing top careers in the user's location.
 * Features:
 * - Fastest growing careers
 * - Most jobs available
 * - High concentration careers
 */

import { useState, useEffect } from "react";
import { useLocation } from "@/lib/location-context";
import { LocationSelector } from "@/components/LocationSelector";
import { formatPay } from "@/types/career";
import { FindJobsButton } from "@/components/jobs/FindJobsButton";

interface LocalJobEntry {
  slug: string;
  title: string;
  category: string;
  employment: number;
  medianWage: number;
  locationQuotient: number;
  aiResilience?: string;
  vsNational?: {
    wagePercent: number;
  };
}

interface LocalJobsData {
  location: {
    code: string;
    name: string;
    type: "msa" | "state";
  };
  fastestGrowing: LocalJobEntry[];
  mostJobs: LocalJobEntry[];
  highGrowth: LocalJobEntry[];
}

// AI resilience badge colors
function getAIResilienceColor(resilience: string): string {
  switch (resilience) {
    case "AI-Resilient":
      return "bg-green-100 text-green-800";
    case "AI-Augmented":
      return "bg-yellow-100 text-yellow-800";
    case "AI-Exposed":
      return "bg-orange-100 text-orange-800";
    case "AI-Vulnerable":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Career card component
function CareerCard({ career, rankType }: { career: LocalJobEntry; rankType: "growth" | "jobs" | "concentration" }) {
  return (
    <div className="p-4 bg-warm-white rounded-lg border border-sage-muted hover:border-sage hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <a href={`/careers/${career.slug}`} className="block">
            <h3 className="font-semibold text-ds-slate hover:text-sage transition-colors">
              {career.title}
            </h3>
          </a>
          <p className="text-sm text-ds-slate-muted">{career.category}</p>
        </div>
        {career.aiResilience && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${getAIResilienceColor(career.aiResilience)}`}>
            {career.aiResilience.replace("AI-", "")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-3">
        <div>
          <div className="text-lg font-bold text-sage">
            {formatNumber(career.employment)}
          </div>
          <div className="text-xs text-ds-slate-muted">Local jobs</div>
        </div>
        <div>
          <div className="text-lg font-bold text-sage">
            {formatPay(career.medianWage)}
          </div>
          <div className="text-xs text-ds-slate-muted">Median pay</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${
            rankType === "concentration" ? "text-sage" :
            career.locationQuotient > 1 ? "text-green-600" : "text-ds-slate"
          }`}>
            {career.locationQuotient.toFixed(1)}x
          </div>
          <div className="text-xs text-ds-slate-muted">vs national</div>
        </div>
      </div>

      {career.vsNational && (
        <div className="mt-2 text-xs text-ds-slate-muted">
          Local wages are{" "}
          <span className={career.vsNational.wagePercent > 0 ? "text-green-600" : "text-orange-500"}>
            {career.vsNational.wagePercent > 0 ? "+" : ""}
            {career.vsNational.wagePercent}%
          </span>{" "}
          vs national average
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-sage-muted">
        <FindJobsButton
          careerSlug={career.slug}
          careerTitle={career.title}
          variant="primary"
          className="w-full text-sm py-2"
        />
      </div>
    </div>
  );
}

export default function LocalJobsPage() {
  const { location, isLoading: locationLoading } = useLocation();
  const [data, setData] = useState<LocalJobsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mostJobs" | "highGrowth">("mostJobs");

  // Fetch local jobs when location changes
  useEffect(() => {
    if (!location) {
      setData(null);
      return;
    }

    const locationCode = location.code;

    async function fetchLocalJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/local-jobs?location=${locationCode}&limit=20`);
        const result = await response.json();

        if (result.success) {
          setData(result);
        } else {
          setError(result.error?.message || "Failed to load local jobs");
        }
      } catch (err) {
        console.error("Failed to fetch local jobs:", err);
        setError("Failed to load local jobs");
      }

      setIsLoading(false);
    }

    fetchLocalJobs();
  }, [location]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ds-slate-light mb-4">
            <a href="/" className="hover:text-sage">
              Home
            </a>
            <span>/</span>
            <span className="text-ds-slate">Local Jobs</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-ds-slate mb-2">
                {location ? `Jobs in ${location.name}` : "Local Jobs"}
              </h1>
              <p className="text-lg text-ds-slate-light max-w-xl">
                {location
                  ? "Discover the top careers and opportunities in your area."
                  : "Set your location to see local job market data."}
              </p>
            </div>

            <div className="min-w-[240px]">
              <LocationSelector variant="full" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading state */}
        {(locationLoading || isLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No location state */}
        {!locationLoading && !location && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">
              <svg
                className="w-16 h-16 mx-auto text-sage-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-display font-semibold text-ds-slate mb-2">
              Set Your Location
            </h2>
            <p className="text-ds-slate-light mb-6 max-w-md mx-auto">
              Choose your location above to see top careers, employment data, and wages in your area.
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-ds-slate-muted">{error}</p>
          </div>
        )}

        {/* Data loaded */}
        {!isLoading && !error && data && (
          <div className="space-y-12">
            {/* Tab navigation */}
            <div className="flex gap-2 border-b border-sage-muted pb-4">
              <button
                onClick={() => setActiveTab("mostJobs")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "mostJobs"
                    ? "bg-sage text-white"
                    : "bg-warm-white text-ds-slate-light hover:bg-sage-muted"
                }`}
              >
                Most Jobs
              </button>
              <button
                onClick={() => setActiveTab("highGrowth")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "highGrowth"
                    ? "bg-sage text-white"
                    : "bg-warm-white text-ds-slate-light hover:bg-sage-muted"
                }`}
              >
                High Growth
              </button>
            </div>

            {/* Most Jobs */}
            {activeTab === "mostJobs" && (
              <section>
                <div className="flex items-center gap-2 mb-4">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h2 className="text-xl font-display font-semibold text-ds-slate">
                    Careers with Most Jobs
                  </h2>
                </div>
                <p className="text-ds-slate-muted mb-6">
                  The careers with the highest employment in {data.location.name}.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {data.mostJobs.map((career, i) => (
                    <CareerCard key={career.slug} career={career} rankType="jobs" />
                  ))}
                </div>

                {data.mostJobs.length === 0 && (
                  <p className="text-center py-8 text-ds-slate-muted">
                    No job data available for this location.
                  </p>
                )}
              </section>
            )}

            {/* High Growth */}
            {activeTab === "highGrowth" && (
              <section>
                <div className="flex items-center gap-2 mb-4">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <h2 className="text-xl font-display font-semibold text-ds-slate">
                    High Growth Careers
                  </h2>
                </div>
                <p className="text-ds-slate-muted mb-6">
                  Careers growing at 5% or more per year in {data.location.name}.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {data.highGrowth.map((career) => (
                    <CareerCard key={career.slug} career={career} rankType="growth" />
                  ))}
                </div>

                {data.highGrowth.length === 0 && (
                  <p className="text-center py-8 text-ds-slate-muted">
                    No high-growth careers found for this location.
                  </p>
                )}
              </section>
            )}

            {/* Call to action */}
            <section className="bg-warm-white rounded-xl p-6 text-center">
              <h3 className="font-display text-lg font-semibold text-ds-slate mb-2">
                Find Your Perfect Career Match
              </h3>
              <p className="text-ds-slate-light mb-4">
                Take our Career Compass quiz to get personalized recommendations based on your skills and interests.
              </p>
              <a
                href="/compass"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-lg hover:bg-sage-light transition-colors"
              >
                Start Career Compass
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
