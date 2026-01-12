"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "adjn_quickstart_hidden";

interface QuickStartCardProps {
  onTakeQuiz: () => void;
  onUploadResume: () => void;
  onBrowseCareers: () => void;
}

export function QuickStartCard({
  onTakeQuiz,
  onUploadResume,
  onBrowseCareers,
}: QuickStartCardProps) {
  const [isHidden, setIsHidden] = useState(true); // Start hidden to prevent flash
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const hidden = localStorage.getItem(STORAGE_KEY) === "true";
    setIsHidden(hidden);
  }, []);

  const handleHide = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsHidden(true);
    }, 300);
  };

  if (isHidden) return null;

  return (
    <div
      className={`card-warm p-6 md:p-8 mb-6 transition-all duration-300 ${
        isAnimatingOut ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate">
          New here? Here&apos;s how to get started
        </h2>
      </div>

      {/* Three path options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Take the Quiz */}
        <button
          onClick={onTakeQuiz}
          className="group flex flex-col items-center p-5 bg-cream rounded-xl border-2 border-transparent hover:border-sage hover:bg-sage-pale transition-all"
        >
          <div className="w-14 h-14 bg-sage-muted rounded-full flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            🧭
          </div>
          <h3 className="font-display font-semibold text-ds-slate mb-1">
            Take the Quiz
          </h3>
          <p className="text-sm text-ds-slate-light text-center mb-2">
            Answer a few questions for personalized career matches
          </p>
          <span className="text-xs font-medium text-sage">~3 minutes</span>
        </button>

        {/* Upload Resume */}
        <button
          onClick={onUploadResume}
          className="group flex flex-col items-center p-5 bg-cream rounded-xl border-2 border-transparent hover:border-sage hover:bg-sage-pale transition-all"
        >
          <div className="w-14 h-14 bg-sage-muted rounded-full flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            📄
          </div>
          <h3 className="font-display font-semibold text-ds-slate mb-1">
            Upload Resume
          </h3>
          <p className="text-sm text-ds-slate-light text-center mb-2">
            Get instant personalized matches based on your skills
          </p>
          <span className="text-xs font-medium text-sage">Instant</span>
        </button>

        {/* Browse Careers */}
        <button
          onClick={onBrowseCareers}
          className="group flex flex-col items-center p-5 bg-cream rounded-xl border-2 border-transparent hover:border-sage hover:bg-sage-pale transition-all"
        >
          <div className="w-14 h-14 bg-sage-muted rounded-full flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            🔍
          </div>
          <h3 className="font-display font-semibold text-ds-slate mb-1">
            Browse Careers
          </h3>
          <p className="text-sm text-ds-slate-light text-center mb-2">
            Explore 1,000+ careers with filters for pay & training
          </p>
          <span className="text-xs font-medium text-sage">Self-guided</span>
        </button>
      </div>

      {/* Hide button */}
      <div className="text-center">
        <button
          onClick={handleHide}
          className="text-sm text-ds-slate-muted hover:text-ds-slate transition-colors"
        >
          Hide this guide
        </button>
      </div>
    </div>
  );
}
