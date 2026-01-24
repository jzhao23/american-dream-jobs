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

// Tooltip component with info icon
function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-xs text-ds-slate-muted hover:text-sage cursor-help rounded-full border border-ds-slate-muted hover:border-sage transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        i
      </button>
      {isVisible && (
        <span className="absolute z-20 w-56 px-3 py-2 text-xs text-ds-slate bg-warm-white border border-sage-muted rounded-lg shadow-lg -left-24 bottom-6">
          {text}
          <span className="absolute w-2 h-2 bg-warm-white border-r border-b border-sage-muted transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
        </span>
      )}
    </span>
  );
}

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
  const [comparisonScenario, setComparisonScenario] = useState<'none' | 'retire_later' | 'save_more'>('none');
  const [showHelperResources, setShowHelperResources] = useState(false);

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
    if (!searchQuery) return careers;
    const query = searchQuery.toLowerCase();
    return careers
      .filter(c => c.title.toLowerCase().includes(query) || c.category.toLowerCase().includes(query));
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

  // Helper to calculate final net worth for a given scenario
  const calculateNetWorthForScenario = (
    scenarioRetirementAge: number,
    scenarioSavingsRate: number
  ): number => {
    if (!selectedCareer) return 0;

    const education = getEffectiveEducation();
    const timeline = selectedCareer.career_progression?.timeline || [];
    const educationCost = educationCostIncluded ? (education?.estimated_cost?.typical_cost || 0) : 0;
    let netWorth = startingSavings - educationCost;

    for (let age = currentAge; age <= scenarioRetirementAge; age++) {
      const careerYear = age - currentAge;
      const timelineIndex = Math.min(careerYear, timeline.length - 1);
      const income = timeline[timelineIndex]?.expected_compensation || 0;
      const yearlySavings = income * (scenarioSavingsRate / 100);
      const investmentGrowthAmount = netWorth > 0 ? netWorth * (investmentReturn / 100) : 0;
      netWorth = netWorth + investmentGrowthAmount + yearlySavings;
    }

    return netWorth;
  };

  // Calculate Key Insights
  const insights = useMemo(() => {
    if (!selectedCareer) return null;

    const education = getEffectiveEducation();
    const educationCost = educationCostIncluded ? (education?.estimated_cost?.typical_cost || 0) : 0;
    const timeline = selectedCareer.career_progression?.timeline || [];

    // Current final net worth
    const currentNetWorth = projections[projections.length - 1]?.netWorth || 0;

    // Net worth at age 65 (or current retirement age if already past 65)
    const netWorthAt65 = calculateNetWorthForScenario(65, savingsRate);
    const retirementVs65Difference = currentNetWorth - netWorthAt65;

    // Impact of 1% more savings
    const netWorthWith1MorePercent = calculateNetWorthForScenario(retirementAge, savingsRate + 1);
    const impactOf1PercentSavings = netWorthWith1MorePercent - currentNetWorth;

    // Find breakeven age where education investment pays off (net worth > 0 with education vs without)
    let breakevenAge: number | null = null;
    if (educationCost > 0) {
      // Find when cumulative earnings from this career exceed what you'd have without the education cost
      let netWorthWithEducation = startingSavings - educationCost;
      for (let age = currentAge; age <= 100; age++) {
        const careerYear = age - currentAge;
        const timelineIndex = Math.min(careerYear, timeline.length - 1);
        const income = timeline[timelineIndex]?.expected_compensation || 0;
        const yearlySavings = income * (savingsRate / 100);
        const growth = netWorthWithEducation > 0 ? netWorthWithEducation * (investmentReturn / 100) : 0;
        netWorthWithEducation = netWorthWithEducation + growth + yearlySavings;

        // Breakeven is when net worth becomes positive (paid off education debt)
        if (netWorthWithEducation > 0 && breakevenAge === null) {
          breakevenAge = age;
          break;
        }
      }
    }

    // Find age to reach $1M
    const millionAge = projections.find(p => p.netWorth >= 1000000)?.age || null;

    // Impact of retiring 5 years later
    const netWorthRetire5Later = calculateNetWorthForScenario(Math.min(retirementAge + 5, 100), savingsRate);
    const retire5YearsLaterDiff = netWorthRetire5Later - currentNetWorth;

    // Impact of saving 5% more
    const netWorthSave5More = calculateNetWorthForScenario(retirementAge, Math.min(savingsRate + 5, 50));
    const save5PercentMoreDiff = netWorthSave5More - currentNetWorth;

    return {
      currentNetWorth,
      retirementVs65Difference,
      impactOf1PercentSavings,
      breakevenAge,
      millionAge,
      retire5YearsLaterDiff,
      save5PercentMoreDiff,
    };
  }, [projections, selectedCareer, currentAge, startingSavings, savingsRate, investmentReturn, retirementAge, educationCostIncluded, selectedSpecialization]);

  // Handle What-if button clicks
  const handleWhatIf = (scenario: 'retire_later' | 'save_more') => {
    if (comparisonScenario === scenario) {
      // Reset to original
      setComparisonScenario('none');
    } else {
      // Apply the scenario
      setComparisonScenario(scenario);
      if (scenario === 'retire_later') {
        setRetirementAge(Math.min(retirementAge + 5, 100));
      } else if (scenario === 'save_more') {
        setSavingsRate(Math.min(savingsRate + 5, 50));
      }
    }
  };

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
          <p className="text-lg text-ds-slate-light max-w-2xl mb-4">
            See how your career choice impacts your lifetime wealth. This calculator
            projects your net worth from now until retirement, factoring in your salary,
            savings habits, and investment growth.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-pale rounded-full text-sage">
              <span>1.</span> Pick a career
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-pale rounded-full text-sage">
              <span>2.</span> Adjust your details
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-pale rounded-full text-sage">
              <span>3.</span> See your projected wealth
            </div>
          </div>
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
                    max={100}
                    value={currentAge}
                    onChange={(e) => {
                      const newAge = Number(e.target.value);
                      setCurrentAge(newAge);
                      // Ensure retirement age is always >= current age
                      if (newAge > retirementAge) {
                        setRetirementAge(newAge);
                      }
                    }}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>16</span>
                    <span>100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ds-slate-light mb-1">
                    Starting Savings: {formatPay(startingSavings)}
                    <Tooltip text="Money you already have saved (checking, savings, investments)" />
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
                    <Tooltip text="Percentage of your income you'll save each year" />
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
                    <Tooltip text="Expected annual return on investments (7% is historical stock market average)" />
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
                    min={currentAge}
                    max={100}
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className="w-full h-2 bg-sage-muted rounded-lg appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-xs text-ds-slate-muted mt-1">
                    <span>{currentAge}</span>
                    <span>100</span>
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

            {/* Helper Resources Section */}
            <div className="card-warm p-4">
              <button
                onClick={() => setShowHelperResources(!showHelperResources)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm font-medium text-ds-slate-light">New to financial planning?</span>
                <span className="text-ds-slate-muted text-xs">
                  {showHelperResources ? '−' : '+'}
                </span>
              </button>
              {showHelperResources && (
                <div className="mt-3 pt-3 border-t border-sage-muted">
                  <p className="text-xs text-ds-slate-muted mb-3">
                    Learn the basics with these beginner-friendly resources:
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="https://www.investopedia.com/terms/s/savings-rate.asp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sage hover:text-sage-dark hover:underline"
                      >
                        Understanding savings rates →
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.investor.gov/additional-resources/information/youth/teachers-classroom-resources/compound-interest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sage hover:text-sage-dark hover:underline"
                      >
                        How compound interest works →
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.nerdwallet.com/article/investing/how-to-start-investing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sage hover:text-sage-dark hover:underline"
                      >
                        Getting started with investing →
                      </a>
                    </li>
                  </ul>
                  <p className="text-xs text-ds-slate-muted mt-3 pt-2 border-t border-sage-muted italic">
                    External resources for educational purposes only, not financial advice.
                  </p>
                </div>
              )}
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

                {/* What-If Quick Actions */}
                <div className="card-warm p-6 bg-blue-50 border-blue-200">
                  <h2 className="font-display text-lg font-semibold text-ds-slate mb-3">Try What-If Scenarios</h2>
                  <p className="text-sm text-ds-slate-light mb-4">See how small changes can impact your net worth</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleWhatIf('retire_later')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        retirementAge <= 95
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={retirementAge > 95}
                    >
                      Retire 5 years later
                      {insights && retirementAge <= 95 && (
                        <span className="ml-2 text-green-600">+{formatPay(insights.retire5YearsLaterDiff)}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleWhatIf('save_more')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        savingsRate < 50
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={savingsRate >= 50}
                    >
                      Save 5% more
                      {insights && savingsRate < 50 && (
                        <span className="ml-2 text-green-600">+{formatPay(insights.save5PercentMoreDiff)}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Key Insights */}
                {insights && (
                  <div className="card-warm p-6 bg-gradient-to-br from-sage-pale to-white border-sage">
                    <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Key Insights</h2>
                    <div className="space-y-4">
                      {/* Retirement age comparison */}
                      {retirementAge !== 65 && (
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <p className="text-sm font-medium text-ds-slate">
                              Retiring at {retirementAge} vs 65 {insights.retirementVs65Difference >= 0 ? 'adds' : 'reduces your net worth by'}{' '}
                              <span className={insights.retirementVs65Difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPay(Math.abs(insights.retirementVs65Difference))}
                              </span>
                            </p>
                            <p className="text-xs text-ds-slate-muted mt-1">
                              {retirementAge > 65
                                ? 'More working years means more savings and investment growth'
                                : 'Fewer working years but more time to enjoy retirement'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Savings rate impact */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="text-sm font-medium text-ds-slate">
                            Each 1% increase in savings rate adds{' '}
                            <span className="text-green-600">{formatPay(insights.impactOf1PercentSavings)}</span>{' '}
                            to your net worth
                          </p>
                          <p className="text-xs text-ds-slate-muted mt-1">
                            Small consistent increases compound significantly over time
                          </p>
                        </div>
                      </div>

                      {/* Education payback */}
                      {insights.breakevenAge && educationCostIncluded && (
                        <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                          <span className="text-2xl">🎓</span>
                          <div>
                            <p className="text-sm font-medium text-ds-slate">
                              Your education investment pays back by age{' '}
                              <span className="text-sage font-bold">{insights.breakevenAge}</span>
                            </p>
                            <p className="text-xs text-ds-slate-muted mt-1">
                              {insights.breakevenAge <= currentAge + 5
                                ? 'Great ROI! You\'ll be in the positive quickly'
                                : insights.breakevenAge <= currentAge + 10
                                ? 'Solid investment with reasonable payback period'
                                : 'Longer payback, but education has non-financial benefits too'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Million dollar milestone */}
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <p className="text-sm font-medium text-ds-slate">
                            {insights.millionAge
                              ? <>At this rate, you&apos;ll hit <span className="text-green-600 font-bold">$1M</span> by age <span className="text-sage font-bold">{insights.millionAge}</span></>
                              : <>To reach $1M, consider increasing your savings rate or retirement age</>
                            }
                          </p>
                          <p className="text-xs text-ds-slate-muted mt-1">
                            {insights.millionAge
                              ? insights.millionAge <= 45
                                ? 'Excellent trajectory! You\'re on track for early financial independence'
                                : insights.millionAge <= 55
                                ? 'Solid path to becoming a millionaire before typical retirement'
                                : 'You\'ll reach this milestone during your career'
                              : 'Try the what-if scenarios above to see how changes help'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improved Milestones */}
                <div className="card-warm p-6">
                  <h2 className="font-display text-lg font-semibold text-ds-slate mb-4">Your Wealth Journey</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key milestone amounts */}
                    {[
                      { amount: 100000, label: '$100K', icon: '🌱' },
                      { amount: 250000, label: '$250K', icon: '🌿' },
                      { amount: 500000, label: '$500K', icon: '🌳' },
                      { amount: 1000000, label: '$1M', icon: '🏆' },
                    ].map(target => {
                      const reachAge = projections.find(p => p.netWorth >= target.amount)?.age;
                      const isAchieved = reachAge !== undefined;
                      return (
                        <div
                          key={target.amount}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isAchieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className="text-2xl">{target.icon}</span>
                          <div>
                            <div className={`font-bold ${isAchieved ? 'text-green-700' : 'text-gray-500'}`}>
                              {target.label}
                            </div>
                            <div className={`text-sm ${isAchieved ? 'text-green-600' : 'text-gray-400'}`}>
                              {isAchieved
                                ? `Reached at age ${reachAge}`
                                : 'Not reached by retirement'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Traditional age milestones */}
                  <div className="mt-6 pt-4 border-t border-sage-muted">
                    <h3 className="text-sm font-medium text-ds-slate-light mb-3">Net Worth by Age</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {milestones.map(milestone => (
                        <div key={milestone.age} className="text-center p-2 bg-cream rounded-lg">
                          <div className="text-xs text-ds-slate-light">Age {milestone.age}</div>
                          <div className={`text-sm font-bold ${milestone.netWorth >= 1000000 ? 'text-green-600' : milestone.netWorth < 0 ? 'text-red-600' : 'text-ds-slate'}`}>
                            {milestone.netWorth >= 0 ? formatPay(milestone.netWorth) : `-${formatPay(Math.abs(milestone.netWorth))}`}
                          </div>
                        </div>
                      ))}
                    </div>
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
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-ds-slate mb-3">
                  Start Your Wealth Projection
                </h3>
                <p className="text-ds-slate-light mb-6 max-w-md mx-auto">
                  Select a career on the left to see how your choices impact your lifetime net worth.
                  You&apos;ll get personalized insights on reaching financial milestones.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
                  <div className="p-3 bg-sage-pale rounded-lg">
                    <div className="text-lg mb-1">📊</div>
                    <div className="text-sm font-medium text-ds-slate">Projections</div>
                    <div className="text-xs text-ds-slate-muted">See net worth over time</div>
                  </div>
                  <div className="p-3 bg-sage-pale rounded-lg">
                    <div className="text-lg mb-1">🎯</div>
                    <div className="text-sm font-medium text-ds-slate">Milestones</div>
                    <div className="text-xs text-ds-slate-muted">Track $100K to $1M goals</div>
                  </div>
                  <div className="p-3 bg-sage-pale rounded-lg">
                    <div className="text-lg mb-1">💡</div>
                    <div className="text-sm font-medium text-ds-slate">Insights</div>
                    <div className="text-xs text-ds-slate-muted">Get personalized advice</div>
                  </div>
                </div>
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
