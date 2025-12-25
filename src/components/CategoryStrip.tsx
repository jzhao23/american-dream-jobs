"use client";

import Link from "next/link";
import { getAllCategories, getCategoryIcon } from "@/lib/categories";

/**
 * CategoryStrip - Slim horizontal navigation strip showing all categories
 *
 * Design: Single row with horizontal scroll, compact chips, unobtrusive styling.
 * Purpose: Quick navigation aid, easy to scroll past.
 */
export function CategoryStrip() {
  const categories = getAllCategories();

  return (
    <div className="border-y border-secondary-200 bg-secondary-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-secondary-900 mb-4 text-center">
          Explore by Category
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-base rounded-full whitespace-nowrap transition-all hover:shadow-sm flex-shrink-0 bg-white border border-secondary-200 text-secondary-700 hover:border-secondary-300 hover:text-secondary-900"
            >
              <span>{getCategoryIcon(category.id)}</span>
              <span>{category.shortName}</span>
            </Link>
          ))}
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-base rounded-full whitespace-nowrap transition-all flex-shrink-0 text-primary-600 hover:text-primary-700 hover:underline"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}
