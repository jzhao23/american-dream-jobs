"use client";

import { useState, useEffect } from "react";
import { setOnboardingComplete, isOnboardingComplete } from "@/lib/storage";

type Goal = "explore" | "compare" | "high-paying" | null;

interface OnboardingPromptProps {
  onSelectGoal: (goal: Goal) => void;
}

export function OnboardingPrompt({ onSelectGoal }: OnboardingPromptProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      // Show after a brief delay
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const handleSelect = (goal: Goal) => {
    setOnboardingComplete();
    setShow(false);
    onSelectGoal(goal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 md:p-8">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          What's your goal?
        </h2>
        <p className="text-secondary-600 mb-6">
          We'll help you find the right path based on what you're looking for.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleSelect("explore")}
            className="w-full text-left p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <div className="font-semibold text-secondary-900 mb-1">
              Explore Careers
            </div>
            <div className="text-sm text-secondary-600">
              Browse all careers and discover what interests you
            </div>
          </button>

          <button
            onClick={() => handleSelect("compare")}
            className="w-full text-left p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <div className="font-semibold text-secondary-900 mb-1">
              Compare Options
            </div>
            <div className="text-sm text-secondary-600">
              See how different careers stack up side-by-side
            </div>
          </button>

          <button
            onClick={() => handleSelect("high-paying")}
            className="w-full text-left p-4 border-2 border-secondary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <div className="font-semibold text-secondary-900 mb-1">
              Find High-Paying Jobs
            </div>
            <div className="text-sm text-secondary-600">
              Focus on careers with the best earning potential
            </div>
          </button>
        </div>

        <button
          onClick={() => handleSelect(null)}
          className="mt-4 text-sm text-secondary-500 hover:text-secondary-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

