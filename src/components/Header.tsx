"use client";

import { useState, useEffect } from "react";
import { getSavedCareers, getCompareList } from "@/lib/storage";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateCounts = () => {
      setSavedCount(getSavedCareers().length);
      setCompareCount(getCompareList().length);
    };
    updateCounts();
    // Update counts periodically (for cross-tab sync)
    const interval = setInterval(updateCounts, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-secondary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇺🇸</span>
            <span className="font-bold text-xl text-secondary-900">
              American Dream Jobs
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/#careers"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Explore Careers
            </a>
            <a
              href="/companies"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Companies
            </a>
            <a
              href="/compare"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors relative"
            >
              Compare
              {mounted && compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </a>
            <a
              href="/compass"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Career Compass
            </a>
            <a
              href="/calculator"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Calculator
            </a>
            {mounted && savedCount > 0 && (
              <a
                href="/my-careers"
                className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors relative"
              >
                My Careers
                <span className="ml-1 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              </a>
            )}
            <a
              href="/contribute"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Contribute
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-secondary-600 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
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
        <div className="md:hidden border-t border-secondary-200 bg-white">
          <nav className="px-4 py-2 space-y-1">
            <a
              href="/#careers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-2 min-h-[44px] text-base font-medium text-secondary-700 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
            >
              Explore Careers
            </a>
            <a
              href="/companies"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
            >
              Companies
            </a>
            <a
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-2 min-h-[44px] text-base font-medium text-secondary-700 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
            >
              Compare Careers
              {mounted && compareCount > 0 && (
                <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {compareCount}
                </span>
              )}
            </a>
            <a
              href="/compass"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-2 min-h-[44px] text-base font-medium text-secondary-700 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
            >
              Career Compass
            </a>
            <a
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-2 min-h-[44px] text-base font-medium text-secondary-700 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
            >
              Net Worth Calculator
            </a>
            {mounted && savedCount > 0 && (
              <a
                href="/my-careers"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
              >
                My Careers
                <span className="ml-2 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              </a>
            )}
            <a
              href="/contribute"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 px-2 min-h-[44px] text-base font-medium text-secondary-700 hover:text-secondary-900 active:bg-secondary-100 rounded-lg"
            >
              Contribute
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
