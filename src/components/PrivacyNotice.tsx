"use client";

/**
 * Privacy Notice Component
 *
 * Displays a notice informing users that their data is stored locally
 * in their browser and is never sent to our servers.
 *
 * This component should be displayed on pages that use localStorage
 * to store user data (Career Compass, etc.)
 */

import { useState, useEffect } from "react";
import { getStoredDataSummary, isStorageAvailable } from "@/lib/localStorage";

interface PrivacyNoticeProps {
  /** Whether to show a compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function PrivacyNotice({ compact = false, className = "" }: PrivacyNoticeProps) {
  const [dataSummary, setDataSummary] = useState<ReturnType<typeof getStoredDataSummary> | null>(null);
  const [isStorageOk, setIsStorageOk] = useState(true);

  useEffect(() => {
    setIsStorageOk(isStorageAvailable());
    if (isStorageAvailable()) {
      setDataSummary(getStoredDataSummary());
    }
  }, []);

  if (!isStorageOk) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Private browsing mode detected
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Your data cannot be saved between sessions. Switch to regular browsing to save your progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm text-ds-slate-muted ${className}`}>
        <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Your data stays on your device</span>
      </div>
    );
  }

  return (
    <div className={`bg-sage-pale border border-sage-muted rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm text-sage font-medium">
            Your privacy matters
          </p>
          <p className="text-sm text-ds-slate-light mt-1">
            Your data stays on your device. We do not store any personal information on our servers.
            Clear your browser data anytime to remove all locally stored information.
          </p>
          {dataSummary && (dataSummary.hasCompassResults || dataSummary.hasResume || dataSummary.hasPreferences) && (
            <div className="mt-3 pt-3 border-t border-sage-muted">
              <p className="text-xs text-ds-slate-muted font-medium mb-2">Data stored on this device:</p>
              <ul className="text-xs text-ds-slate-muted space-y-1">
                {dataSummary.hasCompassResults && (
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-sage" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Career Compass results
                  </li>
                )}
                {dataSummary.hasResume && (
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-sage" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Resume text (parsed content only)
                  </li>
                )}
                {dataSummary.hasPreferences && (
                  <li className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-sage" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Location and preferences
                  </li>
                )}
              </ul>
              {dataSummary.dataAge !== null && dataSummary.dataAge > 0 && (
                <p className="text-xs text-ds-slate-muted mt-2">
                  Data stored {dataSummary.dataAge} day{dataSummary.dataAge !== 1 ? "s" : ""} ago
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
