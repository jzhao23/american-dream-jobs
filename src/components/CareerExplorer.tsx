"use client";

import { useState, useMemo } from "react";
import type { CareerIndex, TrainingTime, AIResilienceClassification } from "@/types/career";
import {
  formatPay,
  getTrainingTimeLabel,
  getCategoryColor,
  getCategoryLabel,
  getAIResilienceEmoji,
  getAIResilienceColor,
} from "@/types/career";
import { FindJobsButton } from "@/components/jobs/FindJobsButton";

interface CareerExplorerProps {
  careers: CareerIndex[];
  hideCategoryFilter?: boolean;
}

type SortField = "median_pay" | "ai_resilience" | "title";
type SortDirection = "asc" | "desc";

// AI Resilience tiers in order from most to least resilient
const AI_RESILIENCE_TIERS: AIResilienceClassification[] = [
  "AI-Resilient",
  "AI-Augmented",
  "In Transition",
  "High Disruption Risk",
];

const TRAINING_TIME_ORDER: TrainingTime[] = ["<6mo", "6-24mo", "2-4yr", "4+yr"];

export function CareerExplorer({ careers, hideCategoryFilter = false }: CareerExplorerProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [minPay, setMinPay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrainingTimes, setSelectedTrainingTimes] = useState<TrainingTime[]>([]);
  const [selectedAIResilience, setSelectedAIResilience] = useState<AIResilienceClassification[]>([]);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("median_pay");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Mobile filter toggle
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(careers.map((c) => c.category))].sort();
  }, [careers]);

  // Filter and sort careers
  const filteredCareers = useMemo(() => {
    let result = careers.filter((career) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!career.title.toLowerCase().includes(query) &&
            !career.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Pay filter
      if (career.median_pay < minPay) return false;

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(career.category)) {
        return false;
      }

      // Training time filter
      if (selectedTrainingTimes.length > 0 && !selectedTrainingTimes.includes(career.training_time)) {
        return false;
      }

      // AI Resilience filter
      if (selectedAIResilience.length > 0) {
        if (!career.ai_resilience || !selectedAIResilience.includes(career.ai_resilience as AIResilienceClassification)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result = result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "median_pay":
          comparison = a.median_pay - b.median_pay;
          break;
        case "ai_resilience":
          // Sort by tier (1=resilient, 4=high risk), nulls at end
          const tierA = a.ai_resilience_tier ?? 99;
          const tierB = b.ai_resilience_tier ?? 99;
          comparison = tierA - tierB;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [
    careers,
    searchQuery,
    minPay,
    selectedCategories,
    selectedTrainingTimes,
    selectedAIResilience,
    sortField,
    sortDirection,
  ]);

  // Paginated results
  const paginatedCareers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCareers.slice(start, start + pageSize);
  }, [filteredCareers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCareers.length / pageSize);

  // Toggle handlers
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const toggleTrainingTime = (time: TrainingTime) => {
    setSelectedTrainingTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
    setCurrentPage(1);
  };

  const toggleAIResilience = (tier: AIResilienceClassification) => {
    setSelectedAIResilience((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // For AI resilience, lower tier is better (asc), for pay higher is better (desc)
      setSortDirection(field === "ai_resilience" ? "asc" : "desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinPay(0);
    setSelectedCategories([]);
    setSelectedTrainingTimes([]);
    setSelectedAIResilience([]);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    minPay > 0 ||
    selectedCategories.length > 0 ||
    selectedTrainingTimes.length > 0 ||
    selectedAIResilience.length > 0;

  // Count active filters (excluding search) for mobile display
  const activeFilterCount =
    (minPay > 0 ? 1 : 0) +
    selectedCategories.length +
    selectedTrainingTimes.length +
    selectedAIResilience.length;

  return (
    <div>
      {/* Compact Filter Bar */}
      <div className="card-warm p-3 mb-6">
        {/* Mobile: Search + Filters toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-base border border-sage-muted rounded-lg focus:ring-2 focus:ring-sage focus:border-sage outline-none bg-warm-white"
            />
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`flex items-center gap-1 px-3 py-2 min-h-[44px] text-sm font-medium rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? "bg-sage-muted text-sage border-sage"
                : "bg-warm-white text-ds-slate-light border-sage-muted"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            <svg className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Mobile: Expandable filter panel */}
        {filtersExpanded && (
          <div className="mt-3 pt-3 border-t border-sage-muted space-y-3 md:hidden">
            {/* Min Pay */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ds-slate-light">Min Pay</label>
              <select
                value={minPay}
                onChange={(e) => {
                  setMinPay(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-base border border-sage-muted rounded-lg focus:ring-2 focus:ring-sage focus:border-sage outline-none bg-warm-white min-h-[44px]"
              >
                <option value={0}>Any</option>
                <option value={30000}>$30k+</option>
                <option value={50000}>$50k+</option>
                <option value={75000}>$75k+</option>
                <option value={100000}>$100k+</option>
                <option value={150000}>$150k+</option>
              </select>
            </div>

            {/* AI Resilience Filter */}
            <div>
              <label className="text-sm font-medium text-ds-slate-light block mb-2">AI Resilience</label>
              <div className="flex flex-wrap gap-2">
                {AI_RESILIENCE_TIERS.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => toggleAIResilience(tier)}
                    className={`px-3 py-2 min-h-[44px] text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                      selectedAIResilience.includes(tier)
                        ? "bg-sage text-white border-sage"
                        : "bg-warm-white text-ds-slate-light border-sage-muted active:bg-sage-muted"
                    }`}
                  >
                    <span>{getAIResilienceEmoji(tier)}</span>
                    <span className="hidden sm:inline">{tier}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Training Time */}
            <div>
              <label className="text-sm font-medium text-ds-slate-light block mb-2">Training Time</label>
              <div className="flex flex-wrap gap-2">
                {TRAINING_TIME_ORDER.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTrainingTime(time)}
                    className={`px-4 py-2 min-h-[44px] text-sm rounded-lg border transition-colors ${
                      selectedTrainingTimes.includes(time)
                        ? "bg-sage text-white border-sage"
                        : "bg-warm-white text-ds-slate-light border-sage-muted active:bg-sage-muted"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter on mobile */}
            {!hideCategoryFilter && (
              <div>
                <label className="text-sm font-medium text-ds-slate-light block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-2 min-h-[44px] text-sm rounded-full border transition-colors whitespace-nowrap ${
                        selectedCategories.includes(category)
                          ? "bg-sage text-white border-sage"
                          : "bg-warm-white text-ds-slate-light border-sage-muted active:bg-sage-muted"
                      }`}
                    >
                      {getCategoryLabel(category)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  setFiltersExpanded(false);
                }}
                className="w-full py-2 min-h-[44px] text-sm font-medium text-sage border border-sage rounded-lg active:bg-sage-muted"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Desktop: Inline filters (hidden on mobile) */}
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm border border-sage-muted rounded-lg focus:ring-2 focus:ring-sage focus:border-sage outline-none bg-warm-white"
            />
          </div>

          {/* Min Pay */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-ds-slate-light whitespace-nowrap">
              Pay ≥
            </label>
            <select
              value={minPay}
              onChange={(e) => {
                setMinPay(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 text-sm border border-sage-muted rounded-lg focus:ring-2 focus:ring-sage focus:border-sage outline-none bg-warm-white"
            >
              <option value={0}>Any</option>
              <option value={30000}>$30k</option>
              <option value={50000}>$50k</option>
              <option value={75000}>$75k</option>
              <option value={100000}>$100k</option>
              <option value={150000}>$150k</option>
            </select>
          </div>

          {/* AI Resilience Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-ds-slate-light mr-1">AI:</span>
            {AI_RESILIENCE_TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => toggleAIResilience(tier)}
                title={tier}
                className={`px-1.5 py-1 text-sm rounded border transition-colors ${
                  selectedAIResilience.includes(tier)
                    ? "bg-sage border-sage"
                    : "bg-warm-white border-sage-muted hover:border-sage"
                }`}
              >
                {getAIResilienceEmoji(tier)}
              </button>
            ))}
          </div>

          {/* Training Time */}
          <div className="flex items-center gap-1">
            {TRAINING_TIME_ORDER.map((time) => (
              <button
                key={time}
                onClick={() => toggleTrainingTime(time)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedTrainingTimes.includes(time)
                    ? "bg-sage text-white border-sage"
                    : "bg-warm-white text-ds-slate-light border-sage-muted hover:border-sage"
                }`}
              >
                {time}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-sage hover:text-sage-dark whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter - shown on second row for desktop when not hidden */}
        {!hideCategoryFilter && (
          <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2 md:mt-3 md:pt-3 md:border-t md:border-sage-muted">
            <span className="text-xs font-medium text-ds-slate-light">Category:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors whitespace-nowrap ${
                  selectedCategories.includes(category)
                    ? "bg-sage text-white border-sage"
                    : "bg-warm-white text-ds-slate-light border-sage-muted hover:border-sage"
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count and sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-ds-slate-light">
          Showing {paginatedCareers.length} of {filteredCareers.length} careers
          {filteredCareers.length !== careers.length && ` (${careers.length} total)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ds-slate-light">Sort by:</span>
          <div className="flex gap-1">
            {[
              { field: "median_pay" as const, label: "Pay" },
              { field: "ai_resilience" as const, label: "AI Resilience" },
              { field: "title" as const, label: "A-Z" },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  sortField === field
                    ? "bg-sage text-white border-sage"
                    : "bg-warm-white text-ds-slate-light border-sage-muted hover:border-sage"
                }`}
              >
                {label}
                {sortField === field && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block card-warm overflow-hidden">
        <table className="w-full">
          <thead className="bg-sage text-white">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Career
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold">
                Category
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold">
                Median Pay
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                Training
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                AI Resilience
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold">
                Find Jobs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-muted">
            {paginatedCareers.map((career) => (
              <tr key={career.slug} className="hover:bg-sage-pale transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/careers/${career.slug}`}
                      className="text-sage hover:text-sage-dark font-medium hover:underline"
                    >
                      {career.title}
                    </a>
                    {career.specialization_count && career.specialization_count > 1 && (
                      <span className="text-xs bg-sage-muted text-ds-slate-muted px-1.5 py-0.5 rounded">
                        {career.specialization_count} specializations
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/categories/${career.category}`}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${getCategoryColor(career.category)}`}
                  >
                    {getCategoryLabel(career.category)}
                  </a>
                </td>
                <td className="px-4 py-3 text-right font-medium text-ds-slate">
                  {formatPay(career.median_pay)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-ds-slate-light">
                    {career.training_time === "4+yr" && career.training_years
                      ? (career.training_years.min === career.training_years.max
                          ? `${career.training_years.min} years`
                          : `${career.training_years.min}-${career.training_years.max} years`)
                      : career.training_time}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {career.ai_resilience && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAIResilienceColor(career.ai_resilience as AIResilienceClassification)}`}
                      title={career.ai_resilience}
                    >
                      <span>{getAIResilienceEmoji(career.ai_resilience as AIResilienceClassification)}</span>
                      <span className="hidden xl:inline">{career.ai_resilience}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <FindJobsButton
                    careerSlug={career.slug}
                    careerTitle={career.title}
                    variant="primary"
                    className="text-xs px-3 py-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedCareers.length === 0 && (
          <div className="text-center py-12 text-ds-slate-muted">
            No careers match your filters. Try adjusting your criteria.
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {paginatedCareers.map((career) => (
          <div
            key={career.slug}
            className="card-warm p-4 block hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-ds-slate">
                  <a
                    href={`/careers/${career.slug}`}
                    className="text-sage hover:text-sage-dark hover:underline"
                  >
                    {career.title}
                  </a>
                  {career.specialization_count && career.specialization_count > 1 && (
                    <span className="ml-2 text-xs bg-sage-muted text-ds-slate-muted px-1.5 py-0.5 rounded">
                      {career.specialization_count} specializations
                    </span>
                  )}
                </h3>
                <a
                  href={`/categories/${career.category}`}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 hover:opacity-80 transition-opacity ${getCategoryColor(career.category)}`}
                >
                  {getCategoryLabel(career.category)}
                </a>
              </div>
              <a
                href={`/careers/${career.slug}`}
                className="text-lg font-bold text-sage hover:text-sage-dark"
              >
                {formatPay(career.median_pay)}
              </a>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-ds-slate-light">
                {getTrainingTimeLabel(career.training_time, career.training_years || undefined)}
              </span>
              <span className="text-ds-slate-muted">•</span>
              {career.ai_resilience && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAIResilienceColor(career.ai_resilience as AIResilienceClassification)}`}
                >
                  <span>{getAIResilienceEmoji(career.ai_resilience as AIResilienceClassification)}</span>
                  <span>{career.ai_resilience}</span>
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-sage-muted">
              <FindJobsButton
                careerSlug={career.slug}
                careerTitle={career.title}
                variant="primary"
                className="w-full text-sm py-2"
              />
            </div>
          </div>
        ))}

        {paginatedCareers.length === 0 && (
          <div className="card-warm p-8 text-center text-ds-slate-muted">
            No careers match your filters. Try adjusting your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-sage-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-pale"
          >
            Previous
          </button>
          <span className="text-sm text-ds-slate-light">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-sage-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sage-pale"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
