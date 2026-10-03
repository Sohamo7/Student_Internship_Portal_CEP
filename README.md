# 🌟 NGO Internship Portal — Week 1 Foundation

A modern, role-based web application connecting passionate students with meaningful community & NGO internship opportunities.

This repository implements the complete **Week 1 Roadmap: Setting up the Foundation**, including role-based authentication, student and NGO administration dashboards, edge route protection, Supabase schema with Row-Level Security (RLS), and deployment readiness for Vercel.

---

## 🎯 Week 1 Accomplishments

```text
✅ GitHub repository initialized & structured
✅ Next.js 16 (App Router + Turbopack) project running
✅ Supabase connection architecture & database schema with RLS
✅ Profiles table with auto-trigger on registration
✅ Student & Admin role separation (student | admin)
✅ Student registration & unified login
✅ Protected Student Dashboard (/student/dashboard)
✅ Protected NGO Admin Dashboard (/admin/dashboard)
✅ Strict role guard middleware & 403 unauthorized page
✅ Navigation layouts with future milestone placeholders
✅ Production build verified (npm run build)
```

---

## 🏗️ Architecture & Technology Stack

- **Frontend & Backend**: Next.js (App Router, Server & Client Components)
- **Styling**: Tailwind CSS + Lucide Icons + CSS variables
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security + Supabase Auth)
- **Role Control**: Edge Middleware + Session Cookies + RLS Database Policies
- **Deployment**: Vercel ready

### Role & Navigation Flow

```text
                                WEBSITE (/)
                                     │
                               Login / Signup
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
              STUDENT ROLE                      ADMIN ROLE
                     │                               │
                     ▼                               ▼
             Student Dashboard                Admin Dashboard
           (/student/dashboard)              (/admin/dashboard)
           - Application status              - Registered students
           - Project status                  - Applications review
           - Attendance tracker              - Project allocation
           - Work logs                       - Attendance & logs
```

---

## 📁 Repository Structure

```text
ngo-internship-portal/
├── app/
│   ├── page.tsx                    # Landing Page
│   ├── login/page.tsx              # Unified Login (Student & Admin)
│   ├── register/page.tsx           # Student Self-Registration
│   ├── student/dashboard/page.tsx  # Protected Student Dashboard
│   ├── admin/dashboard/page.tsx    # Protected NGO Admin Dashboard
│   ├── unauthorized/page.tsx       # 403 Access Denied Page
│   ├── globals.css                 # Design System & Styling
│   └── layout.tsx                  # Root Layout & Auth Provider
├── components/
│   ├── navbar.tsx                  # Header with Auth Badge & Nav
│   ├── sidebar.tsx                 # Role-Specific Sidebar Nav
│   ├── stat-card.tsx               # Reusable Metric Cards
│   └── demo-banner.tsx             # Dev / Demo / Live Status Banner
├── lib/
│   ├── auth/
│   │   └── auth-context.tsx        # Client Auth Provider & State
│   └── supabase/
│       ├── client.ts               # Supabase Browser Client
│       ├── server.ts               # Supabase Server Client
│       └── types.ts                # TypeScript Database Types
├── supabase/
│   └── schema.sql                  # Database Schema, RLS & Trigger
├── proxy.ts                        # Route Guards (/student/* vs /admin/*) — Next 16's name for middleware
├── .env.example                    # Environment Variable Template
├── .env.local                      # Local Secrets (Git Ignored)
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The portal includes an instant **Demo / Offline Fallback Mode** so you and your team can immediately test registration, logins, dashboards, and role guards right out of the box even before configuring Supabase!

---

## 🗄️ Supabase Setup (Database & Authentication)

### Step 1: Create Supabase Project
1. Go to [database.new](https://database.new) and create a free Supabase project.
2. Under **Project Settings** → **API**, copy:
   - **Project URL**
   - **anon / public Key**

### Step 2: Configure Environment Variables
Create `.env.local` in your root folder:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Run Database Schema
1. Open your Supabase Dashboard → **SQL Editor**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repository, copy the contents, and click **Run**.
3. This sets up:
   - The `profiles` table
   - Row Level Security (RLS) policies
   - Automatic user sync trigger (`on_auth_user_created`) when a user signs up.

### Step 4: Create the FIRST NGO Admin (one-time, by a developer)
Public admin registration is disabled, so a brand-new deployment needs one starting admin.
1. In Supabase Dashboard → **Authentication** → **Users**, click **Add User** (e.g. `admin@ngo.org`).
2. Run this once in the **SQL Editor**:
```sql
UPDATE public.profiles
SET role = 'admin', application_status = 'approved'
WHERE email = 'admin@ngo.org';
```
**Every admin after that is invited from inside the portal** (see below) — NGO staff never need database access.

### Step 5: Résumé uploads (Supabase Storage)
Re-running `supabase/schema.sql` (it is safe to re-run) creates the private `resumes` bucket
(5 MB limit, PDF/DOC/DOCX only) and its policies. Applicants attach a file on the **Apply** tab;
admins open it with **View / Download** on **Applications**. Files are never public — admins get
2-minute signed links. Without Supabase configured, the file is kept in the browser only and the UI says so.

### Step 6: Admin invites (Admin Team page)
Add to `.env.local` (and to Vercel's environment variables):
```env
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase → Project Settings → API → service_role (server-only secret!)
NEXT_PUBLIC_SITE_URL=https://your-portal.vercel.app
```
Then in Supabase → **Authentication → URL Configuration → Redirect URLs**, add
`https://your-portal.vercel.app/accept-invite` (and `http://localhost:3000/accept-invite` for local use).

An admin opens **Admin Team**, enters a colleague's name + email, and clicks **Send invite**. The invitee gets an
email (via Resend), opens the link, chooses a password and lands in the admin dashboard. If `RESEND_API_KEY`
isn't set, the page shows the one-time link so the admin can send it manually. Pending invites can be revoked, or
re-sent by inviting the same email again.

---

## 🧪 Week 1 Testing Checklist

| Test | Action | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **Test 1** | Register new student at `/register` | Account created → Auto redirects to `/student/dashboard` | ✅ Verified |
| **Test 2** | Admin logs in at `/login` | Redirects to `/admin/dashboard` with Admin badge | ✅ Verified |
| **Test 3** | Student navigates to `/admin/dashboard` | Blocked by Middleware → Redirected to `/unauthorized` | ✅ Verified |
| **Test 4** | Admin logs out | Session cleared → `/admin/dashboard` redirects to `/login` | ✅ Verified |
| **Test 5** | Student logs out | Session cleared → `/student/dashboard` redirects to `/login` | ✅ Verified |

---

## 🚢 Production Deployment (Vercel + Supabase)

Follow these in order. Steps 1–3 are one-time manual setup; no `vercel.json` is needed (Vercel auto-detects
Next.js and uses `npm run build`).

### 1. Supabase project
1. Create a project at [database.new](https://database.new). Pick a region near your users (e.g. Mumbai for India).
2. **SQL Editor** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. It is safe to re-run later.
   This creates the tables, security rules, the `resumes` storage bucket and the signup trigger.
3. **Authentication → Providers → Email**: decide on **Confirm email**.
   - *Recommended: turn it OFF.* Admin approval already gates portal access, and Supabase's built-in email
     sender allows only a handful of emails per hour, so with confirmation ON applications will start failing
     once a few people apply. (If you need it ON, configure custom SMTP under *Project Settings → Authentication*.)
   - Admin invites are not affected either way — they don't use Supabase's mailer.
4. Create the **first admin** (one-time; every later admin is invited from the portal's *Admin Team* page):
   **Authentication → Users → Add user** (tick *Auto Confirm User*), then run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', application_status = 'approved'
   WHERE email = 'you@yourngo.org';
   ```
5. Copy from **Project Settings → API**: the Project URL, the `anon` key and the `service_role` key.

### 2. Resend (email) — optional but recommended
Create an API key at [resend.com](https://resend.com/api-keys). The default `onboarding@resend.dev` sender only
delivers to *your own* Resend account email, so to reach real applicants **verify your NGO's domain** in Resend and
use an address on it for `RESEND_FROM_EMAIL`. Skipping Resend is fine for a demo: emails are logged instead, and
admin invite links are shown on screen to copy.

### 3. Deploy on Vercel
1. Push the repo to GitHub (the included `.gitignore` keeps `.env.local` and `node_modules` out — check
   `git status` shows no `.env*` file before committing).
2. [vercel.com/new](https://vercel.com/new) → import the repo. Framework preset: **Next.js** (auto). Node **20.9+**.
3. Add **Environment Variables** *before* the first deploy (Production, and Preview if you want previews to work):

   | Variable | Required | Notes |
   | :--- | :---: | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `anon` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | for invites | **Secret** — server-only, never `NEXT_PUBLIC_` |
   | `NEXT_PUBLIC_SITE_URL` | for invites | e.g. `https://your-portal.vercel.app` (no trailing `/`) |
   | `RESEND_API_KEY` | recommended | |
   | `RESEND_FROM_EMAIL` | recommended | enter without quotes on Vercel |

   `NEXT_PUBLIC_*` values are baked in at build time — **if you add or change one after deploying, redeploy.**
4. **Deploy.** A Production build now *fails on purpose* if the Supabase variables are missing (see
   `next.config.ts`), instead of publishing a demo site with open admin access.

### 4. After the first deploy
1. Supabase → **Authentication → URL Configuration**:
   - **Site URL** = your Vercel URL.
   - **Redirect URLs** = add `https://your-portal.vercel.app/accept-invite` (and `http://localhost:3000/accept-invite`
     for local work). If you attach a custom domain later, update both.
2. Open the site: the banner should say **Live Mode** (green). If you see "Connected Mode" with *Quick Jump*
   buttons, the site is in demo mode — the env vars didn't reach the build; fix them and redeploy.

### 5. Smoke test (≈10 minutes)
| # | Do this | Expect |
| :-: | :--- | :--- |
| 1 | Sign in as your first admin | Lands on `/admin/dashboard` |
| 2 | Private window → **Apply** with a PDF résumé | "Application Submitted" screen |
| 3 | Admin → **Applications** | New row; **View** / **Download** open the PDF |
| 4 | Approve it | Applicant can now sign in and sees the student dashboard |
| 5 | Admin → **Admin Team** → invite a second email | Email arrives (or link is shown); link → set password → admin dashboard |
| 6 | Student account opens `/admin/dashboard` | Sent to `/unauthorized` |

### Automated tests
```bash
npm install        # first time only — installs Vitest and refreshes package-lock.json
npm test           # one run (CI)        |  npm run test:watch   # re-run on save
```
Tests live in `tests/` and run in Vitest's Node environment against the app's demo-mode (localStorage) code paths,
so they need no Supabase project, network or browser. They cover three critical paths:

| File | What it protects |
| :--- | :--- |
| `tests/login-gate.test.ts` | Pending / rejected applicants cannot sign in; approving unlocks them (`lib/auth/login-gate.ts`) |
| `tests/attendance.test.ts` | Check-in opens a record, check-out closes and persists it, admin verification, per-user isolation |
| `tests/project-assignment.test.ts` | Assigning, de-duplicating and un-assigning volunteers; who can see a project |

These are intentionally a starting point, not full coverage. The Supabase code paths and React components are not
covered yet — adding `jsdom` + React Testing Library is the natural next step for page-level tests.

### Known limitations to be aware of before going public
- **`/api/send-email` has no authentication.** Anyone who finds the URL can make your Resend account send those
  three notification emails to any address. Fine for a demo; before real traffic, add rate limiting or restrict it.
- **Email body text isn't HTML-escaped** in the three older notification templates (applicant names are inserted
  as-is). Only the new admin-invite email escapes its inputs.
- **Résumé uploads are open to anyone** (applicants have no account yet). They are limited by file type, 5 MB and
  an exact path format, but junk files can still accumulate; check *Storage → resumes* occasionally.
- Role routing uses a browser-set cookie (`cep_user_role`) for convenience. Real data is protected by Supabase
  Row Level Security, and the admin-invite API re-verifies the caller server-side, but a user can still *view*
  an admin page shell by forging the cookie — they just won't get data.

---

## 📅 Roadmap Ahead

- **Week 2**: Detailed Student Application Form, Resume Upload & Admin Review Workflow.
- **Week 3**: NGO Project Catalog, Capacity Limits & Student Allocation.
- **Week 4**: Daily Attendance Check-In, Geolocation/QR, and Weekly Work Logs.
- **Week 5**: Verification Sign-Off, Automated Certificate Generation & Export.
