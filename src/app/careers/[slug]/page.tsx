import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as fs from "fs";
import * as path from "path";
import careers from "../../../../data/output/careers.json";
import careersIndex from "../../../../data/output/careers-index.json";
import reviewsIndex from "../../../../data/reviews/reviews-index.json";
import type { Career } from "@/types/career";
import { SpecializationsTable } from "@/components/SpecializationsTable";

// Try to load specializations if they exist
let specializations: Career[] = [];
try {
  specializations = require("../../../../data/output/specializations.json") as Career[];
} catch {
  // Specializations file may not exist yet
}
import {
  formatPay,
  formatPayRange,
  getTrainingTimeLabel,
  getCategoryColor,
  getAIResilienceColor,
  getAIResilienceEmoji,
  type AIResilienceClassification,
} from "@/types/career";
import { AIAssessmentDetail } from "@/components/AIAssessmentDetail";
import { CareerVideoPlayer } from "@/components/CareerVideoPlayer";
import { LocalJobMarket } from "@/components/LocalJobMarket";
import { FindJobsSection, CareerHeroCTAs, CareerPageWrapper } from "@/components/jobs";
import { TableOfContents } from "@/components/TableOfContents";
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
  // Use education_duration (ground truth) if available
  const trainingTime = getTrainingTimeFromYears(career.education?.education_duration?.typical_years ?? career.education?.time_to_job_ready?.typical_years ?? 2);

  return {
    title: `${career.title} | American Dream Jobs`,
    description: `Learn about becoming a ${career.title}. Median pay: ${formatPay(medianPay)}. Training: ${getTrainingTimeLabel(trainingTime)}. Real career info with AI resilience scores.`,
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
  // Use education_duration (ground truth) if available
  const educationDuration = career.education?.education_duration || career.education?.time_to_job_ready;
  const trainingTime = getTrainingTimeFromYears(educationDuration?.typical_years ?? 2);
  const trainingYears = educationDuration;
  const aiResilience = career.ai_resilience as AIResilienceClassification | undefined;
  const aiAssessment = career.ai_assessment;

  // Find reviews for this career (match by slug or SOC code)
  const careerReviewsSummary = (reviewsIndex as RawCareerReviewsSummary[]).find(
    (r) => r.slug === career.slug || r.soc_code === career.soc_code
  );

  // Load all reviews for this career (for scrollable display)
  const allReviews = loadCareerReviews(career.slug);

  return (
    <CareerPageWrapper
      careerSlug={career.slug}
      careerTitle={career.title}
      onetCode={career.onet_code}
      alternateJobTitles={career.alternate_titles?.slice(0, 5)}
    >
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ds-slate-light mb-4">
            <a href="/" className="hover:text-sage">
              Home
            </a>
            <span>/</span>
            <a href="/#careers" className="hover:text-sage">
              Careers
            </a>
            <span>/</span>
            <span className="text-ds-slate">{career.title}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(career.category)} mb-3`}>
                {career.category}
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-ds-slate mb-2">
                {career.title}
              </h1>
              {career.description && (
                <p className="text-lg text-ds-slate-light max-w-2xl">
                  {career.description}
                </p>
              )}
            </div>

            <div className="bg-cream rounded-xl p-6 min-w-[200px]">
              <div className="text-center">
                <div className="text-sm text-ds-slate-light mb-1">
                  Median Annual Pay
                </div>
                <div className="text-3xl font-bold text-sage mb-2">
                  {formatPay(medianPay)}
                </div>
                {payRange && payRange.min > 0 && payRange.max > 0 && (
                  <div className="text-sm text-ds-slate-muted">
                    Range: {formatPayRange(payRange.min, payRange.max)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-cream rounded-lg p-4">
              <div className="text-sm text-ds-slate-light mb-1">
                Training Time
              </div>
              <div className="font-semibold text-ds-slate">
                {getTrainingTimeLabel(trainingTime, trainingYears ? {
                  min: trainingYears.min_years,
                  max: trainingYears.max_years,
                  typical: trainingYears.typical_years
                } : undefined)}
              </div>
            </div>
            <div className="bg-cream rounded-lg p-4">
              <div className="text-sm text-ds-slate-light mb-1">
                AI Resilience
              </div>
              <div className="flex items-center gap-2">
                {aiResilience ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAIResilienceColor(aiResilience)}`}>
                    <span>{getAIResilienceEmoji(aiResilience)}</span>
                    <span>{aiResilience}</span>
                  </span>
                ) : (
                  <span className="text-ds-slate-muted text-sm">Assessment pending</span>
                )}
              </div>
            </div>
            <div className="bg-cream rounded-lg p-4">
              <div className="text-sm text-ds-slate-light mb-1">
                Education
              </div>
              <div className="font-semibold text-ds-slate text-sm">
                {career.education?.typical_entry_education || "Varies"}
              </div>
            </div>
          </div>

          {/* Action CTAs - Find Jobs and Training are most prominent */}
          <CareerHeroCTAs
            careerSlug={career.slug}
            careerTitle={career.title}
            onetCode={career.onet_code}
            alternateJobTitles={career.alternate_titles?.slice(0, 5)}
          />
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Table of Contents */}
        <TableOfContents
          items={[
            ...(career.video ? [{ id: "career-video", label: "Career Video" }] : []),
            ...(aiAssessment ? [{ id: "ai-resilience", label: "AI Resilience Assessment" }] : []),
            ...(career.tasks && career.tasks.length > 0 ? [{ id: "responsibilities", label: "Key Responsibilities" }] : []),
            ...(career.inside_look ? [{ id: "inside-look", label: "Inside This Career" }] : []),
            ...(career.career_progression?.levels ? [{ id: "career-progression", label: "Career Progression" }] : []),
            ...(career.education ? [{ id: "education", label: "Education & Training" }] : []),
            { id: "local-jobs", label: "Local Job Market" },
            ...(career.technology_skills && career.technology_skills.length > 0 ? [{ id: "skills", label: "Technology Skills" }] : []),
            ...(allReviews.length > 0 ? [{ id: "reviews", label: "What Workers Say" }] : []),
          ]}
        />

        <div className="space-y-8">
          {/* Career Video */}
          {career.video && (
            <Section title="Career Video" icon="video" id="career-video">
              <div className="space-y-4">
                <CareerVideoPlayer video={career.video} careerTitle={career.title} />
                <a
                  href="https://www.careeronestop.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-cream rounded-md hover:bg-sage-muted transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-sage">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-sm font-medium text-ds-slate-light">
                    CareerOneStop
                  </span>
                  <span className="text-xs text-ds-slate-muted">
                    U.S. Department of Labor
                  </span>
                </a>
              </div>
            </Section>
          )}

          {/* AI Resilience Assessment - Moved up for visibility */}
          {aiAssessment && (
            <Section title="AI Resilience Assessment" icon="robot" id="ai-resilience">
              <AIAssessmentDetail assessment={aiAssessment} />
            </Section>
          )}

          {/* Key Tasks */}
          {career.tasks && career.tasks.length > 0 && (
            <Section title="Key Responsibilities" icon="clipboard" id="responsibilities">
              <ul className="space-y-3">
                {career.tasks.slice(0, 8).map((task, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-sage mt-1">•</span>
                    <span className="text-ds-slate-light">{task}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Inside This Career */}
          {career.inside_look && (
            <Section title="Inside This Career" icon="insight" id="inside-look">
              <div className="prose max-w-none">
                {career.inside_look.content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-ds-slate-light leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Section>
          )}

          {/* Career Progression */}
          {career.career_progression && career.career_progression.levels && (
            <Section title="Career Progression" icon="chart" id="career-progression">
              <details className="mb-4 group">
                <summary className="text-sm text-sage hover:text-sage-dark cursor-pointer inline-flex items-center gap-1">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  What does this mean?
                </summary>
                <p className="text-sm text-ds-slate-muted mt-2 pl-5">
                  This shows how earnings typically grow with experience. Entry level represents starting salaries, while Expert shows top earners (90th percentile). Most workers reach mid-career earnings within 5-10 years. Figures are national averages and vary by location and employer.
                </p>
              </details>
              <div className="space-y-4">
                {career.career_progression.levels.map((level, i) => (
                  <div key={i} className="flex items-center gap-4 bg-cream rounded-lg p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sage-muted text-sage flex items-center justify-center font-bold">
                      {level.level_number}
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-ds-slate">{level.level_name}</div>
                      <div className="text-sm text-ds-slate-light">
                        {level.years_experience.min}-{level.years_experience.max} years experience
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sage">
                        {formatPay(level.compensation.total.median)}
                      </div>
                      <div className="text-xs text-ds-slate-muted">
                        {formatPay(level.compensation.total.min)} - {formatPay(level.compensation.total.max)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {career.career_progression.source === "levels_fyi" && (
                <div className="mt-4 text-sm text-ds-slate-muted">
                  Data source: Levels.fyi ({career.career_progression.match_confidence} match)
                </div>
              )}
            </Section>
          )}

          {/* Education & Training */}
          {career.education && (
            <Section title="Education & Training" icon="book" id="education">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-ds-slate mb-3">Requirements</h4>
                  <ul className="space-y-2 text-ds-slate-light">
                    <li className="flex items-center gap-2">
                      <span className="text-sage">•</span>
                      <span>Entry Education: {career.education.typical_entry_education}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-sage">•</span>
                      <span>Experience: {career.education.work_experience_required}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-sage">•</span>
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
                  <h4 className="font-semibold text-ds-slate mb-3">Time & Cost</h4>
                  <div className="bg-cream rounded-lg p-4">
                    <div className="mb-3">
                      <div className="text-sm text-ds-slate-light">Education Duration</div>
                      <div className="font-semibold text-ds-slate">
                        {trainingYears ? `${trainingYears.min_years}-${trainingYears.max_years} years` : 'Varies'}
                        {trainingYears && <span className="text-ds-slate-muted font-normal"> (typically {trainingYears.typical_years})</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-ds-slate-light">Estimated Education Cost</div>
                      <div className="font-semibold text-ds-slate">
                        {career.education.estimated_cost ? (
                          <>{formatPay(career.education.estimated_cost.min_cost)} - {formatPay(career.education.estimated_cost.max_cost)}</>
                        ) : (
                          'Varies'
                        )}
                      </div>
                      {career.education.time_to_job_ready?.earning_while_learning && (
                        <div className="text-sm text-green-600 mt-1">
                          Can earn while learning
                        </div>
                      )}
                      {/* Institution type breakdown */}
                      {career.education.cost_by_institution_type && (
                        <div className="mt-3 pt-3 border-t border-sage-muted space-y-1 text-sm">
                          {career.education.cost_by_institution_type.public_in_state && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Public (in-state):</span>
                              <span className="font-medium text-ds-slate">{formatPay(career.education.cost_by_institution_type.public_in_state.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.public_out_of_state && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Public (out-of-state):</span>
                              <span className="font-medium text-ds-slate">{formatPay(career.education.cost_by_institution_type.public_out_of_state.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.private_nonprofit && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Private nonprofit:</span>
                              <span className="font-medium text-ds-slate">{formatPay(career.education.cost_by_institution_type.private_nonprofit.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.community_college && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Community college:</span>
                              <span className="font-medium text-ds-slate">{formatPay(career.education.cost_by_institution_type.community_college.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.trade_school && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Trade school:</span>
                              <span className="font-medium text-ds-slate">{formatPay(career.education.cost_by_institution_type.trade_school.total)}</span>
                            </div>
                          )}
                          {career.education.cost_by_institution_type.apprenticeship && (
                            <div className="flex justify-between">
                              <span className="text-ds-slate-light">Apprenticeship:</span>
                              <span className="font-medium text-green-600">
                                {career.education.cost_by_institution_type.apprenticeship.cost === 0 ? '$0 (paid training)' : formatPay(career.education.cost_by_institution_type.apprenticeship.cost)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Data source */}
                      {career.education.cost_data_source && (
                        <div className="mt-2 text-xs text-ds-slate-muted">
                          Source: {career.education.cost_data_source.primary.replace(/_/g, ' ')} ({career.education.cost_data_source.year})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Local Job Market */}
          <div id="local-jobs" className="scroll-mt-20">
            <LocalJobMarket
              careerSlug={career.slug}
              careerTitle={career.title}
              nationalMedianWage={medianPay}
            />
          </div>

          {/* Find Jobs & Training Section */}
          <FindJobsSection
            careerSlug={career.slug}
            careerTitle={career.title}
            onetCode={career.onet_code}
            alternateJobTitles={career.alternate_titles?.slice(0, 5)}
            medianSalary={medianPay}
          />

          {/* Technology Skills */}
          {career.technology_skills && career.technology_skills.length > 0 && (
            <Section title="Technology Skills" icon="computer" id="skills">
              <div className="flex flex-wrap gap-2">
                {career.technology_skills.slice(0, 15).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-sage-muted text-ds-slate-light rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Key Abilities */}
          {career.abilities && career.abilities.length > 0 && (
            <Section title="Key Abilities" icon="star" id="abilities">
              <div className="grid md:grid-cols-2 gap-2">
                {career.abilities.slice(0, 10).map((ability, i) => (
                  <div key={i} className="flex items-center gap-2 text-ds-slate-light">
                    <span className="text-sage">•</span>
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
                  <span key={i} className="px-3 py-1 bg-sage-muted text-ds-slate-light rounded-full text-sm">
                    {title}
                  </span>
                ))}
                {career.alternate_titles.length > 10 && (
                  <span className="px-3 py-1 text-ds-slate-muted text-sm">
                    +{career.alternate_titles.length - 10} more
                  </span>
                )}
              </div>
            </Section>
          )}

          {/* Specializations Section (for consolidated careers) */}
          {(() => {
            // Check if this career has specializations
            const careerWithSpecs = career as Career & {
              specialization_count?: number;
              specialization_slugs?: string[];
              display_strategy?: string;
              specialization_label?: string;
            };

            if (
              careerWithSpecs.display_strategy !== 'show-specializations' ||
              !careerWithSpecs.specialization_slugs ||
              careerWithSpecs.specialization_slugs.length === 0
            ) {
              return null;
            }

            // Find the specializations for this career
            const careerSpecs = specializations.filter(
              (s) => careerWithSpecs.specialization_slugs?.includes(s.slug)
            );

            if (careerSpecs.length === 0) return null;

            return (
              <Section
                title={careerWithSpecs.specialization_label || "Specializations"}
                icon="layers"
              >
                <SpecializationsTable
                  specializations={careerSpecs}
                  parentCareerSlug={career.slug}
                  label={careerWithSpecs.specialization_label || "Specializations"}
                />
              </Section>
            );
          })()}

          {/* Related Careers */}
          {(() => {
            const relatedCareers = (careersIndex as { slug: string; title: string; category: string; median_pay: number }[])
              .filter(c => c.category === career.category && c.slug !== career.slug)
              .sort((a, b) => (b.median_pay || 0) - (a.median_pay || 0))
              .slice(0, 5);

            if (relatedCareers.length === 0) return null;

            return (
              <Section title="Related Careers" icon="link">
                <p className="text-sm text-ds-slate-light mb-4">
                  Other careers in {career.category}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedCareers.map((related) => (
                    <div key={related.slug} className="bg-cream rounded-lg p-4 hover:bg-sage-muted transition-colors">
                      <a
                        href={`/careers/${related.slug}`}
                        className="font-medium text-sage hover:text-sage-dark hover:underline block mb-1"
                      >
                        {related.title}
                      </a>
                      <div className="text-sm text-ds-slate-light mb-3">
                        {formatPay(related.median_pay)}/yr
                      </div>
                      <a
                        href={`/compare?careers=${career.slug},${related.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-ds-slate-muted hover:text-sage"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </a>
                    </div>
                  ))}
                </div>
              </Section>
            );
          })()}

          {/* What Workers Say */}
          {allReviews.length > 0 && (
            <Section title="What Workers Say" icon="chat" id="reviews">
              <div className="space-y-4">
                <p className="text-sm text-ds-slate-light">
                  {allReviews.length} testimonial{allReviews.length !== 1 ? 's' : ''} from Reddit
                </p>

                <div className="max-h-[400px] md:max-h-[600px] overflow-y-auto space-y-4 pr-2">
                  {allReviews.map((review) => (
                    <a
                      key={review.id}
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-cream rounded-lg p-4 hover:bg-sage-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-sage">
                          r/{review.subreddit}
                        </span>
                        <span className="text-xs text-ds-slate-muted">
                          {review.score} upvotes
                        </span>
                      </div>
                      <h4 className="font-medium text-ds-slate mb-2 text-sm">
                        {review.title}
                      </h4>
                      {review.text && (
                        <p className="text-ds-slate-light text-sm line-clamp-3">
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
            <div className="text-sm text-ds-slate-light mb-4">
              Last updated: {career.last_updated}
              {career.onet_code && (
                <span className="ml-4 px-2 py-0.5 bg-sage-muted text-ds-slate-light rounded text-xs">
                  O*NET Code: {career.onet_code}
                </span>
              )}
              {career.data_source === 'manual' && (
                <span className="ml-4 px-2 py-0.5 bg-sage-muted text-ds-slate-light rounded text-xs">
                  Manually Sourced
                </span>
              )}
            </div>
            {/* O*NET careers - show data sources */}
            {career.data_sources && (
              <ul className="space-y-2">
                {career.data_sources.map((source, i) => (
                  <li key={i}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage hover:text-sage-dark hover:underline"
                    >
                      {source.source} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {/* Manual careers - show source citations */}
            {career.source_citations && (
              <div className="space-y-2 text-sm">
                <div><span className="text-ds-slate-light">Wages:</span> {career.source_citations.wages}</div>
                <div><span className="text-ds-slate-light">Skills:</span> {career.source_citations.skills}</div>
                <div><span className="text-ds-slate-light">Outlook:</span> {career.source_citations.outlook}</div>
                <div><span className="text-ds-slate-light">AI Assessment:</span> {career.source_citations.ai_assessment}</div>
              </div>
            )}
          </Section>

          {/* Feedback CTA */}
          <div className="bg-gradient-to-r from-sage to-sage-dark rounded-xl p-8 text-white">
            <h2 className="font-display text-2xl font-semibold mb-3">
              Have feedback about this page?
            </h2>
            <p className="text-white/80 mb-6">
              Help us make this page better. Share your experience, correct errors, or suggest improvements.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://forms.gle/AUDDvhvbBtiHVkZE8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 bg-white text-sage rounded-lg font-semibold hover:bg-sage-pale transition-colors"
              >
                Give Feedback
              </a>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/20">
              <a
                href={`/compare?career=${career.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Compare Careers
              </a>
              <a
                href={`/calculator?career=${career.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Calculate Earnings
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </CareerPageWrapper>
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
  insight: "💡",
  layers: "📑",
};

function Section({
  title,
  icon,
  id,
  children,
}: {
  title: string;
  icon: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card-warm p-6 md:p-8 scroll-mt-20">
      <h2 className="font-display text-xl font-semibold text-ds-slate mb-4 flex items-center gap-2">
        <span>{icons[icon] || "📌"}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
