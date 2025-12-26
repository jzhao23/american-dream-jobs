"use client";

import { useState, useEffect } from "react";
import {
  saveCareer,
  unsaveCareer,
  isCareerSaved,
  addToCompare,
  removeFromCompare,
  isInCompare,
  getCompareList,
} from "@/lib/storage";
import type { CareerIndex } from "@/types/career";

interface CareerActionsProps {
  career: CareerIndex;
  variant?: "card" | "detail";
  onCompareChange?: () => void;
}

const MAX_COMPARE_ITEMS = 3;

export function CareerActions({ career, variant = "card", onCompareChange }: CareerActionsProps) {
  const [saved, setSaved] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    setSaved(isCareerSaved(career.slug));
    setInCompare(isInCompare(career.slug));
    setCompareCount(getCompareList().length);
  }, [career.slug]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      unsaveCareer(career.slug);
      setSaved(false);
    } else {
      saveCareer(career.slug);
      setSaved(true);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(career.slug);
      setInCompare(false);
      setCompareCount(prev => prev - 1);
    } else {
      if (compareCount >= MAX_COMPARE_ITEMS) {
        alert(`You can compare up to ${MAX_COMPARE_ITEMS} careers. Remove one first.`);
        return;
      }
      if (addToCompare(career.slug)) {
        setInCompare(true);
        setCompareCount(prev => prev + 1);
        onCompareChange?.();
      }
    }
  };

  const handleCalculateEarnings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/calculator?career=${career.slug}`;
  };

  if (variant === "card") {
    return (
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            saved
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-secondary-700 border-secondary-300 hover:border-primary-300"
          }`}
          title={saved ? "Remove from saved" : "Save career"}
        >
          {saved ? "✓ Saved" : "Save"}
        </button>
        <button
          onClick={handleCompare}
          className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
            inCompare
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-secondary-700 border-secondary-300 hover:border-primary-300"
          }`}
          title={inCompare ? "Remove from compare" : "Add to compare"}
        >
          {inCompare ? "✓ Compare" : "Compare"}
        </button>
      </div>
    );
  }

  // Detail page variant
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button
        onClick={handleSave}
        className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
          saved
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50"
        }`}
      >
        {saved ? "✓ Saved to My Careers" : "Save to My Careers"}
      </button>
      <button
        onClick={handleCompare}
        className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${
          inCompare
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50"
        }`}
        disabled={!inCompare && compareCount >= MAX_COMPARE_ITEMS}
      >
        {inCompare ? "✓ In Compare List" : `Add to Compare (${compareCount}/${MAX_COMPARE_ITEMS})`}
      </button>
      <a
        href={`/calculator?career=${career.slug}`}
        onClick={handleCalculateEarnings}
        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Calculate Earnings →
      </a>
    </div>
  );
}

