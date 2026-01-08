"use client";

/**
 * LocationSelector Component
 *
 * A dropdown selector for choosing user location (MSA or state).
 * Features:
 * - Search by name or ZIP code
 * - Auto-detect button
 * - Clear location option
 * - Compact display for header
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, LocationInfo } from "@/lib/location-context";

interface LocationResult {
  type: "msa" | "state";
  code: string;
  name: string;
  shortName: string;
  states: string[];
}

interface LocationSelectorProps {
  variant?: "header" | "full";
  onSelect?: (location: LocationInfo) => void;
  className?: string;
}

export function LocationSelector({
  variant = "header",
  onSelect,
  className = "",
}: LocationSelectorProps) {
  const {
    location,
    isLoading,
    isDetecting,
    setLocation,
    clearLocation,
    detectLocation,
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Search for locations
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setLastSearchedQuery("");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Location search failed:", error);
    }
    setIsSearching(false);
    setLastSearchedQuery(query);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Handle location selection
  const handleSelect = (result: LocationResult) => {
    const locationInfo: LocationInfo = {
      code: result.code,
      name: result.name,
      shortName: result.shortName,
      state: result.states[0] || "",
      type: result.type,
    };

    setLocation(locationInfo, "manual");
    setIsOpen(false);
    setSearchQuery("");
    onSelect?.(locationInfo);
  };

  // Handle auto-detect
  const handleAutoDetect = async () => {
    const detected = await detectLocation();
    if (detected) {
      setIsOpen(false);
      onSelect?.(detected);
    }
  };

  // Handle clear
  const handleClear = () => {
    clearLocation();
    setIsOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`text-sm text-ds-slate-light ${className}`}>
        <span className="inline-flex items-center gap-1">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 text-sm font-medium transition-all
          ${
            variant === "header"
              ? "text-ds-slate-light hover:text-sage px-2 py-1.5 rounded-lg hover:bg-sage-muted"
              : "text-ds-slate hover:text-sage px-3 py-2 rounded-lg border border-sage-muted hover:border-sage bg-white"
          }
        `}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>
          {location
            ? location.shortName
            : "Set location"}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
          absolute z-50 mt-2 bg-white rounded-xl shadow-lg border border-sage-muted
          overflow-hidden
          ${variant === "header" ? "right-0 w-80" : "left-0 w-full min-w-80"}
        `}
        >
          {/* Search input */}
          <div className="p-3 border-b border-sage-muted">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search city, state, or ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sage-muted rounded-lg
                focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-b border-sage-muted flex gap-2">
            <button
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg bg-sage-muted text-sage
                hover:bg-sage hover:text-white transition-colors disabled:opacity-50"
            >
              {isDetecting ? "Detecting..." : "Auto-detect"}
            </button>
            {location && (
              <button
                onClick={handleClear}
                className="text-sm px-3 py-1.5 rounded-lg text-ds-slate-muted
                  hover:text-ds-slate hover:bg-cream transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search results */}
          <div className="max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-ds-slate-muted">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map((result) => (
                  <li key={`${result.type}-${result.code}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors"
                    >
                      <div className="text-sm font-medium text-ds-slate">
                        {result.shortName}
                        {result.states.length > 0 && (
                          <span className="text-ds-slate-muted">
                            , {result.states.join("-")}
                          </span>
                        )}
                      </div>
                      {result.type === "msa" && result.name !== result.shortName && (
                        <div className="text-xs text-ds-slate-muted mt-0.5">
                          {result.name}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-sm text-ds-slate-muted">
                {searchQuery === lastSearchedQuery ? "No locations found" : "Searching..."}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-ds-slate-muted">
                Start typing to search
              </div>
            )}
          </div>

          {/* Current location indicator */}
          {location && (
            <div className="px-4 py-2.5 bg-cream border-t border-sage-muted">
              <div className="text-xs text-ds-slate-muted">Current location</div>
              <div className="text-sm font-medium text-sage">
                {location.name}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
