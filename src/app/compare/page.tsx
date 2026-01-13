"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import careersIndex from "../../../data/output/careers-index.json";
import careersData from "../../../data/output/careers.json";
import type { CareerIndex, Career } from "@/types/career";
import {
  formatPay,
  getCategoryColor,
  getAIResilienceColor,
  getAIResilienceEmoji,
  type AIResilienceClassification,
} from "@/types/career";
import {
  getSpecializationsForCareer,
  getSpecializationBySlug,
  hasEducationVariance,
} from "@/lib/specializations";

const careers = careersIndex as CareerIndex[];
const fullCareers = careersData as Career[];

interface CareerPathStage {
  type: "education" | "career" | "retirement";
  label: string;
  ageStart: number;
  ageEnd: number;
  annualAmount: number; // negative for costs, positive for earnings
  cumulative: number;
  levelName?: string;
}

interface InstitutionOption {
  value: string;
  label: string;
  cost: number;
}

// Helper function to get available institution types for each education stage
function getAvailableInstitutionTypes(
  stageItem: string,
  costByType: Career['education']['cost_by_institution_type'],
  stageCost: { min: number; max: number; typical?: number }
): InstitutionOption[] {
  const item = stageItem.toLowerCase();
  const options: InstitutionOption[] = [
    { value: 'average', label: 'Average', cost: stageCost.typical || Math.round((stageCost.min + stageCost.max) / 2) }
  ];

  if (!costByType) return options;

  if (item.includes('bachelor')) {
    // Bachelor's degree options
    if (costByType.public_in_state) {
      options.push({ value: 'public_in_state', label: 'Public (in-state)', cost: costByType.public_in_state.total });
    }
    if (costByType.public_out_of_state) {
      options.push({ value: 'public_out_of_state', label: 'Public (out-of-state)', cost: costByType.public_out_of_state.total });
    }
    if (costByType.private_nonprofit) {
      options.push({ value: 'private_nonprofit', label: 'Private', cost: costByType.private_nonprofit.total });
    }
    // Add transfer options (2 years CC + 2 years 4-year)
    if (costByType.community_college) {
      const ccCost = costByType.community_college.per_year * 2;
      if (costByType.public_in_state) {
        const transferCost = ccCost + costByType.public_in_state.per_year * 2;
        options.push({ value: 'cc_transfer_public', label: 'CC → Public (transfer)', cost: transferCost });
      }
      if (costByType.private_nonprofit) {
        const transferCost = ccCost + costByType.private_nonprofit.per_year * 2;
        options.push({ value: 'cc_transfer_private', label: 'CC → Private (transfer)', cost: transferCost });
      }
    }
  } else if (item.includes('master') || item.includes('graduate') || item.includes('mba')) {
    // Master's/Graduate degree - use proportional costs
    const typicalCost = stageCost.typical || Math.round((stageCost.min + stageCost.max) / 2);
    const totalTypicalCost = costByType.public_in_state?.total || costByType.public_out_of_state?.total || typicalCost;
    const proportion = typicalCost / (totalTypicalCost || 1);

    if (costByType.public_in_state) {
      options.push({ value: 'public_in_state', label: 'Public (in-state)', cost: Math.round(stageCost.min) });
    }
    if (costByType.public_out_of_state) {
      options.push({ value: 'public_out_of_state', label: 'Public (out-of-state)', cost: Math.round((stageCost.min + stageCost.max) / 2) });
    }
    if (costByType.private_nonprofit) {
      options.push({ value: 'private_nonprofit', label: 'Private', cost: Math.round(stageCost.max) });
    }
  } else if (item.includes('associate')) {
    if (costByType.community_college) {
      options.push({ value: 'community_college', label: 'Community College', cost: costByType.community_college.total });
    }
    if (costByType.public_in_state) {
      options.push({ value: 'public_in_state', label: 'Public 4-year', cost: Math.round(costByType.public_in_state.per_year * 2) });
    }
  } else if (item.includes('apprentice')) {
    // Apprenticeship - just show the one option
    if (costByType.apprenticeship) {
      options.length = 0; // Clear the average option
      options.push({ value: 'apprenticeship', label: 'Apprenticeship (paid)', cost: 0 });
    }
  } else if (item.includes('certificate') || item.includes('trade') || item.includes('vocational')) {
    if (costByType.trade_school) {
      options.push({ value: 'trade_school', label: 'Trade School', cost: costByType.trade_school.total });
    }
    if (costByType.community_college) {
      options.push({ value: 'community_college', label: 'Community College', cost: costByType.community_college.total });
    }
  } else if (item.includes('doctor') || item.includes('md') || item.includes('medical') ||
             item.includes('law') || item.includes('jd') || item.includes('professional')) {
    // Professional degrees - use min/max from stage
    options.push({ value: 'public_in_state', label: 'Public', cost: stageCost.min });
    options.push({ value: 'private_nonprofit', label: 'Private', cost: stageCost.max });
  }

  return options;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [startAge] = useState(18); // Age when starting education/training
  const [retirementAge] = useState(65);
  // Track institution type selections: { [careerSlug]: { [stageIndex]: institutionType } }
  const [institutionTypes, setInstitutionTypes] = useState<Record<string, Record<number, string>>>({});
  // Track selected specialization for each career (for education requirements)
  const [selectedSpecializations, setSelectedSpecializations] = useState<Record<string, string | null>>({});

  // Parse URL params for pre-selecting careers
  useEffect(() => {
    const careerParam = searchParams.get("career");
    const careersParam = searchParams.get("careers");

    if (careerParam && selectedSlugs.length === 0) {
      // Single career param
      const careerExists = fullCareers.some(c => c.slug === careerParam);
      if (careerExists) {
        setSelectedSlugs([careerParam]);
      }
    } else if (careersParam && selectedSlugs.length === 0) {
      // Multiple careers (comma-separated)
      const slugs = careersParam.split(",").slice(0, 3);
      const validSlugs = slugs.filter(slug => fullCareers.some(c => c.slug === slug));
      if (validSlugs.length > 0) {
        setSelectedSlugs(validSlugs);
      }
    }
  }, [searchParams, selectedSlugs.length]);

  const updateInstitutionType = (careerSlug: string, stageIndex: number, value: string) => {
    setInstitutionTypes(prev => ({
      ...prev,
      [careerSlug]: {
        ...(prev[careerSlug] || {}),
        [stageIndex]: value,
      },
    }));
  };

  const selectedCareers = useMemo(() => {
    return selectedSlugs.map(slug => fullCareers.find(c => c.slug === slug)).filter(Boolean) as Career[];
  }, [selectedSlugs]);

  // Get effective education data for each career (from specialization if selected)
  const getEffectiveEducation = (career: Career): Career['education'] => {
    const selectedSpecSlug = selectedSpecializations[career.slug];
    if (selectedSpecSlug) {
      const spec = getSpecializationBySlug(selectedSpecSlug);
      if (spec?.education) {
        return spec.education;
      }
    }
    return career.education;
  };

  const filteredCareers = useMemo(() => {
    if (!searchQuery) return careers.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return careers
      .filter(c => c.title.toLowerCase().includes(query) || c.category.toLowerCase().includes(query))
      .slice(0, 50);
  }, [searchQuery]);

  // Build career paths for each selected career
  const careerPaths = useMemo(() => {
    return selectedCareers.map(career => {
      const stages: CareerPathStage[] = [];
      // Get effective education (from specialization if selected)
      const education = getEffectiveEducation(career);
      // Use education_duration (ground truth) if available, fall back to time_to_job_ready
      const educationYears = education?.education_duration?.typical_years
        ?? education?.time_to_job_ready?.typical_years
        ?? 2;
      const timeline = career.career_progression?.timeline || [];
      const costBreakdown = education?.estimated_cost?.cost_breakdown || [];
      const costByType = education?.cost_by_institution_type;

      // Calculate total education cost based on institution type selections
      let educationCost = 0;
      if (costBreakdown.length > 0) {
        costBreakdown.forEach((stage, idx) => {
          const selectedType = institutionTypes[career.slug]?.[idx] || 'average';
          const options = getAvailableInstitutionTypes(stage.item, costByType, stage);
          const selectedOption = options.find(o => o.value === selectedType) || options[0];
          educationCost += selectedOption.cost;
        });
      } else {
        // Fallback to typical cost if no breakdown
        educationCost = education?.estimated_cost?.typical_cost || 0;
      }

      let cumulative = 0;

      // Education stage
      const educationEnd = startAge + educationYears;
      cumulative -= educationCost;
      stages.push({
        type: "education",
        label: education?.typical_entry_education || "Training",
        ageStart: startAge,
        ageEnd: educationEnd,
        annualAmount: -educationCost,
        cumulative,
      });

      // Career stages in 5-year blocks
      const careerStartAge = educationEnd;
      const yearsUntilRetirement = retirementAge - careerStartAge;
      const numBlocks = Math.ceil(yearsUntilRetirement / 5);

      for (let block = 0; block < numBlocks; block++) {
        const blockStartAge = careerStartAge + block * 5;
        const blockEndAge = Math.min(blockStartAge + 5, retirementAge);
        const yearsInBlock = blockEndAge - blockStartAge;

        // Calculate earnings for this block based on timeline
        let blockEarnings = 0;
        let levelName = "Entry";

        for (let year = 0; year < yearsInBlock; year++) {
          const careerYear = block * 5 + year;
          const timelineIndex = Math.min(careerYear, timeline.length - 1);
          if (timeline[timelineIndex]) {
            blockEarnings += timeline[timelineIndex].expected_compensation;
            levelName = timeline[timelineIndex].level_name;
          }
        }

        cumulative += blockEarnings;

        stages.push({
          type: "career",
          label: `Years ${block * 5 + 1}-${Math.min((block + 1) * 5, yearsUntilRetirement)}`,
          ageStart: blockStartAge,
          ageEnd: blockEndAge,
          annualAmount: blockEarnings,
          cumulative,
          levelName,
        });
      }

      // Retirement marker
      stages.push({
        type: "retirement",
        label: "Retirement",
        ageStart: retirementAge,
        ageEnd: retirementAge,
        annualAmount: 0,
        cumulative,
      });

      return {
        career,
        stages,
        totalEarnings: cumulative,
        educationCost,
      };
    });
  }, [selectedCareers, startAge, retirementAge, institutionTypes, selectedSpecializations]);

  const addCareer = (slug: string) => {
    if (selectedSlugs.length < 3 && !selectedSlugs.includes(slug)) {
      setSelectedSlugs([...selectedSlugs, slug]);
    }
    setSearchQuery("");
    setShowSearch(false);
  };

  const removeCareer = (slug: string) => {
    setSelectedSlugs(selectedSlugs.filter(s => s !== slug));
  };

  const colors = ['blue', 'green', 'purple'] as const;
  const colorClasses = {
    blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    green: { bg: 'bg-green-500', bgLight: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-warm-white border-b border-sage-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ds-slate mb-4">
            Compare Futures
          </h1>
          <p className="text-lg text-ds-slate-light max-w-2xl">
            Answer the big question: Which career will earn more over your lifetime? Compare up to 3 paths and see the full picture.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Color Coding Legend */}
        <div className="bg-sage-pale rounded-lg p-4 mb-6 flex flex-wrap items-center justify-center gap-6 text-sm">
          <span className="font-medium text-ds-slate">How to read:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-ds-slate-light">Earnings (money in)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-ds-slate-light">Education Cost (investment)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold">+$</span>
            <span className="text-ds-slate-light">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold">-$</span>
            <span className="text-ds-slate-light">Investment/Cost</span>
          </div>
        </div>

        {/* Career Selection */}
        <div className="card-warm p-6 mb-8">
          <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">Select Careers to Compare</h2>

          <div className="flex flex-wrap gap-3 mb-4">
            {selectedCareers.map((career, index) => (
              <div
                key={career.slug}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${colorClasses[colors[index]].border} ${colorClasses[colors[index]].bgLight}`}
              >
                <a
                  href={`/careers/${career.slug}`}
                  className="font-medium text-sage hover:text-sage-dark hover:underline"
                >
                  {career.title}
                </a>
                <a
                  href={`/calculator?career=${career.slug}`}
                  className="text-xs text-ds-slate-muted hover:text-sage"
                  title="Calculate earnings"
                >
                  📊
                </a>
                <button
                  onClick={() => removeCareer(career.slug)}
                  className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-ds-slate-muted hover:text-ds-slate-light active:bg-sage-muted rounded-full text-xl leading-none -mr-2"
                  aria-label={`Remove ${career.title}`}
                >
                  &times;
                </button>
              </div>
            ))}

            {selectedSlugs.length < 3 && (
              <div className="relative">
                <button
                  onClick={() => setShowSearch(true)}
                  className="px-4 py-3 min-h-[44px] border-2 border-dashed border-sage-muted rounded-lg text-ds-slate-muted hover:border-sage hover:text-sage active:bg-sage-pale transition-colors"
                >
                  + Add Career ({3 - selectedSlugs.length} remaining)
                </button>

                {showSearch && (
                  <div className="absolute top-full left-0 right-0 md:right-auto mt-2 w-full md:w-80 bg-warm-white rounded-lg shadow-lg border border-sage-muted z-10">
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
                          onClick={() => addCareer(career.slug)}
                          disabled={selectedSlugs.includes(career.slug)}
                          className={`w-full px-4 py-3 min-h-[44px] text-left hover:bg-sage-pale active:bg-sage-muted ${
                            selectedSlugs.includes(career.slug) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="font-medium text-ds-slate">{career.title}</div>
                          <div className="text-sm text-ds-slate-muted">{career.category} - {formatPay(career.median_pay)}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="w-full px-4 py-3 min-h-[44px] text-sm text-ds-slate-muted border-t border-sage-muted hover:bg-sage-pale active:bg-sage-muted"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Education Cost Settings */}
        {selectedCareers.length > 0 && (
          <div className="card-warm p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-ds-slate mb-2">Education Cost Settings</h2>
            <p className="text-sm text-ds-slate-muted mb-4">
              Default uses average of public and private school costs.
              Select specific institution types for more accurate estimates.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {selectedCareers.map((career, idx) => {
                // Get effective education (from specialization if selected)
                const education = getEffectiveEducation(career);
                const costBreakdown = education?.estimated_cost?.cost_breakdown || [];
                const costByType = education?.cost_by_institution_type;
                const hasBreakdown = costBreakdown.length > 0;
                // Check if career has specializations with different education requirements
                const specializationOptions = career.specialization_slugs
                  ? getSpecializationsForCareer(career.specialization_slugs)
                  : [];
                const showSpecializationSelector = specializationOptions.length > 1 &&
                  hasEducationVariance(career.specialization_slugs || []);

                return (
                  <div key={career.slug} className={`p-4 rounded-lg ${colorClasses[colors[idx]].bgLight} border ${colorClasses[colors[idx]].border}`}>
                    <div className={`font-semibold mb-3 ${colorClasses[colors[idx]].text}`}>
                      {career.title}
                    </div>

                    {/* Specialization Selector - shown when education varies */}
                    {showSpecializationSelector && (
                      <div className="mb-4 pb-3 border-b border-sage-muted">
                        <div className="text-xs text-ds-slate-light mb-1">
                          Specialization (affects education requirements)
                        </div>
                        <select
                          value={selectedSpecializations[career.slug] || ''}
                          onChange={(e) => {
                            setSelectedSpecializations({
                              ...selectedSpecializations,
                              [career.slug]: e.target.value || null
                            });
                            // Reset institution types when specialization changes
                            setInstitutionTypes(prev => {
                              const newTypes = { ...prev };
                              delete newTypes[career.slug];
                              return newTypes;
                            });
                          }}
                          className="w-full text-sm border border-sage-muted rounded px-2 py-1.5 bg-warm-white focus:outline-none focus:ring-2 focus:ring-sage"
                        >
                          <option value="">All specializations (default)</option>
                          {specializationOptions.map(spec => (
                            <option key={spec.slug} value={spec.slug}>
                              {spec.title} ({spec.education_duration?.typical_years || '?'} years)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {hasBreakdown ? (
                      <div className="space-y-3">
                        {costBreakdown.map((stage, stageIdx) => {
                          const options = getAvailableInstitutionTypes(stage.item, costByType, stage);
                          const selectedValue = institutionTypes[career.slug]?.[stageIdx] || 'average';
                          const selectedOption = options.find(o => o.value === selectedValue) || options[0];
                          const isLocked = options.length === 1;

                          return (
                            <div key={stageIdx}>
                              <div className="text-xs text-ds-slate-light mb-1">{stage.item}</div>
                              {isLocked ? (
                                <div className="text-sm font-medium text-green-600 bg-warm-white rounded px-2 py-1">
                                  {selectedOption.label} - {selectedOption.cost === 0 ? '$0 (paid training)' : formatPay(selectedOption.cost)}
                                </div>
                              ) : (
                                <select
                                  value={selectedValue}
                                  onChange={(e) => updateInstitutionType(career.slug, stageIdx, e.target.value)}
                                  className="w-full text-sm border border-sage-muted rounded px-2 py-1.5 bg-warm-white focus:outline-none focus:ring-2 focus:ring-sage"
                                >
                                  {options.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label} - {formatPay(option.cost)}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-sage-muted">
                          <div className="text-xs text-ds-slate-muted">Total Education Cost</div>
                          <div className="font-bold text-ds-slate">
                            {formatPay(careerPaths.find(p => p.career.slug === career.slug)?.educationCost || 0)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-ds-slate-light">
                        <div className="font-medium">{formatPay(education?.estimated_cost?.typical_cost || 0)}</div>
                        <div className="text-xs text-ds-slate-muted mt-1">No breakdown available</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedCareers.length >= 1 && (
          <>
            {/* Career Path Timeline */}
            <div className="card-warm p-6 mb-8">
              <h2 className="font-display text-xl font-semibold text-ds-slate mb-2">
                {selectedCareers.length === 1 ? 'Career Path Visualization' : 'Career Path Comparison'}
              </h2>
              <p className="text-sm text-ds-slate-light mb-6">Starting at age {startAge}, retiring at age {retirementAge}</p>

              <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto pb-4">
                {careerPaths.map((path, pathIndex) => (
                  <div key={path.career.slug} className="flex-1 min-w-full md:min-w-[280px]">
                    {/* Career header */}
                    <div className={`text-center p-3 rounded-t-lg ${colorClasses[colors[pathIndex]].bgLight} border-2 ${colorClasses[colors[pathIndex]].border}`}>
                      <a
                        href={`/careers/${path.career.slug}`}
                        className="font-bold text-sage hover:text-sage-dark hover:underline text-sm"
                      >
                        {path.career.title}
                      </a>
                      <div className={`text-xs ${getCategoryColor(path.career.category)} inline-block px-2 py-0.5 rounded-full mt-1`}>
                        {path.career.category}
                      </div>
                    </div>

                    {/* Stages */}
                    <div className="border-x-2 border-b-2 border-sage-muted rounded-b-lg overflow-hidden">
                      {path.stages.map((stage, stageIndex) => (
                        <div
                          key={stageIndex}
                          className={`p-3 border-b border-sage-muted last:border-b-0 ${
                            stage.type === 'education' ? 'bg-amber-50' :
                            stage.type === 'retirement' ? 'bg-sage-muted' :
                            stageIndex % 2 === 0 ? 'bg-warm-white' : 'bg-sage-pale'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <div className="text-xs text-ds-slate-muted">
                                {stage.type === 'retirement' ? `Age ${stage.ageStart}` : `Age ${stage.ageStart}-${stage.ageEnd}`}
                              </div>
                              <div className="font-medium text-sm text-ds-slate">
                                {stage.type === 'education' ? stage.label :
                                 stage.type === 'retirement' ? 'Retirement' :
                                 stage.label}
                              </div>
                              {stage.levelName && stage.type === 'career' && (
                                <div className="text-xs text-ds-slate-muted">{stage.levelName}</div>
                              )}
                            </div>
                            <div className="text-right">
                              {stage.type === 'education' ? (
                                <div className="group relative">
                                  <div className="text-amber-600 font-bold text-sm cursor-help">
                                    Education Cost: -{formatPay(Math.abs(stage.annualAmount))}
                                  </div>
                                  <div className="absolute hidden group-hover:block right-0 bottom-full mb-1 w-48 p-2 bg-ds-slate text-white text-xs rounded shadow-lg z-10">
                                    This is an investment in your future earning potential
                                  </div>
                                </div>
                              ) : stage.type === 'career' ? (
                                <div className="text-green-600 font-bold text-sm">
                                  +{formatPay(stage.annualAmount)}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {stage.type !== 'retirement' && (
                            <div className="text-xs text-ds-slate-muted mt-1">
                              Cumulative: <span className={stage.cumulative >= 0 ? 'text-green-600' : 'text-amber-600'}>
                                {stage.cumulative >= 0 ? '' : '-'}{formatPay(Math.abs(stage.cumulative))}
                              </span>
                            </div>
                          )}
                          {stage.type === 'retirement' && (
                            <div className="mt-2 p-2 bg-warm-white rounded border border-sage-muted">
                              <div className="text-xs text-ds-slate-light">Total Lifetime Net</div>
                              <div className={`font-bold ${path.totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPay(path.totalEarnings)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded" />
                  <span className="text-ds-slate-light">Education (Cost)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-warm-white border border-sage-muted rounded" />
                  <span className="text-ds-slate-light">Career (Earnings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sage-muted border border-sage-muted rounded" />
                  <span className="text-ds-slate-light">Retirement</span>
                </div>
              </div>
            </div>

            {/* Summary Comparison Table */}
            <div className="card-warm overflow-hidden mb-8">
              {/* Mobile scroll hint */}
              <div className="md:hidden px-4 py-2 bg-sage-muted text-xs text-ds-slate-light flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swipe to see all columns
              </div>
              <div className="relative">
                {/* Left fade */}
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-warm-white to-transparent pointer-events-none z-10 md:hidden" />
                {/* Right fade */}
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-warm-white to-transparent pointer-events-none z-10 md:hidden" />
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-pale">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-ds-slate-light w-40">
                        Metric
                      </th>
                      {selectedCareers.map((career, index) => (
                        <th
                          key={career.slug}
                          className={`text-center px-4 py-3 ${colorClasses[colors[index]].bgLight}`}
                        >
                          <a
                            href={`/careers/${career.slug}`}
                            className="text-sage hover:underline font-semibold"
                          >
                            {career.title}
                          </a>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {/* Education Cost */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">
                        <div className="group relative inline-block cursor-help">
                          Education Cost
                          <span className="ml-1 text-ds-slate-muted">ⓘ</span>
                          <div className="absolute hidden group-hover:block left-0 top-full mt-1 w-48 p-2 bg-ds-slate text-white text-xs rounded shadow-lg z-10">
                            Initial investment in education - pays off over your career lifetime
                          </div>
                        </div>
                      </td>
                      {careerPaths.map((path, index) => (
                        <td key={path.career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                          <div className="text-xl font-bold text-amber-600">
                            -{formatPay(path.educationCost)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Education Duration */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">Education Time</td>
                      {selectedCareers.map((career, index) => {
                        // Use education_duration (ground truth) if available
                        const years = career.education?.education_duration || career.education?.time_to_job_ready;
                        return (
                          <td key={career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                            <div className="font-semibold">
                              {years ? `${years.min_years}-${years.max_years} years` : 'Varies'}
                            </div>
                            <div className="text-xs text-ds-slate-muted">
                              {career.education?.typical_entry_education}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Median Pay */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">Median Pay</td>
                      {selectedCareers.map((career, index) => (
                        <td key={career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                          <div className="text-xl font-bold text-sage">
                            {formatPay(career.wages?.annual?.median || 0)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* 10-Year Net Earnings */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">
                        10-Year Net
                        <div className="text-xs text-ds-slate-muted font-normal">After education costs</div>
                      </td>
                      {careerPaths.map((path, index) => {
                        const timeline = path.career.career_progression?.timeline || [];
                        const tenYearEarnings = timeline
                          .filter(t => t.year < 10)
                          .reduce((sum, t) => sum + t.expected_compensation, 0);
                        const netAmount = tenYearEarnings - path.educationCost;
                        return (
                          <td key={path.career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                            <div className={`text-xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {netAmount >= 0 ? '' : '-'}{formatPay(Math.abs(netAmount))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* 20-Year Net Earnings */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">
                        20-Year Net
                        <div className="text-xs text-ds-slate-muted font-normal">After education costs</div>
                      </td>
                      {careerPaths.map((path, index) => {
                        const timeline = path.career.career_progression?.timeline || [];
                        const twentyYearEarnings = timeline.reduce((sum, t) => sum + t.expected_compensation, 0);
                        const netAmount = twentyYearEarnings - path.educationCost;
                        return (
                          <td key={path.career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                            <div className={`text-xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPay(netAmount)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Lifetime Net */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">
                        Lifetime Net (to 65)
                        <div className="text-xs text-ds-slate-muted font-normal">After education costs</div>
                      </td>
                      {careerPaths.map((path, index) => (
                        <td key={path.career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                          <div className="text-xl font-bold text-green-600">
                            {formatPay(path.totalEarnings)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* AI Resilience */}
                    <tr>
                      <td className="px-4 py-4 font-medium text-ds-slate">AI Resilience</td>
                      {selectedCareers.map((career, index) => {
                        const classification = career.ai_resilience as AIResilienceClassification | undefined;
                        return (
                          <td key={career.slug} className={`text-center px-4 py-4 ${colorClasses[colors[index]].bgLight} bg-opacity-50`}>
                            {classification ? (
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getAIResilienceColor(classification)}`}>
                                <span>{getAIResilienceEmoji(classification)}</span>
                                <span>{classification}</span>
                              </span>
                            ) : (
                              <span className="text-secondary-400 text-sm">Assessment pending</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ARCHIVED: National Importance row removed - see data/archived/importance-scores-backup.json */}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            {/* Key Insights - only show when comparing 2+ careers */}
            {selectedCareers.length >= 2 && (
            <div className="card-warm p-6">
              <h2 className="font-display text-xl font-semibold text-ds-slate mb-4">Key Insights</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Highest Lifetime Net - PRIMARY INSIGHT */}
                <div className="bg-green-50 rounded-lg p-4 ring-2 ring-green-200">
                  <div className="text-sm text-green-700 mb-1 font-semibold">Highest Lifetime Net</div>
                  {(() => {
                    const best = careerPaths.reduce((b, p) => p.totalEarnings > b.totalEarnings ? p : b);
                    const second = careerPaths.filter(p => p !== best).reduce((b, p) => p.totalEarnings > b.totalEarnings ? p : b, { totalEarnings: 0, career: { slug: '', title: '' } });
                    const diff = best.totalEarnings - second.totalEarnings;
                    return (
                      <>
                        <a href={`/careers/${best.career.slug}`} className="font-bold text-green-800 hover:underline block text-lg">
                          {best.career.title}
                        </a>
                        <div className="text-sm text-green-600 font-medium">
                          {formatPay(best.totalEarnings)}
                        </div>
                        {second.career.title && diff > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            +{formatPay(diff)} vs. next best
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Best ROI (Earnings vs. Education Cost) */}
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="text-sm text-emerald-700 mb-1">Best ROI (Earnings vs. Education Cost)</div>
                  {(() => {
                    const withROI = careerPaths.map(p => {
                      const timeline = p.career.career_progression?.timeline || [];
                      const totalEarnings = timeline.reduce((sum, t) => sum + t.expected_compensation, 0);
                      const cost = p.educationCost || 1;
                      const roi = Math.round(((totalEarnings - cost) / Math.max(cost, 1)) * 100);
                      return { path: p, roi, totalEarnings, cost };
                    });
                    const best = withROI.reduce((b, curr) => curr.roi > b.roi ? curr : b);
                    return (
                      <>
                        <a href={`/careers/${best.path.career.slug}`} className="font-bold text-emerald-800 hover:underline block">
                          {best.path.career.title}
                        </a>
                        <div className="text-sm text-emerald-600">
                          {best.roi.toLocaleString()}% return on education
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Fastest to Positive (Break-even) */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="text-sm text-cyan-700 mb-1">Fastest to Positive</div>
                  {(() => {
                    const withBreakeven = careerPaths.map(p => {
                      const timeline = p.career.career_progression?.timeline || [];
                      let cumulative = -p.educationCost;
                      let breakEvenYear = -1;
                      for (let year = 0; year < timeline.length; year++) {
                        cumulative += timeline[year]?.expected_compensation || 0;
                        if (cumulative >= 0 && breakEvenYear === -1) {
                          breakEvenYear = year + 1;
                          break;
                        }
                      }
                      // If never breaks even in timeline, estimate
                      if (breakEvenYear === -1 && timeline.length > 0) {
                        const avgSalary = timeline.reduce((sum, t) => sum + t.expected_compensation, 0) / timeline.length;
                        breakEvenYear = Math.ceil(p.educationCost / avgSalary);
                      }
                      return { path: p, breakEvenYear };
                    });
                    const best = withBreakeven.reduce((b, curr) =>
                      (curr.breakEvenYear > 0 && (b.breakEvenYear < 0 || curr.breakEvenYear < b.breakEvenYear)) ? curr : b
                    );
                    return (
                      <>
                        <a href={`/careers/${best.path.career.slug}`} className="font-bold text-cyan-800 hover:underline block">
                          {best.path.career.title}
                        </a>
                        <div className="text-sm text-cyan-600">
                          Breaks even in ~{best.breakEvenYear} year{best.breakEvenYear !== 1 ? 's' : ''}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Lowest Education Cost */}
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-700 mb-1">Lowest Education Cost</div>
                  {(() => {
                    const best = careerPaths.reduce((b, p) => p.educationCost < b.educationCost ? p : b);
                    return (
                      <a href={`/careers/${best.career.slug}`} className="font-bold text-amber-800 hover:underline block">
                        {best.career.title}
                      </a>
                    );
                  })()}
                  <div className="text-sm text-amber-600">
                    {formatPay(Math.min(...careerPaths.map(p => p.educationCost)))}
                  </div>
                </div>

                {/* Fastest to Start */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-700 mb-1">Fastest to Start</div>
                  {(() => {
                    const best = selectedCareers.reduce((b, c) => (c.education?.time_to_job_ready?.typical_years || 10) < (b.education?.time_to_job_ready?.typical_years || 10) ? c : b);
                    const years = best.education?.time_to_job_ready?.typical_years;
                    return (
                      <>
                        <a href={`/careers/${best.slug}`} className="font-bold text-purple-800 hover:underline block">
                          {best.title}
                        </a>
                        {years && (
                          <div className="text-sm text-purple-600">
                            {years} year{years !== 1 ? 's' : ''} to job-ready
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Most AI-Resilient */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 mb-1">Most AI-Resilient</div>
                  {(() => {
                    // Lower tier = more resilient (1=Resilient, 4=High Risk)
                    const best = selectedCareers.reduce((b, c) => (c.ai_resilience_tier || 4) < (b.ai_resilience_tier || 4) ? c : b);
                    const classification = best.ai_resilience as AIResilienceClassification | undefined;
                    return (
                      <>
                        <a href={`/careers/${best.slug}`} className="font-bold text-blue-800 hover:underline block">
                          {best.title}
                        </a>
                        {classification && (
                          <span className="text-xs text-blue-600">
                            {getAIResilienceEmoji(classification)} {classification}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            )}
          </>
        )}

        {selectedCareers.length < 1 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-ds-slate mb-2">
              Select a career to visualize
            </h3>
            <p className="text-ds-slate-light">
              Use the search above to add 1-3 careers and see their lifetime earnings trajectory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sage-pale">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-10 bg-secondary-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-secondary-200 rounded w-2/3 mb-8" />
              <div className="h-64 bg-secondary-200 rounded mb-8" />
              <div className="h-96 bg-secondary-200 rounded" />
            </div>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
