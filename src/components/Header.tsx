"use client";

import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              href="/compare"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Compare
            </a>
            <a
              href="/calculator"
              className="text-sm font-medium text-secondary-600 hover:text-secondary-900 transition-colors"
            >
              Calculator
            </a>
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
            className="md:hidden p-2 text-secondary-600 hover:text-secondary-900"
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
          <nav className="px-4 py-4 space-y-3">
            <a
              href="/#careers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
            >
              Explore Careers
            </a>
            <a
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
            >
              Compare Careers
            </a>
            <a
              href="/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
            >
              Net Worth Calculator
            </a>
            <a
              href="/contribute"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-secondary-700 hover:text-secondary-900"
            >
              Contribute
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
