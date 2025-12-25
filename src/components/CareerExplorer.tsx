"use client";

import { useState, useMemo } from "react";
import type { CareerIndex, TrainingTime } from "@/types/career";
import {
  formatPay,
  getTrainingTimeLabel,
  getAIRiskColor,
  getAIRiskLabel,
  getImportanceFlags,
  getCategoryColor,
} from "@/types/career";

interface CareerExplorerProps {
  careers: CareerIndex[];
}

type SortField = "median_pay" | "ai_risk" | "importance" | "title";
type SortDirection = "asc" | "desc";

const TRAINING_TIME_ORDER: TrainingTime[] = ["<6mo", "6-24mo", "2-4yr", "4+yr"];

export function CareerExplorer({ careers }: CareerExplorerProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [minPay, setMinPay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrainingTimes, setSelectedTrainingTimes] = useState<TrainingTime[]>([]);
  const [maxAIRisk, setMaxAIRisk] = useState(10);
  const [minImportance, setMinImportance] = useState(1);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("importance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

      // AI risk filter
      if (career.ai_risk > maxAIRisk) return false;

      // Importance filter
      if (career.importance < minImportance) return false;

      return true;
    });

    // Sort
    result = result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "median_pay":
          comparison = a.median_pay - b.median_pay;
          break;
        case "ai_risk":
          comparison = a.ai_risk - b.ai_risk;
          break;
        case "importance":
          comparison = a.importance - b.importance;
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
    maxAIRisk,
    minImportance,
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "ai_risk" ? "asc" : "desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinPay(0);
    setSelectedCategories([]);
    setSelectedTrainingTimes([]);
    setMaxAIRisk(10);
    setMinImportance(1);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    minPay > 0 ||
    selectedCategories.length > 0 ||
    selectedTrainingTimes.length > 0 ||
    maxAIRisk < 10 ||
    minImportance > 1;

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search careers..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-secondary-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Min Pay Slider */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Minimum Pay: {formatPay(minPay)}
            </label>
            <input
              type="range"
              min={0}
              max={150000}
              step={10000}
              value={minPay}
              onChange={(e) => {
                setMinPay(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Max AI Risk Slider */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Max AI Risk: {maxAIRisk}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={maxAIRisk}
              onChange={(e) => {
                setMaxAIRisk(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Min Importance Slider */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Min Importance: {minImportance}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={minImportance}
              onChange={(e) => {
                setMinImportance(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>

          {/* Training Time Filter */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Training Time
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAINING_TIME_ORDER.map((time) => (
                <button
                  key={time}
                  onClick={() => toggleTrainingTime(time)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedTrainingTimes.includes(time)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-secondary-700 border-secondary-300 hover:border-primary-300"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category ({categories.length} total)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedCategories.includes(category)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-secondary-700 border-secondary-300 hover:border-primary-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count and sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p className="text-sm text-secondary-600">
          Showing {paginatedCareers.length} of {filteredCareers.length} careers
          {filteredCareers.length !== careers.length && ` (${careers.length} total)`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-600">Sort by:</span>
          <div className="flex gap-1">
            {[
              { field: "importance" as const, label: "Importance" },
              { field: "median_pay" as const, label: "Pay" },
              { field: "ai_risk" as const, label: "AI Risk" },
              { field: "title" as const, label: "A-Z" },
            ].map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  sortField === field
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-secondary-700 border-secondary-300 hover:border-primary-300"
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
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary-50 border-b border-secondary-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-secondary-900">
                Career
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-secondary-900">
                Category
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-secondary-900">
                Median Pay
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                Training
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                AI Risk
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-secondary-900">
                Importance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {paginatedCareers.map((career) => (
              <tr key={career.slug} className="hover:bg-secondary-50 transition-colors">
                <td className="px-4 py-3">
                  <a
                    href={`/careers/${career.slug}`}
                    className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
                  >
                    {career.title}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(career.category)}`}>
                    {career.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-secondary-900">
                  {formatPay(career.median_pay)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-secondary-600">
                    {career.training_time === "4+yr" && career.training_years
                      ? (career.training_years.min === career.training_years.max
                          ? `${career.training_years.min} years`
                          : `${career.training_years.min}-${career.training_years.max} years`)
                      : career.training_time}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(career.ai_risk)}`}>
                    {career.ai_risk}/10
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span title={`Importance: ${career.importance}/10`}>
                    {getImportanceFlags(career.flag_count)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedCareers.length === 0 && (
          <div className="text-center py-12 text-secondary-500">
            No careers match your filters. Try adjusting your criteria.
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {paginatedCareers.map((career) => (
          <a
            key={career.slug}
            href={`/careers/${career.slug}`}
            className="card p-4 block hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-secondary-900">
                  {career.title}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getCategoryColor(career.category)}`}>
                  {career.category}
                </span>
              </div>
              <span className="text-lg font-bold text-primary-600">
                {formatPay(career.median_pay)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-secondary-600">
                {getTrainingTimeLabel(career.training_time, career.training_years || undefined)}
              </span>
              <span className="text-secondary-300">•</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAIRiskColor(career.ai_risk)}`}>
                AI Risk: {career.ai_risk}/10
              </span>
              <span className="text-secondary-300">•</span>
              <span>{getImportanceFlags(career.flag_count)}</span>
            </div>
          </a>
        ))}

        {paginatedCareers.length === 0 && (
          <div className="card p-8 text-center text-secondary-500">
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
            className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
          >
            Previous
          </button>
          <span className="text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
