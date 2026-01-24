"use client";

import { Suspense } from "react";
import { CareerCompassWizard } from "@/components/CareerCompassWizard";
import { SavedResultsBanner } from "@/components/SavedResultsBanner";

function CompassPageLoading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🧭</div>
        <p className="text-ds-slate-light">Loading Career Compass...</p>
      </div>
    </div>
  );
}

export default function CompassPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-medium text-ds-slate mb-3">
            🧭 Career Compass
          </h1>
          <p className="text-lg text-ds-slate-light max-w-xl mx-auto">
            Answer a few questions to discover career paths that match your goals.
          </p>
        </div>

        <SavedResultsBanner />

        <Suspense fallback={<CompassPageLoading />}>
          <CareerCompassWizard />
        </Suspense>
      </div>
    </div>
  );
}
