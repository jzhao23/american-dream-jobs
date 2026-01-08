"use client";

import { useState } from "react";
import { LocationSelector } from "./LocationSelector";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-warm-white/95 backdrop-blur-md border-b border-sage-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="text-xl">🇺🇸</span>
            <span className="font-display font-semibold text-lg text-sage">
              American Dream Jobs
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <a
              href="/compare"
              className="text-sm font-medium text-ds-slate-light hover:text-sage hover:bg-sage-muted px-3 py-2 rounded-lg transition-all"
            >
              Compare
            </a>
            <a
              href="/calculator"
              className="text-sm font-medium text-ds-slate-light hover:text-sage hover:bg-sage-muted px-3 py-2 rounded-lg transition-all"
            >
              Calculator
            </a>
            <a
              href="/local-jobs"
              className="text-sm font-medium text-ds-slate-light hover:text-sage hover:bg-sage-muted px-3 py-2 rounded-lg transition-all"
            >
              Local Jobs
            </a>
            <a
              href="/methodology"
              className="text-sm font-medium text-ds-slate-light hover:text-sage hover:bg-sage-muted px-3 py-2 rounded-lg transition-all"
            >
              Methodology
            </a>
            <a
              href="/compass"
              className="ml-2 text-sm font-medium text-white bg-sage hover:bg-sage-light px-4 py-2 rounded-lg transition-all"
            >
              Career Compass
            </a>
            <div className="ml-3 border-l border-sage-muted pl-3">
              <LocationSelector variant="header" />
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-sage-muted bg-warm-white">
          <nav className="px-4 py-2 space-y-1">
            {/* Location selector for mobile */}
            <div className="py-3 px-3 border-b border-sage-muted mb-2">
              <LocationSelector variant="full" />
            </div>
            <a
              href="/#careers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-medium text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            >
              Explore Careers
            </a>
            <a
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-medium text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            >
              Compare Careers
            </a>
            <a
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-medium text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            >
              Net Worth Calculator
            </a>
            <a
              href="/local-jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-medium text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            >
              Local Jobs
            </a>
            <a
              href="/methodology"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-medium text-ds-slate-light hover:text-sage active:bg-sage-muted rounded-lg transition-colors"
            >
              Methodology
            </a>
            <a
              href="/compass"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-3 min-h-[44px] text-base font-semibold text-white bg-sage hover:bg-sage-light rounded-lg transition-colors mt-2"
            >
              Career Compass
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
