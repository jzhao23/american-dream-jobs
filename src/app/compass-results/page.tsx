"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAIResilienceColor,
  getAIResilienceEmoji,
  type AIResilienceClassification,
} from "@/types/career";

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

export default function CompassResultsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<CareerMatch[]>([]);
  const [metadata, setMetadata] = useState<ResultsMetadata | null>(null);
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [submissionData, setSubmissionData] = useState<{
    resumeLength: number;
    answers: Record<string, string>;
    timestamp: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="card-warm p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">
            Analysis Summary
          </h2>

          {/* Profile Summary */}
          {profile && (
            <div className="mb-6 p-4 bg-sage-pale rounded-xl">
              <h3 className="text-sm font-semibold text-ds-slate mb-3">
                Your Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Experience</p>
                  <p className="font-medium text-ds-slate">
                    {profile.experienceYears} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Education</p>
                  <p className="font-medium text-ds-slate">
                    {formatEducationLevel(profile.education.level)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ds-slate-muted mb-1">Skills Identified</p>
                  <p className="font-medium text-ds-slate">
                    {profile.skills.length} skills
                  </p>
                </div>
              </div>
              {profile.skills.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-ds-slate-muted mb-2">Top Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 8).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-sage-muted text-sage rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 8 && (
                      <span className="px-2 py-0.5 text-xs text-ds-slate-muted">
                        +{profile.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-ds-slate">Analyzed:</span>
              <span className="ml-2 text-ds-slate-light">
                {new Date(submissionData.timestamp).toLocaleDateString()}
              </span>
            </div>
            {metadata && (
              <>
                <div>
                  <span className="font-medium text-ds-slate">Careers Evaluated:</span>
                  <span className="ml-2 text-ds-slate-light">
                    {metadata.stage1Candidates} candidates
                  </span>
                </div>
                <div>
                  <span className="font-medium text-ds-slate">Processing Time:</span>
                  <span className="ml-2 text-ds-slate-light">
                    {(metadata.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

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

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-sage-muted">
                <Link
                  href={`/careers/${career.slug}`}
                  className="btn-sage w-full text-center block"
                >
                  View Full Career Details
                </Link>
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
