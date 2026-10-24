# Production Deployment Guide — NGO Internship Portal

This guide provides a comprehensive, step-by-step walkthrough for deploying the **NGO Internship & Community Engagement Portal (CEP)** to production using **Vercel**, **Supabase**, and **Resend**.

---

## Architecture Overview

```text
Volunteers / NGO Staff (Browser)
              │ HTTPS
              ▼
    ┌──────────────────────┐        ┌─────────────────────────────────┐
    │  Vercel              │──────► │  Supabase                       │
    │  • Next.js 16 Web    │        │  • GoTrue Auth (Sessions)       │
    │  • Edge Proxy Guards │        │  • PostgreSQL 15+ with RLS      │
    │  • Server Routes     │        │  • Storage (Private Résumés &   │
    └──────────┬───────────┘        │    Public Project Attachments)  │
               │                    └─────────────────────────────────┘
               ▼
    ┌──────────────────────┐
    │  Resend              │  Automated Transactional Emails:
    │  • Email Delivery    │  • "Application Received"
    │  • SPF / DKIM signed │  • "Application Decision"
    └──────────────────────┘  • "Project Assignment"
                              • "Admin Team Invitations"
```

---

## Table of Contents

0. [Prerequisites & Accounts](#0-prerequisites--accounts)
1. [Pre-Deployment Verification](#1-pre-deployment-verification)
2. [Create Supabase Project](#2-create-supabase-project)
3. [Execute Database Schema & Storage Buckets](#3-execute-database-schema--storage-buckets)
4. [Configure Supabase Authentication](#4-configure-supabase-authentication)
5. [Retrieve API Credentials](#5-retrieve-api-credentials)
6. [Bootstrap Initial Administrator](#6-bootstrap-initial-administrator)
7. [Configure Transactional Email (Resend)](#7-configure-transactional-email-resend)
8. [Prepare Source Code & Git Repository](#8-prepare-source-code--git-repository)
9. [Deploy to Vercel](#9-deploy-to-vercel)
10. [Configure Production Callback URLs](#10-configure-production-callback-urls)
11. [Optional: Custom Domain Setup](#11-optional-custom-domain-setup)
12. [Production Smoke Test Checklist](#12-production-smoke-test-checklist)
13. [Go-Live Operational Checklist](#13-go-live-operational-checklist)
14. [Routine Maintenance & Updates](#14-routine-maintenance--updates)
15. [Troubleshooting Matrix](#15-troubleshooting-matrix)
16. [Production Environment Variables Reference](#16-production-environment-variables-reference)
17. [Administrative SQL Snippets](#17-administrative-sql-snippets)

---

## 0. Prerequisites & Accounts

Before beginning deployment, ensure the following accounts and local tools are available:

### Accounts Required

| Service | Purpose | Recommended Plan | Sign Up |
| :--- | :--- | :--- | :--- |
| **GitHub** | Version control & CI deployment source | Free / Team | [github.com](https://github.com) |
| **Supabase** | Managed PostgreSQL, Auth & Object Storage | Free / Pro | [supabase.com](https://supabase.com) |
| **Vercel** | Hosting platform for Next.js App Router | Hobby / Pro | [vercel.com](https://vercel.com) |
| **Resend** | Transactional email delivery service | Free / Pro | [resend.com](https://resend.com) |
| **Domain Registrar** | Optional custom domain (e.g. `portal.yourngo.org`) | Any | Any registrar |

> **Security Note:** Create accounts using a shared institutional email address (e.g. `it@yourngo.org`) rather than personal emails, and enable **Two-Factor Authentication (2FA)** across all services.

### Local Tooling Requirements
- **Node.js**: Version `20.9.0` or higher (Node 22 LTS recommended). Verify with:
  ```bash
  node -v
  ```
- **Git**: Version `2.30+`. Verify with:
  ```bash
  git --version
  ```

---

## 1. Pre-Deployment Verification

Verify that all dependencies install cleanly and all automated security and workflow tests pass:

1. Open a terminal in the project root directory.
2. Install dependencies cleanly from the lockfile:
   ```bash
   npm ci
   ```
3. Run the automated test suite:
   ```bash
   npm test
   ```
   **Expected Output:**
   ```text
   Test Files  8 passed (8)
   Tests       82 passed (82)
   ```
   *Do not proceed to deployment if any test fails.*

---

## 2. Create Supabase Project

1. Log in to [supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project** and select your organization.
3. Configure project details:
   - **Name**: `ngo-internship-portal` (or your preferred identifier).
   - **Database Password**: Generate a strong password and save it in your organization password vault.
   - **Region**: Select the geographical region closest to your end users (e.g., `South Asia (Mumbai)` for India).
4. Click **Create new project** and allow 1–2 minutes for provisioning to complete.

---

## 3. Execute Database Schema & Storage Buckets

The schema file sets up tables, column-level security triggers, RLS policies, automated signup hooks, and storage buckets.

1. In the Supabase Dashboard, open **SQL Editor** from the left sidebar and click **New query**.
2. Open the [`supabase/schema.sql`](supabase/schema.sql) file from the project, copy its entire contents, paste it into the SQL Editor, and click **Run**.
3. Verify the message: **"Success. No rows returned"**.

### Schema Integrity Verification

Run the following verification query in the SQL Editor to ensure all security structures were applied:

```sql
SELECT 'functions' AS check_type, string_agg(proname, ', ' ORDER BY proname) AS result
  FROM pg_proc
  WHERE proname IN ('is_admin', 'protect_profile_columns', 'handle_new_user')
UNION ALL
SELECT 'tables without RLS (must be empty)',
       coalesce(string_agg(c.relname, ', '), '(none)')
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
UNION ALL
SELECT 'resumes bucket is private',
       coalesce((SELECT (NOT public)::text FROM storage.buckets WHERE id = 'resumes'), 'MISSING');
```

**Expected Result:**

| check_type | result |
| :--- | :--- |
| `functions` | `handle_new_user, is_admin, protect_profile_columns` |
| `tables without RLS (must be empty)` | `(none)` |
| `resumes bucket is private` | `true` |

---

## 4. Configure Supabase Authentication

### 4.1 Email Confirmations Setting
1. Go to **Authentication** → **Providers** → **Email**.
2. Set **Confirm email** to **OFF**.
   - *Rationale:* Application intake is gated by administrator approval. Enabling Supabase's default confirmation email uses a low-volume shared mailer (approx. 2-3 emails/hour on free tier), which can drop volunteer applications during peak intake.
3. Set **Allow new users to sign up** to **ON**.
4. Click **Save**.

### 4.2 URL Configuration (Initial)
1. Go to **Authentication** → **URL Configuration**.
2. You will configure the final production URL in [Step 10](#10-configure-production-callback-urls) once Vercel provides your deployment domain.

---

## 5. Retrieve API Credentials

In the Supabase Dashboard, navigate to **Project Settings** → **API**. Copy and store the following three values:

| Parameter | Location in Supabase Dashboard | Variable Name | Security Level |
| :--- | :--- | :--- | :--- |
| **Project URL** | Project URL (or Connect button) | `NEXT_PUBLIC_SUPABASE_URL` | Public |
| **Anon / Publishable Key** | Project API Keys → Publishable key (or `anon` public) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client Safe) |
| **Service Role Secret Key** | Project API Keys → Secret key (or `service_role` secret) | `SUPABASE_SERVICE_ROLE_KEY` | **Confidential (Server Only)** |

> ⚠️ **Critical Security Warning:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses all Row-Level Security policies. It is used exclusively on the server for admin invitations and applicant verification. **Never** expose it in client code, commit it to GitHub, or prefix it with `NEXT_PUBLIC_`.

---

## 6. Bootstrap Initial Administrator

Because public registration creates pending volunteer accounts only, the initial administrator account must be created once via administrative access:

1. In Supabase Dashboard, navigate to **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the administrator email (e.g. `director@yourngo.org`) and a temporary strong password.
3. Check **Auto Confirm User**.
4. Click **Create user**.
5. Navigate to **SQL Editor** → **New query**, paste the following snippet (replacing the email), and click **Run**:

```sql
UPDATE public.profiles
SET role               = 'admin',
    application_status = 'approved',
    joinee_id          = 'ADM-' || to_char(NOW(), 'YYYYMMDD') || '-001',
    joined_at          = NOW()
WHERE email = 'director@yourngo.org';
```

Verify that 1 row was updated. This account can now log into the admin dashboard and invite all subsequent team members directly through the web UI.

---

## 7. Configure Transactional Email (Resend)

1. Sign up at [resend.com](https://resend.com).
2. Go to **Domains** → **Add Domain** and enter your organization domain (e.g., `yourngo.org`).
3. Add the required DNS records (TXT, MX, CNAME for DKIM/SPF) at your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy).
4. Click **Verify Domain** in Resend.
5. Navigate to **API Keys** → **Create API Key**.
   - Name: `NGO Portal Production`
   - Permission: Full access or Sending access
   - Copy the API key (starts with `re_...`).
6. Set your verified sender address (e.g., `NGO Portal <noreply@yourngo.org>`).

*(Note: For staging or development without a custom domain, you can test with Resend's default sender `onboarding@resend.dev`, which delivers solely to your registered Resend account email).*

---

## 8. Prepare Source Code & Git Repository

1. Initialize Git in the project root if not already configured:
   ```bash
   git init
   git add .
   ```
2. **Mandatory Secrets Safety Check:** Verify that no local environment files are staged:
   ```bash
   git status
   ```
   Ensure `.env.local` is **not** staged. Only `.env.example` should be tracked by Git.
3. Commit and push to GitHub:
   ```bash
   git commit -m "Production release"
   git branch -M main
   git remote add origin https://github.com/YOUR-ORG/ngo-internship-portal.git
   git push -u origin main
   ```

---

## 9. Deploy to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure the deployment parameters:
   - **Framework Preset**: `Next.js` (auto-detected).
   - **Root Directory**: `./` (default).
   - **Build Command**: `next build` (default).
   - **Output Directory**: `.next` (default).
4. Expand **Environment Variables** and add the following keys for the **Production** environment:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefghijkl.supabase.co` | Project REST endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` or `eyJ...` | Client authentication key |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` or `eyJ...` | Server-side administrative key |
| `RESEND_API_KEY` | `re_123456789...` | Email delivery service key |
| `RESEND_FROM_EMAIL` | `NGO Portal <noreply@yourngo.org>` | Sender email header (no quotes) |
| `NEXT_PUBLIC_NGO_SITE_LATITUDE` | `28.6139` | NGO site latitude for attendance |
| `NEXT_PUBLIC_NGO_SITE_LONGITUDE` | `77.2090` | NGO site longitude for attendance |
| `NEXT_PUBLIC_NGO_GEOFENCE_RADIUS_METERS` | `500` | Attendance radius threshold in meters |

> **Formatting Note:** Enter environment variables in Vercel **without quotation marks**. 

5. Click **Deploy**. The build will execute in approximately 1–2 minutes.
6. When complete, copy your production domain (e.g. `https://ngo-internship-portal.vercel.app`).

---

## 10. Configure Production Callback URLs

Once your deployment domain is active, link it back to Supabase Authentication:

1. In Supabase Dashboard, open **Authentication** → **URL Configuration**:
   - **Site URL**: Enter `https://your-portal.vercel.app` (no trailing slash).
   - **Redirect URLs**: Add:
     ```text
     https://your-portal.vercel.app/accept-invite
     ```
   - Click **Save**.
2. In Vercel, open **Project Settings** → **Environment Variables**:
   - Add `NEXT_PUBLIC_SITE_URL` with value `https://your-portal.vercel.app`.
3. In Vercel, go to **Deployments** → click the three dots on the latest deployment → **Redeploy** (without cache) so the updated `NEXT_PUBLIC_SITE_URL` is baked into the production build.

---

## 11. Optional: Custom Domain Setup

To configure a custom domain (e.g., `portal.yourngo.org`):

1. In Vercel Dashboard, navigate to **Settings** → **Domains** → **Add**.
2. Enter your custom domain and follow the DNS configuration instructions (typically adding a `CNAME` pointing to `cname.vercel-dns.com`).
3. Once DNS propagation completes and Vercel issues an SSL certificate:
   - Update **Supabase** → **Authentication** → **URL Configuration**:
     - Change **Site URL** to `https://portal.yourngo.org`.
     - Update **Redirect URLs** to include `https://portal.yourngo.org/accept-invite`.
   - Update **Vercel** → **Environment Variables**:
     - Change `NEXT_PUBLIC_SITE_URL` to `https://portal.yourngo.org`.
   - Trigger a Redeploy in Vercel.

---

## 12. Production Smoke Test Checklist

Execute this checklist in order. Use a normal browser window for the administrator and an **Incognito / Private window** for the volunteer actions:

| # | Action | Steps to Execute | Expected Behavior |
| :-: | :--- | :--- | :--- |
| **1** | **Live Mode Check** | Open the live site URL. | Header banner displays **"Live Mode"** in green. No demo quick-jump controls are present. |
| **2** | **Admin Sign-In** | Sign in with the bootstrapped admin credentials. | Lands on `/admin/dashboard` with active admin controls. |
| **3** | **Settings Configuration** | In Admin window, navigate to **Settings**, verify details, click **Save**. | Notification indicates "Settings saved successfully". |
| **4** | **Volunteer Intake** | In Incognito window, open `/login`, select **Apply for Internship**, submit with a test PDF résumé. | "Application Submitted" confirmation appears. Email notification received (if Resend configured). |
| **5** | **Login Guard Check** | In Incognito window, attempt to log in using the submitted volunteer account. | Login blocked with: *"Your application is currently under review"*. |
| **6** | **Application Review** | In Admin window, open `/admin/applications`. | New application appears in the queue with status **Pending**. |
| **7** | **Résumé Preview** | Click **View / Download** on the applicant's résumé. | PDF opens securely via a 2-minute expiring signed URL. |
| **8** | **Application Decision** | Click **Approve**. | Application changes to **Approved**; a Joinee ID (e.g. `STU-YYYYMMDD-001`) is generated; approval email dispatched. |
| **9** | **Student Access** | In Incognito window, log in with the approved volunteer account. | Access granted to `/student/dashboard`; profile reflects assigned Joinee ID. |
| **10** | **Route Security Guard** | While signed in as student, manually browse to `/admin/dashboard`. | Server proxy redirects immediately to `/unauthorized` (403). |
| **11** | **Attendance Logging** | As student, open `/student/attendance` and click **Check In**. | Browser prompts for location; check-in timestamp and distance from NGO site are logged. |
| **12** | **Attendance Audit** | As admin, open `/admin/attendance`. | Check-in record appears with coordinates; coordinator can click **Verify**. |
| **13** | **Project Allocation** | As admin, open `/admin/projects`, create a project, and assign the student. | Student dashboard reflects assigned project, supervisor details, and milestones. |
| **14** | **Admin Invitation** | As admin, open `/admin/admins`, invite a secondary email address. | Invitation email dispatched with one-time link to `/accept-invite`. |

---

## 13. Go-Live Operational Checklist

### Security & Access Control
- [ ] Two-factor authentication (2FA) enforced on GitHub, Supabase, Vercel, and Resend accounts.
- [ ] Access to production dashboards shared with at least two authorized organizational personnel.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` stored strictly in Vercel environment variables and internal password manager.
- [ ] A secondary administrator account invited and verified.

### Data Protection & Compliance
- [ ] Backup schedule active: Supabase Pro automated backups enabled or manual exports scheduled for `profiles`, `attendance`, `projects`, and `work_logs`.
- [ ] Storage retention policy defined for the `resumes` bucket.
- [ ] Privacy notice published informing volunteers about data collection (contact details, résumés, attendance GPS pins).

### Monitoring & Operations
- [ ] Vercel Function logs monitored for unexpected runtime errors.
- [ ] Resend delivery logs monitored to verify email deliverability.
- [ ] Supabase project health monitored (ensure free-tier projects are active or upgraded to avoid automatic pausing).

---

## 14. Routine Maintenance & Updates

### Deploying Code Updates
1. Test modifications locally: `npm test && npm run build`.
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Vercel automatically builds and deploys the commit.

### Applying Database Schema Changes
1. Update [`supabase/schema.sql`](supabase/schema.sql).
2. Execute the migration in the Supabase SQL Editor.
3. Deploy application code that utilizes the modified schema.

### Rolling Back a Release
If an unexpected issue occurs in production:
1. Open Vercel Dashboard → **Deployments**.
2. Locate the previous stable deployment.
3. Click the three dots → **Promote to Production** (instant zero-downtime rollback).

---

## 15. Troubleshooting Matrix

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Build fails: "Refusing to build production without Supabase"** | Required Supabase variables are missing from Vercel Production environment. | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel and redeploy. |
| **Banner displays "Connected Mode" instead of "Live Mode"** | Build time environment variables were not available during compilation. | Verify variable names in Vercel, remove any surrounding quotes, and trigger a clean redeploy. |
| **Sign-in error: "User profile not found"** | Database trigger was not in place when user signed up. | Execute [`supabase/schema.sql`](supabase/schema.sql) in SQL Editor and verify `handle_new_user` trigger exists. |
| **PostgreSQL error: "infinite recursion detected in policy"** | Outdated RLS policy directly querying `profiles`. | Re-run the current [`supabase/schema.sql`](supabase/schema.sql) containing the `is_admin()` helper. |
| **Admin Team: "SUPABASE_SERVICE_ROLE_KEY is missing"** | Service role secret key not configured in Vercel. | Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel Environment Variables and redeploy. |
| **Admin invite link error: "Redirect URL not allowed"** | `/accept-invite` path not added to Supabase Redirect URLs. | Add `https://your-domain/accept-invite` to Supabase **Authentication** → **URL Configuration** → **Redirect URLs**. |
| **Application received email not delivered** | Applicant email verification failed or domain unverified in Resend. | Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and verify domain status in Resend Dashboard. |
| **Résumé upload fails with storage error** | File exceeds 5 MB, invalid file format, or `resumes` bucket missing. | Ensure file is PDF/DOC/DOCX under 5 MB. Re-run bucket creation SQL in `schema.sql`. |
| **Attendance check-in reports "Location permission denied"** | Browser location permission blocked or non-HTTPS origin. | Ensure domain is served over HTTPS and allow location access in browser settings. |
| **Portal becomes unreachable after days of inactivity** | Supabase Free tier project automatically paused. | Visit Supabase Dashboard and click **Restore project**. Consider upgrading to Pro for critical deployments. |

---

## 16. Production Environment Variables Reference

| Variable Name | Required? | Exposure | Purpose |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | Supabase project REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | **Server Only** | Supabase secret key for admin invites & server verification |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Client & Server | Canonical public domain URL (no trailing slash) |
| `NEXT_PUBLIC_NGO_SITE_LATITUDE` | Optional | Client & Server | Physical NGO center latitude for attendance verification |
| `NEXT_PUBLIC_NGO_SITE_LONGITUDE` | Optional | Client & Server | Physical NGO center longitude for attendance verification |
| `NEXT_PUBLIC_NGO_GEOFENCE_RADIUS_METERS`| Optional | Client & Server | Geofence threshold radius in meters (default: 500) |
| `RESEND_API_KEY` | Recommended | **Server Only** | API key for transactional email delivery |
| `RESEND_FROM_EMAIL` | Recommended | Server Only | Sender email address header |

---

## 17. Administrative SQL Snippets

Run these queries in **Supabase Dashboard** → **SQL Editor** when manual adjustments are needed:

### Promote a Volunteer to the Intern Track
```sql
UPDATE public.profiles 
SET role = 'intern' 
WHERE email = 'student@example.com';
```

### Manually Approve an Application
```sql
UPDATE public.profiles 
SET application_status = 'approved',
    joinee_id = 'STU-' || to_char(NOW(), 'YYYYMMDD') || '-001',
    joined_at = NOW(),
    reviewed_at = NOW()
WHERE email = 'student@example.com';
```

### List All Active Administrators
```sql
SELECT name, email, invited_at, invite_accepted_at, created_at
FROM public.profiles 
WHERE role = 'admin' 
ORDER BY created_at ASC;
```

### Clear Stale Test Attendance Records
```sql
DELETE FROM public.attendance 
WHERE created_at < NOW() - INTERVAL '30 days';
```
