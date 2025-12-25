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
import careersIndex from "../../../../data/careers-index.json";
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
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="text-sm text-primary-200 mb-6">
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-xl text-primary-100 mb-4">
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
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* What You'll Do */}
            <div className="bg-secondary-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <span>📋</span> What You'll Do
              </h3>
              <ul className="space-y-2">
                {content.typicalTasks.slice(0, 6).map((task, i) => (
                  <li
                    key={i}
                    className="text-sm text-secondary-700 flex items-start gap-2"
                  >
                    <span className="text-primary-500 mt-0.5">•</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Education & Training */}
            <div className="bg-secondary-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <span>🎓</span> Education & Training
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-secondary-900">
                    Typical Path
                  </div>
                  <div className="text-sm text-secondary-700">
                    {content.educationPaths.typical}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-900">
                    Time Investment
                  </div>
                  <div className="text-sm text-secondary-700">
                    {content.educationPaths.timeRange}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-900">
                    Common Credentials
                  </div>
                  <ul className="text-sm text-secondary-700">
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
            <div className="bg-secondary-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <span>👤</span> Who This Is For
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-2">
                    Good fit if you:
                  </div>
                  <ul className="space-y-1">
                    {content.whoItsFor.slice(0, 4).map((trait, i) => (
                      <li
                        key={i}
                        className="text-sm text-secondary-700 flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-700 mb-2">
                    Not ideal if you:
                  </div>
                  <ul className="space-y-1">
                    {content.whoItsNotFor.slice(0, 2).map((trait, i) => (
                      <li
                        key={i}
                        className="text-sm text-secondary-700 flex items-start gap-2"
                      >
                        <span className="text-red-500 mt-0.5">✗</span>
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
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
              About {category.name} Careers
            </h2>
            <div className="prose prose-secondary text-secondary-700">
              {content.longDescription.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Skills */}
      <section className="bg-secondary-50 border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Core Skills Needed
          </h2>
          <div className="flex flex-wrap gap-2">
            {content.coreSkills.map((skill, i) => (
              <span
                key={i}
                className="bg-white px-3 py-1.5 rounded-full text-sm text-secondary-700 border border-secondary-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Career Explorer Section */}
      <section className="bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              {category.name} Careers
            </h2>
            <p className="text-secondary-600">
              Explore all {stats.totalCareers} careers in this category
            </p>
          </div>
          <CareerExplorer careers={categoryCarers} hideCategoryFilter />
        </div>
      </section>

      {/* Back Navigation */}
      <section className="bg-white border-t border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/categories"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← All Categories
            </Link>
            <span className="text-secondary-300 hidden sm:inline">|</span>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← All Careers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
