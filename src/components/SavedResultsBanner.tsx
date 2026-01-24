"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCompassResultsSummary,
  formatRelativeTime,
  clearCompassResults,
  restoreResultsToSession,
} from "@/lib/compass-results-storage";

interface SavedResultsBannerProps {
  onStartNew?: () => void;
}

export function SavedResultsBanner({ onStartNew }: SavedResultsBannerProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<ReturnType<typeof getCompassResultsSummary>>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for saved results on mount
    const resultsSummary = getCompassResultsSummary();
    if (resultsSummary) {
      setSummary(resultsSummary);
      setIsVisible(true);
    }
  }, []);

  const handleViewResults = () => {
    // Restore results to sessionStorage and navigate
    if (restoreResultsToSession()) {
      router.push('/compass-results');
    }
  };

  const handleStartNew = () => {
    // Clear saved results
    clearCompassResults();
    setIsVisible(false);
    // Call optional callback
    onStartNew?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !summary) {
    return null;
  }

  return (
    <div className="bg-sage-pale border border-sage-muted rounded-xl p-4 mb-6 animate-fadeDown">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-sage-muted rounded-full flex items-center justify-center">
          <span className="text-lg">📊</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ds-slate mb-1">
            You have saved results
          </h3>
          <p className="text-sm text-ds-slate-light mb-3">
            Found {summary.matchCount} career matches {formatRelativeTime(summary.savedAt)}.
            {summary.hasResume && " Based on your resume."}
            {summary.isExpiringSoon && (
              <span className="text-terracotta font-medium"> Expires soon!</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleViewResults}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white font-semibold rounded-lg hover:bg-sage-dark transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View Results
            </button>
            <button
              onClick={handleStartNew}
              className="inline-flex items-center gap-2 px-4 py-2 border border-sage text-sage font-semibold rounded-lg hover:bg-sage-muted transition-colors text-sm"
            >
              Start Fresh
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-ds-slate-muted hover:text-ds-slate transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
