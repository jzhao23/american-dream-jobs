"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSavedCareers, getCompareList } from "@/lib/storage";

export function BottomNav() {
  const pathname = usePathname();
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
    const interval = setInterval(updateCounts, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        <a
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive("/") ? "text-primary-600" : "text-secondary-600"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Home</span>
        </a>
        <a
          href="/#careers"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            pathname === "/" ? "text-primary-600" : "text-secondary-600"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs">Explore</span>
        </a>
        <a
          href="/compare"
          className={`flex flex-col items-center justify-center flex-1 h-full relative ${
            isActive("/compare") ? "text-primary-600" : "text-secondary-600"
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {mounted && compareCount > 0 && (
            <span className="absolute top-1 right-4 bg-primary-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {compareCount}
            </span>
          )}
          <span className="text-xs">Compare</span>
        </a>
        {mounted && savedCount > 0 && (
          <a
            href="/my-careers"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive("/my-careers") ? "text-primary-600" : "text-secondary-600"
            }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-xs">Saved</span>
          </a>
        )}
      </div>
    </nav>
  );
}

