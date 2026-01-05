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
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading results...</p>
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

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
                Your Career Recommendations
              </h1>
              <p className="text-lg text-secondary-600 max-w-2xl">
                Based on your resume and responses, here are the careers that best match your profile.
              </p>
            </div>
            <Link
              href="/compass"
              className="btn-secondary text-sm whitespace-nowrap"
            >
              Start Over
            </Link>
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Analysis Summary
          </h2>

          {/* Profile Summary */}
          {profile && (
            <div className="mb-6 p-4 bg-secondary-50 rounded-lg">
              <h3 className="text-sm font-semibold text-secondary-700 mb-3">
                Your Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Experience</p>
                  <p className="font-medium text-secondary-900">
                    {profile.experienceYears} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Education</p>
                  <p className="font-medium text-secondary-900">
                    {formatEducationLevel(profile.education.level)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Skills Identified</p>
                  <p className="font-medium text-secondary-900">
                    {profile.skills.length} skills
                  </p>
                </div>
              </div>
              {profile.skills.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-secondary-500 mb-2">Top Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 8).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 8 && (
                      <span className="px-2 py-0.5 text-xs text-secondary-500">
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
              <span className="font-medium text-secondary-700">Analyzed:</span>
              <span className="ml-2 text-secondary-600">
                {new Date(submissionData.timestamp).toLocaleDateString()}
              </span>
            </div>
            {metadata && (
              <>
                <div>
                  <span className="font-medium text-secondary-700">Careers Evaluated:</span>
                  <span className="ml-2 text-secondary-600">
                    {metadata.stage1Candidates} candidates
                  </span>
                </div>
                <div>
                  <span className="font-medium text-secondary-700">Processing Time:</span>
                  <span className="ml-2 text-secondary-600">
                    {(metadata.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Career Matches */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-secondary-900">
            Top {recommendations.length} Career Matches
          </h2>

          {recommendations.map((career, index) => (
            <div key={career.slug} className="card p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-primary-600">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-secondary-900">
                        {career.title}
                      </h3>
                      <p className="text-sm text-secondary-600 capitalize">
                        {career.category.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {career.matchScore}%
                  </div>
                  <p className="text-xs text-secondary-600">Match Score</p>
                </div>
              </div>

              {/* Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-secondary-50 rounded-lg">
                <div>
                  <p className="text-xs text-secondary-600 mb-1">Median Salary</p>
                  <p className="font-semibold text-secondary-900">
                    ${career.medianPay.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 mb-1">Education</p>
                  <p className="font-semibold text-secondary-900">
                    {career.education}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 mb-1">Transition Timeline</p>
                  <p className="font-semibold text-secondary-900">
                    {career.transitionTimeline}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-600 mb-1">AI Resilience</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getAIResilienceColor(career.aiResilience as AIResilienceClassification)}`}>
                    <span>{getAIResilienceEmoji(career.aiResilience as AIResilienceClassification)}</span>
                    <span>{career.aiResilience}</span>
                  </span>
                </div>
              </div>

              {/* Why It's a Good Fit */}
              <div className="mb-4">
                <h4 className="font-semibold text-secondary-900 mb-2 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Why It's a Good Fit
                </h4>
                <p className="text-secondary-700 leading-relaxed">
                  {career.reasoning}
                </p>
              </div>

              {/* Skills Gap */}
              <div className="mb-4">
                <h4 className="font-semibold text-secondary-900 mb-2">
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {career.skillsGap.map((skill) => (
                    <span
                      key={skill}
                      className="badge bg-yellow-100 text-yellow-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <Link
                  href={`/careers/${career.slug}`}
                  className="btn-primary w-full text-center block"
                >
                  View Full Career Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="card p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-blue-600"
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
          <ul className="space-y-2 text-sm text-secondary-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Review each career in detail to understand day-to-day responsibilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Research training programs and certification requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Connect with professionals in these fields for informational interviews</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Create a timeline for developing identified skills gaps</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
