# Supabase Security Checklist

**Date:** January 29, 2026
**Status:** Alpha Launch - User Data Features Disabled

## Overview

For the alpha launch, we have disabled all server-side user data storage. Supabase is still used for:
- Career embeddings (read-only career data)
- Compass recommendations caching
- Form submissions (newsletter, contribution requests)

User authentication and user data storage are **disabled**.

---

## Current Database Tables

### Tables Still In Use (Alpha)

| Table | Status | Access Level | Purpose |
|-------|--------|--------------|---------|
| `career_embeddings` | ACTIVE | Read-only via API | Vector similarity search |
| `compass_responses` | ACTIVE | Write-only via API | Anonymous responses only |
| `newsletter_subscriptions` | ACTIVE | Write-only | Email subscriptions |
| `contribution_requests` | ACTIVE | Write-only | User contribution requests |
| `support_requests` | ACTIVE | Write-only | Support inquiries |

### Tables NOT Used (Alpha)

| Table | Status | Reason |
|-------|--------|--------|
| `user_profiles` | DISABLED | Auth disabled for alpha |
| `user_resumes` | DISABLED | Resume storage local-only |

---

## Security Lockdown Checklist

### Row Level Security (RLS)

- [x] `career_embeddings` - Public read access (career data is public)
- [x] `compass_responses` - Insert only (no read/update/delete)
- [ ] `user_profiles` - Verify RLS policies (not used, but should be locked)
- [ ] `user_resumes` - Verify RLS policies (not used, but should be locked)
- [x] `newsletter_subscriptions` - Insert only
- [x] `contribution_requests` - Insert only
- [x] `support_requests` - Insert only

### Recommended RLS Policies for Alpha

```sql
-- Lock down user tables (not used in alpha but should be protected)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- No public access to user data
CREATE POLICY "No public access to user_profiles"
ON user_profiles FOR ALL
USING (false);

CREATE POLICY "No public access to user_resumes"
ON user_resumes FOR ALL
USING (false);

-- Career embeddings - public read
CREATE POLICY "Public read access to career_embeddings"
ON career_embeddings FOR SELECT
USING (true);

-- Compass responses - anonymous insert only
CREATE POLICY "Anonymous insert to compass_responses"
ON compass_responses FOR INSERT
WITH CHECK (true);

-- No read/update/delete for compass_responses
CREATE POLICY "No read access to compass_responses"
ON compass_responses FOR SELECT
USING (false);
```

---

## API Key Security

### Environment Variables

| Variable | Exposure | Status |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | NOT USED (auth disabled) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | NOT USED (auth disabled) |
| `SUPABASE_URL` | Server only | ACTIVE |
| `SUPABASE_SERVICE_KEY` | Server only | ACTIVE |
| `SUPABASE_ANON_KEY` | Server only | ACTIVE (fallback) |

### Key Access Permissions

**Anon Key Permissions (RESTRICTED):**
- Should NOT have access to user_profiles
- Should NOT have access to user_resumes
- Should have SELECT on career_embeddings
- Should have INSERT on compass_responses, newsletter_subscriptions, etc.

**Service Key Permissions:**
- Full access (server-side only, never exposed)
- Used for career data operations
- Used for form submission storage

---

## Supabase Storage

### Bucket: `resumes`

| Setting | Current | Recommended |
|---------|---------|-------------|
| Public Access | Disabled | Keep Disabled |
| File Size Limit | 5MB | Keep 5MB |
| Allowed MIME Types | pdf, docx, doc, txt, md | Keep restricted |

**Alpha Status:** NOT USED - Resumes stored locally in browser

---

## Pre-Launch Security Tasks

### Immediate (Before Alpha)

- [ ] Verify RLS policies in Supabase Dashboard
- [ ] Confirm anon key cannot access user tables
- [ ] Test API endpoints return 503 for user routes
- [ ] Verify no PII in server logs
- [ ] Check CORS settings are restrictive

### Before Re-Enabling Auth

- [ ] Full RLS policy audit
- [ ] Penetration testing of auth endpoints
- [ ] Session management review
- [ ] Password policy verification
- [ ] Rate limiting implementation
- [ ] Audit logging setup
- [ ] Data retention policy implementation

---

## Monitoring

### What to Monitor

1. **Failed Authentication Attempts** (when auth is re-enabled)
   - Unusual patterns
   - Brute force attempts
   - Geographic anomalies

2. **API Usage**
   - Rate of 503 responses (user routes)
   - Unexpected access patterns
   - Large data requests

3. **Database Access**
   - Direct table access (should be minimal)
   - Suspicious queries
   - Access to user tables (should be zero during alpha)

---

## Incident Response

### If User Data Exposure Suspected

1. **Immediately:**
   - Revoke all API keys
   - Disable public access to database
   - Notify security team

2. **Investigation:**
   - Review Supabase audit logs
   - Check API access logs
   - Identify scope of exposure

3. **Remediation:**
   - Rotate all credentials
   - Review and update RLS policies
   - Implement additional access controls

### Contact Information

- Security Team: [security@americandreamjobs.org]
- On-Call Engineer: [See internal runbook]

---

## Verification Commands

### Check RLS Status

```sql
-- Check if RLS is enabled on tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### List Policies

```sql
-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### Test Anon Access

```sql
-- Test what anon role can access (run as anon)
SET ROLE anon;
SELECT COUNT(*) FROM user_profiles;  -- Should fail or return 0
SELECT COUNT(*) FROM career_embeddings;  -- Should work
```

---

## Appendix: SQL Scripts

### Lock Down User Tables

```sql
-- Run this to lock down user tables for alpha
BEGIN;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can manage own resumes" ON user_resumes;

-- Create deny-all policies
CREATE POLICY "Deny all access during alpha" ON user_profiles
FOR ALL USING (false);

CREATE POLICY "Deny all access during alpha" ON user_resumes
FOR ALL USING (false);

COMMIT;
```

### Verify Security

```sql
-- Verification queries
SELECT 'user_profiles' as table_name,
       (SELECT COUNT(*) FROM user_profiles) as accessible_rows;
-- Should return 0 or error

SELECT 'user_resumes' as table_name,
       (SELECT COUNT(*) FROM user_resumes) as accessible_rows;
-- Should return 0 or error
```

---

**Last Updated:** January 29, 2026
**Next Review:** Before re-enabling authentication
