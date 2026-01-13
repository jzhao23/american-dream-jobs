"use client";

import { useLocation } from "@/lib/location-context";

interface FindTrainingButtonProps {
  careerTitle: string;
  onetCode?: string;
  variant?: "primary" | "secondary" | "hero";
  className?: string;
}

export function FindTrainingButton({
  careerTitle,
  onetCode,
  variant = "primary",
  className = ""
}: FindTrainingButtonProps) {
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

  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200";

  const variantStyles = {
    primary: "px-5 py-2.5 bg-sage-pale text-sage rounded-lg hover:bg-sage-muted border border-sage-muted hover:border-sage",
    secondary: "px-4 py-2 bg-warm-white border border-sage-muted rounded-lg text-ds-slate-light hover:border-sage hover:text-sage",
    hero: "px-6 py-3 bg-warm-white border-2 border-sage text-sage rounded-xl hover:bg-sage-pale hover:border-sage-dark hover:text-sage-dark text-lg"
  };

  return (
    <a
      href={getTrainingUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      Find Training
    </a>
  );
}
