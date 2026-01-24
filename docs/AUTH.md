# Authentication Architecture

This document describes the authentication system for American Dream Jobs using Supabase Auth.

## Overview

Authentication is **optional** - users can continue using the app anonymously. The benefit of signing in is that resume and Career Compass results persist across sessions and devices.

**Key principle:** No protected routes. Auth is purely for data persistence benefit.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AuthProvider (src/lib/auth-context.tsx)                │    │
│  │  - Manages session state via onAuthStateChange          │    │
│  │  - Provides signIn, signUp, signOut functions           │    │
│  │  - Controls AuthModal visibility                        │    │
│  │  - Syncs user profile with database                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────┐   ┌────────────────┐   ┌────────────────┐  │
│  │  Header.tsx     │   │  AuthModal.tsx │   │  UserMenu.tsx  │  │
│  │  - Sign In btn  │   │  - Sign in/up  │   │  - User email  │  │
│  │  - UserMenu     │   │  - T&C accept  │   │  - Sign out    │  │
│  └─────────────────┘   └────────────────┘   └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Auth                                │
│  - Email/password authentication                                 │
│  - Session management                                            │
│  - JWT tokens                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes                                   │
│  /api/auth/sync-profile       - Link auth user to user_profiles │
│  /api/auth/migrate-anonymous  - Migrate anonymous session data  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database                                     │
│  user_profiles.auth_id → auth.users(id)                         │
│  compass_responses.user_id → user_profiles(id)                  │
│  user_resumes.user_id → user_profiles(id)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Anonymous User
1. Resume stored in localStorage via `storeCompassResume()`
2. Compass results saved with `user_id: null` (session_id only)
3. Can use all features without signing in

#### Authenticated User
1. Resume stored in Supabase (linked to `user_profiles.id`)
2. Compass results saved with `user_id` set
3. Data persists across sessions/devices

#### Anonymous → Authenticated Migration
1. On sign-up/sign-in, check for localStorage data
2. Call `/api/auth/sync-profile` to get/create user profile
3. Call `/api/auth/migrate-anonymous-data` to link `compass_responses` via `session_id`
4. Resume in localStorage is still accessible; authenticated user can upload new one

## Files

### Core Auth Files
- `src/lib/supabase-browser.ts` - Browser-side Supabase client (uses anon key)
- `src/lib/auth-context.tsx` - React context for auth state management
- `src/lib/db/users.ts` - Database operations including auth functions

### UI Components
- `src/components/auth/AuthModal.tsx` - Sign in/sign up/forgot password modal
- `src/components/auth/UserMenu.tsx` - User dropdown with resume management
- `src/components/auth/ResumeManager.tsx` - Resume upload/delete management
- `src/components/Header.tsx` - Contains sign-in button and UserMenu

### Pages
- `src/app/auth/reset-password/page.tsx` - Password reset callback page

### API Routes
- `src/app/api/auth/sync-profile/route.ts` - Sync auth user to user_profiles
- `src/app/api/auth/migrate-anonymous-data/route.ts` - Link anonymous data
- `src/app/api/users/resume/manage/route.ts` - Resume metadata and deletion

### Database
- `supabase/migrations/20260121_auth_integration.sql` - Adds `auth_id` column and functions

## Environment Variables

Required for auth to work:

```bash
# Server-side (already existed)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Browser-side (new - same values, NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Supabase Dashboard Setup

1. **Enable Email Provider**
   - Go to Authentication > Providers
   - Enable "Email" provider
   - Configure email templates as needed

2. **Configure Redirect URLs**
   - Go to Authentication > URL Configuration
   - Add your site URL to "Site URL"
   - Add redirect URLs for confirmation emails

3. **Apply Migration**
   - Run the migration in `supabase/migrations/20260121_auth_integration.sql`
   - This adds `auth_id` column and database functions

## Usage

### In Components

```tsx
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const {
    user,              // Supabase User object or null
    userProfileId,     // Our user_profiles.id or null
    isAuthenticated,   // Boolean
    isLoading,         // Boolean (initial load)
    openAuthModal,     // (mode?: 'sign-in' | 'sign-up') => void
    signOut,           // () => Promise<void>
  } = useAuth();

  if (isAuthenticated) {
    return <p>Welcome, {user?.email}</p>;
  }

  return (
    <button onClick={() => openAuthModal('sign-in')}>
      Sign In
    </button>
  );
}
```

### In API Routes

```ts
import { getOrCreateUserFromAuth, getUserByAuthId } from "@/lib/db/users";

// Link auth user to user_profiles
const result = await getOrCreateUserFromAuth(authId, email);

// Get user profile by auth ID
const user = await getUserByAuthId(authId);
```

## Security Considerations

1. **Anon Key is Safe for Browser**
   - Supabase anon key is designed to be public
   - Row Level Security (RLS) protects data
   - Service key is never exposed to browser

2. **Session Management**
   - Supabase handles JWT refresh automatically
   - Sessions are stored in localStorage by Supabase client
   - `persistSession: true` in client config

3. **No Protected Routes**
   - All routes accessible without auth
   - Auth only affects what data is persisted
   - No server-side auth checks needed for pages

## Password Reset Flow

Users can reset their password through the following flow:

1. Click "Forgot password?" link on the sign-in form
2. Enter email address and submit
3. Receive email with reset link (handled by Supabase)
4. Click link → redirected to `/auth/reset-password`
5. Enter new password (minimum 8 characters)
6. Password updated, user redirected to home

### Components Involved
- `AuthModal.tsx` - "forgot-password" mode for email entry
- `auth-context.tsx` - `resetPassword()` and `updatePassword()` methods
- `reset-password/page.tsx` - Password reset callback page

## Resume Management

Authenticated users can manage their resume through the UserMenu dropdown:

1. Click user avatar in header
2. Click "Manage Resume" to expand
3. View current resume (filename, size, upload date)
4. Upload new resume (replaces existing)
5. Delete resume with confirmation

### Features
- Supports PDF, Word (.docx), Markdown (.md), Text (.txt)
- Maximum file size: 5MB
- Soft delete (deactivates for audit) via API
- Resume persists across sessions/devices

### API Endpoints
- `GET /api/users/resume/manage?userId={id}` - Get resume metadata
- `DELETE /api/users/resume/manage?userId={id}` - Delete active resume
- `POST /api/users/resume` - Upload new resume (existing endpoint)

## Testing

See test files in `test/`:
- `test/api/auth-sync-profile.test.ts` - Profile sync API tests
- `test/api/password-reset.test.ts` - Password reset flow tests
- `test/api/resume-manage.test.ts` - Resume management API tests
- `test/components/resume-manager.test.tsx` - ResumeManager component tests
