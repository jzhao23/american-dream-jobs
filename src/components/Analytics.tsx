"use client";

import Script from "next/script";

// Optional: Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN for privacy-friendly analytics
// Plausible is cookieless and doesn't collect personal data

export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  // Only load Plausible if configured - no tracking by default
  if (!plausibleDomain) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={plausibleDomain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
