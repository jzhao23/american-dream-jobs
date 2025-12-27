"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAllCategories, getCategoryIcon } from "@/lib/categories";

/**
 * CategoryStrip - Slim horizontal navigation strip showing all categories
 *
 * Design: Single row with horizontal scroll, compact chips, unobtrusive styling.
 * Purpose: Quick navigation aid, easy to scroll past.
 *
 * Auto-scrolls continuously when not hovered, pauses on hover to let user interact.
 */
export function CategoryStrip() {
  const categories = getAllCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<1 | -1>(1); // 1 = right, -1 = left

  // Auto-scroll effect
  useEffect(() => {
    if (isHovered) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = 0.5; // pixels per frame
    let animationId: number;

    const animate = () => {
      if (!scrollContainer) return;

      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

      // Scroll in current direction
      scrollContainer.scrollLeft += scrollSpeed * scrollDirection;

      // Reverse direction at edges
      if (scrollContainer.scrollLeft >= maxScroll) {
        setScrollDirection(-1);
      } else if (scrollContainer.scrollLeft <= 0) {
        setScrollDirection(1);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isHovered, scrollDirection]);

  return (
    <div className="border-y border-secondary-200 bg-secondary-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-secondary-900 mb-4 text-center">
          Explore by Category
        </h2>
        {/* Scroll container with fade indicators */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left fade indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-secondary-50/90 to-transparent pointer-events-none z-10 md:hidden" />
          {/* Right fade indicator */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-secondary-50/90 to-transparent pointer-events-none z-10 md:hidden" />

          <div
            ref={scrollRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-base rounded-full whitespace-nowrap transition-all hover:shadow-sm flex-shrink-0 bg-white border border-secondary-200 text-secondary-700 hover:border-secondary-300 hover:text-secondary-900 active:bg-secondary-100"
              >
                <span>{getCategoryIcon(category.id)}</span>
                <span>{category.shortName}</span>
              </Link>
            ))}
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-base rounded-full whitespace-nowrap transition-all flex-shrink-0 text-primary-600 hover:text-primary-700 hover:underline"
            >
              View All →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
