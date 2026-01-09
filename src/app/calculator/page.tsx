"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import careersIndex from "../../../data/output/careers-index.json";
import careersData from "../../../data/output/careers.json";
import type { CareerIndex, Career } from "@/types/career";
import { formatPay, getCategoryColor } from "@/types/career";
import {
  getSpecializationsForCareer,
  getSpecializationBySlug,
  hasEducationVariance,
} from "@/lib/specializations";

const careers = careersIndex as CareerIndex[];
const fullCareers = careersData as Career[];

interface YearlyProjection {
  year: number;
  age: number;
  income: number;
  savings: number;
  cumulativeSavings: number;
  investmentGrowth: number;
  netWorth: number;
  careerLevel: string;
}

function CalculatorContent() {
  const searchParams = useSearchParams();
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentAge, setCurrentAge] = useState(22);
  const [startingSavings, setStartingSavings] = useState(0);
  const [savingsRate, setSavingsRate] = useState(20);
  const [investmentReturn, setInvestmentReturn] = useState(7);
  const [retirementAge, setRetirementAge] = useState(65);
  const [educationCostIncluded, setEducationCostIncluded] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);

  const selectedCareer = useMemo(() => {
    return fullCareers.find(c => c.slug === selectedSlug);
  }, [selectedSlug]);

  // Get effective education (from specialization if selected)
  const getEffectiveEducation = (): Career['education'] | undefined => {
    if (selectedSpecialization) {
      const spec = getSpecializationBySlug(selectedSpecialization);
      if (spec?.education) {
        return spec.education;
      }
    }
    return selectedCareer?.education;
  };

  // Get specialization options for the selected career
  const specializationOptions = useMemo(() => {
    if (!selectedCareer?.specialization_slugs) return [];
    return getSpecializationsForCareer(selectedCareer.specialization_slugs);
  }, [selectedCareer]);

  // Check if specialization selector should be shown
  const showSpecializationSelector = useMemo(() => {
    return specializationOptions.length > 1 &&
      hasEducationVariance(selectedCareer?.specialization_slugs || []);
  }, [specializationOptions, selectedCareer]);

  // Reset specialization when career changes
  useEffect(() => {
    setSelectedSpecialization(null);
  }, [selectedSlug]);

  // Parse URL params for pre-selecting career
  useEffect(() => {
    const careerParam = searchParams.get("career");
    if (careerParam && !selectedSlug) {
      // Validate the career exists
      const careerExists = fullCareers.some(c => c.slug === careerParam);
      if (careerExists) {
        setSelectedSlug(careerParam);
      }
    }
  }, [searchParams, selectedSlug]);

  const filteredCareers = useMemo(() => {
    if (!searchQuery) return careers.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return careers
      .filter(c => c.title.toLowerCase().includes(query) || c.category.toLowerCase().includes(query))
      .slice(0, 50);
  }, [searchQuery]);

  const projections = useMemo((): YearlyProjection[] => {
    if (!selectedCareer) return [];

    const education = getEffectiveEducation();
    const timeline = selectedCareer.career_progression?.timeline || [];
    const educationCost = educationCostIncluded ? (education?.estimated_cost?.typical_cost || 0) : 0;

    const results: YearlyProjection[] = [];

    // Education cost is treated as initial debt/investment (already paid before career starts)
    // The user starts their career at currentAge, timeline year 0 = first year of career
    let netWorth = startingSavings - educationCost;

    // Calculate projections for each year until retirement
    for (let age = currentAge; age <= retirementAge; age++) {
      const careerYear = age - currentAge;

      // Get income from timeline (career year maps directly to timeline index)
      const timelineIndex = Math.min(careerYear, timeline.length - 1);
      const income = timeline[timelineIndex]?.expected_compensation || 0;
      const careerLevel = timeline[timelineIndex]?.level_name || "Entry";

      // Calculate yearly savings from income
      const yearlySavings = income * (savingsRate / 100);

      // Apply investment return to current net worth (can be negative if in debt)
      const investmentGrowth = netWorth > 0 ? netWorth * (investmentReturn / 100) : 0;

      // Update net worth: previous + investment growth + new savings
      netWorth = netWorth + investmentGrowth + yearlySavings;

      results.push({
        year: careerYear,
        age,
        income,
        savings: yearlySavings,
        cumulativeSavings: yearlySavings, // This year's savings
        investmentGrowth,
        netWorth,
        careerLevel,
      });
    }

    return results;
  }, [selectedCareer, currentAge, startingSavings, savingsRate, investmentReturn, retirementAge, educationCostIncluded, selectedSpecialization]);

  // Calculate milestone values
  const milestones = useMemo(() => {
    const ages = [30, 40, 50, 60, retirementAge];
    return ages.map(age => {
      const projection = projections.find(p => p.age === age);
      return {
        age,
        netWorth: projection?.netWorth || 0,
      };
    }).filter(m => m.age >= currentAge);
  }, [projections, currentAge, retirementAge]);

  // Calculate lifetime earnings
  const lifetimeEarnings = useMemo(() => {
    return projections.reduce((sum, p) => sum + p.income, 0);
  }, [projections]);

  const { maxNetWorth, minNetWorth } = useMemo(() => {
    const values = projections.map(p => p.netWorth);
    return {
      maxNetWorth: Math.max(...values, 100000),
      minNetWorth: Math.min(...values, 0),
    };
  }, [projections]);

  const selectCareer = (slug: string) => {
    setSelectedSlug(slug);
    setSearchQuery("");
    setShowSearch(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ds-slate mb-4">
            Net Worth Calculator
          </h1>
          <p className="text-lg text-ds-slate-light max-w-2xl">
            Project your lifetime earnings and net worth based on your career choice.
            See how different paths compare over time.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Career Selection */}
            <div className="card-warm p-6">
              <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Select Career</h2>

              {selectedCareer ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between p-3 bg-sage-pale rounded-lg border border-sage">
                    <div>
                      <a
                        href={`/careers/${selectedCareer.slug}`}
                        className="font-medium text-sage hover:text-sage-dark hover:underline"
                      >
                        {selectedCareer.title}
                      </a>
                      <div className={`text-xs inline-block px-2 py-0.5 rounded-full mt-1 ${getCategoryColor(selectedCareer.category)}`}>
                        {selectedCareer.category}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSlug("")}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-ds-slate-muted hover:text-ds-slate-light active:bg-sage-muted rounded-full text-xl -mr-2"
                      aria-label="Remove career"
                    >
                      &times;
                    </button>
                  </div>
                  <a
                    href={`/compare?career=${selectedCareer.slug}`}
                    className="inline-flex items-center gap-1 mt-2 text-sm text-sage hover:text-sage-dark hover:underline"
                  >
                    Compare with other careers →
                  </a>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="w-full px-4 py-3 min-h-[44px] border-2 border-dashed border-sage-muted rounded-lg text-ds-slate-muted hover:border-sage hover:text-sage active:bg-cream transition-colors text-left"
                  >
                    Search for a career...
                  </button>

                  {showSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-warm-white rounded-lg shadow-lg border border-sage-muted z-10">
                      <input
                        type="text"
                        placeholder="Search careers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 text-base border-b border-sage-muted rounded-t-lg focus:outline-none"
                        autoFocus
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {filteredCareers.map(career => (
                          <button
                            key={career.slug}
                            onClick={() => selectCareer(career.slug)}
                            className="w-full px-4 py-3 min-h-[44px] text-left hover:bg-cream active:bg-sage-muted"
                          >
                            <div className="font-medium text-ds-slate">{career.title}</div>
                            <div className="text-sm text-ds-slate-muted">{career.category} - {formatPay(career.median_pay)}</div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowSearch(false)}
                        className="w-full px-4 py-3 min-h-[44px] text-sm text-ds-slate-muted border-t border-sage-muted hover:bg-cream active:bg-sage-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Personal Info */}
            <div className="card-warm p-6">
              <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Your Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Current Age: {currentAge}
                  </label>
                  <input
                    type="range"
                    min={16}
                    max={50}
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>16</span>
                    <span>50</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Starting Savings: {formatPay(startingSavings)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={5000}
                    value={startingSavings}
                    onChange={(e) => setStartingSavings(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>$0</span>
                    <span>$100K</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Savings Rate: {savingsRate}%
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Investment Return: {investmentReturn}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={investmentReturn}
                    onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>0%</span>
                    <span>12%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Retirement Age: {retirementAge}
                  </label>
                  <input
                    type="range"
                    min={55}
                    max={70}
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>55</span>
                    <span>70</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={educationCostIncluded}
                      onChange={(e) => setEducationCostIncluded(e.target.checked)}
                      className="w-4 h-4 text-sage rounded focus:ring-sage"
                    />
                    <span className="text-sm text-ds-slate-light">Include education costs</span>
                  </label>
                  {selectedCareer && educationCostIncluded && (
                    <div className="text-xs text-ds-slate-muted mt-1 ml-6">
                      -{formatPay(getEffectiveEducation()?.estimated_cost?.typical_cost || 0)} upfront
                    </div>
                  )}
                </div>

                {/* Specialization selector for careers with education variance */}
                {showSpecializationSelector && educationCostIncluded && (
                  <div className="pt-3 mt-3 border-t border-sage-muted">
                    <label className="block text-sm font-medium text-ds-slate-light mb-2">
                      Specialization (affects education cost)
                    </label>
                    <select
                      value={selectedSpecialization || ''}
                      onChange={(e) => setSelectedSpecialization(e.target.value || null)}
                      className="w-full text-sm border border-sage-muted rounded px-3 py-2 bg-warm-white focus:outline-none focus:ring-2 focus:ring-sage"
                    >
                      <option value="">All specializations (default)</option>
                      {specializationOptions.map(spec => (
                        <option key={spec.slug} value={spec.slug}>
                          {spec.title} ({spec.education_duration?.typical_years || '?'} years, {formatPay(spec.estimated_cost?.typical_cost || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCareer ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card-warm p-4 text-center">
                    <div className="text-sm text-ds-slate-light mb-1">Lifetime Earnings</div>
                    <div className="text-xl font-bold text-sage">{formatPay(lifetimeEarnings)}</div>
                  </div>
                  <div className="card-warm p-4 text-center">
                    <div className="text-sm text-ds-slate-light mb-1">Net Worth at {retirementAge}</div>
                    <div className={`text-xl font-bold ${(projections[projections.length - 1]?.netWorth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(() => {
                        const nw = projections[projections.length - 1]?.netWorth || 0;
                        return nw >= 0 ? formatPay(nw) : `-${formatPay(Math.abs(nw))}`;
                      })()}
                    </div>
                  </div>
                  <div className="card-warm p-4 text-center">
                    <div className="text-sm text-ds-slate-light mb-1">Years to $1M</div>
                    <div className="text-xl font-bold text-ds-slate">
                      {(() => {
                        const millionYear = projections.find(p => p.netWorth >= 1000000);
                        return millionYear ? `Age ${millionYear.age}` : "N/A";
                      })()}
                    </div>
                  </div>
                  <div className="card-warm p-4 text-center">
                    <div className="text-sm text-ds-slate-light mb-1">Education Cost</div>
                    <div className="text-xl font-bold text-amber-600">
                      {formatPay(getEffectiveEducation()?.estimated_cost?.typical_cost || 0)}
                    </div>
                  </div>
                </div>

                {/* Net Worth Chart */}
                <div className="card-warm p-6">
                  <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Net Worth Projection</h2>
                  <div className="h-48 md:h-64 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-ds-slate-muted text-right pr-2">
                      <span>{formatPay(maxNetWorth)}</span>
                      <span>{formatPay((maxNetWorth + minNetWorth) / 2)}</span>
                      <span>{minNetWorth < 0 ? `-${formatPay(Math.abs(minNetWorth))}` : '$0'}</span>
                    </div>

                    {/* Chart area */}
                    <div className="ml-16 h-full relative border-l border-b border-sage-muted">
                      {/* Million dollar line */}
                      {maxNetWorth >= 1000000 && (
                        <div
                          className="absolute w-full border-t-2 border-dashed border-green-300"
                          style={{ bottom: `${((1000000 - minNetWorth) / (maxNetWorth - minNetWorth)) * 224}px` }}
                        >
                          <span className="absolute right-0 text-xs text-green-600 -top-4">$1M</span>
                        </div>
                      )}

                      {/* Area chart */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 1000 224"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>

                        {projections.length > 0 && (() => {
                          const range = maxNetWorth - minNetWorth;
                          const zeroY = 224 - ((0 - minNetWorth) / range) * 224;
                          return (
                            <>
                              {/* Zero line if there are negative values */}
                              {minNetWorth < 0 && (
                                <line
                                  x1="0"
                                  y1={zeroY}
                                  x2="1000"
                                  y2={zeroY}
                                  stroke="#9CA3AF"
                                  strokeWidth="1"
                                  strokeDasharray="5,5"
                                />
                              )}

                              {/* Area fill */}
                              <path
                                d={`
                                  M 0 ${zeroY}
                                  ${projections.map((p, i) => {
                                    const x = (i / Math.max(projections.length - 1, 1)) * 1000;
                                    const y = 224 - ((p.netWorth - minNetWorth) / range) * 224;
                                    return `L ${x} ${y}`;
                                  }).join(' ')}
                                  L 1000 ${zeroY}
                                  Z
                                `}
                                fill="url(#netWorthGradient)"
                              />

                              {/* Line */}
                              <polyline
                                points={projections.map((p, i) => {
                                  const x = (i / Math.max(projections.length - 1, 1)) * 1000;
                                  const y = 224 - ((p.netWorth - minNetWorth) / range) * 224;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* X-axis labels */}
                    <div className="ml-16 flex justify-between text-xs text-ds-slate-muted mt-2">
                      <span>Age {currentAge}</span>
                      <span>Age {Math.round((currentAge + retirementAge) / 2)}</span>
                      <span>Age {retirementAge}</span>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="card-warm p-6">
                  <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Milestones</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {milestones.map(milestone => (
                      <div key={milestone.age} className="text-center p-3 bg-cream rounded-lg">
                        <div className="text-sm text-ds-slate-light">Age {milestone.age}</div>
                        <div className={`font-bold ${milestone.netWorth >= 1000000 ? 'text-green-600' : milestone.netWorth < 0 ? 'text-red-600' : 'text-ds-slate'}`}>
                          {milestone.netWorth >= 0 ? formatPay(milestone.netWorth) : `-${formatPay(Math.abs(milestone.netWorth))}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Year by Year Table */}
                <div className="card-warm overflow-hidden">
                  <div className="p-6 border-b border-sage-muted">
                    <h2 className="font-display text-lg font-semibold text-ds-slate">Year-by-Year Breakdown</h2>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="bg-cream sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-ds-slate-light">Age</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-ds-slate-light">Level</th>
                          <th className="text-right px-4 py-2 text-sm font-semibold text-ds-slate-light">Income</th>
                          <th className="text-right px-4 py-2 text-sm font-semibold text-ds-slate-light">Saved</th>
                          <th className="text-right px-4 py-2 text-sm font-semibold text-ds-slate-light">Growth</th>
                          <th className="text-right px-4 py-2 text-sm font-semibold text-ds-slate-light">Net Worth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {projections.filter((_, i) => i % 5 === 0 || i === projections.length - 1).map(p => (
                          <tr key={p.age} className="hover:bg-cream">
                            <td className="px-4 py-2 font-medium">{p.age}</td>
                            <td className="px-4 py-2 text-sm text-ds-slate-light">{p.careerLevel}</td>
                            <td className="px-4 py-2 text-right">{formatPay(p.income)}</td>
                            <td className="px-4 py-2 text-right text-green-600">+{formatPay(p.savings)}</td>
                            <td className="px-4 py-2 text-right text-blue-600">+{formatPay(p.investmentGrowth)}</td>
                            <td className={`px-4 py-2 text-right font-bold ${p.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {p.netWorth >= 0 ? '' : '-'}{formatPay(Math.abs(p.netWorth))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assumptions */}
                <div className="card-warm p-6 bg-amber-50 border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-2">Assumptions & Disclaimers</h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>Career progression based on typical BLS percentile data</li>
                    <li>Investment returns assume compound annual growth at {investmentReturn}%</li>
                    <li>Does not account for inflation, taxes, or living expenses</li>
                    <li>Actual results will vary based on individual circumstances</li>
                    <li>This is for educational purposes only, not financial advice</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="card-warm p-12 text-center">
                <div className="text-6xl mb-4">Calculator</div>
                <h3 className="text-xl font-semibold text-ds-slate mb-2">
                  Select a career to get started
                </h3>
                <p className="text-ds-slate-light">
                  Choose a career path to see projected lifetime earnings and net worth calculations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-sage-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-sage-muted rounded w-2/3 mb-8" />
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="h-96 bg-sage-muted rounded" />
                <div className="lg:col-span-2 h-96 bg-sage-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CalculatorContent />
    </Suspense>
  );
}
