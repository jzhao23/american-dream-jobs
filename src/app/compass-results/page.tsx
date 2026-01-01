"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAIRiskColor } from "@/types/career";

// Hardcoded placeholder results
const PLACEHOLDER_RESULTS = [
  {
    slug: "registered-nurses",
    title: "Registered Nurses",
    category: "healthcare",
    matchScore: 92,
    medianPay: 81220,
    aiRisk: 0.9,
    aiRiskLabel: "Very Low Risk",
    reasoning:
      "Your healthcare interest and desire to help people align perfectly with nursing. Strong job security with excellent growth prospects. Your communication skills and attention to detail are crucial in this field.",
    skillsGap: ["Clinical certifications", "Medical terminology", "Patient care protocols"],
    transitionTimeline: "2-4 years",
    education: "Bachelor's degree",
  },
  {
    slug: "software-developers",
    title: "Software Developers",
    category: "technology",
    matchScore: 88,
    medianPay: 127260,
    aiRisk: 3.2,
    aiRiskLabel: "Low Risk",
    reasoning:
      "Your analytical mindset and problem-solving abilities are ideal for software development. High earning potential with remote work flexibility matches your work environment preferences.",
    skillsGap: ["Programming languages", "Software architecture", "Version control"],
    transitionTimeline: "6-12 months",
    education: "Bachelor's degree",
  },
  {
    slug: "electricians",
    title: "Electricians",
    category: "trades",
    matchScore: 85,
    medianPay: 60240,
    aiRisk: 1.5,
    aiRiskLabel: "Very Low Risk",
    reasoning:
      "Hands-on work with strong earning potential. Apprenticeship model allows you to earn while learning. Your technical aptitude and attention to detail are perfect for this trade.",
    skillsGap: ["Electrical code knowledge", "Blueprint reading", "Safety protocols"],
    transitionTimeline: "4-5 years (apprenticeship)",
    education: "High school diploma or equivalent",
  },
  {
    slug: "data-scientists",
    title: "Data Scientists",
    category: "technology",
    matchScore: 83,
    medianPay: 103500,
    aiRisk: 2.8,
    aiRiskLabel: "Low Risk",
    reasoning:
      "Your analytical skills and interest in technology align well. Growing field with diverse applications across industries. Matches your preference for problem-solving work.",
    skillsGap: ["Statistics", "Machine learning", "Data visualization"],
    transitionTimeline: "8-12 months",
    education: "Bachelor's degree",
  },
  {
    slug: "dental-hygienists",
    title: "Dental Hygienists",
    category: "healthcare",
    matchScore: 81,
    medianPay: 81400,
    aiRisk: 0.7,
    aiRiskLabel: "Very Low Risk",
    reasoning:
      "Healthcare career with excellent work-life balance. Shorter training period than other health professions. Your interest in helping people and attention to detail are key strengths.",
    skillsGap: ["Dental procedures", "Radiology", "Patient education"],
    transitionTimeline: "2-3 years",
    education: "Associate degree",
  },
  {
    slug: "project-management-specialists",
    title: "Project Management Specialists",
    category: "business-finance",
    matchScore: 79,
    medianPay: 98420,
    aiRisk: 1.8,
    aiRiskLabel: "Very Low Risk",
    reasoning:
      "Your organizational skills and leadership goals make this a natural fit. Transferable across industries, allowing career flexibility. Matches your collaborative work environment preference.",
    skillsGap: ["Project management certification", "Stakeholder management", "Agile methodology"],
    transitionTimeline: "3-6 months",
    education: "Bachelor's degree",
  },
  {
    slug: "heating-air-conditioning-and-refrigeration-mechanics-and-ins",
    title: "HVAC Technicians",
    category: "trades",
    matchScore: 76,
    medianPay: 57300,
    aiRisk: 1.1,
    aiRiskLabel: "Very Low Risk",
    reasoning:
      "Stable career with consistent demand. Technical skills with hands-on application. Good earning potential with opportunities for business ownership.",
    skillsGap: ["HVAC certification", "Refrigeration systems", "EPA certification"],
    transitionTimeline: "6-24 months",
    education: "Postsecondary non-degree award",
  },
];

export default function CompassResultsPage() {
  const router = useRouter();
  const [submissionData, setSubmissionData] = useState<{
    resumeFileName: string;
    answers: Record<string, string>;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    // Retrieve submission data from sessionStorage
    const data = sessionStorage.getItem("compass-submission");
    if (data) {
      setSubmissionData(JSON.parse(data));
    } else {
      // If no data, redirect back to compass
      router.push("/compass");
    }
  }, [router]);

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading results...</p>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-secondary-700">Resume:</span>
              <span className="ml-2 text-secondary-600">
                {submissionData.resumeFileName}
              </span>
            </div>
            <div>
              <span className="font-medium text-secondary-700">Analyzed:</span>
              <span className="ml-2 text-secondary-600">
                {new Date(submissionData.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Career Matches */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-secondary-900">
            Top {PLACEHOLDER_RESULTS.length} Career Matches
          </h2>

          {PLACEHOLDER_RESULTS.map((career, index) => (
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
                  <p className="text-xs text-secondary-600 mb-1">AI Risk</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(career.aiRisk)}`}>
                    {career.aiRiskLabel}
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
