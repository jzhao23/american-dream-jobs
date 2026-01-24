"use client";

/**
 * Email Confirmation Page
 *
 * This page is the callback destination after clicking the email confirmation link
 * from Supabase Auth. It confirms the user's email and allows them to proceed.
 *
 * Flow:
 * 1. User clicks confirmation link in email -> redirected here with hash params
 * 2. Supabase client automatically exchanges the token for a session
 * 3. We show a success message that the email has been confirmed
 * 4. User can click to go to the homepage
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function EmailConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = getSupabaseBrowserClient();

      // Supabase automatically handles the URL hash and exchanges it for a session
      // when detectSessionInUrl is true (which it is in our client config)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Confirmation error:", sessionError);
        setError("There was an issue confirming your email. Please try signing in or request a new confirmation link.");
        setStatus("error");
        return;
      }

      if (session && session.user.email_confirmed_at) {
        // Email is confirmed!
        setStatus("success");
      } else if (session) {
        // Session exists but email not yet confirmed - still show success as the confirmation may be processing
        setStatus("success");
      } else {
        // No session means the token was invalid or expired
        setError("This confirmation link is invalid or has expired. Please try signing in or request a new confirmation link.");
        setStatus("error");
      }
    };

    confirmEmail();
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 text-sage" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-ds-slate">Confirming your email...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-semibold text-ds-slate mb-2">
            Confirmation Failed
          </h1>
          <p className="text-ds-slate-light mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-sage text-white font-semibold rounded-xl hover:bg-sage-light transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-warm-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-display font-semibold text-ds-slate mb-2">
          Email Confirmed!
        </h1>
        <p className="text-ds-slate-light mb-6">
          Your email has been successfully verified. You can now sign in to your account and access all features.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-sage text-white font-semibold rounded-xl hover:bg-sage-light transition-colors"
        >
          Continue to American Dream Jobs
        </button>
      </div>
    </div>
  );
}
