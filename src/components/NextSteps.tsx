"use client";

import { getCompareList, getSavedCareers } from "@/lib/storage";
import { useState, useEffect, useMemo } from "react";

interface NextStepsProps {
  currentPage?: "home" | "career" | "compare" | "calculator";
  careerSlug?: string;
}

export function NextSteps({ currentPage = "home", careerSlug }: NextStepsProps) {
  const [compareCount, setCompareCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCompareCount(getCompareList().length);
    setSavedCount(getSavedCareers().length);
  }, []);

  // Base suggestions that don't depend on localStorage
  const baseSuggestions: Record<string, Array<{ label: string; href: string; icon: string }>> = {
    home: [
      { label: "Compare Careers", href: "/compare", icon: "📊" },
      { label: "Calculate Net Worth", href: "/calculator", icon: "💰" },
    ],
    career: [
      { label: "Calculate Earnings", href: careerSlug ? `/calculator?career=${careerSlug}` : "/calculator", icon: "💰" },
      { label: "Explore More Careers", href: "/#careers", icon: "🔍" },
    ],
    compare: [
      { label: "Calculate Net Worth", href: "/calculator", icon: "💰" },
      { label: "Explore More Careers", href: "/#careers", icon: "🔍" },
    ],
    calculator: [
      { label: "Explore More Careers", href: "/#careers", icon: "🔍" },
    ],
  };

  // Build suggestions array after mount to avoid hydration mismatch
  const steps = useMemo(() => {
    const base = baseSuggestions[currentPage] || [];
    if (!mounted) return base;

    const additional: Array<{ label: string; href: string; icon: string }> = [];
    
    if (currentPage === "home" && savedCount > 0) {
      additional.push({ label: `View My Careers (${savedCount})`, href: "/my-careers", icon: "⭐" });
    }
    if (currentPage === "career" && compareCount > 0) {
      additional.unshift({ label: `Compare ${compareCount} Career${compareCount > 1 ? "s" : ""}`, href: "/compare", icon: "📊" });
    }
    if (currentPage === "compare" && savedCount > 0) {
      additional.push({ label: `View My Careers (${savedCount})`, href: "/my-careers", icon: "⭐" });
    }
    if (currentPage === "calculator") {
      if (compareCount > 0) {
        additional.unshift({ label: `Compare ${compareCount} Career${compareCount > 1 ? "s" : ""}`, href: "/compare", icon: "📊" });
      }
      if (savedCount > 0) {
        additional.push({ label: `View My Careers (${savedCount})`, href: "/my-careers", icon: "⭐" });
      }
    }

    return [...base, ...additional];
  }, [currentPage, compareCount, savedCount, mounted, careerSlug]);

  if (steps.length === 0) return null;

  return (
    <section className="bg-secondary-50 border-t border-secondary-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Next Steps</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <a
              key={i}
              href={step.href}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                {step.label}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

