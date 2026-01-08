import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllCategories,
  getCategoryIcon,
  computeCategoryStats,
} from "@/lib/categories";
import { formatPay } from "@/types/career";
import careersIndex from "../../../data/output/careers-index.json";
import type { CareerIndex } from "@/types/career";

export const metadata: Metadata = {
  title: "Career Categories | American Dream Jobs",
  description:
    "Explore 22 career categories covering 1,000+ occupations. Find the right field for your skills and interests.",
};

export default function CategoriesPage() {
  const careers = careersIndex as CareerIndex[];
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <nav className="text-sm text-ds-slate-muted mb-4">
              <Link href="/" className="hover:text-sage">
                Home
              </Link>
              <span className="mx-2">→</span>
              <span className="text-ds-slate">Categories</span>
            </nav>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-ds-slate mb-4">
              Explore Career Categories
            </h1>
            <p className="text-lg text-ds-slate-light">
              Browse careers by field. Each category includes detailed information
              about skills, education, and career outlook.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const stats = computeCategoryStats(careers, category.id);
            return (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group bg-warm-white rounded-xl border border-sage-muted p-6 hover:shadow-lg hover:border-sage transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getCategoryIcon(category.id)}</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-lg font-semibold text-ds-slate group-hover:text-sage transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-ds-slate-light mt-1 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-ds-slate-muted">
                      <span>{stats.totalCareers} careers</span>
                      <span>{formatPay(stats.medianPay)} median</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Back to Home */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sage hover:text-sage-dark font-medium"
          >
            ← Back to All Careers
          </Link>
        </div>
      </section>
    </div>
  );
}
