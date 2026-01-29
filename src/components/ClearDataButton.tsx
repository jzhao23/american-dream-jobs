"use client";

/**
 * Clear Data Button Component
 *
 * Provides a button that allows users to clear all locally stored data.
 * Includes a confirmation dialog to prevent accidental data loss.
 */

import { useState } from "react";
import { clearAllLocalData, getStoredDataSummary } from "@/lib/localStorage";

interface ClearDataButtonProps {
  /** Callback when data is cleared */
  onDataCleared?: () => void;
  /** Button variant */
  variant?: "default" | "compact" | "text";
  /** Additional CSS classes */
  className?: string;
}

export function ClearDataButton({
  onDataCleared,
  variant = "default",
  className = "",
}: ClearDataButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    const success = clearAllLocalData();

    setIsClearing(false);
    setShowConfirm(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      onDataCleared?.();
    }
  };

  const dataSummary = getStoredDataSummary();
  const hasData = dataSummary.hasCompassResults || dataSummary.hasResume || dataSummary.hasPreferences;

  // Text variant - minimal link style
  if (variant === "text") {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!hasData || showSuccess}
          className={`text-sm text-ds-slate-muted hover:text-terracotta underline disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {showSuccess ? "Data cleared" : "Clear my data"}
        </button>

        {showConfirm && (
          <ConfirmDialog
            onConfirm={handleClear}
            onCancel={() => setShowConfirm(false)}
            isClearing={isClearing}
          />
        )}
      </>
    );
  }

  // Compact variant - small button
  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!hasData || showSuccess}
          className={`text-sm px-3 py-1.5 rounded-lg border border-terracotta/30 text-terracotta hover:bg-terracotta/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {showSuccess ? (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cleared
            </span>
          ) : (
            "Clear data"
          )}
        </button>

        {showConfirm && (
          <ConfirmDialog
            onConfirm={handleClear}
            onCancel={() => setShowConfirm(false)}
            isClearing={isClearing}
          />
        )}
      </>
    );
  }

  // Default variant - full button with icon
  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!hasData || showSuccess}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-terracotta/30 text-terracotta hover:bg-terracotta/10 hover:border-terracotta/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {showSuccess ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Data cleared</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-medium">Clear my data</span>
          </>
        )}
      </button>

      {showConfirm && (
        <ConfirmDialog
          onConfirm={handleClear}
          onCancel={() => setShowConfirm(false)}
          isClearing={isClearing}
        />
      )}
    </>
  );
}

// Confirmation dialog component
function ConfirmDialog({
  onConfirm,
  onCancel,
  isClearing,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isClearing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-warm-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-ds-slate mb-1">
              Clear all your data?
            </h3>
            <p className="text-sm text-ds-slate-light">
              This will permanently delete your Career Compass results, saved resume, and preferences from this browser. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isClearing}
            className="flex-1 px-4 py-2.5 rounded-xl border border-sage-muted text-ds-slate font-medium hover:bg-sage-muted/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Clearing...
              </>
            ) : (
              "Yes, clear data"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
