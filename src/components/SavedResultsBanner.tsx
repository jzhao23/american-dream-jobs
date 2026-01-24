"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// localStorage key for user session (shared with FindJobsModal and CareerCompassWizard)
const USER_SESSION_KEY = 'adjn_user_session';

interface UserSession {
  email: string;
  userId?: string;
}

interface SavedResultsSummary {
  savedAt: string;
  matchCount: number;
  topMatch: string;
  hasResume: boolean;
}

interface SavedResultsBannerProps {
  onStartNew?: () => void;
}

/**
 * Format a relative time string for display
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function SavedResultsBanner({ onStartNew }: SavedResultsBannerProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<SavedResultsSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Check for user session and fetch saved results
    async function checkSavedResults() {
      try {
        // Get user session from localStorage
        const sessionData = localStorage.getItem(USER_SESSION_KEY);
        if (!sessionData) {
          setIsLoading(false);
          return;
        }

        const session: UserSession = JSON.parse(sessionData);
        if (!session.userId) {
          setIsLoading(false);
          return;
        }

        setUserId(session.userId);

        // Fetch saved results summary from API
        const response = await fetch(`/api/compass/saved?userId=${session.userId}&summary=true`);
        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        if (data.hasSavedResults && data.summary) {
          setSummary(data.summary);
          setIsVisible(true);
        }
      } catch (error) {
        console.warn('Failed to check for saved results:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSavedResults();
  }, []);

  const handleViewResults = async () => {
    if (!userId) return;

    try {
      // Fetch full results from API
      const response = await fetch(`/api/compass/saved?userId=${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      if (!data.hasSavedResults || !data.results) return;

      // Restore results to sessionStorage for the results page
      sessionStorage.setItem('compass-results', JSON.stringify(data.results.recommendations));
      sessionStorage.setItem('compass-submission', JSON.stringify(data.results.submission));

      if (data.results.metadata) {
        sessionStorage.setItem('compass-metadata', JSON.stringify(data.results.metadata));
      }
      if (data.results.parsedProfile) {
        sessionStorage.setItem('compass-profile', JSON.stringify(data.results.parsedProfile));
      }

      router.push('/compass-results');
    } catch (error) {
      console.error('Failed to load saved results:', error);
    }
  };

  const handleClearResults = async () => {
    if (!userId || isClearing) return;

    setIsClearing(true);
    try {
      const response = await fetch(`/api/compass/saved?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsVisible(false);
        setSummary(null);
        onStartNew?.();
      }
    } catch (error) {
      console.error('Failed to clear saved results:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Don't render while loading or if no saved results
  if (isLoading || !isVisible || !summary) {
    return null;
  }

  return (
    <div className="bg-sage-pale border border-sage-muted rounded-xl p-4 mb-6 animate-fadeDown">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-sage-muted rounded-full flex items-center justify-center">
          <span className="text-lg">📊</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ds-slate mb-1">
            You have saved results
          </h3>
          <p className="text-sm text-ds-slate-light mb-3">
            Found {summary.matchCount} career matches {formatRelativeTime(summary.savedAt)}.
            {summary.hasResume && " Based on your resume."}
            {" Your top match: "}<span className="font-medium text-sage">{summary.topMatch}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleViewResults}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white font-semibold rounded-lg hover:bg-sage-dark transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View Results
            </button>
            <button
              onClick={handleClearResults}
              disabled={isClearing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-sage text-sage font-semibold rounded-lg hover:bg-sage-muted transition-colors text-sm disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Start Fresh'}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-ds-slate-muted hover:text-ds-slate transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
