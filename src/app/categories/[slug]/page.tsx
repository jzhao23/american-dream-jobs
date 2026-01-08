import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CareerExplorer } from "@/components/CareerExplorer";
import {
  ALL_CATEGORY_IDS,
  isCategoryId,
  getCategoryMetadata,
  getCategoryIcon,
  getCategoryContent,
  computeCategoryStats,
  getCareersByCategory,
  getAIRiskLevel,
} from "@/lib/categories";
import { formatPay } from "@/types/career";
import careersIndex from "../../../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

// Generate static params for all categories
export function generateStaticParams() {
  return ALL_CATEGORY_IDS.map((id) => ({ slug: id }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!isCategoryId(slug)) {
    return { title: "Category Not Found" };
  }

  const category = getCategoryMetadata(slug);
  const careers = careersIndex as CareerIndex[];
  const stats = computeCategoryStats(careers, slug);

  return {
    title: `${category.name} Careers | American Dream Jobs`,
    description: `Explore ${stats.totalCareers} ${category.name} careers. ${category.description} Median salary: ${formatPay(stats.medianPay)}.`,
    openGraph: {
      title: `${category.name} Careers`,
      description: category.description,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Validate category
  if (!isCategoryId(slug)) {
    notFound();
  }

  const careers = careersIndex as CareerIndex[];
  const category = getCategoryMetadata(slug);
  const content = getCategoryContent(slug);
  const stats = computeCategoryStats(careers, slug);
  const categoryCarers = getCareersByCategory(careers, slug);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-sage to-sage-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="text-sm text-white/70 mb-6">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">→</span>
            <Link href="/categories" className="hover:text-white">
              Categories
            </Link>
            <span className="mx-2">→</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <div className="flex items-start gap-4">
            <div className="text-5xl">{getCategoryIcon(slug)}</div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
                {category.name}
              </h1>
              <p className="text-xl text-white/90 mb-4">
                {category.description}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {stats.totalCareers} careers
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {formatPay(stats.medianPay)} median pay
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {getAIRiskLevel(stats.avgAIRisk)} AI risk
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* What You'll Do */}
            <div className="bg-cream rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>📋</span> What You'll Do
              </h3>
              <ul className="space-y-2">
                {content.typicalTasks.slice(0, 6).map((task, i) => (
                  <li
                    key={i}
                    className="text-sm text-ds-slate-light flex items-start gap-2"
                  >
                    <span className="text-sage mt-0.5">•</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Education & Training */}
            <div className="bg-cream rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>🎓</span> Education & Training
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-ds-slate">
                    Typical Path
                  </div>
                  <div className="text-sm text-ds-slate-light">
                    {content.educationPaths.typical}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ds-slate">
                    Time Investment
                  </div>
                  <div className="text-sm text-ds-slate-light">
                    {content.educationPaths.timeRange}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-ds-slate">
                    Common Credentials
                  </div>
                  <ul className="text-sm text-ds-slate-light">
                    {content.educationPaths.commonCredentials
                      .slice(0, 3)
                      .map((cred, i) => (
                        <li key={i}>• {cred}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Who This Is For */}
            <div className="bg-cream rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold text-ds-slate mb-4 flex items-center gap-2">
                <span>👤</span> Who This Is For
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-sage mb-2">
                    Good fit if you:
                  </div>
                  <ul className="space-y-1">
                    {content.whoItsFor.slice(0, 4).map((trait, i) => (
                      <li
                        key={i}
                        className="text-sm text-ds-slate-light flex items-start gap-2"
                      >
                        <span className="text-sage mt-0.5">✓</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-terracotta mb-2">
                    Not ideal if you:
                  </div>
                  <ul className="space-y-1">
                    {content.whoItsNotFor.slice(0, 2).map((trait, i) => (
                      <li
                        key={i}
                        className="text-sm text-ds-slate-light flex items-start gap-2"
                      >
                        <span className="text-terracotta mt-0.5">✗</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">
              About {category.name} Careers
            </h2>
            <div className="prose text-ds-slate-light">
              {content.longDescription.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Skills */}
      <section className="bg-cream border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">
            Core Skills Needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {content.coreSkills.map((skill, i) => (
              <span
                key={i}
                className="bg-warm-white px-3 py-1.5 rounded-full text-sm text-ds-slate-light border border-sage-muted"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Career Explorer Section */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <p className="section-eyebrow">Explore Careers</p>
            <h2 className="section-title">{category.name} Careers</h2>
            <p className="section-subtitle">
              Explore all {stats.totalCareers} careers in this category
            </p>
          </div>
          <CareerExplorer careers={categoryCarers} hideCategoryFilter />
        </div>
      </section>

      {/* Back Navigation */}
      <section className="bg-warm-white border-t border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/categories"
              className="text-sage hover:text-sage-dark font-medium"
            >
              ← All Categories
            </Link>
            <span className="text-ds-slate-muted hidden sm:inline">|</span>
            <Link
              href="/"
              className="text-sage hover:text-sage-dark font-medium"
            >
              ← All Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
