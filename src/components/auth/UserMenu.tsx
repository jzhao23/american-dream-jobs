"use client";

/**
 * User Menu Component
 *
 * Dropdown menu shown when user is authenticated.
 * Displays user email and provides:
 * - Resume management
 * - Sign out functionality
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ResumeManager } from "./ResumeManager";

export function UserMenu() {
  const { user, signOut, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showResumeManager, setShowResumeManager] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowResumeManager(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowResumeManager(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (isLoading || !user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsOpen(false);
    setShowResumeManager(false);
    await signOut();
  };

  const handleManageResume = () => {
    setShowResumeManager(!showResumeManager);
  };

  const handleCloseResumeManager = () => {
    setShowResumeManager(false);
  };

  // Get initials from email for avatar
  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : "?";

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sage-muted transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-sage text-white flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-ds-slate-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-warm-white rounded-xl shadow-lg border border-sage-muted overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-sage-muted">
            <p className="text-sm font-medium text-ds-slate truncate">
              {user.email}
            </p>
            <p className="text-xs text-ds-slate-muted mt-0.5">
              Signed in
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {/* Manage Resume */}
            <button
              onClick={handleManageResume}
              className="w-full px-4 py-2.5 text-left text-sm text-ds-slate hover:bg-sage-muted transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-ds-slate-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Manage Resume
              </div>
              <svg
                className={`w-4 h-4 text-ds-slate-muted transition-transform ${showResumeManager ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Resume Manager (expandable) */}
            {showResumeManager && (
              <div className="border-t border-sage-muted bg-cream/50">
                <ResumeManager onClose={handleCloseResumeManager} />
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-sage-muted my-1" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 text-left text-sm text-ds-slate hover:bg-sage-muted transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-ds-slate-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
