"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Helper: Fetch with timeout to prevent infinite loading
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Types
type TimelineBucket = 'asap' | '6-24-months' | '2-4-years' | 'flexible';
type WizardStep = 'timeline' | 'priorities' | 'environment' | 'industries' | 'resume' | 'review';

interface ParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: { level: string; fields: string[] };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

// Options data
const timelineOptions = [
  { id: "asap" as TimelineBucket, icon: "⚡", title: "ASAP", desc: "Under 6 months" },
  { id: "6-24-months" as TimelineBucket, icon: "📅", title: "6-24 months", desc: "Certifications & programs" },
  { id: "2-4-years" as TimelineBucket, icon: "🎯", title: "2-4 years", desc: "Degrees & apprenticeships" },
  { id: "flexible" as TimelineBucket, icon: "🎓", title: "I can invest longer", desc: "Explore all paths" },
];

const priorityOptions = [
  { id: "earning", label: "Higher earning potential" },
  { id: "balance", label: "Work-life balance" },
  { id: "stability", label: "Job stability & security" },
  { id: "growth", label: "Career growth opportunities" },
  { id: "meaningful", label: "Meaningful / impactful work" },
];

const environmentOptions = [
  { id: "remote", label: "Remote / Work from home" },
  { id: "office", label: "Office-based / Indoor" },
  { id: "fieldwork", label: "Hands-on / Fieldwork / Outdoors" },
  { id: "mixed", label: "Mix of different settings" },
];

const industryOptions = [
  { id: "healthcare", label: "Healthcare" },
  { id: "technology", label: "Technology" },
  { id: "trades", label: "Skilled Trades" },
  { id: "business", label: "Business / Finance" },
  { id: "transportation", label: "Transportation / Logistics" },
  { id: "public-service", label: "Public Service / Government" },
];

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.md,.txt';
const MAX_FILE_SIZE_MB = 5;

export function CareerCompassWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('timeline');
  const [isAnimating, setIsAnimating] = useState(false);

  // Selections
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineBucket | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  // Loading states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step navigation with animation
  const goToStep = useCallback((step: WizardStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 150);
  }, []);

  // Timeline selection
  const handleTimelineSelect = (id: TimelineBucket) => {
    setSelectedTimeline(id);
    goToStep('priorities');
  };

  // Toggle multi-select options
  const toggleOption = (list: string[], setList: (v: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter(x => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  // File handling
  const parseFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setIsParsingFile(true);
    setResumeFile(file);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/compass/parse-file/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to parse file');
      }

      setResumeText(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setResumeFile(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const clearFile = () => {
    setResumeFile(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const hasResume = resumeText.length >= 100;
      let profile: ParsedProfile;

      if (hasResume) {
        // Model A: Analyze resume first
        const analyzeResponse = await fetchWithTimeout('/api/compass/analyze/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: resumeText.trim() })
        }, 30000); // 30s timeout for resume analysis

        const analyzeData = await analyzeResponse.json();
        if (!analyzeData.success) {
          throw new Error(analyzeData.error?.message || 'Failed to analyze resume');
        }
        profile = analyzeData.profile;
      } else {
        // Model B: Minimal profile
        profile = {
          skills: [],
          jobTitles: [],
          education: { level: 'high_school', fields: [] },
          industries: selectedIndustries,
          experienceYears: 0,
          confidence: 0.5
        };
      }

      // Build preference strings from selected options (use labels, not IDs)
      const priorityLabels = selectedPriorities
        .map(id => priorityOptions.find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      const environmentLabels = selectedEnvironments
        .map(id => environmentOptions.find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      const industryLabels = selectedIndustries
        .map(id => industryOptions.find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');

      // Get recommendations
      const recommendResponse = await fetchWithTimeout('/api/compass/recommend/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            skills: profile.skills,
            jobTitles: profile.jobTitles,
            education: profile.education,
            industries: profile.industries,
            experienceYears: profile.experienceYears
          },
          preferences: {
            careerGoals: priorityLabels || 'Career growth, stability, and meaningful work',
            skillsToDevelop: priorityLabels || 'Skills relevant to my career goals',
            workEnvironment: environmentLabels || 'Flexible work environment',
            salaryExpectations: 'Competitive salary matching my experience',
            industryInterests: industryLabels || 'Open to various industries',
            // Pass structured selections for better LLM reasoning
            priorityIds: selectedPriorities,
            environmentIds: selectedEnvironments,
            industryIds: selectedIndustries,
            additionalContext: anythingElse.trim() || undefined
          },
          options: {
            timelineBucket: selectedTimeline || 'flexible',
            model: hasResume ? 'model-a' : 'model-b'
          }
        })
      }, 60000); // 60s timeout for career matching

      const recommendData = await recommendResponse.json();
      if (!recommendData.success) {
        throw new Error(recommendData.error?.message || 'Failed to get recommendations');
      }

      // Validate response structure to prevent crashes
      if (!recommendData.recommendations || !Array.isArray(recommendData.recommendations)) {
        throw new Error('Invalid response: no recommendations returned');
      }
      if (recommendData.recommendations.length === 0) {
        throw new Error('No career matches found. Try adjusting your preferences.');
      }

      // Store and navigate
      sessionStorage.setItem('compass-results', JSON.stringify(recommendData.recommendations));
      sessionStorage.setItem('compass-metadata', JSON.stringify(recommendData.metadata));
      sessionStorage.setItem('compass-profile', JSON.stringify(profile));
      sessionStorage.setItem('compass-submission', JSON.stringify({
        timeline: selectedTimeline,
        priorities: selectedPriorities,
        environments: selectedEnvironments,
        industries: selectedIndustries,
        hasResume,
        anythingElse,
        timestamp: new Date().toISOString(),
      }));

      router.push('/compass-results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      setIsSubmitting(false);
    }
  };

  // Progress indicator
  const getProgressStep = () => {
    if (currentStep === 'timeline') return 0;
    if (['priorities', 'environment', 'industries'].includes(currentStep)) return 1;
    if (currentStep === 'resume') return 2;
    return 3;
  };

  // Checkbox icon
  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div className="bg-warm-white rounded-2xl p-6 md:p-8 shadow-soft">
      {/* Progress indicator - only show after timeline selection */}
      {currentStep !== 'timeline' && (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  step < getProgressStep() ? 'w-2.5 bg-sage' :
                  step === getProgressStep() ? 'w-8 bg-sage' :
                  'w-2.5 bg-sage-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-ds-slate-muted">
            Step {getProgressStep()} of 3
          </p>
        </div>
      )}

      {/* Timeline badge - show after selection */}
      {selectedTimeline && currentStep !== 'timeline' && (
        <div className="flex items-center justify-center gap-2 bg-sage-muted text-sage text-sm font-semibold px-4 py-2 rounded-full mb-4 mx-auto w-fit">
          <span>{timelineOptions.find(t => t.id === selectedTimeline)?.icon}</span>
          <span>{timelineOptions.find(t => t.id === selectedTimeline)?.title}</span>
          <button
            onClick={() => goToStep('timeline')}
            className="text-xs underline opacity-75 hover:opacity-100"
          >
            change
          </button>
        </div>
      )}

      {/* Animated step container */}
      <div className={`transition-all duration-150 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        {/* STEP: Timeline Selection */}
        {currentStep === 'timeline' && (
          <div>
            <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate text-center mb-6">
              How soon do you need to start earning?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {timelineOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTimelineSelect(option.id)}
                  className={`time-option ${selectedTimeline === option.id ? "selected" : ""}`}
                >
                  <div className="text-2xl md:text-3xl mb-2">{option.icon}</div>
                  <div className="font-display font-semibold text-ds-slate text-sm md:text-base mb-1">
                    {option.title}
                  </div>
                  <div className="text-xs md:text-sm text-ds-slate-light">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Priorities */}
        {currentStep === 'priorities' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What matters most to you?
              </h2>
              <p className="text-sm text-ds-slate-light">Select all that apply, or skip to continue</p>
            </div>

            <div className="space-y-3 mb-6">
              {priorityOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleOption(selectedPriorities, setSelectedPriorities, option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedPriorities.includes(option.id)
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedPriorities.includes(option.id)
                      ? 'bg-sage border-sage text-white'
                      : 'border-sage-muted'
                  }`}>
                    {selectedPriorities.includes(option.id) && <CheckIcon />}
                  </div>
                  <span className="font-medium text-ds-slate">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('environment')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('environment')}
                className="btn-sage flex items-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Environment */}
        {currentStep === 'environment' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What work environment suits you?
              </h2>
              <p className="text-sm text-ds-slate-light">Select all that apply, or skip to continue</p>
            </div>

            <div className="space-y-3 mb-6">
              {environmentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleOption(selectedEnvironments, setSelectedEnvironments, option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedEnvironments.includes(option.id)
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedEnvironments.includes(option.id)
                      ? 'bg-sage border-sage text-white'
                      : 'border-sage-muted'
                  }`}>
                    {selectedEnvironments.includes(option.id) && <CheckIcon />}
                  </div>
                  <span className="font-medium text-ds-slate">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('industries')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('industries')}
                className="btn-sage flex items-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Industries */}
        {currentStep === 'industries' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                Which fields interest you?
              </h2>
              <p className="text-sm text-ds-slate-light">Select all that apply, or skip to continue</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {industryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleOption(selectedIndustries, setSelectedIndustries, option.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedIndustries.includes(option.id)
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    selectedIndustries.includes(option.id)
                      ? 'bg-sage border-sage text-white'
                      : 'border-sage-muted'
                  }`}>
                    {selectedIndustries.includes(option.id) && <CheckIcon />}
                  </div>
                  <span className="font-medium text-ds-slate text-sm">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('resume')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('resume')}
                className="btn-sage flex items-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Resume */}
        {currentStep === 'resume' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                Upload your resume (optional)
              </h2>
              <p className="text-sm text-ds-slate-light">Get more personalized recommendations based on your experience</p>
            </div>

            <label
              className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
                resumeFile
                  ? 'border-sage bg-sage-pale border-solid'
                  : 'border-sage-muted bg-cream hover:border-sage-light'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isParsingFile}
              />
              {isParsingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-8 w-8 text-sage" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm text-ds-slate-light">Extracting text...</span>
                </div>
              ) : resumeFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl">✓</div>
                  <span className="font-semibold text-sage">{resumeFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); clearFile(); }}
                    className="text-xs text-terracotta hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl mb-1">📄</div>
                  <span className="font-medium text-ds-slate">Click to upload your resume</span>
                  <span className="text-xs text-ds-slate-muted">PDF, DOC, DOCX, or TXT (max 5MB)</span>
                </div>
              )}
            </label>

            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-6">
              <span>✨</span>
              <span>Resume helps us match your skills to career requirements</span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('review')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip, continue without resume
              </button>
              <button
                onClick={() => goToStep('review')}
                className="btn-sage flex items-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP: Review & Submit */}
        {currentStep === 'review' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                Almost there!
              </h2>
              <p className="text-sm text-ds-slate-light">Review your selections and add any final details</p>
            </div>

            {/* Anything else textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-ds-slate mb-2">
                Anything else we should know? (optional)
              </label>
              <textarea
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                placeholder="e.g., I'm a single parent and need flexible hours... I have experience in a specific field... I'm transitioning from another career..."
                rows={3}
                className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-sm"
              />
            </div>

            {/* Summary */}
            <div className="bg-cream rounded-xl p-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ds-slate-muted mb-3">Your selections</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span>⏱️</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Timeline</div>
                    <div className="font-medium text-ds-slate">{timelineOptions.find(t => t.id === selectedTimeline)?.title || 'Flexible'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>🎯</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Priorities</div>
                    <div className={`font-medium ${selectedPriorities.length ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedPriorities.length ? selectedPriorities.map(p => priorityOptions.find(o => o.id === p)?.label).join(', ') : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>🏢</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Environment</div>
                    <div className={`font-medium ${selectedEnvironments.length ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedEnvironments.length ? selectedEnvironments.map(e => environmentOptions.find(o => o.id === e)?.label).join(', ') : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>💼</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Industries</div>
                    <div className={`font-medium ${selectedIndustries.length ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedIndustries.length ? selectedIndustries.map(i => industryOptions.find(o => o.id === i)?.label).join(', ') : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>📄</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Resume</div>
                    <div className={`font-medium ${resumeFile ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {resumeFile ? resumeFile.name : 'Not uploaded'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model indicator */}
            <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${resumeFile ? 'bg-sage-muted' : 'bg-sage-pale'}`}>
              <span className="text-xl">{resumeFile ? '✨' : '💡'}</span>
              <span className="text-sm text-ds-slate">
                {resumeFile
                  ? <>We&apos;ll use <strong className="text-sage">AI-powered matching</strong> with your resume for personalized results</>
                  : <>We&apos;ll match you with careers based on <strong className="text-sage">your preferences</strong></>
                }
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full px-6 py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-ds-slate-muted text-white cursor-not-allowed'
                  : 'bg-sage text-white hover:bg-sage-light hover:-translate-y-0.5 shadow-soft hover:shadow-hover'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Finding your matches...
                </>
              ) : (
                <>
                  Get My Career Recommendations
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
