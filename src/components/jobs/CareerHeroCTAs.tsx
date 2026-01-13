"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "@/lib/location-context";
import { FindJobsModal } from "./FindJobsModal";

interface CareerHeroCTAsProps {
  careerSlug: string;
  careerTitle: string;
  onetCode?: string;
  alternateJobTitles?: string[];
}

export function CareerHeroCTAs({
  careerSlug,
  careerTitle,
  onetCode,
  alternateJobTitles
}: CareerHeroCTAsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location } = useLocation();

  // Build CareerOneStop training URL
  const getTrainingUrl = () => {
    const baseUrl = "https://www.careeronestop.org/Toolkit/Training/find-local-training.aspx";
    const params = new URLSearchParams();

    // Use O*NET code if available for more accurate matching
    if (onetCode) {
      params.set("onetcode", onetCode);
    }
    params.set("keyword", careerTitle);

    // Add location if available
    if (location?.shortName) {
      params.set("location", location.shortName);
    } else if (location?.state) {
      params.set("location", location.state);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 mt-6">
        {/* Find Jobs - Primary CTA */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <span>🔍</span>
          Find Jobs
        </button>

        {/* Find Training - Secondary CTA */}
        <a
          href={getTrainingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-warm-white border-2 border-sage text-sage rounded-xl font-semibold text-lg hover:bg-sage-pale hover:border-sage-dark hover:text-sage-dark transition-all duration-200"
        >
          <span>📚</span>
          Find Training
        </a>

        {/* Compare - Tertiary CTA */}
        <a
          href={`/compare?career=${careerSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm-white border border-sage-muted rounded-lg text-ds-slate-light hover:border-sage hover:text-sage transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Compare with other careers
        </a>

        {/* Calculate - Tertiary CTA */}
        <a
          href={`/calculator?career=${careerSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-warm-white border border-sage-muted rounded-lg text-ds-slate-light hover:border-sage hover:text-sage transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculate lifetime earnings
        </a>
      </div>

      <FindJobsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        careerSlug={careerSlug}
        careerTitle={careerTitle}
        alternateJobTitles={alternateJobTitles}
      />
    </>
  );
}

/**
 * Mobile Sticky CTA Bar
 * Shows when user scrolls past the hero section on mobile devices
 */
interface MobileStickyCTAsProps {
  careerSlug: string;
  careerTitle: string;
  onetCode?: string;
  alternateJobTitles?: string[];
  heroRef: React.RefObject<HTMLElement | null>;
}

export function MobileStickyCTAs({
  careerSlug,
  careerTitle,
  onetCode,
  alternateJobTitles,
  heroRef
}: MobileStickyCTAsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location } = useLocation();

  // Track scroll position to show/hide sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const heroBottom = heroRef.current.getBoundingClientRect().bottom;
      // Show sticky bar when hero section is scrolled past
      setIsVisible(heroBottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroRef]);

  // Build CareerOneStop training URL
  const getTrainingUrl = () => {
    const baseUrl = "https://www.careeronestop.org/Toolkit/Training/find-local-training.aspx";
    const params = new URLSearchParams();

    if (onetCode) {
      params.set("onetcode", onetCode);
    }
    params.set("keyword", careerTitle);

    if (location?.shortName) {
      params.set("location", location.shortName);
    } else if (location?.state) {
      params.set("location", location.state);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile-only sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-warm-white border-t border-sage-muted shadow-lg safe-area-inset-bottom">
        <div className="flex gap-2 p-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl font-semibold shadow-md"
          >
            <span>🔍</span>
            Find Jobs
          </button>
          <a
            href={getTrainingUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-warm-white border-2 border-sage text-sage rounded-xl font-semibold"
          >
            <span>📚</span>
            Training
          </a>
        </div>
      </div>

      <FindJobsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        careerSlug={careerSlug}
        careerTitle={careerTitle}
        alternateJobTitles={alternateJobTitles}
      />
    </>
  );
}
