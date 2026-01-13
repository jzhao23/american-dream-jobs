"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/lib/location-context";

// localStorage key for user session (shared with FindJobsModal)
const USER_SESSION_KEY = 'adjn_user_session';

interface StoredUserSession {
  email: string;
  userId: string;
  hasResume: boolean;
}

interface ExistingResumeData {
  resumeText: string;
  metadata: {
    resumeId: string;
    fileName: string;
    fileType: string;
    textLength: number;
    uploadedAt: string;
  };
}

// Helper: Load user session from localStorage
function loadUserSession(): StoredUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(USER_SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email && parsed.userId) {
        return {
          email: parsed.email,
          userId: parsed.userId,
          hasResume: parsed.hasResume || false,
        };
      }
    }
  } catch {
    console.warn('Failed to load user session');
  }
  return null;
}

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
type TrainingLevel = 'minimal' | 'short-term' | 'medium' | 'significant';
type EducationLevel = 'high-school' | 'some-college' | 'bachelors' | 'masters-plus';
type SalaryTarget = 'under-40k' | '40-60k' | '60-80k' | '80-100k' | '100k-plus';
type WizardStep = 'training' | 'education' | 'background' | 'salary' | 'workStyle' | 'location' | 'resume' | 'review';

interface ParsedProfile {
  skills: string[];
  jobTitles: string[];
  education: { level: string; fields: string[] };
  industries: string[];
  experienceYears: number;
  confidence: number;
}

// Options data - Q1: Training Willingness (framed as "how soon do you need to earn?")
const trainingOptions = [
  { id: "minimal" as TrainingLevel, icon: "⚡", title: "Right away", desc: "Minimal training — a few weeks max" },
  { id: "short-term" as TrainingLevel, icon: "📅", title: "Within 6 months", desc: "Short program — certificate or bootcamp" },
  { id: "medium" as TrainingLevel, icon: "📚", title: "1-2 years", desc: "Moderate training — Associate's or technical program" },
  { id: "significant" as TrainingLevel, icon: "🎓", title: "I can invest 4+ years", desc: "Significant training — Bachelor's, Master's, or beyond" },
];

// Q2: Education Level
const educationOptions = [
  { id: "high-school" as EducationLevel, label: "High school diploma or GED" },
  { id: "some-college" as EducationLevel, label: "Some college or Associate's degree" },
  { id: "bachelors" as EducationLevel, label: "Bachelor's degree" },
  { id: "masters-plus" as EducationLevel, label: "Master's degree or higher" },
];

// Q3: Work Background
const workBackgroundOptions = [
  { id: "none", label: "No significant work experience" },
  { id: "service", label: "Service, Retail, or Hospitality" },
  { id: "office", label: "Office, Administrative, or Clerical" },
  { id: "technical", label: "Technical, IT, or Engineering" },
  { id: "healthcare", label: "Healthcare or Medical" },
  { id: "trades", label: "Trades, Construction, or Manufacturing" },
  { id: "sales", label: "Sales & Marketing" },
  { id: "finance", label: "Business & Finance" },
  { id: "education", label: "Education or Social Services" },
  { id: "creative", label: "Creative, Media, or Design" },
];

// Q4: Salary Target
const salaryOptions = [
  { id: "under-40k" as SalaryTarget, label: "Under $40,000" },
  { id: "40-60k" as SalaryTarget, label: "$40,000 - $60,000" },
  { id: "60-80k" as SalaryTarget, label: "$60,000 - $80,000" },
  { id: "80-100k" as SalaryTarget, label: "$80,000 - $100,000" },
  { id: "100k-plus" as SalaryTarget, label: "$100,000+" },
];

// Q5: Work Style
const workStyleOptions = [
  { id: "hands-on", label: "Hands-on work", desc: "Building, fixing, operating equipment" },
  { id: "people", label: "Working with people", desc: "Caring, teaching, helping, serving" },
  { id: "analytical", label: "Analysis & problem-solving", desc: "Data, research, strategy, systems" },
  { id: "creative", label: "Creative & design", desc: "Art, writing, media, innovation" },
  { id: "technology", label: "Technology & digital", desc: "Coding, IT, systems, software" },
  { id: "leadership", label: "Leadership & business", desc: "Managing, selling, organizing" },
];

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.md,.txt';
const MAX_FILE_SIZE_MB = 5;

export function CareerCompassWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { location, setLocation, isLoading: locationLoading } = useLocation();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('training');
  const [isAnimating, setIsAnimating] = useState(false);

  // Selections
  const [selectedTraining, setSelectedTraining] = useState<TrainingLevel | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<EducationLevel | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string[]>([]);
  const [selectedSalary, setSelectedSalary] = useState<SalaryTarget | null>(null);
  const [selectedWorkStyle, setSelectedWorkStyle] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  // Location search state (for wizard step)
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Array<{ code: string; name: string; shortName: string; type: 'msa' | 'state'; states: string[] }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSkipped, setLocationSkipped] = useState(false);

  // Loading states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing resume state (shared between Find Jobs and Career Compass)
  const [userSession, setUserSession] = useState<StoredUserSession | null>(null);
  const [existingResume, setExistingResume] = useState<ExistingResumeData | null>(null);
  const [isLoadingExistingResume, setIsLoadingExistingResume] = useState(false);
  const [useExistingResume, setUseExistingResume] = useState(false);

  // Session ID for tracking and persistence
  const [sessionId] = useState(() => `compass_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Check for existing resume on mount (shared with Find Jobs)
  useEffect(() => {
    const session = loadUserSession();
    if (session) {
      setUserSession(session);

      // If user has a resume in their session, fetch the text
      if (session.hasResume && session.userId) {
        setIsLoadingExistingResume(true);
        fetch(`/api/users/resume/text?userId=${encodeURIComponent(session.userId)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.hasResume && data.data.resumeText) {
              setExistingResume({
                resumeText: data.data.resumeText,
                metadata: data.data.metadata,
              });
              // Pre-select to use existing resume
              setUseExistingResume(true);
              setResumeText(data.data.resumeText);
            }
          })
          .catch(err => {
            console.warn('Failed to fetch existing resume:', err);
          })
          .finally(() => {
            setIsLoadingExistingResume(false);
          });
      }
    }
  }, []);

  // Location search effect
  useEffect(() => {
    if (!locationQuery || locationQuery.length < 2) {
      setLocationResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const response = await fetch(`/api/location/search?q=${encodeURIComponent(locationQuery)}`);
        const data = await response.json();
        if (data.success && data.results) {
          setLocationResults(data.results.slice(0, 6));
        }
      } catch (err) {
        console.error('Location search failed:', err);
      }
      setIsSearchingLocation(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [locationQuery]);

  // Determine if we should show the location step
  const shouldShowLocationStep = !location && !locationSkipped;

  // Step navigation with animation
  const goToStep = useCallback((step: WizardStep) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 150);
  }, []);

  // Training selection
  const handleTrainingSelect = (id: TrainingLevel) => {
    setSelectedTraining(id);
    goToStep('education');
  };

  // Toggle multi-select options
  const toggleOption = (list: string[], setList: (v: string[]) => void, id: string, maxSelect?: number) => {
    if (list.includes(id)) {
      setList(list.filter(x => x !== id));
    } else {
      if (maxSelect && list.length >= maxSelect) {
        // Replace oldest selection
        setList([...list.slice(1), id]);
      } else {
        setList([...list, id]);
      }
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
    setUseExistingResume(false); // Clear existing resume selection when uploading new
    setError(null);

    try {
      // If user has a session, upload to database for persistence (shared with Find Jobs)
      if (userSession?.userId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userSession.userId);

        const response = await fetch('/api/users/resume', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          // Resume saved to database successfully - use the extracted text from response
          setResumeText(data.data.extractedText);

          // Update localStorage to reflect that user now has a resume
          const updatedSession = { ...userSession, hasResume: true };
          try {
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession));
            setUserSession(updatedSession);
          } catch {
            console.warn('Failed to update user session');
          }
        } else {
          throw new Error(data.error?.message || 'Failed to upload resume');
        }
      } else {
        // No user session - just parse the file locally (original behavior)
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
      }
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
    setUseExistingResume(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handler to switch to existing resume
  const useExistingResumeHandler = () => {
    if (existingResume) {
      setUseExistingResume(true);
      setResumeFile(null);
      setResumeText(existingResume.resumeText);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        // Model B: Minimal profile based on questionnaire
        // Map education level from wizard format to API format
        const eduLevelMap: Record<string, string> = {
          'high-school': 'high_school',
          'some-college': 'some_college',
          'bachelors': 'bachelors',
          'masters-plus': 'masters'  // API expects 'masters', not 'masters_plus'
        };
        const eduLevel = eduLevelMap[selectedEducation || 'high-school'] || 'high_school';
        profile = {
          skills: [],
          jobTitles: [],
          education: {
            level: eduLevel,
            fields: []
          },
          industries: [],
          experienceYears: selectedBackground.includes('none') ? 0 : 3,
          confidence: 0.5
        };
      }

      // Build preference labels for display/context
      const backgroundLabels = selectedBackground
        .map(id => workBackgroundOptions.find(o => o.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      const workStyleLabels = selectedWorkStyle
        .map(id => workStyleOptions.find(o => o.id === id)?.label)
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
            // New structured preferences
            trainingWillingness: selectedTraining || 'significant',
            educationLevel: selectedEducation || 'high-school',
            workBackground: selectedBackground,
            salaryTarget: selectedSalary || '40-60k',
            workStyle: selectedWorkStyle,
            // Legacy fields for backward compatibility
            careerGoals: workStyleLabels || 'Career growth and stability',
            workEnvironment: backgroundLabels || 'Flexible',
            additionalContext: anythingElse.trim() || undefined
          },
          options: {
            trainingWillingness: selectedTraining || 'significant',
            model: hasResume ? 'model-a' : 'model-b'
          },
          // Session tracking for persistence
          sessionId,
          locationCode: location?.code,
          locationName: location?.name
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
        training: selectedTraining,
        education: selectedEducation,
        background: selectedBackground,
        salary: selectedSalary,
        workStyle: selectedWorkStyle,
        location: location ? { code: location.code, name: location.name, shortName: location.shortName } : null,
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
    if (currentStep === 'training') return 0;
    if (['education', 'background', 'salary', 'workStyle', 'location'].includes(currentStep)) return 1;
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
      {/* Progress indicator - only show after training selection */}
      {currentStep !== 'training' && (
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

      {/* Response Summary - show all answered/skipped questions */}
      {selectedTraining && currentStep !== 'training' && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {/* Training - always show after selection */}
          <button
            onClick={() => goToStep('training')}
            className="flex items-center gap-1.5 bg-sage-muted text-sage font-semibold px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all"
          >
            <span>{trainingOptions.find(t => t.id === selectedTraining)?.icon}</span>
            <span>{trainingOptions.find(t => t.id === selectedTraining)?.title}</span>
          </button>

          {/* Education - show after that step */}
          {currentStep !== 'education' && (
            <button
              onClick={() => goToStep('education')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all ${
                selectedEducation
                  ? 'bg-sage-muted text-sage font-semibold'
                  : 'bg-gray-100 text-gray-400 font-medium italic'
              }`}
            >
              <span>🎓</span>
              <span>{selectedEducation ? educationOptions.find(e => e.id === selectedEducation)?.label : 'Skipped'}</span>
            </button>
          )}

          {/* Background - show after that step */}
          {['salary', 'workStyle', 'resume', 'review'].includes(currentStep) && (
            <button
              onClick={() => goToStep('background')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all ${
                selectedBackground.length
                  ? 'bg-sage-muted text-sage font-semibold'
                  : 'bg-gray-100 text-gray-400 font-medium italic'
              }`}
            >
              <span>💼</span>
              <span>{selectedBackground.length ? `${selectedBackground.length} backgrounds` : 'Skipped'}</span>
            </button>
          )}

          {/* Salary - show after that step */}
          {['workStyle', 'resume', 'review'].includes(currentStep) && (
            <button
              onClick={() => goToStep('salary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all ${
                selectedSalary
                  ? 'bg-sage-muted text-sage font-semibold'
                  : 'bg-gray-100 text-gray-400 font-medium italic'
              }`}
            >
              <span>💰</span>
              <span>{selectedSalary ? salaryOptions.find(s => s.id === selectedSalary)?.label : 'Skipped'}</span>
            </button>
          )}

          {/* Work Style - show after that step */}
          {['location', 'resume', 'review'].includes(currentStep) && (
            <button
              onClick={() => goToStep('workStyle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all ${
                selectedWorkStyle.length
                  ? 'bg-sage-muted text-sage font-semibold'
                  : 'bg-gray-100 text-gray-400 font-medium italic'
              }`}
            >
              <span>⚡</span>
              <span>{selectedWorkStyle.length ? `${selectedWorkStyle.length} work styles` : 'Skipped'}</span>
            </button>
          )}

          {/* Location - show after that step (only if location step was shown) */}
          {['resume', 'review'].includes(currentStep) && shouldShowLocationStep === false && location && (
            <button
              onClick={() => goToStep('location')}
              className="flex items-center gap-1.5 bg-sage-muted text-sage font-semibold px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all"
            >
              <span>📍</span>
              <span>{location.shortName}</span>
            </button>
          )}

          {/* Resume - show on review */}
          {currentStep === 'review' && (
            <button
              onClick={() => goToStep('resume')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:opacity-80 cursor-pointer transition-all ${
                resumeFile || useExistingResume
                  ? 'bg-sage-muted text-sage font-semibold'
                  : 'bg-gray-100 text-gray-400 font-medium italic'
              }`}
            >
              <span>📄</span>
              <span>{resumeFile ? 'Uploaded' : useExistingResume ? 'Using existing' : 'Skipped'}</span>
            </button>
          )}
        </div>
      )}

      {/* Animated step container */}
      <div className={`transition-all duration-150 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

        {/* STEP: Training Selection */}
        {currentStep === 'training' && (
          <div>
            <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate text-center mb-6">
              How soon do you need to start earning?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {trainingOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTrainingSelect(option.id)}
                  className={`time-option ${selectedTraining === option.id ? "selected" : ""}`}
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

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mt-6">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>
          </div>
        )}

        {/* STEP: Education Level */}
        {currentStep === 'education' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What&apos;s your highest level of education?
              </h2>
              <p className="text-sm text-ds-slate-light">Select one, or skip to continue</p>
            </div>

            <div className="space-y-3 mb-6">
              {educationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedEducation(option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedEducation === option.id
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedEducation === option.id
                      ? 'bg-sage border-sage'
                      : 'border-sage-muted'
                  }`}>
                    {selectedEducation === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium text-ds-slate">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-4">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('background')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('background')}
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

        {/* STEP: Work Background */}
        {currentStep === 'background' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What best describes your work experience?
              </h2>
              <p className="text-sm text-ds-slate-light">Select all that apply, or skip to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {workBackgroundOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleOption(selectedBackground, setSelectedBackground, option.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedBackground.includes(option.id)
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    selectedBackground.includes(option.id)
                      ? 'bg-sage border-sage text-white'
                      : 'border-sage-muted'
                  }`}>
                    {selectedBackground.includes(option.id) && <CheckIcon />}
                  </div>
                  <span className="font-medium text-ds-slate text-sm">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-4">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('salary')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('salary')}
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

        {/* STEP: Salary Target */}
        {currentStep === 'salary' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What annual salary are you targeting?
              </h2>
              <p className="text-sm text-ds-slate-light">Select one, or skip to continue</p>
            </div>

            <div className="space-y-3 mb-6">
              {salaryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedSalary(option.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedSalary === option.id
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedSalary === option.id
                      ? 'bg-sage border-sage'
                      : 'border-sage-muted'
                  }`}>
                    {selectedSalary === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="font-medium text-ds-slate">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-4">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('workStyle')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep('workStyle')}
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

        {/* STEP: Work Style */}
        {currentStep === 'workStyle' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                What type of work appeals to you most?
              </h2>
              <p className="text-sm text-ds-slate-light">Select all that apply, or skip to continue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {workStyleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleOption(selectedWorkStyle, setSelectedWorkStyle, option.id)}
                  className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all ${
                    selectedWorkStyle.includes(option.id)
                      ? 'border-sage bg-sage-pale'
                      : 'border-transparent bg-cream hover:border-sage-light'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedWorkStyle.includes(option.id)
                        ? 'bg-sage border-sage text-white'
                        : 'border-sage-muted'
                    }`}>
                      {selectedWorkStyle.includes(option.id) && <CheckIcon />}
                    </div>
                    <span className="font-medium text-ds-slate text-sm">{option.label}</span>
                  </div>
                  <span className="text-xs text-ds-slate-light pl-8">{option.desc}</span>
                </button>
              ))}
            </div>

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-4">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep(shouldShowLocationStep ? 'location' : 'resume')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                Skip this question
              </button>
              <button
                onClick={() => goToStep(shouldShowLocationStep ? 'location' : 'resume')}
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

        {/* STEP: Location (conditional - only shown if no location set) */}
        {currentStep === 'location' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="font-display text-xl md:text-2xl font-medium text-ds-slate mb-2">
                Where are you looking for work?
              </h2>
              <p className="text-sm text-ds-slate-light">This helps us show you local job data and opportunities</p>
            </div>

            {/* Location search input */}
            <div className="relative mb-4">
              <div className="flex items-center gap-2 bg-cream border border-sage-muted rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-sage focus-within:border-transparent">
                <svg className="w-5 h-5 text-ds-slate-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search city, metro area, or ZIP code..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-ds-slate placeholder-ds-slate-muted"
                />
                {isSearchingLocation && (
                  <svg className="animate-spin h-5 w-5 text-sage" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>

              {/* Search results dropdown */}
              {locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-warm-white border border-sage-muted rounded-xl shadow-lg overflow-hidden">
                  {locationResults.map((result) => (
                    <button
                      key={result.code}
                      onClick={() => {
                        setLocation({
                          code: result.code,
                          name: result.name,
                          shortName: result.shortName,
                          type: result.type,
                          state: result.states[0] || "",
                        }, "manual");
                        setLocationQuery("");
                        setLocationResults([]);
                        goToStep('resume');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-sage-pale transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-ds-slate">{result.shortName}</div>
                        <div className="text-xs text-ds-slate-muted">{result.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular locations */}
            <div className="mb-6">
              <p className="text-xs font-medium text-ds-slate-muted mb-2">Popular areas:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: '35620', name: 'New York-Newark-Jersey City, NY-NJ-PA', shortName: 'New York', state: 'NY', type: 'msa' as const },
                  { code: '31080', name: 'Los Angeles-Long Beach-Anaheim, CA', shortName: 'Los Angeles', state: 'CA', type: 'msa' as const },
                  { code: '16980', name: 'Chicago-Naperville-Elgin, IL-IN-WI', shortName: 'Chicago', state: 'IL', type: 'msa' as const },
                  { code: '19100', name: 'Dallas-Fort Worth-Arlington, TX', shortName: 'Dallas', state: 'TX', type: 'msa' as const },
                  { code: '26420', name: 'Houston-The Woodlands-Sugar Land, TX', shortName: 'Houston', state: 'TX', type: 'msa' as const },
                ].map((loc) => (
                  <button
                    key={loc.code}
                    onClick={() => {
                      setLocation(loc, "manual");
                      goToStep('resume');
                    }}
                    className="px-3 py-1.5 text-sm bg-cream border border-sage-muted rounded-full hover:border-sage hover:bg-sage-pale transition-colors text-ds-slate"
                  >
                    {loc.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Resume prompt */}
            <div className="flex items-center justify-center gap-2 text-sm text-sage mb-4">
              <span>📄</span>
              <button
                onClick={() => goToStep('resume')}
                className="underline hover:no-underline"
              >
                Upload your resume for best results
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button
                onClick={() => {
                  setLocationSkipped(true);
                  goToStep('resume');
                }}
                className="text-sm text-ds-slate-light hover:text-ds-slate"
              >
                Skip, I&apos;ll set this later
              </button>
              <button
                onClick={() => goToStep('resume')}
                disabled={!location}
                className={`btn-sage flex items-center gap-2 ${!location ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                {existingResume ? 'Your resume' : 'Upload your resume'}
              </h2>
              <p className="text-sm text-ds-slate-light mb-2">
                {existingResume
                  ? <>We found your previously uploaded resume. You can use it or upload a new one.</>
                  : <>This step is optional, but <strong className="text-sage">highly recommended</strong></>
                }
              </p>
              {!existingResume && (
                <p className="text-sm text-ds-slate-muted">
                  Resumes typically improve match accuracy by 2-3x by letting us understand your unique skills and experience
                </p>
              )}
            </div>

            {/* Show existing resume option if available */}
            {existingResume && !resumeFile && (
              <div className={`border-2 rounded-xl p-6 mb-4 transition-all ${
                useExistingResume
                  ? 'border-sage bg-sage-pale'
                  : 'border-sage-muted bg-cream'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    useExistingResume ? 'bg-sage border-sage' : 'border-sage-muted'
                  }`}>
                    {useExistingResume && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={useExistingResumeHandler}
                      className="text-left w-full"
                    >
                      <div className="font-semibold text-ds-slate mb-1">Use existing resume</div>
                      <div className="text-sm text-ds-slate-muted">
                        {existingResume.metadata.fileName}
                        <span className="mx-2">•</span>
                        Uploaded {new Date(existingResume.metadata.uploadedAt).toLocaleDateString()}
                      </div>
                    </button>
                    {useExistingResume && (
                      <div className="mt-3 text-sm text-sage flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Your resume will be used for personalized matching
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for existing resume */}
            {isLoadingExistingResume && (
              <div className="border-2 border-sage-muted rounded-xl p-6 mb-4 bg-cream">
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-sage" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm text-ds-slate-muted">Checking for existing resume...</span>
                </div>
              </div>
            )}

            {/* Upload new resume option */}
            <label
              className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4 ${
                resumeFile
                  ? 'border-sage bg-sage-pale border-solid'
                  : existingResume && !useExistingResume
                    ? 'border-sage-muted bg-cream hover:border-sage-light'
                    : existingResume
                      ? 'border-sage-muted bg-warm-white hover:border-sage-light'
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
                  <span className="font-medium text-ds-slate">
                    {existingResume ? 'Or upload a different resume' : 'Click to upload your resume'}
                  </span>
                  <span className="text-xs text-ds-slate-muted">PDF, DOC, DOCX, or TXT (max 5MB)</span>
                </div>
              )}
            </label>

            {!existingResume && !resumeFile && (
              <div className="flex items-center justify-center gap-2 text-sm text-sage mb-6">
                <span>✨</span>
                <span><strong>Pro tip:</strong> Users who upload resumes get significantly more relevant career matches</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-sage-muted">
              <button onClick={() => goToStep('review')} className="text-sm text-ds-slate-light hover:text-ds-slate">
                {resumeText.length > 0 || useExistingResume ? 'Back to review' : 'Skip, continue without resume'}
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
                  <span>📚</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Training</div>
                    <div className="font-medium text-ds-slate">{trainingOptions.find(t => t.id === selectedTraining)?.title || 'Open to anything'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>🎓</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Education</div>
                    <div className={`font-medium ${selectedEducation ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedEducation ? educationOptions.find(e => e.id === selectedEducation)?.label : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>💼</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Work Background</div>
                    <div className={`font-medium ${selectedBackground.length ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedBackground.length ? selectedBackground.map(b => workBackgroundOptions.find(o => o.id === b)?.label).join(', ') : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>💰</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Salary Target</div>
                    <div className={`font-medium ${selectedSalary ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedSalary ? salaryOptions.find(s => s.id === selectedSalary)?.label : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>⚡</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Work Style</div>
                    <div className={`font-medium ${selectedWorkStyle.length ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {selectedWorkStyle.length ? selectedWorkStyle.map(w => workStyleOptions.find(o => o.id === w)?.label).join(', ') : 'Skipped'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>📍</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Location</div>
                    <div className={`font-medium ${location ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {location ? location.name : 'Not set'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span>📄</span>
                  <div>
                    <div className="text-xs text-ds-slate-muted">Resume</div>
                    <div className={`font-medium ${resumeFile || useExistingResume ? 'text-ds-slate' : 'text-ds-slate-muted italic'}`}>
                      {resumeFile
                        ? resumeFile.name
                        : useExistingResume && existingResume
                          ? `${existingResume.metadata.fileName} (previously uploaded)`
                          : 'Not uploaded'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model indicator */}
            <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${resumeFile || useExistingResume ? 'bg-sage-muted' : 'bg-sage-pale'}`}>
              <span className="text-xl">{resumeFile || useExistingResume ? '✨' : '💡'}</span>
              <span className="text-sm text-ds-slate">
                {resumeFile || useExistingResume
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
