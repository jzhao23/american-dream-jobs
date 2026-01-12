import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import specializations from "../../../../data/output/specializations.json";
import careers from "../../../../data/output/careers.json";
import type { Career } from "@/types/career";
import {
  formatPay,
  formatPayRange,
  getTrainingTimeLabel,
  getCategoryColor,
  getCategoryLabel,
  getAIResilienceColor,
  getAIResilienceEmoji,
  getAIResilienceDescription,
  type AIResilienceClassification,
} from "@/types/career";
import { AIAssessmentDetail } from "@/components/AIAssessmentDetail";
import { CareerVideoPlayer } from "@/components/CareerVideoPlayer";
import { FindJobsButton, FindJobsSection } from "@/components/jobs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Cast specializations to Career type
const typedSpecializations = specializations as Career[];
const typedCareers = careers as Career[];

// Generate static paths for all specializations
export async function generateStaticParams() {
  return typedSpecializations.map((spec) => ({
    slug: spec.slug,
  }));
}

// Get training time category from years
function getTrainingTimeFromYears(years: number): "<6mo" | "6-24mo" | "2-4yr" | "4+yr" {
  if (years < 0.5) return "<6mo";
  if (years < 2) return "6-24mo";
  if (years < 4) return "2-4yr";
  return "4+yr";
}

// Generate metadata for each specialization page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const spec = typedSpecializations.find((s) => s.slug === slug);

  if (!spec) {
    return {
      title: "Specialization Not Found | American Dream Jobs",
    };
  }

  const medianPay = spec.wages?.annual?.median || 0;
  const trainingTime = getTrainingTimeFromYears(
    spec.education?.education_duration?.typical_years ?? spec.education?.time_to_job_ready?.typical_years ?? 2
  );

  return {
    title: `${spec.title} | American Dream Jobs`,
    description: `Detailed information about ${spec.title}. Median pay: ${formatPay(medianPay)}. Training: ${getTrainingTimeLabel(trainingTime)}.`,
    openGraph: {
      title: `${spec.title} | American Dream Jobs`,
      description: spec.description?.substring(0, 160) || "",
    },
  };
}

// Section component for consistent styling
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-ds-slate mb-4 flex items-center gap-2">
        {icon && <span className="text-sage">{getIcon(icon)}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

function getIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    briefcase: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    book: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    chip: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    brain: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    list: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    video: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export default async function SpecializationPage({ params }: PageProps) {
  const { slug } = await params;
  const spec = typedSpecializations.find((s) => s.slug === slug);

  if (!spec) {
    notFound();
  }

  // Find parent career
  const parentCareer = spec.parent_career_slug
    ? typedCareers.find((c) => c.slug === spec.parent_career_slug)
    : null;

  // Calculate display values
  const medianPay = spec.wages?.annual?.median || 0;
  const payRange = spec.wages?.annual
    ? { low: spec.wages.annual.pct_10 || 0, high: spec.wages.annual.pct_90 || 0 }
    : null;
  const trainingYears = spec.education?.education_duration?.typical_years ?? spec.education?.time_to_job_ready?.typical_years ?? 2;
  const trainingTime = getTrainingTimeFromYears(trainingYears);
  const aiResilience = spec.ai_resilience as AIResilienceClassification | undefined;

  return (
    <main className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-ds-slate-muted">
            <Link href="/#careers" className="hover:text-sage">
              Careers
            </Link>
            <span>/</span>
            {parentCareer ? (
              <>
                <Link href={`/careers/${parentCareer.slug}`} className="hover:text-sage">
                  {parentCareer.title}
                </Link>
                <span>/</span>
              </>
            ) : null}
            <span className="text-ds-slate font-medium">{spec.title}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(spec.category)}`}
                >
                  {getCategoryLabel(spec.category)}
                </span>
                {spec.onet_code && (
                  <span className="px-2 py-0.5 bg-sage-muted text-ds-slate-muted rounded text-xs font-mono">
                    {spec.onet_code}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                  Specialization
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-ds-slate mb-3">
                {spec.title}
              </h1>
              {spec.description && (
                <p className="text-ds-slate-light max-w-2xl">
                  {spec.description}
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-sage">
                  {medianPay > 0 ? formatPay(medianPay) : "N/A"}
                </div>
                <div className="text-xs text-ds-slate-muted">Median Pay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sage">
                  {getTrainingTimeLabel(trainingTime, spec.education?.time_to_job_ready ? {
                    min: spec.education.time_to_job_ready.min_years,
                    max: spec.education.time_to_job_ready.max_years,
                    typical: spec.education.time_to_job_ready.typical_years,
                  } : undefined)}
                </div>
                <div className="text-xs text-ds-slate-muted">Training</div>
              </div>
              {aiResilience && (
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {getAIResilienceEmoji(aiResilience)}
                  </div>
                  <div className={`text-xs ${getAIResilienceColor(aiResilience).split(' ')[0]}`}>
                    {aiResilience}
                  </div>
                </div>
              )}
              {spec.time_to_paycheck && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-sage">
                    {spec.time_to_paycheck.can_earn_while_learning ? (
                      <span className="text-green-600 text-lg">Immediate</span>
                    ) : (
                      <span>{spec.time_to_paycheck.min_months}-{spec.time_to_paycheck.typical_months}mo</span>
                    )}
                  </div>
                  <div className="text-xs text-ds-slate-muted">To Paycheck</div>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-3 mt-6">
            <FindJobsButton
              careerSlug={spec.slug}
              careerTitle={spec.title}
              alternateJobTitles={spec.alternate_titles?.slice(0, 5)}
              variant="hero"
            />
            {parentCareer && (
              <Link
                href={`/careers/${parentCareer.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-warm-white border border-sage-muted rounded-lg text-ds-slate-light hover:border-sage hover:text-sage transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                View {parentCareer.title}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back to Parent Career */}
        {parentCareer && (
          <div className="bg-sage-muted/30 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <div>
              <p className="text-sm text-ds-slate-muted">This is a specialization of</p>
              <Link
                href={`/careers/${parentCareer.slug}`}
                className="font-medium text-sage hover:text-sage-dark hover:underline"
              >
                {parentCareer.title}
              </Link>
            </div>
          </div>
        )}

        {/* Video Section */}
        {spec.video && (
          <Section title="Career Overview Video" icon="video">
            <CareerVideoPlayer video={spec.video} careerTitle={spec.title} />
          </Section>
        )}

        {/* Key Responsibilities */}
        {spec.tasks && spec.tasks.length > 0 && (
          <Section title="Key Responsibilities" icon="briefcase">
            <ul className="space-y-2">
              {spec.tasks.slice(0, 10).map((task, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-sage mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-ds-slate-light text-sm">{task}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Education & Training */}
        {spec.education && (
          <Section title="Education & Training" icon="book">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-ds-slate mb-1">Typical Entry Education</h3>
                <p className="text-ds-slate-light">{spec.education.typical_entry_education}</p>
              </div>
              {spec.education.time_to_job_ready && (
                <div>
                  <h3 className="text-sm font-medium text-ds-slate mb-1">Time to Job Ready</h3>
                  <p className="text-ds-slate-light">
                    {spec.education.time_to_job_ready.min_years === spec.education.time_to_job_ready.max_years
                      ? `${spec.education.time_to_job_ready.typical_years} years`
                      : `${spec.education.time_to_job_ready.min_years}-${spec.education.time_to_job_ready.max_years} years`}
                  </p>
                  {spec.education.time_to_job_ready.notes && (
                    <p className="text-xs text-ds-slate-muted mt-1">
                      {spec.education.time_to_job_ready.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Technology Skills */}
        {spec.technology_skills && spec.technology_skills.length > 0 && (
          <Section title="Technology Skills" icon="chip">
            <div className="flex flex-wrap gap-2">
              {spec.technology_skills.slice(0, 15).map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-sage-muted text-ds-slate rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Abilities */}
        {spec.abilities && spec.abilities.length > 0 && (
          <Section title="Key Abilities" icon="brain">
            <div className="flex flex-wrap gap-2">
              {spec.abilities.slice(0, 10).map((ability, i) => (
                <span key={i} className="px-3 py-1 bg-cream text-ds-slate-light rounded-full text-sm border border-sage-muted">
                  {ability}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* AI Assessment */}
        {spec.ai_assessment && (
          <Section title="AI Impact Assessment" icon="chip">
            <AIAssessmentDetail assessment={spec.ai_assessment} />
          </Section>
        )}

        {/* Find Jobs Section */}
        <FindJobsSection
          careerSlug={spec.slug}
          careerTitle={spec.title}
          alternateJobTitles={spec.alternate_titles?.slice(0, 5)}
          medianSalary={medianPay}
        />

        {/* Compensation Details */}
        {payRange && (payRange.low > 0 || payRange.high > 0) && (
          <Section title="Compensation Details" icon="list">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-ds-slate">
                    {payRange.low > 0 ? formatPay(payRange.low) : 'N/A'}
                  </div>
                  <div className="text-xs text-ds-slate-muted">10th Percentile</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-sage">
                    {medianPay > 0 ? formatPay(medianPay) : 'N/A'}
                  </div>
                  <div className="text-xs text-ds-slate-muted">Median</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-ds-slate">
                    {payRange.high > 0 ? formatPay(payRange.high) : 'N/A'}
                  </div>
                  <div className="text-xs text-ds-slate-muted">90th Percentile</div>
                </div>
              </div>
              {spec.wages?.employment_count && (
                <p className="text-xs text-ds-slate-muted text-center">
                  Based on {spec.wages.employment_count.toLocaleString()} employed workers
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Alternate Titles */}
        {spec.alternate_titles && spec.alternate_titles.length > 0 && (
          <Section title="Also Known As" icon="list">
            <div className="flex flex-wrap gap-2">
              {spec.alternate_titles.slice(0, 10).map((title, i) => (
                <span key={i} className="px-3 py-1 bg-sage-muted text-ds-slate-light rounded-full text-sm">
                  {title}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Data Sources */}
        <div className="text-xs text-ds-slate-muted text-center py-4">
          <p>Data from O*NET 30.1 and BLS Occupational Employment Statistics</p>
          {spec.onet_code && (
            <p className="mt-1">O*NET Code: {spec.onet_code}</p>
          )}
        </div>
      </div>
    </main>
  );
}
