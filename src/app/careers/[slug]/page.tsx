import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as fs from "fs";
import * as path from "path";
import careers from "../../../../data/careers.generated.json";
import reviewsIndex from "../../../../data/reviews/reviews-index.json";
import type { Career } from "@/types/career";
import {
  formatPay,
  formatPayRange,
  getTrainingTimeLabel,
  getCategoryColor,
  getAIRiskColor,
  getAIRiskLabel,
  getImportanceColor,
  getImportanceLabel,
} from "@/types/career";
import { CareerVideoPlayer } from "@/components/CareerVideoPlayer";
// Raw review type from Reddit
interface RawCareerReviewsSummary {
  slug: string;
  soc_code: string;
  total_reviews: number;
  featured_reviews: {
    id: string;
    subreddit: string;
    title: string;
    text: string;
    score: number;
    url: string;
  }[];
  last_updated: string;
}

// Full review from per-career file
interface FullReview {
  id: string;
  subreddit: string;
  soc_codes: string[];
  title: string;
  text: string;
  score: number;
  url: string;
  created_at: string;
  num_comments: number;
}

// Helper to load all reviews for a career
function loadCareerReviews(slug: string): FullReview[] {
  try {
    const reviewsPath = path.join(process.cwd(), `data/reviews/reviews-by-career/${slug}.json`);
    if (fs.existsSync(reviewsPath)) {
      const data = fs.readFileSync(reviewsPath, 'utf-8');
      return JSON.parse(data) as FullReview[];
    }
  } catch {
    // Fall back to empty array if file doesn't exist
  }
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all careers
export async function generateStaticParams() {
  return (careers as Career[]).map((career) => ({
    slug: career.slug,
  }));
}

// Get training time category from years
function getTrainingTimeFromYears(years: number): "<6mo" | "6-24mo" | "2-4yr" | "4+yr" {
  if (years < 0.5) return "<6mo";
  if (years < 2) return "6-24mo";
  if (years < 4) return "2-4yr";
  return "4+yr";
}

// Generate metadata for each career page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const career = (careers as Career[]).find((c) => c.slug === slug);

  if (!career) {
    return {
      title: "Career Not Found | American Dream Jobs",
    };
  }

  const medianPay = career.wages?.annual?.median || 0;
  const trainingTime = getTrainingTimeFromYears(career.education?.time_to_job_ready?.typical_years || 2);

  return {
    title: `${career.title} | American Dream Jobs`,
    description: `Learn about becoming a ${career.title}. Median pay: ${formatPay(medianPay)}. Training: ${getTrainingTimeLabel(trainingTime)}. Real career info with AI resilience and national importance scores.`,
  };
}

export default async function CareerPage({ params }: PageProps) {
  const { slug } = await params;
  const career = (careers as Career[]).find((c) => c.slug === slug);

  if (!career) {
    notFound();
  }

  const medianPay = career.wages?.annual?.median || 0;
  const payRange = career.wages?.annual
    ? { min: career.wages.annual.pct_10 || 0, max: career.wages.annual.pct_90 || 0 }
    : null;
  const trainingTime = getTrainingTimeFromYears(career.education?.time_to_job_ready?.typical_years || 2);
  const trainingYears = career.education?.time_to_job_ready;
  const aiRiskScore = career.ai_risk?.score || 5;
  const importanceScore = career.national_importance?.score || 5;

  // Find reviews for this career (match by slug or SOC code)
  const careerReviewsSummary = (reviewsIndex as RawCareerReviewsSummary[]).find(
    (r) => r.slug === career.slug || r.soc_code === career.soc_code
  );

  // Load all reviews for this career (for scrollable display)
  const allReviews = loadCareerReviews(career.slug);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-600 mb-4">
            <a href="/" className="hover:text-primary-600">
              Home
            </a>
            <span>/</span>
            <a href="/#careers" className="hover:text-primary-600">
              Careers
            </a>
            <span>/</span>
            <span className="text-secondary-900">{career.title}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(career.category)} mb-3`}>
                {career.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-2">
                {career.title}
              </h1>
              {career.description && (
                <p className="text-lg text-secondary-600 max-w-2xl">
                  {career.description}
                </p>
              )}
            </div>

            <div className="bg-secondary-50 rounded-xl p-6 min-w-[200px]">
              <div className="text-center">
                <div className="text-sm text-secondary-600 mb-1">
                  Median Annual Pay
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {formatPay(medianPay)}
                </div>
                {payRange && payRange.min > 0 && payRange.max > 0 && (
                  <div className="text-sm text-secondary-500">
                    Range: {formatPayRange(payRange.min, payRange.max)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">
                Training Time
              </div>
              <div className="font-semibold text-secondary-900">
                {getTrainingTimeLabel(trainingTime, trainingYears ? {
                  min: trainingYears.min_years,
                  max: trainingYears.max_years,
                  typical: trainingYears.typical_years
                } : undefined)}
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">
                AI Risk
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(aiRiskScore)}`}>
                  {aiRiskScore}/10 - {getAIRiskLabel(aiRiskScore)}
                </span>
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">
                National Importance
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-secondary-900">{importanceScore}/10</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(importanceScore)}`}>
                  {getImportanceLabel(importanceScore)}
                </span>
              </div>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">
                Education
              </div>
              <div className="font-semibold text-secondary-900 text-sm">
                {career.education?.typical_entry_education || "Varies"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Career Video */}
          {career.video && (
            <Section title="Career Video" icon="video">
              <div className="space-y-4">
                <CareerVideoPlayer video={career.video} careerTitle={career.title} />
                <a
                  href="https://www.careeronestop.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-50 rounded-md hover:bg-secondary-100 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium text-secondary-700">
                    CareerOneStop
                  </span>
                  <span className="text-xs text-secondary-500">
                    U.S. Department of Labor
                  </span>
                </a>
              </div>
            </Section>
          )}

          {/* Key Tasks */}
          {career.tasks && career.tasks.length > 0 && (
            <Section title="Key Responsibilities" icon="clipboard">
              <ul className="space-y-3">
                {career.tasks.slice(0, 8).map((task, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary-500 mt-1">•</span>
                    <span className="text-secondary-700">{task}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Career Progression */}
          {career.career_progression && career.career_progression.levels && (
            <Section title="Career Progression" icon="chart">
              <div className="space-y-4">
                {career.career_progression.levels.map((level, i) => (
                  <div key={i} className="flex items-center gap-4 bg-secondary-50 rounded-lg p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                      {level.level_number}
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-secondary-900">{level.level_name}</div>
                      <div className="text-sm text-secondary-600">
                        {level.years_experience.min}-{level.years_experience.max} years experience
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600">
                        {formatPay(level.compensation.total.median)}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {formatPay(level.compensation.total.min)} - {formatPay(level.compensation.total.max)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {career.career_progression.source === "levels_fyi" && (
                <div className="mt-4 text-sm text-secondary-500">
                  Data source: Levels.fyi ({career.career_progression.match_confidence} match)
                </div>
              )}
            </Section>
          )}

          {/* Education & Training */}
          {career.education && (
            <Section title="Education & Training" icon="book">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-3">Requirements</h4>
                  <ul className="space-y-2 text-secondary-700">
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Entry Education: {career.education.typical_entry_education}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Experience: {career.education.work_experience_required}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>On-the-job Training: {career.education.on_the_job_training}</span>
                    </li>
                    {career.education.requires_license_or_cert && (
                      <li className="flex items-center gap-2">
                        <span className="text-amber-500">!</span>
                        <span>License or certification required</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-3">Time & Cost</h4>
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="text-sm text-secondary-600">Time to Job Ready</div>
                      <div className="font-semibold">
                        {career.education.time_to_job_ready.min_years}-{career.education.time_to_job_ready.max_years} years
                        <span className="text-secondary-500 font-normal"> (typically {career.education.time_to_job_ready.typical_years})</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-secondary-600">Estimated Education Cost</div>
                      <div className="font-semibold">
                        {formatPay(career.education.estimated_cost.min_cost)} - {formatPay(career.education.estimated_cost.max_cost)}
                      </div>
                      {career.education.time_to_job_ready.earning_while_learning && (
                        <div className="text-sm text-green-600 mt-1">
                          Can earn while learning
                        </div>
                      )}
                      {/* Institution type breakdown */}
                      {career.education.cost_by_institution_type && (
                        <div className="mt-3 pt-3 border-t border-secondary-200 space-y-1 text-sm">
                          {career.education.cost_by_institution_type.public_in_state && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Public (in-state):</span>
                              <span className="font-medium">{formatPay(career.education.cost_by_institution_type.public_in_state.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.public_out_of_state && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Public (out-of-state):</span>
                              <span className="font-medium">{formatPay(career.education.cost_by_institution_type.public_out_of_state.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.private_nonprofit && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Private nonprofit:</span>
                              <span className="font-medium">{formatPay(career.education.cost_by_institution_type.private_nonprofit.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.community_college && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Community college:</span>
                              <span className="font-medium">{formatPay(career.education.cost_by_institution_type.community_college.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.trade_school && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Trade school:</span>
                              <span className="font-medium">{formatPay(career.education.cost_by_institution_type.trade_school.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.apprenticeship && (
                            <div className="flex justify-between">
                              <span className="text-secondary-600">Apprenticeship:</span>
                              <span className="font-medium text-green-600">
                                {career.education.cost_by_institution_type.apprenticeship.cost === 0 ? '$0 (paid training)' : formatPay(career.education.cost_by_institution_type.apprenticeship.cost)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Data source */}
                      {career.education.cost_data_source && (
                        <div className="mt-2 text-xs text-secondary-400">
                          Source: {career.education.cost_data_source.primary.replace(/_/g, ' ')} ({career.education.cost_data_source.year})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* AI Risk Assessment */}
          {career.ai_risk && (
            <Section title="AI Automation Risk" icon="robot">
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${aiRiskScore <= 3 ? 'text-green-600' : aiRiskScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {career.ai_risk.score}/10
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAIRiskColor(aiRiskScore)}`}>
                    {getAIRiskLabel(aiRiskScore)}
                  </span>
                  <div className="text-sm text-secondary-500 mt-1">
                    Confidence: {career.ai_risk.confidence}
                  </div>
                </div>
              </div>
              <p className="text-secondary-700 mb-4">{career.ai_risk.rationale.summary}</p>

              <div className="grid md:grid-cols-2 gap-4">
                {career.ai_risk.rationale.factors_decreasing_risk.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Lower Risk Factors</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      {career.ai_risk.rationale.factors_decreasing_risk.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>+</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {career.ai_risk.rationale.factors_increasing_risk.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Higher Risk Factors</h4>
                    <ul className="space-y-1 text-sm text-red-700">
                      {career.ai_risk.rationale.factors_increasing_risk.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>-</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* National Importance */}
          {career.national_importance && (
            <Section title="Why This Job Matters" icon="flag">
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${getImportanceColor(importanceScore)} px-4 py-2 rounded-lg`}>
                  {importanceScore}/10
                </div>
                <div>
                  <div className="font-bold text-xl text-secondary-900">
                    {getImportanceLabel(importanceScore)}
                  </div>
                  {career.national_importance.rationale.critical_infrastructure_sector && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {career.national_importance.rationale.critical_infrastructure_sector} Sector
                    </span>
                  )}
                </div>
              </div>
              <p className="text-secondary-700 mb-4">{career.national_importance.rationale.summary}</p>

              <div className="flex flex-wrap gap-2">
                {career.national_importance.rationale.defense_related && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    Defense Related
                  </span>
                )}
                {career.national_importance.rationale.shortage_occupation && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                    Shortage Occupation
                  </span>
                )}
                {career.national_importance.rationale.cannot_offshore && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Cannot Offshore
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* Technology Skills */}
          {career.technology_skills && career.technology_skills.length > 0 && (
            <Section title="Technology Skills" icon="computer">
              <div className="flex flex-wrap gap-2">
                {career.technology_skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Key Abilities */}
          {career.abilities && career.abilities.length > 0 && (
            <Section title="Key Abilities" icon="star">
              <div className="grid md:grid-cols-2 gap-2">
                {career.abilities.slice(0, 10).map((ability, i) => (
                  <div key={i} className="flex items-center gap-2 text-secondary-700">
                    <span className="text-primary-500">•</span>
                    <span>{ability}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Alternate Titles */}
          {career.alternate_titles && career.alternate_titles.length > 0 && (
            <Section title="Also Known As" icon="tag">
              <div className="flex flex-wrap gap-2">
                {career.alternate_titles.slice(0, 10).map((title, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                    {title}
                  </span>
                ))}
                {career.alternate_titles.length > 10 && (
                  <span className="px-3 py-1 text-secondary-500 text-sm">
                    +{career.alternate_titles.length - 10} more
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* What Workers Say */}
          {allReviews.length > 0 && (
            <Section title="What Workers Say" icon="chat">
              <div className="space-y-4">
                <p className="text-sm text-secondary-600">
                  {allReviews.length} testimonial{allReviews.length !== 1 ? 's' : ''} from Reddit
                </p>

                <div className="max-h-[400px] md:max-h-[600px] overflow-y-auto space-y-4 pr-2">
                  {allReviews.map((review) => (
                    <a
                      key={review.id}
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-secondary-50 rounded-lg p-4 hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary-600">
                          r/{review.subreddit}
                        </span>
                        <span className="text-xs text-secondary-500">
                          {review.score} upvotes
                        </span>
                      </div>
                      <h4 className="font-medium text-secondary-900 mb-2 text-sm">
                        {review.title}
                      </h4>
                      {review.text && (
                        <p className="text-secondary-700 text-sm line-clamp-3">
                          {review.text}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Sources */}
          <Section title="Data Sources" icon="link">
            <div className="text-sm text-secondary-600 mb-4">
              Last updated: {career.last_updated}
              <span className="ml-4 px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                O*NET Code: {career.onet_code}
              </span>
            </div>
            <ul className="space-y-2">
              {career.data_sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {source.source} ↗
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          {/* Contribution CTA */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-3">
              Work as a {career.title.split(",")[0]}?
            </h2>
            <p className="text-primary-100 mb-6">
              Help us make this page better. Share your real-world experience,
              correct any errors, or add context that helps others.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`/contribute?career=${career.slug}`}
                className="inline-flex items-center px-5 py-2.5 bg-white text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Share Your Experience
              </a>
              <a
                href={`/contribute?career=${career.slug}&type=correction`}
                className="inline-flex items-center px-5 py-2.5 border border-primary-300 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors"
              >
                Report an Error
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const icons: Record<string, string> = {
  clipboard: "📋",
  chart: "📈",
  book: "📚",
  robot: "🤖",
  flag: "🇺🇸",
  computer: "💻",
  star: "⭐",
  tag: "🏷️",
  link: "🔗",
  chat: "💬",
  video: "🎬",
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 md:p-8">
      <h2 className="text-xl font-bold text-secondary-900 mb-4 flex items-center gap-2">
        <span>{icons[icon] || "📌"}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
