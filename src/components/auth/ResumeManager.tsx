"use client";

/**
 * Resume Manager Component
 *
 * Allows authenticated users to view, upload, and delete their resume.
 *
 * Features:
 * - Display current resume status (filename, upload date, or "No resume")
 * - Upload new resume (triggers file input, uses existing /api/users/resume endpoint)
 * - Delete resume with confirmation
 * - Loading states during operations
 */

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useAuth } from "@/lib/auth-context";

interface ResumeData {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  version: number;
  createdAt: string;
  hasParsedProfile: boolean;
}

interface ResumeManagerProps {
  onClose?: () => void;
}

export function ResumeManager({ onClose }: ResumeManagerProps) {
  const { userProfileId, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current resume on mount
  useEffect(() => {
    if (userProfileId && isAuthenticated) {
      fetchResume();
    } else {
      setIsLoading(false);
    }
  }, [userProfileId, isAuthenticated]);

  const fetchResume = async () => {
    if (!userProfileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/resume?userId=${userProfileId}`);
      const data = await response.json();

      if (data.success) {
        setResume(data.data);
      } else {
        setError(data.error?.message || "Failed to load resume");
      }
    } catch {
      setError("Failed to load resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfileId) return;

    // Reset file input
    e.target.value = "";

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userProfileId);

      const response = await fetch("/api/users/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Resume uploaded successfully");
        // Refetch to get updated resume data
        await fetchResume();
      } else {
        setError(data.error?.message || "Failed to upload resume");
      }
    } catch {
      setError("Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userProfileId || !resume) return;

    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/users/resume/manage?userId=${userProfileId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        setResume(null);
        setSuccessMessage("Resume deleted successfully");
        setShowDeleteConfirm(false);
      } else {
        setError(data.error?.message || "Failed to delete resume");
      }
    } catch {
      setError("Failed to delete resume");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center text-ds-slate-light">
        Please sign in to manage your resume.
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-ds-slate">
          Your Resume
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-ds-slate-muted hover:text-ds-slate rounded-lg hover:bg-sage-muted transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-sage" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
          {successMessage}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Resume card or empty state */}
          {resume ? (
            <div className="bg-cream rounded-xl p-4 mb-4">
              {/* File icon and info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ds-slate truncate" title={resume.fileName}>
                    {resume.fileName}
                  </p>
                  <p className="text-sm text-ds-slate-light">
                    {formatFileSize(resume.fileSizeBytes)} &middot; Uploaded {formatDate(resume.createdAt)}
                  </p>
                  {resume.version > 1 && (
                    <p className="text-xs text-ds-slate-muted mt-1">
                      Version {resume.version}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-cream rounded-xl p-6 mb-4 text-center">
              <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-ds-slate-light">No resume uploaded</p>
              <p className="text-sm text-ds-slate-muted mt-1">
                Upload a resume to get personalized career recommendations
              </p>
            </div>
          )}

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-700 mb-3">
                Are you sure you want to delete your resume? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-white text-ds-slate text-sm font-medium rounded-lg border border-sage-muted hover:bg-sage-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Upload button */}
            <button
              onClick={handleUploadClick}
              disabled={isUploading || isDeleting}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                isUploading || isDeleting
                  ? "bg-ds-slate-muted text-white cursor-not-allowed"
                  : "bg-sage text-white hover:bg-sage-light"
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {resume ? "Replace Resume" : "Upload Resume"}
                </>
              )}
            </button>

            {/* Delete button (only if resume exists) */}
            {resume && !showDeleteConfirm && (
              <button
                onClick={handleDeleteClick}
                disabled={isUploading || isDeleting}
                className="px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/markdown,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Supported formats hint */}
          <p className="text-xs text-ds-slate-muted mt-3 text-center">
            Supported formats: PDF, Word (.docx), Markdown (.md), Text (.txt)
          </p>
        </>
      )}
    </div>
  );
}
