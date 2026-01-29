"use client";

/**
 * Authentication Modal
 *
 * Modal component for sign-in and sign-up flows.
 * Uses portal to render at document.body level for proper centering.
 *
 * Features:
 * - Toggle between sign-in and sign-up modes
 * - Email and password inputs
 * - Terms & Conditions checkbox (sign-up only)
 * - Error display and loading states
 */

import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    signIn,
    signUp,
    resetPassword,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tcAccepted, setTcAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "forgot-password">(authModalMode);
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync mode with context when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setError(null);
      setSuccessMessage(null);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTcAccepted(false);
    }
  }, [isAuthModalOpen, authModalMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation for forgot password mode
    if (mode === "forgot-password") {
      if (!email) {
        setError("Please enter your email address");
        return;
      }

      setIsSubmitting(true);
      try {
        const { error: resetError } = await resetPassword(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccessMessage("Check your email for a password reset link");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Validation for sign-in/sign-up
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (mode === "sign-up") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!tcAccepted) {
        setError("Please accept the Terms & Conditions");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        const { error: authError } = await signIn(email, password);
        if (authError) {
          if (authError.message.includes("Invalid login credentials")) {
            setError("Invalid email or password");
          } else {
            setError(authError.message);
          }
        }
      } else {
        // Sign up flow
        const { error: authError, needsEmailConfirmation } = await signUp(email, password);
        if (authError) {
          if (authError.message.includes("User already registered")) {
            setError("An account with this email already exists. Try signing in instead.");
          } else if (authError.message.includes("Password should be")) {
            setError("Password must be at least 8 characters");
          } else {
            setError(authError.message);
          }
        } else if (needsEmailConfirmation) {
          // Show success message for email confirmation
          setSuccessMessage(
            "Account created! Please check your email inbox (and spam folder) for a confirmation link from Supabase. You must confirm your email before you can sign in."
          );
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
    setError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  const goToForgotPassword = () => {
    setMode("forgot-password");
    setError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  const backToSignIn = () => {
    setMode("sign-in");
    setError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  if (!isAuthModalOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAuthModal}
      />

      {/* Modal */}
      <div className="relative bg-warm-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage-muted">
          <h2 className="text-xl font-display font-semibold text-ds-slate">
            {mode === "sign-in" ? "Welcome back" : mode === "sign-up" ? "Create your account" : "Reset your password"}
          </h2>
          <button
            onClick={closeAuthModal}
            className="p-2 text-ds-slate-muted hover:text-ds-slate rounded-lg hover:bg-sage-muted transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-ds-slate-light mb-6">
            {mode === "sign-in"
              ? "Sign in to access your saved resume and career recommendations across devices."
              : mode === "sign-up"
              ? "Create an account to save your resume and career recommendations."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-ds-slate mb-1">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-ds-slate placeholder-ds-slate-muted"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            {/* Password input (not shown in forgot-password mode) */}
            {mode !== "forgot-password" && (
              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-ds-slate mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"}
                  className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-ds-slate placeholder-ds-slate-muted"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  disabled={isSubmitting}
                />
                {mode === "sign-in" && (
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="mt-2 text-sm text-sage hover:underline"
                    disabled={isSubmitting}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {/* Confirm password (sign-up only) */}
            {mode === "sign-up" && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-ds-slate mb-1">
                  Confirm Password
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-ds-slate placeholder-ds-slate-muted"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Terms & Conditions (sign-up only) */}
            {mode === "sign-up" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tcAccepted}
                  onChange={(e) => setTcAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-sage border-sage-muted rounded focus:ring-sage"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-ds-slate-light">
                  I agree to the{" "}
                  <a
                    href="/legal#terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage hover:underline"
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/legal#privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage hover:underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
                {successMessage}
              </div>
            )}

            {/* Submit button (hide if success message shown in forgot-password or sign-up mode) */}
            {!((mode === "forgot-password" || mode === "sign-up") && successMessage) && (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-ds-slate-muted text-white cursor-not-allowed"
                    : "bg-sage text-white hover:bg-sage-light"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === "sign-in" ? "Signing in..." : mode === "sign-up" ? "Creating account..." : "Sending reset link..."}
                  </>
                ) : (
                  mode === "sign-in" ? "Sign In" : mode === "sign-up" ? "Create Account" : "Send Reset Link"
                )}
              </button>
            )}
          </form>

          {/* Toggle mode / Back to sign in */}
          <div className="mt-6 text-center text-sm text-ds-slate-light">
            {mode === "sign-in" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-sage font-medium hover:underline"
                  disabled={isSubmitting}
                >
                  Sign up
                </button>
              </>
            ) : mode === "sign-up" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-sage font-medium hover:underline"
                  disabled={isSubmitting}
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                onClick={backToSignIn}
                className="text-sage font-medium hover:underline"
                disabled={isSubmitting}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
