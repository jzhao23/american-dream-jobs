# Stashed Authentication Code

## Status: DISABLED for Alpha Launch

## Stashed Date: January 29, 2026

## Reason

For alpha launch, we are using local storage only to eliminate security risks associated with server-side user data storage. User accounts and server-side storage will be reconsidered post-alpha after completing a full security audit.

### Why This Decision Was Made

1. **Security First**: Storing user data on servers introduces security risks that require extensive auditing
2. **Privacy Focus**: Local-only storage ensures user data never leaves their device
3. **Simplified Architecture**: No authentication reduces complexity and potential attack surface
4. **Faster Launch**: We can launch sooner without waiting for security audits

### What Users Get Instead

- Career Compass results saved locally in browser
- Resume text stored locally (never uploaded to servers)
- Preferences persisted across sessions
- One-click data clearing for privacy

## Files Stashed

### Core Auth Files
- `auth-context.tsx` - React context for auth state management
- `supabase-browser.ts` - Browser-side Supabase client

### Components
- `components/AuthModal.tsx` - Sign-in/sign-up modal
- `components/UserMenu.tsx` - Authenticated user dropdown menu
- `components/ResumeManager.tsx` - Resume management for authenticated users

### Pages
- `pages/confirm/page.tsx` - Email confirmation page
- `pages/reset-password/page.tsx` - Password reset page

### API Routes
- `api/sync-profile/route.ts` - Create/link user profile after auth
- `api/migrate-anonymous-data/route.ts` - Link anonymous data to user

## Reactivation Checklist

Before re-enabling authentication, complete the following:

### Security Audit
- [ ] Review all Supabase RLS (Row Level Security) policies
- [ ] Audit database access patterns and permissions
- [ ] Check for SQL injection vulnerabilities
- [ ] Review all API endpoints for authorization
- [ ] Penetration test authentication flows
- [ ] Test session management and token refresh
- [ ] Verify password requirements meet security standards
- [ ] Test password reset flow for vulnerabilities

### Privacy & Compliance
- [ ] Update Privacy Policy for data collection
- [ ] Implement data retention policy
- [ ] Add data export functionality (GDPR)
- [ ] Add data deletion functionality (GDPR right to be forgotten)
- [ ] Review CCPA compliance if applicable
- [ ] Document all data collected and purpose

### Technical Requirements
- [ ] Add rate limiting to auth endpoints
- [ ] Implement CSRF protection
- [ ] Add audit logging for sensitive operations
- [ ] Set up monitoring for auth failures
- [ ] Configure proper CORS settings
- [ ] Implement proper session timeout
- [ ] Add 2FA option for users

### Testing
- [ ] Unit tests for all auth functions
- [ ] Integration tests for auth flows
- [ ] E2E tests for sign-in/sign-up
- [ ] Load testing for auth endpoints
- [ ] Security scanning (SAST/DAST)

### Documentation
- [ ] Update API documentation
- [ ] Document auth architecture
- [ ] Create runbook for auth incidents
- [ ] Update user documentation

## How to Reactivate

1. Complete all items in the reactivation checklist
2. Copy files from this directory back to their original locations:
   - `auth-context.tsx` -> `src/lib/auth-context.tsx`
   - `supabase-browser.ts` -> `src/lib/supabase-browser.ts`
   - `components/*` -> `src/components/auth/*`
   - `pages/*` -> `src/app/auth/*`
   - `api/*` -> `src/app/api/auth/*`
3. Update `src/app/layout.tsx` to include AuthProvider
4. Update `src/components/Header.tsx` to show sign-in button
5. Remove the disabled stub from API routes
6. Test thoroughly before deploying

## Contact

Questions about this code? Contact the engineering team.

---

**DO NOT IMPORT THESE FILES** - They are preserved for future use only.
