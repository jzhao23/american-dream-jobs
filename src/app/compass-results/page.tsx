"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAIResilienceColor,
  getAIResilienceEmoji,
  type AIResilienceClassification,
} from "@/types/career";
import { useLocation } from "@/lib/location-context";
import { FindJobsButton } from "@/components/jobs";

// Types from the API
interface CareerMatch {
  slug: string;
  title: string;
  category: string;
  matchScore: number;
  medianPay: number;
  aiResilience: string;
  reasoning: string;
  skillsGap: [string, string, string];
  transitionTimeline: string;
  education: string;
}

interface ResultsMetadata {
  stage1Candidates: number;
  stage2Candidates: number;
  finalMatches: number;
  processingTimeMs: number;
  costUsd: number;
}

interface ParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: {
    level: string;
    fields: string[];
  };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

interface SubmissionData {
  training: string;
  education: string | null;
  background: string[];
  salary: string | null;
  workStyle: string[];
  hasResume: boolean;
  anythingElse: string;
  timestamp: string;
}

// Label mappings for summary display
const trainingLabels: Record<string, string> = {
  'minimal': 'Start earning right away',
  'short-term': 'Within 6 months',
  'medium': '1-2 years',
  'significant': 'Open to any training'
};

const educationLabels: Record<string, string> = {
  'high-school': 'High school diploma',
  'some-college': 'Some college',
  'bachelors': "Bachelor's degree",
  'masters-plus': "Master's or higher"
};

const salaryLabels: Record<string, string> = {
  'under-40k': 'Under $40k',
  '40-60k': '$40-60k',
  '60-80k': '$60-80k',
  '80-100k': '$80-100k',
  '100k-plus': '$100k+'
};

const backgroundLabels: Record<string, string> = {
  'none': 'No work experience',
  'service': 'Service/Retail',
  'office': 'Office/Admin',
  'technical': 'Technical/IT',
  'healthcare': 'Healthcare',
  'trades': 'Trades/Construction',
  'sales': 'Sales & Marketing',
  'finance': 'Business & Finance',
  'education': 'Education',
  'creative': 'Creative/Media'
};

const workStyleLabels: Record<string, string> = {
  'hands-on': 'Hands-on',
  'people': 'Working with people',
  'analytical': 'Analytical',
  'creative': 'Creative',
  'technology': 'Technology',
  'leadership': 'Leadership'
};

const TOTAL_CAREERS = 1016;

// Local career data type
interface LocalCareerEntry {
  employment: number;
  medianWage: number;
  locationQuotient: number;
  growth?: string;
  growthPercent?: number;
}

export default function CompassResultsPage() {
  const router = useRouter();
  const { location } = useLocation();
  const [recommendations, setRecommendations] = useState<CareerMatch[]>([]);
  const [metadata, setMetadata] = useState<ResultsMetadata | null>(null);
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [localCareerData, setLocalCareerData] = useState<{ [slug: string]: LocalCareerEntry } | null>(null);

  // Load local career data for each recommendation when location is set
  useEffect(() => {
    if (!location || recommendations.length === 0) {
      setLocalCareerData(null);
      return;
    }

    const locationCode = location.code;

    async function loadLocalData() {
      const extracted: { [slug: string]: LocalCareerEntry } = {};

      // Fetch local data for each recommendation
      await Promise.all(
        recommendations.map(async (career) => {
          try {
            const response = await fetch(
              `/api/careers/${career.slug}/local?location=${locationCode}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.localData) {
                extracted[career.slug] = data.localData;
              }
            }
          } catch (error) {
            // Silently ignore - not all careers will have local data
          }
        })
      );

      setLocalCareerData(Object.keys(extracted).length > 0 ? extracted : null);
    }

    loadLocalData();
  }, [location, recommendations]);

  useEffect(() => {
    // Retrieve all data from sessionStorage
    const resultsData = sessionStorage.getItem("compass-results");
    const metadataData = sessionStorage.getItem("compass-metadata");
    const profileData = sessionStorage.getItem("compass-profile");
    const submissionDataStr = sessionStorage.getItem("compass-submission");

    if (resultsData && submissionDataStr) {
      setRecommendations(JSON.parse(resultsData));
      setSubmissionData(JSON.parse(submissionDataStr));

      if (metadataData) {
        setMetadata(JSON.parse(metadataData));
      }
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
      setIsLoading(false);
    } else {
      // If no data, redirect back to compass
      router.push("/compass");
    }
  }, [router]);

  if (isLoading || !submissionData || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage mx-auto"></div>
          <p className="mt-4 text-ds-slate-light">Loading results...</p>
        </div>
      </div>
    );
  }

  const formatEducationLevel = (level: string): string => {
    const labels: Record<string, string> = {
      high_school: "High School",
      some_college: "Some College",
      associates: "Associate's Degree",
      bachelors: "Bachelor's Degree",
      masters: "Master's Degree",
      doctorate: "Doctorate",
      professional_degree: "Professional Degree",
    };
    return labels[level] || level;
  };

  // Get badge class for AI resilience
  const getAIResilienceBadgeClass = (resilience: string): string => {
    switch (resilience) {
      case "AI-Resilient":
        return "badge-ai-resilient";
      case "AI-Augmented":
        return "badge-ai-augmented";
      case "In Transition":
        return "badge-ai-transition";
      case "High Disruption Risk":
        return "badge-ai-risk";
      default:
        return "bg-sage-muted text-sage";
    }
  };

  // Get growth badge info
  const getGrowthBadge = (growth: string | undefined, growthPercent: number | undefined): { label: string; color: string } | null => {
    if (!growth) return null;

    switch (growth) {
      case "growing-quickly":
        return { label: `+${growthPercent?.toFixed(1) || "5+"}%`, color: "text-green-600" };
      case "growing":
        return { label: `+${growthPercent?.toFixed(1) || "1-5"}%`, color: "text-green-500" };
      case "stable":
        return { label: "Stable", color: "text-ds-slate-muted" };
      case "declining":
        return { label: `${growthPercent?.toFixed(1) || "-"}%`, color: "text-orange-500" };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-medium text-ds-slate mb-4">
                Your Career Recommendations
              </h1>
              <p className="text-lg text-ds-slate-light max-w-2xl">
                Based on your resume and responses, here are the careers that best match your profile.
              </p>
            </div>
            <Link
              href="/compass"
              className="btn-sage-outline text-sm whitespace-nowrap"
            >
              Start Over
            </Link>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-warm-white rounded-2xl p-6 border border-sage-muted">

          {/* Section 1: Based on your responses */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-ds-slate mb-3 flex items-center gap-2">
              <span className="text-lg">✨</span>
              Based on your responses
            </h3>
            <div className="flex flex-wrap gap-2">
              {submissionData?.training && (
                <span className="inline-flex items-center gap-1.5 bg-sage-muted text-sage font-medium px-3 py-1.5 rounded-full text-sm">
                  <span>⏱️</span>
                  <span>{trainingLabels[submissionData.training] || submissionData.training}</span>
                </span>
              )}
              {submissionData?.education && (
                <span className="inline-flex items-center gap-1.5 bg-sage-muted text-sage font-medium px-3 py-1.5 rounded-full text-sm">
                  <span>🎓</span>
                  <span>{educationLabels[submissionData.education] || submissionData.education}</span>
                </span>
              )}
              {submissionData?.salary && (
                <span className="inline-flex items-center gap-1.5 bg-sage-muted text-sage font-medium px-3 py-1.5 rounded-full text-sm">
                  <span>💰</span>
                  <span>{salaryLabels[submissionData.salary] || submissionData.salary}</span>
                </span>
              )}
              {submissionData?.background && submissionData.background.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-sage-muted text-sage font-medium px-3 py-1.5 rounded-full text-sm">
                  <span>💼</span>
                  <span>{submissionData.background.map(b => backgroundLabels[b] || b).join(', ')}</span>
                </span>
              )}
              {submissionData?.workStyle && submissionData.workStyle.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-sage-muted text-sage font-medium px-3 py-1.5 rounded-full text-sm">
                  <span>⚡</span>
                  <span>{submissionData.workStyle.map(w => workStyleLabels[w] || w).join(', ')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Skills from resume (only if they have skills) */}
          {profile && profile.skills && profile.skills.length > 0 && (
            <div className="mb-6 pt-6 border-t border-sage-muted">
              <h3 className="text-sm font-semibold text-ds-slate mb-3 flex items-center gap-2">
                <span className="text-lg">💪</span>
                You bring valuable skills to the table
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 15).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-sm bg-sage-pale text-sage rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {profile.skills.length > 15 && (
                  <span className="px-2.5 py-1 text-sm bg-cream text-ds-slate-muted rounded-full">
                    +{profile.skills.length - 15} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Impressive stat + Save button */}
          <div className={`pt-6 border-t border-sage-muted ${profile?.skills?.length ? '' : 'mt-0'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-ds-slate">
                  Out of <span className="font-bold text-sage">{TOTAL_CAREERS.toLocaleString()}</span> careers,
                  we found your <span className="font-bold text-sage">top {recommendations.length} matches</span>
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="print:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage border border-sage rounded-lg hover:bg-sage-pale transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save as PDF
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Career Matches */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-ds-slate">
            Top {recommendations.length} Career Matches
            {!showAll && recommendations.length > 10 && (
              <span className="text-sm font-normal text-ds-slate-muted ml-2">
                (showing 1-10)
              </span>
            )}
          </h2>

          {(showAll ? recommendations : recommendations.slice(0, 10)).map((career, index) => (
            <div key={career.slug} className="card-warm p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-sage">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ds-slate">
                        {career.title}
                      </h3>
                      <p className="text-sm text-ds-slate-light capitalize">
                        {career.category.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-sage">
                    {career.matchScore}%
                  </div>
                  <p className="text-xs text-ds-slate-muted">Match Score</p>
                </div>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-sage-pale rounded-xl">
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Median Salary</p>
                  <p className="font-semibold text-ds-slate">
                    ${career.medianPay.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Education</p>
                  <p className="font-semibold text-ds-slate">
                    {career.education}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Transition Timeline</p>
                  <p className="font-semibold text-ds-slate">
                    {career.transitionTimeline}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">AI Resilience</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getAIResilienceBadgeClass(career.aiResilience)}`}>
                    <span>{getAIResilienceEmoji(career.aiResilience as AIResilienceClassification)}</span>
                    <span>{career.aiResilience}</span>
                  </span>
                </div>
              </div>

              {/* Local Job Market Data */}
              {location && localCareerData && localCareerData[career.slug] && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-cream rounded-lg border border-sage-muted">
                  <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-ds-slate">
                      {localCareerData[career.slug].employment.toLocaleString()} jobs in {location.shortName}
                    </span>
                    {(() => {
                      const growthBadge = getGrowthBadge(
                        localCareerData[career.slug].growth,
                        localCareerData[career.slug].growthPercent
                      );
                      return growthBadge ? (
                        <span className={`font-medium ${growthBadge.color}`}>
                          {growthBadge.label} growth
                        </span>
                      ) : null;
                    })()}
                    {localCareerData[career.slug].locationQuotient > 1.2 && (
                      <span className="text-green-600 font-medium">
                        High demand area
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Why It's a Good Fit */}
              <div className="mb-4">
                <h4 className="font-semibold text-ds-slate mb-2 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-sage"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Why It&apos;s a Good Fit
                </h4>
                <p className="text-ds-slate-light leading-relaxed">
                  {career.reasoning}
                </p>
              </div>

              {/* Skills Gap */}
              <div className="mb-4">
                <h4 className="font-semibold text-ds-slate mb-2">
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {career.skillsGap.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-sm bg-gold-bg text-gold rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-sage-muted flex gap-3">
                <Link
                  href={`/careers/${career.slug}`}
                  className="flex-1 text-center inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sage text-white font-semibold rounded-lg hover:bg-sage-dark shadow-sm hover:shadow-md transition-all duration-200"
                >
                  View Details
                </Link>
                <FindJobsButton
                  careerSlug={career.slug}
                  careerTitle={career.title}
                  variant="primary"
                  className="flex-1"
                />
              </div>
            </div>
          ))}

          {/* Show More Button */}
          {!showAll && recommendations.length > 10 && (
            <div className="text-center pt-4">
              <button
                onClick={() => setShowAll(true)}
                className="btn-sage-outline inline-flex items-center gap-2"
              >
                <span>Show {recommendations.length - 10} More Careers</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="card-warm p-6 mt-8 bg-sage-pale border border-sage-muted">
          <h3 className="font-display font-semibold text-ds-slate mb-3 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-sage"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Next Steps
          </h3>
          <ul className="space-y-2 text-sm text-ds-slate-light">
            <li className="flex items-start gap-2">
              <span className="text-sage font-bold">1.</span>
              <span>Review each career in detail to understand day-to-day responsibilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage font-bold">2.</span>
              <span>Research training programs and certification requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage font-bold">3.</span>
              <span>Connect with professionals in these fields for informational interviews</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage font-bold">4.</span>
              <span>Create a timeline for developing identified skills gaps</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
