"use client";

/**
 * Password Reset Page
 *
 * This page is the callback destination after clicking a password reset link
 * from the email sent by Supabase Auth. It allows users to set a new password.
 *
 * Flow:
 * 1. User clicks reset link in email -> redirected here with hash params
 * 2. Supabase client automatically exchanges the token for a session
 * 3. User enters new password
 * 4. We call updateUser({ password }) to set the new password
 * 5. User is redirected to home page
 */

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, isAuthenticated } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Check if we have a valid recovery session from the URL
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();

      // Supabase automatically handles the URL hash and exchanges it for a session
      // when detectSessionInUrl is true (which it is in our client config)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);
        setIsValidToken(false);
        setError("Invalid or expired reset link. Please request a new one.");
        return;
      }

      if (session) {
        setIsValidToken(true);
      } else {
        // No session means the token was invalid or expired
        setIsValidToken(false);
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await updatePassword(password);

      if (updateError) {
        if (updateError.message.includes("Password should be")) {
          setError("Password must be at least 8 characters");
        } else {
          setError(updateError.message);
        }
      } else {
        setSuccess(true);
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 text-sage" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-ds-slate">Verifying reset link...</span>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-semibold text-ds-slate mb-2">
            Link Expired
          </h1>
          <p className="text-ds-slate-light mb-6">
            {error || "This password reset link is invalid or has expired."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-sage text-white font-semibold rounded-xl hover:bg-sage-light transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-semibold text-ds-slate mb-2">
            Password Updated
          </h1>
          <p className="text-ds-slate-light">
            Your password has been successfully updated. Redirecting you to the home page...
          </p>
        </div>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-xl font-display font-semibold text-ds-slate mb-2">
          Set New Password
        </h1>
        <p className="text-sm text-ds-slate-light mb-6">
          Enter your new password below. Make sure it&apos;s at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-ds-slate mb-1">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-ds-slate placeholder-ds-slate-muted"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-ds-slate mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full px-4 py-3 bg-cream border border-sage-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-ds-slate placeholder-ds-slate-muted"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
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
                Updating password...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
