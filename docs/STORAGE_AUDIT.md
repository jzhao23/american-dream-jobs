# Storage Audit Report

**Date:** January 29, 2026
**Purpose:** Security audit for Alpha Launch - Transition to local-only storage
**Status:** COMPLETED

## Executive Summary

This audit documents all storage-related code in the American Dream Jobs application, identifying components that use server-side storage, authentication, and user data handling. For the alpha launch, we are transitioning to purely local browser storage (localStorage) to eliminate security vulnerabilities associated with server-side user data storage.

---

## 1. Supabase Client Configurations

### Browser Client
**File:** `src/lib/supabase-browser.ts`

```typescript
// Uses public anon key (browser-safe)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Status:** STASHED - Authentication features disabled for alpha
**Action:** File moved to `src/lib/_stashed/auth/supabase-browser.ts`

### Server Client
**File:** `src/lib/compass/supabase.ts`

```typescript
// Uses service key for privileged operations
SUPABASE_URL
SUPABASE_SERVICE_KEY (preferred) or SUPABASE_ANON_KEY (fallback)
```

**Status:** RETAINED - Still needed for Career Compass AI recommendations (read-only career data)
**Action:** No user data operations; only used for career embeddings and recommendations

---

## 2. Authentication-Related Code

### Auth Context
**File:** `src/lib/auth-context.tsx`

**Features:**
- Email/password sign-in/sign-up via Supabase Auth
- Session persistence with localStorage
- Auth modal visibility control
- Profile synchronization with database
- Anonymous-to-authenticated data migration

**Status:** STASHED
**Action:** Moved to `src/lib/_stashed/auth/auth-context.tsx`

### Auth Components
**Directory:** `src/components/auth/`

| File | Purpose | Status |
|------|---------|--------|
| `AuthModal.tsx` | Sign-in/sign-up modal | STASHED |
| `UserMenu.tsx` | Authenticated user dropdown | STASHED |
| `ResumeManager.tsx` | Resume upload/delete for auth users | STASHED |

**Action:** All moved to `src/lib/_stashed/auth/components/`

### Auth Pages
**Directory:** `src/app/auth/`

| File | Purpose | Status |
|------|---------|--------|
| `confirm/page.tsx` | Email confirmation page | STASHED |
| `reset-password/page.tsx` | Password reset page | STASHED |

**Action:** Pages moved to `src/lib/_stashed/auth/pages/`

---

## 3. Database Schemas and Migrations

**Directory:** `supabase/migrations/`

### User-Related Tables

| Table | File | Purpose | Status |
|-------|------|---------|--------|
| `user_profiles` | `20260110_user_data.sql` | User accounts | NOT USED (alpha) |
| `user_resumes` | `20260110_user_data.sql` | Uploaded resumes | NOT USED (alpha) |
| `compass_responses` | `20260110_user_data.sql` | Career Compass results | USED (anonymous only) |

### Auth Integration
**File:** `20260121_auth_integration.sql`

| Function | Purpose | Status |
|----------|---------|--------|
| `get_or_create_user_from_auth()` | Links Supabase Auth to profiles | NOT USED (alpha) |
| `link_anonymous_data_to_user()` | Migrates anonymous data | NOT USED (alpha) |

**Action:** Migrations retained but user tables not accessed during alpha

---

## 4. API Routes Handling User Data

### Auth Routes
**Directory:** `src/app/api/auth/`

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/auth/sync-profile` | POST | Create/link user profile | DISABLED |
| `/api/auth/migrate-anonymous-data` | POST | Link anonymous data to user | DISABLED |

**Action:** Routes return 503 Service Unavailable during alpha

### User Data Routes
**Directory:** `src/app/api/users/`

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/users/profile` | POST, GET | Create/get user profile | DISABLED |
| `/api/users/check` | GET | Check if user exists | DISABLED |
| `/api/users/resume` | POST, GET | Upload/fetch resume | DISABLED |
| `/api/users/resume/text` | GET | Get resume text | DISABLED |
| `/api/users/resume/manage` | GET, DELETE | Resume management | DISABLED |

**Action:** Routes return 503 Service Unavailable during alpha

---

## 5. Storage-Related Utilities

### Existing Resume Storage
**File:** `src/lib/resume-storage.ts`

**Keys Used:**
```typescript
'compass-resume-text'      // Resume content
'compass-resume-filename'  // Original filename
'compass-resume-stored-at' // Timestamp
```

**Status:** REPLACED
**Action:** Integrated into new unified `src/lib/localStorage.ts`

### Session Storage Keys
**File:** `src/components/CareerCompassWizard.tsx`

**Keys Used:**
```typescript
'compass-results'     // Career recommendations
'compass-metadata'    // Processing stats
'compass-profile'     // User profile data
'compass-submission'  // Questionnaire responses
```

**Status:** MIGRATED
**Action:** Now managed by new localStorage system

### Legacy User Session
**File:** `src/components/CareerCompassWizard.tsx`

**Keys Used:**
```typescript
'adjn_user_session'   // Legacy user session data
```

**Status:** REMOVED
**Action:** No longer needed without authentication

---

## 6. Environment Variables

### Supabase Variables

| Variable | Type | Usage | Alpha Status |
|----------|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser client | NOT USED |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser client | NOT USED |
| `SUPABASE_URL` | Private | Server client | RETAINED (career data) |
| `SUPABASE_SERVICE_KEY` | Private | Server operations | RETAINED (career data) |
| `SUPABASE_ANON_KEY` | Private | Server fallback | RETAINED (career data) |

### AI API Variables

| Variable | Usage | Alpha Status |
|----------|-------|--------------|
| `ANTHROPIC_API_KEY` | Claude AI analysis | RETAINED |
| `OPENAI_API_KEY` | Embeddings generation | RETAINED |

---

## 7. New Local Storage System

### Storage Key
```typescript
'american_dream_jobs_data'  // Single unified storage key
```

### Data Structure
```typescript
interface LocalUserData {
  version: number;                        // Schema version for migrations
  careerCompassResults: {
    timestamp: string;
    responses: Record<string, string>;
    recommendations: CareerRecommendation[];
    savedAt: string;
  } | null;
  resumeData: {
    fileName: string;
    uploadedAt: string;
    parsedContent: string | null;
  } | null;
  preferences: {
    location: string;
    trainingTimePreference: string;
  };
  lastVisit: string;
}
```

### Features
- Single unified localStorage key
- JSON stringified storage
- Data versioning for future migrations
- 30-day automatic data expiration
- Size limits enforced (5MB max for resume content)
- Graceful handling when localStorage unavailable (private browsing)

---

## 8. Components Modified

| Component | Changes |
|-----------|---------|
| `Header.tsx` | Sign-in button hidden |
| `CareerCompassWizard.tsx` | Uses local-only storage, removed auth deps |
| `layout.tsx` | AuthProvider replaced with LocalStorageProvider |

---

## 9. Security Considerations

### Data That Is Stored Locally
- Career Compass questionnaire responses
- Career recommendations (cached)
- Resume text content (if uploaded)
- Location preferences

### Data That Is NEVER Stored
- Passwords or credentials
- Payment information
- Personal identifying information (name, address, etc.)
- Data is NEVER sent to our servers for storage

### Privacy Notice
A privacy notice is displayed on all pages using local storage:
> "Your data stays on your device. We do not store any personal information on our servers. Clear your browser data anytime to remove all locally stored information."

---

## 10. Reactivation Checklist

Before re-enabling authentication and server storage:

- [ ] Complete security audit of Supabase RLS policies
- [ ] Penetration test authentication flows
- [ ] Review and update Privacy Policy
- [ ] Implement data retention policy
- [ ] Add rate limiting to auth endpoints
- [ ] Implement CSRF protection
- [ ] Add audit logging for data access
- [ ] Set up security monitoring/alerting
- [ ] Review GDPR/CCPA compliance

---

## Files Summary

### Stashed Files (in `src/lib/_stashed/auth/`)
- `auth-context.tsx`
- `supabase-browser.ts`
- `components/AuthModal.tsx`
- `components/UserMenu.tsx`
- `components/ResumeManager.tsx`
- `pages/confirm/page.tsx`
- `pages/reset-password/page.tsx`

### New Files Created
- `src/lib/localStorage.ts` - Core local storage utilities
- `src/lib/localStorage.test.ts` - Unit tests
- `src/components/PrivacyNotice.tsx` - Privacy notice component
- `src/components/ClearDataButton.tsx` - Data clearing UI
- `docs/STORAGE_AUDIT.md` - This document
- `docs/SUPABASE_SECURITY.md` - Security checklist

### Modified Files
- `src/app/layout.tsx` - Removed AuthProvider, added PrivacyNotice
- `src/components/Header.tsx` - Hidden sign-in button
- `src/components/CareerCompassWizard.tsx` - Local-only storage
- `src/app/api/auth/*/route.ts` - Return 503 during alpha
- `src/app/api/users/*/route.ts` - Return 503 during alpha
