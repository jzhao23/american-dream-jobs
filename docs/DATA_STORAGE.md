# Data Storage Architecture

This document describes how user data is stored and managed in production (Vercel + Supabase).

## Overview

All persistent data is stored in **Supabase**, which provides:
- **PostgreSQL Database** - Structured data (user profiles, form submissions, cache)
- **Object Storage** - File storage (resume uploads)

## Database Tables

### User Management

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `user_profiles` | Core user identity | email, location, tc_accepted_at |
| `user_resumes` | Resume metadata & parsed content | file_name, storage_path, extracted_text, parsed_profile |
| `compass_responses` | Career Compass questionnaire | training_willingness, education_level, work_background, recommendations |

### Form Submissions

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `email_subscriptions` | Newsletter signups | email, persona, verified, unsubscribed_at |
| `career_contributions` | User-submitted content | submission_type, content, contributor_email, status |
| `career_requests` | New career requests | career_title, reason, vote_count, status |

### Caching

| Table | Purpose | TTL |
|-------|---------|-----|
| `job_search_cache` | Cached job search results | 24 hours |
| `user_profile_embeddings` | Cached user profile vectors | 24 hours |
| `recommendation_cache` | Cached career recommendations | 24 hours |

## File Storage

### Resume Storage

- **Bucket**: `resumes`
- **Path Format**: `{userId}/{timestamp}_{sanitized_filename}`
- **Supported Types**: PDF, DOCX, DOC, TXT, MD
- **Max Size**: 5MB
- **Access**: Signed URLs with 1-hour expiry

## API Routes & Database Operations

| Route | Database Operation | Table(s) |
|-------|-------------------|----------|
| `POST /api/subscribe` | `createSubscription()` | email_subscriptions |
| `POST /api/contribute` | `createContribution()` | career_contributions |
| `POST /api/request` | `createOrVoteCareerRequest()` | career_requests |
| `POST /api/users/profile` | `getOrCreateUser()` | user_profiles |
| `POST /api/users/resume` | `uploadResume()` | user_resumes + Storage |

## Database Helper Files

```
src/lib/db/
├── index.ts           # Central exports
├── users.ts           # User profile operations
├── resumes.ts         # Resume upload/download
├── compass.ts         # Career Compass responses
├── job-search.ts      # Job search cache & history
├── subscriptions.ts   # Email subscriptions
├── contributions.ts   # Career contributions
└── career-requests.ts # Career requests
```

## GDPR Compliance

### Soft Deletes
All tables with user data support soft deletion via `deleted_at` column:
- Data is marked as deleted but retained for audit
- Email addresses are anonymized to `deleted_{id}@deleted.local`

### Hard Deletes
For complete data removal:
- `permanentlyDeleteResume()` - Removes file from storage + DB record
- `deleteAllUserResumes()` - Bulk resume deletion
- `gdpr_delete_by_email()` - SQL function to anonymize all user data by email

### Privacy Measures
- IP addresses are hashed (not stored raw) for rate limiting
- Signed URLs expire after 1 hour
- Resume text extraction stored server-side only

## Environment Variables

Required for production:

```env
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
SUPABASE_ANON_KEY=sb_publishable_...
IP_SALT=<random-string-for-ip-hashing>
```

## Graceful Degradation

All database operations include graceful degradation:
- If Supabase is unavailable, API routes log data and return success
- Job search still works (without caching)
- User experience is not interrupted

Example pattern:
```typescript
try {
  await createSubscription({ email, persona });
} catch (dbError) {
  console.error("Database error (graceful degradation):", dbError);
  console.log("Data logged (no persistence):", data);
  return NextResponse.json({ success: true });
}
```

## Migration Files

Located in `supabase/migrations/`:

| File | Tables Created |
|------|---------------|
| `20260104_career_compass_embeddings.sql` | career_embeddings, dwa_embeddings |
| `20260108_add_consolidation_fields.sql` | Consolidation fields for embeddings |
| `20260109_form_submissions.sql` | email_subscriptions, career_contributions, career_requests |
| `20260110_user_data.sql` | user_profiles, user_resumes, compass_responses, job_search_* |

## Applying Migrations

### Via Supabase Dashboard
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of migration file
3. Execute the SQL

### Via Supabase CLI
```bash
supabase db push
```

## Testing Storage

### Test Email Subscription
```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "persona": "student"}'
```

### Verify in Supabase
```sql
SELECT * FROM email_subscriptions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM career_contributions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM career_requests ORDER BY created_at DESC LIMIT 5;
```
