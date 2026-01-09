"use client";

import { useState } from "react";
import { FindJobsModal } from "./FindJobsModal";

interface FindJobsButtonProps {
  careerSlug: string;
  careerTitle: string;
  alternateJobTitles?: string[];
  variant?: "primary" | "secondary" | "hero";
  className?: string;
}

export function FindJobsButton({
  careerSlug,
  careerTitle,
  alternateJobTitles,
  variant = "primary",
  className = ""
}: FindJobsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200";

  const variantStyles = {
    primary: "px-5 py-2.5 bg-sage text-white rounded-lg hover:bg-sage-dark shadow-sm hover:shadow-md",
    secondary: "px-4 py-2 bg-sage-pale text-sage rounded-lg hover:bg-sage-muted",
    hero: "px-6 py-3 bg-gradient-to-r from-sage to-sage-dark text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 text-lg"
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Find Jobs
      </button>

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
