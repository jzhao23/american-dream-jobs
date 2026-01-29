"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "@/lib/location-context";
import { JobListing } from "@/lib/jobs/types";
import { getCompassResume } from "@/lib/resume-storage";

// Modal step types - removed 'email' step for alpha launch
type ModalStep = 'location' | 'resume' | 'searching' | 'results' | 'error';

interface FindJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  careerSlug: string;
  careerTitle: string;
  alternateJobTitles?: string[];
}

export function FindJobsModal({
  isOpen,
  onClose,
  careerSlug,
  careerTitle,
  alternateJobTitles
}: FindJobsModalProps) {
  const { location, setLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [step, setStep] = useState<ModalStep>('location');
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Array<{
    code: string;
    name: string;
    shortName: string;
    states: string[];
    type: 'msa' | 'state';
  }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [hasCompassResume, setHasCompassResume] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // Job results
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [displayedCount, setDisplayedCount] = useState<number>(25);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Sorting and filtering
  const [sortBy, setSortBy] = useState<'relevance' | 'salary' | 'date' | 'company'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load saved resume from Career Compass on mount
  useEffect(() => {
    const compassResume = getCompassResume();
    if (compassResume && compassResume.text) {
      setHasCompassResume(true);
      setResumeText(compassResume.text);
    }

    setIsInitialized(true);
  }, []);

  // Determine initial step when modal opens
  useEffect(() => {
    if (isOpen && isInitialized) {
      if (!location) {
        // No location - ask for it first
        setStep('location');
      } else if (!hasCompassResume && !resumeUploaded) {
        // Have location but no resume - prompt for resume
        setStep('resume');
      } else {
        // Have location and resume - go straight to search
        startJobSearch();
      }
    }
  }, [isOpen, isInitialized, location, hasCompassResume, resumeUploaded]);

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
      } catch {
        console.error('Location search failed');
      }
      setIsSearchingLocation(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [locationQuery]);

  // Handle location selection - skip email, go to resume or search
  const handleLocationSelect = useCallback((loc: { code: string; name: string; shortName: string; states: string[]; type: 'msa' | 'state' }) => {
    setLocation({
      code: loc.code,
      name: loc.name,
      shortName: loc.shortName,
      state: loc.type === 'state' ? loc.code : (loc.states[0] || ''),
      type: loc.type
    });
    setLocationQuery('');
    setLocationResults([]);

    // Skip email step - go directly to resume or search
    if (hasCompassResume || resumeUploaded) {
      // Have resume from Career Compass - go to search
      startJobSearch();
    } else {
      // No resume - offer to upload one
      setStep('resume');
    }
  }, [setLocation, hasCompassResume, resumeUploaded]);

  // Handle resume upload (local only - just parse and store text)
  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    setError(null);

    try {
      // Use the parse-file endpoint to extract text (doesn't store on server)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/compass/parse-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResumeText(data.text);
        setResumeUploaded(true);
        await startJobSearch();
      } else {
        setError(data.error?.message || 'Failed to process resume');
      }
    } catch {
      setError('Failed to process resume. Please try again.');
    }

    setIsUploadingResume(false);
  };

  // Handle skip resume
  const handleSkipResume = async () => {
    await startJobSearch();
  };

  // Start job search
  const startJobSearch = async () => {
    if (!location) {
      setError('Location is required');
      return;
    }

    setStep('searching');
    setError(null);

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerSlug,
          careerTitle,
          alternateJobTitles,
          locationCode: location.code,
          locationName: location.shortName,
          // No userId - anonymous search for alpha launch
          limit: 50
        })
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotalResults(data.data.totalResults || data.data.jobs.length);
        setDisplayedCount(25);
        setSearchId(data.data.searchId);
        setIsFromCache(data.data.cached);
        setStep('results');
      } else {
        setError(data.error?.message || 'Failed to search for jobs');
        setStep('error');
      }
    } catch {
      setError('Failed to search for jobs. Please try again.');
      setStep('error');
    }
  };

  // Handle export
  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (jobs.length === 0) return;

    try {
      const response = await fetch('/api/jobs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs,
          careerTitle,
          location: location?.name || 'Unknown',
          format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `jobs.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      console.error('Export failed');
    }
  };

  // Handle Load More
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 25, jobs.length));
      setIsLoadingMore(false);
    }, 300);
  };

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'salary':
        const salaryA = a.salary?.min || 0;
        const salaryB = b.salary?.min || 0;
        comparison = salaryA - salaryB;
        break;
      case 'date':
        comparison = a.postedAt.localeCompare(b.postedAt);
        break;
      case 'company':
        comparison = a.company.localeCompare(b.company);
        break;
      default:
        return 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const displayedJobs = sortedJobs.slice(0, displayedCount);
  const hasMoreJobs = displayedCount < jobs.length;

  // Track if component is mounted (for portal)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Find {careerTitle} Jobs
            </h2>
            {location && (
              <p className="text-sm text-gray-500">
                in {location.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Location Step */}
          {step === 'location' && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Where are you looking for work?
              </h3>
              <p className="text-gray-600 mb-6">
                Enter your city, state, or ZIP code to find jobs near you.
              </p>

              <div className="relative">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="e.g., San Francisco, CA or 94102"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage focus:border-sage"
                />
                {isSearchingLocation && (
                  <div className="absolute right-3 top-3">
                    <div className="w-5 h-5 border-2 border-sage border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {locationResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {locationResults.map((loc) => (
                    <button
                      key={loc.code}
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-gray-900">{loc.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({loc.type.toUpperCase()})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resume Step */}
          {step === 'resume' && (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload your resume (optional)
              </h3>
              <p className="text-gray-600 mb-6">
                Uploading your resume helps us find better job matches for you. You can skip this step if you prefer.
              </p>

              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-sage hover:bg-sage-pale transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.md,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setResumeFile(file);
                        handleResumeUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {isUploadingResume ? (
                    <p className="text-sage font-medium">Processing {resumeFile?.name}...</p>
                  ) : (
                    <>
                      <p className="text-gray-700 font-medium">Click to upload your resume</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, Word, or text file (max 5MB)</p>
                    </>
                  )}
                </div>

                {/* Privacy notice */}
                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Your data is stored locally on your device. We only extract the text for matching—our developers do not have access to your resume.</span>
                </div>

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  onClick={handleSkipResume}
                  disabled={isUploadingResume}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Searching Step */}
          {step === 'searching' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Searching for {careerTitle} jobs...
              </h3>
              <p className="text-gray-600">
                We&apos;re scanning job boards for the best opportunities in {location?.name}.
              </p>
            </div>
          )}

          {/* Results Step */}
          {step === 'results' && (
            <div>
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Showing 1-{Math.min(displayedCount, jobs.length)} of {jobs.length} jobs
                    {isFromCache && ' (from recent search)'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sage focus:border-sage"
                  >
                    <option value="relevance">Sort by Relevance</option>
                    <option value="salary">Sort by Salary</option>
                    <option value="date">Sort by Date</option>
                    <option value="company">Sort by Company</option>
                  </select>

                  {/* Export */}
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              {/* Job List */}
              {jobs.length === 0 ? (
                <div className="text-center py-12 bg-sage-pale rounded-xl border border-sage-muted">
                  <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    0 results found
                  </h4>
                  <p className="text-gray-600 max-w-md mx-auto mb-4">
                    No job listings found for {careerTitle} in {location?.name || 'your area'}. Try expanding your search radius or check back later.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={`/careers/${careerSlug}`}
                      className="inline-flex items-center gap-2 text-sage hover:text-sage-dark font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Learn more about {careerTitle}
                    </a>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Close and try a different search
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-sage hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {job.title}
                          </h4>
                          <p className="text-gray-600">{job.company}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {job.location}
                            </span>
                            {job.salary && (
                              <span className="flex items-center gap-1 text-green-600 font-medium">
                                {formatSalary(job.salary)}
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {job.locationType}
                            </span>
                            <span className="text-gray-400">{job.postedAt}</span>
                          </div>
                        </div>
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark transition-colors"
                        >
                          Apply
                        </a>
                      </div>
                      {job.highlights && job.highlights.length > 0 && (
                        <ul className="mt-3 text-sm text-gray-600 space-y-1">
                          {job.highlights.slice(0, 2).map((highlight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-sage mt-1">•</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-xs text-gray-400">via {job.source}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMoreJobs && jobs.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More ({jobs.length - displayedCount} remaining)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Resume prompt if skipped */}
              {!hasCompassResume && !resumeUploaded && (
                <div className="mt-6 p-4 bg-sage-pale rounded-xl">
                  <p className="text-sage-dark font-medium mb-2">
                    Want better job matches?
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload your resume to get personalized recommendations.
                  </p>
                  <button
                    onClick={() => setStep('resume')}
                    className="text-sm text-sage font-medium hover:underline"
                  >
                    Upload resume now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">
                {error || 'We couldn\'t complete your search. Please try again.'}
              </p>
              <button
                onClick={() => startJobSearch()}
                className="px-6 py-3 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatSalary(salary: JobListing['salary']): string {
  if (!salary) return '';

  const formatNum = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const period = salary.period === 'hour' ? '/hr' : '/yr';

  if (salary.min && salary.max) {
    return `${formatNum(salary.min)} - ${formatNum(salary.max)}${period}`;
  } else if (salary.min) {
    return `${formatNum(salary.min)}+${period}`;
  } else if (salary.max) {
    return `Up to ${formatNum(salary.max)}${period}`;
  }

  return '';
}
