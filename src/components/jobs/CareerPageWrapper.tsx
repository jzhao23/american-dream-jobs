"use client";

import { useRef, ReactNode } from "react";
import { MobileStickyCTAs } from "./CareerHeroCTAs";

interface CareerPageWrapperProps {
  children: ReactNode;
  careerSlug: string;
  careerTitle: string;
  onetCode?: string;
  alternateJobTitles?: string[];
}

/**
 * Client-side wrapper for career pages that:
 * 1. Provides hero section ref for scroll tracking
 * 2. Renders the mobile sticky CTA bar
 */
export function CareerPageWrapper({
  children,
  careerSlug,
  careerTitle,
  onetCode,
  alternateJobTitles
}: CareerPageWrapperProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Wrapper div to capture hero section for scroll tracking */}
      <div ref={heroRef} data-hero-section>
        {children}
      </div>

      {/* Mobile sticky CTAs - appears when scrolled past hero */}
      <MobileStickyCTAs
        careerSlug={careerSlug}
        careerTitle={careerTitle}
        onetCode={onetCode}
        alternateJobTitles={alternateJobTitles}
        heroRef={heroRef}
      />
    </>
  );
}
