"use client";

import { useState } from "react";
import { CareerExplorer } from "@/components/CareerExplorer";
import { CategoryStrip } from "@/components/CategoryStrip";
import { EmailCapture } from "@/components/EmailCapture";
import { OnboardingPrompt } from "@/components/OnboardingPrompt";
import { NextSteps } from "@/components/NextSteps";
import careersIndex from "../../data/careers-index.json";
import type { CareerIndex } from "@/types/career";

export default function HomePage() {
  const careers = careersIndex as CareerIndex[];
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleGoalSelect = (goal: string | null) => {
    setSelectedGoal(goal);
    if (goal === "high-paying") {
      // Scroll to careers section with high-paying filter
      setTimeout(() => {
        const element = document.getElementById("careers");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else if (goal === "compare") {
      window.location.href = "/compare";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Careers That Build America
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Discover high-paying, AI-resilient careers that matter.
              Real wages, honest training requirements, and what the job is actually like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#careers"
                className="inline-flex items-center justify-center px-6 py-3 text-lg font-semibold bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Explore Careers
              </a>
              <a
                href="/contribute"
                className="inline-flex items-center justify-center px-6 py-3 text-lg font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-400 transition-colors border border-primary-400"
              >
                Share Your Experience
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {careers.length.toLocaleString()}
              </div>
              <div className="text-sm text-secondary-600">
                Careers Profiled
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {careers.filter(c => c.ai_risk <= 4).length}
              </div>
              <div className="text-sm text-secondary-600">
                AI-Resilient Careers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {careers.filter(c => c.importance >= 7).length}
              </div>
              <div className="text-sm text-secondary-600">
                Critical to America
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {new Set(careers.map(c => c.category)).size}
              </div>
              <div className="text-sm text-secondary-600">
                Career Categories
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <CategoryStrip />

      {/* Career Explorer Section */}
      <section id="careers" className="bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-secondary-900">
              Explore Careers
            </h2>
            {selectedGoal === "high-paying" && (
              <p className="text-secondary-600 mt-2">
                Showing careers sorted by highest pay
              </p>
            )}
          </div>
          <CareerExplorer 
            careers={careers} 
            hideCategoryFilter 
            initialSort={selectedGoal === "high-paying" ? "median_pay" : undefined}
          />
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              Get Updates on New Careers
            </h2>
            <p className="text-secondary-600 mb-6">
              We're adding new career profiles every week. Be the first to know
              when we add careers you're interested in.
            </p>
            <EmailCapture />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Know something we don't?
              </h2>
              <p className="text-secondary-300 mb-6">
                Are you a practitioner with real-world experience? Help us make
                this resource better. Submit corrections, add context, or request
                new careers.
              </p>
              <a
                href="/contribute"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold bg-white text-secondary-900 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                Contribute Your Knowledge
              </a>
            </div>
            <div className="bg-secondary-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-4">
                What we're looking for:
              </h3>
              <ul className="space-y-3 text-secondary-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Real wage data from your experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>What training programs actually work</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Day-to-day reality of the job</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Career paths and progression tips</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <NextSteps currentPage="home" />

      <OnboardingPrompt onSelectGoal={handleGoalSelect} />
    </div>
  );
}
