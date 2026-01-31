/**
 * Security Middleware for American Dream Jobs
 *
 * Adds security headers to all responses to protect against common attack vectors:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME type sniffing
 * - Information disclosure
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next();

  // Security Headers

  // Prevent XSS attacks by controlling which resources the browser can load
  // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js to work properly
  // In production, consider using nonces for stricter CSP
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com https://serpapi.com https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable browser's XSS protection (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control Referer header to prevent information leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Opt out of FLoC (Google's tracking technology)
  response.headers.set('Permissions-Policy', 'interest-cohort=()');

  // Strict Transport Security (HSTS) - force HTTPS
  // Only enable in production (Vercel handles this automatically but we add it for clarity)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove server identification headers that could reveal technology stack
  response.headers.delete('X-Powered-By');

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
