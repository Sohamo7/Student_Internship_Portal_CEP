# Community Engagement & NGO Internship Portal (CEP)

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Storage-3ecf8e?logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-82%20Tests%20Passing-729b1b?logo=vitest)](https://vitest.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A web platform designed to streamline community engagement projects and NGO internships. The portal connects students with social impact initiatives while providing NGO coordinators with automated workflows for application intake, resume screening, project allocation, GPS-verified attendance tracking, weekly work log audits, leave management, issue ticketing, and coordinator onboarding.

Built on **Next.js 16 (App Router + Turbopack)**, **React 19**, **Supabase (PostgreSQL with Row-Level Security & Storage)**, and **Resend (Email Automation)**. Includes an instant **Zero-Config Offline Demo Mode** for local development alongside a secure **Cloud Database Mode**.

---

## Table of Contents

- [Features Overview](#features-overview)
- [System Architecture](#system-architecture)
- [Role-Based Access Hierarchy](#role-based-access-hierarchy)
- [Project Directory Structure](#project-directory-structure)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Option A: Instant Quickstart (Offline Demo Mode - 60 Seconds)](#option-a-instant-quickstart-offline-demo-mode---60-seconds)
  - [Option B: Local Setup with Supabase & Resend](#option-b-local-setup-with-supabase--resend)
- [Automated Testing Suite](#automated-testing-suite)
- [Database Schema & Security Reference](#database-schema--security-reference)
- [API Endpoints Reference](#api-endpoints-reference)
- [Production Deployment](#production-deployment)
- [Local Troubleshooting & FAQ](#local-troubleshooting--faq)
- [License](#license)

---

## Features Overview

### 🎓 1. Student Volunteer Track
- **Application Intake**: Public intake form capturing personal details, college, degree, skills, social program interest, Statement of Purpose (SOP), and document upload.
- **Application Status Hub**: Real-time status tracking (`Pending`, `Approved`, `Rejected`) displaying reviewer feedback and official joinee credentials.
- **GPS-Verified Daily Attendance**: Interactive Check-in / Check-out with browser geolocation capture and instant distance calculation against the NGO site geofence.
- **Project Workstation**: View assigned NGO project, supervisor contact information, target hours, and milestone progress.
- **Daily Work Logs**: Record hours spent, day of the week, week grouping, and task breakdown with supervisor review tracking.
- **Profile Self-Service**: Edit personal contact information and skills (protected fields are locked against tampering).

### 🚀 2. Advanced Intern Track
- **Full Student Capabilities**: Inherits all standard student privileges and workstations.
- **Leave Management Portal**: Submit leave applications (`Sick`, `Casual`, `Academic`, `Emergency`) with date range selection, duration calculation, and status monitoring.
- **Incident & Issue Reporting**: File support tickets across categories (`Logistics`, `Facility`, `Supervision`, `Technical`) with priority flags (`Low`, `Medium`, `High`, `Urgent`) and inspect coordinator resolution notes.

### 🛡️ 3. NGO Admin Control Center
- **Executive Analytics Dashboard**: Real-time metric cards for active volunteers, pending applications, active projects, daily attendance check-ins, and pending leave requests.
- **Applicant Screening Queue**: Filter, search, and review volunteer applications; preview/download resumes via secure short-lived signed URLs (2-minute expiration); 1-click **Approve** (with automatic unique Joinee ID assignment `STU-YYYYMMDD-SEQ`) or **Decline** with automated email notification.
- **Student Roster Management**: Searchable directory of all approved volunteers; promote volunteers between **Student** and **Intern** tracks.
- **Attendance Verification**: Real-time log of check-in and check-out timestamps, recorded GPS latitude/longitude, accuracy metrics, and 1-click coordinator verification.
- **Project Catalog & Allocation**: Create and update initiatives with duration, target hours, capacity quotas, and milestones; upload project briefs; assign or unassign students with real-time capacity validation.
- **Work Log Audit**: Review volunteer daily submissions and batch-approve weekly cycles with supervisor feedback notes.
- **Leave Request Decisions**: Review incoming leave requests and record approval/rejection decisions with administrator remarks.
- **Issue Resolution Desk**: Track open tickets, adjust priority, update status to `in_progress` or `resolved`, and deliver solution notes to the intern.
- **Admin Team Management**: Invite colleagues via server-side service-role generation and email dispatch (`/accept-invite`); monitor pending invites and revoke access when necessary.
- **NGO Organization Settings**: Configure public NGO profile, toggle seasonal application intake windows with custom closed notices, manage track supervisors, and configure physical site geofence coordinates and threshold radius.

### 🔒 4. Security Architecture
- **Next.js 16 Edge Proxy (`proxy.ts`)**: Server-side route interception validating session cookies via `@supabase/ssr`, preventing unauthorized cross-role access and blocking pending or rejected applicants from entering protected zones.
- **Postgres Row-Level Security (RLS)**: Fine-grained RLS across all tables using a recursive-safe `is_admin()` `SECURITY DEFINER` function.
- **Profile Column-Level Guard Trigger**: PostgreSQL trigger (`protect_profile_columns`) forbidding non-admin users from altering protected fields (role, joinee ID, application status).
- **Private Résumé Storage**: Non-public Supabase Storage bucket (`resumes`) accessible only via short-lived signed URLs generated on the server for verified administrators.
- **Dual-Mode Engine**: Operates in **Offline Demo Mode** (via mock local storage state) or **Live Cloud Mode** (connected to Supabase and Resend).

---

## System Architecture

```text
                                 ┌─────────────────────────────────┐
                                 │       End Users (Browser)       │
                                 └───────────────┬─────────────────┘
                                                 │ HTTPS
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router                                                                           │
│                                                                                                 │
│  ┌────────────────────────┐         ┌────────────────────────────────────────────────────────┐  │
│  │ Edge Proxy (proxy.ts)  │◄───────►│ Session Verification (@supabase/ssr Server Client)     │  │
│  └───────────┬────────────┘         └────────────────────────────────────────────────────────┘  │
│              │                                                                                  │
│      ┌───────┴────────────────────────┬───────────────────────────────┐                         │
│      ▼                                ▼                               ▼                         │
│  Public Routes                 Student / Intern Routes         Admin Control Routes             │
│  • / (Home / Login)            • /student/dashboard            • /admin/dashboard               │
│  • /login & /register          • /student/application          • /admin/applications (Resumes)  │
│  • /accept-invite              • /student/attendance (GPS)     • /admin/students (Roster)       │
│  • /unauthorized (403)         • /student/project              • /admin/attendance (Verify)     │
│                                • /student/work-log             • /admin/projects (Allocation)   │
│                                • /student/profile              • /admin/work-logs (Approvals)   │
│                                • /intern/leave & /report       • /admin/leave & /admin/issues   │
│                                                                • /admin/admins & /admin/settings│
└──────────────────────────────────────────────┬───────────────────────────────┬──────────────────┘
                                               │                               │
                                               ▼                               ▼
                      ┌─────────────────────────────────┐     ┌───────────────────────────────────┐
                      │ Supabase Backend (PostgreSQL)   │     │ Resend Email Service              │
                      │ • Auth (GoTrue Service)         │     │ • Application Received            │
                      │ • PostgreSQL 15+ with RLS       │     │ • Application Decision Notifications│
                      │ • Trigger: on_auth_user_created │     │ • Project Assignment Alerts       │
                      │ • Storage: resumes (Private)    │     │ • Administrator Invitations       │
                      │ • Storage: project-attachments  │     └───────────────────────────────────┘
                      └─────────────────────────────────┘
```

---

## Role-Based Access Hierarchy

```text
                                         VISITOR
                                            │
                          ┌─────────────────┴─────────────────┐
                          ▼                                   ▼
                   Login Account                        Apply for Internship
                          │                                   │
                          │                                   ▼
                          │                        Application Created (Pending)
                          │                                   │
                          │                         (Admin Review Workflow)
                          │                         ┌─────────┴─────────┐
                          │                         ▼                   ▼
                          │                     Approved             Declined
                          │                         │                   │
                          │                         ▼                   ▼
                          │                   Joinee ID Issued     Blocked at Login
                          ▼                         │
                 Role Detection in proxy.ts         │
         ┌────────────────┼─────────────────────────┤
         ▼                ▼                         ▼
   STUDENT ROLE      INTERN ROLE                ADMIN ROLE
         │                │                         │
         ├─ Dashboard     ├─ Dashboard              ├─ Command Dashboard
         ├─ Status        ├─ Status                 ├─ Application Queue & Resumes
         ├─ Attendance    ├─ Attendance             ├─ Student & Intern Directory
         ├─ Project       ├─ Project                ├─ Attendance GPS Verification
         ├─ Work Logs     ├─ Work Logs              ├─ Project Management & Quota
         └─ Profile       ├─ Leave Management ✦     ├─ Work Log Review & Approval
                          ├─ Issue Resolution ✦     ├─ Leave & Issue Decisions
                          └─ Profile                ├─ Admin Team & Invitations
                                                    └─ Organization & Geofence Settings
```

---

## Project Directory Structure

```text
├── app/
│   ├── accept-invite/page.tsx      # Admin invitation acceptance & password configuration
│   ├── admin/                      # NGO Admin Control Suite
│   │   ├── admins/page.tsx         # Admin team roster & member invitation desk
│   │   ├── applications/page.tsx   # Volunteer application review, resume viewer, decision actions
│   │   ├── attendance/page.tsx     # GPS attendance audit log & coordinator verification
│   │   ├── dashboard/page.tsx      # Command center KPIs, metrics, and activity feeds
│   │   ├── issues/page.tsx         # Support ticket resolution desk
│   │   ├── leave/page.tsx          # Volunteer leave request management
│   │   ├── projects/page.tsx       # Project catalog, milestone tracker, student allocations
│   │   ├── settings/page.tsx       # NGO organization profile, intake window, site geofencing
│   │   ├── students/page.tsx       # Volunteer directory, role promotion, contact cards
│   │   └── work-logs/page.tsx      # Daily work log review & weekly batch approvals
│   ├── api/
│   │   ├── admin/invite/route.ts   # Server endpoint for generating admin invites (Service Role)
│   │   ├── admin/members/route.ts  # Server endpoint for listing/revoking admin members
│   │   └── send-email/route.ts     # Rate-limited transactional email dispatcher (Resend)
│   ├── intern/                     # Advanced Intern Track Pages
│   │   ├── application/page.tsx    # Application status view
│   │   ├── attendance/page.tsx     # GPS attendance check-in/out
│   │   ├── dashboard/page.tsx      # Intern metrics & quick actions
│   │   ├── leave/page.tsx          # File leave requests & track approvals
│   │   ├── profile/page.tsx        # Profile view and self-service editor
│   │   ├── project/page.tsx        # Assigned project & milestones
│   │   ├── report/page.tsx         # Issue reporting & resolution tracking
│   │   └── work-log/page.tsx       # Daily work log submissions
│   ├── login/page.tsx              # Unified Login & Internship Application Intake
│   ├── register/page.tsx           # Student Registration redirector
│   ├── student/                    # Student Volunteer Track Pages
│   │   ├── application/page.tsx    # Application status view
│   │   ├── attendance/page.tsx     # Daily GPS check-in/out
│   │   ├── dashboard/page.tsx      # Volunteer workstation dashboard
│   │   ├── profile/page.tsx        # Profile editor
│   │   ├── project/page.tsx        # Assigned project workspace
│   │   └── work-log/page.tsx       # Daily work log submission
│   ├── unauthorized/page.tsx       # 403 Access Denied interstitial page
│   ├── globals.css                 # Design system, theme variables & Tailwind v4 imports
│   ├── layout.tsx                  # Root layout with AuthProvider & notification banner
│   └── page.tsx                    # Landing router redirecting to /login
├── components/
│   ├── application-view.tsx        # Modal & viewer for applicant details and SOP
│   ├── demo-banner.tsx             # Banner indicating Live Mode vs Demo Mode
│   ├── motion-wrapper.tsx          # Framer Motion transition components
│   ├── navbar.tsx                  # Top navigation bar with role indicator and auth triggers
│   ├── project-detail-view.tsx     # Project details, milestones, attachments & roster
│   ├── resume-actions.tsx          # Secure resume preview & download button with signed URLs
│   ├── sidebar.tsx                 # Dynamic role-tailored sidebar navigation
│   └── stat-card.tsx               # Reusable KPI and analytics display card
├── lib/
│   ├── admins/admin-service.ts     # Admin team management, invite dispatch, member listing
│   ├── applications/               # Application intake, resume upload, decision services
│   ├── attendance.ts               # Attendance logging, geofencing calculation, verification
│   ├── auth/auth-context.tsx       # Client-side authentication provider & session state
│   ├── email/                      # Transactional email templates & Resend client wrapper
│   ├── geolocation.ts              # Browser HTML5 Geolocation API wrapper & coordinate parsing
│   ├── issues/issues-service.ts    # Issue creation, priority management, resolution services
│   ├── leave/leave-service.ts      # Leave request submission, balance calculation, admin review
│   ├── projects/project-service.ts # Project creation, quota tracking, student assignment
│   ├── resumes/resume-service.ts   # Private Supabase Storage bucket client & signed URL generator
│   ├── settings/settings-service.ts# NGO profile, intake window, supervisor & geofence settings
│   ├── supabase/                   # Supabase browser/server SSR clients & database types
│   └── work-log/work-log-service.ts# Daily work log persistence & weekly review aggregation
├── proxy.ts                        # Next.js 16 Edge Proxy (Middleware) role guards & session validation
├── supabase/
│   └── schema.sql                  # Complete PostgreSQL schema, RLS policies, triggers & buckets
├── tests/                          # Vitest automated test suite (82 passing tests)
│   ├── application-approval.test.ts# Joinee ID formatting and database transaction tests
│   ├── attendance.test.ts          # Check-in/out, geofence, and isolation tests
│   ├── email.test.ts               # HTML escaping & template injection prevention tests
│   ├── login-gate.test.ts          # Gatekeeping pending/rejected applicants tests
│   ├── project-assignment.test.ts  # Quota validation, deduplication, and assignment tests
│   ├── rls.test.ts                 # Full PostgreSQL schema & RLS policy audit in PGlite
│   ├── send-email-route.test.ts    # Rate limiting & authorization tests on /api/send-email
│   └── settings.test.ts            # Organization profile & intake window persistence tests
├── .env.example                    # Environment variable template
├── package.json                    # Project configuration and script definitions
└── tsconfig.json                   # TypeScript compiler configuration
```

---

## Local Development Setup

### Prerequisites

- **Node.js**: Version `20.9.0` or higher (Node 22 LTS recommended). Verify with:
  ```bash
  node -v
  ```
- **npm**: Version `10.0.0` or higher.
- **Git**: Installed and configured.

---

### Option A: Instant Quickstart (Offline Demo Mode - 60 Seconds)

To explore, develop, or demo the platform without setting up external database or email accounts:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sohamo7/Student_Internship_Portal_CEP.git
   cd Student_Internship_Portal_CEP
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

   > 💡 **Demo Quick Jump**: When running without Supabase credentials, the yellow **Connected Mode** banner and the **Demo Quick Jump** buttons on `/login` allow one-click login into **Student Demo**, **Intern Demo**, or **Admin Demo** roles using local storage.

---

### Option B: Local Setup with Supabase & Resend

To develop against a live local instance backed by a real Supabase database:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create a free Supabase project**:
   - Visit [supabase.com](https://supabase.com) and create a project.

3. **Execute database schema**:
   - Open Supabase Dashboard → **SQL Editor** → **New query**.
   - Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql), paste into the editor, and click **Run**.

4. **Bootstrap the initial administrator**:
   - In Supabase Dashboard → **Authentication** → **Users** → **Add user** (enter email e.g. `admin@ngo.org`, set password, check *Auto Confirm User*).
   - In SQL Editor, run:
     ```sql
     UPDATE public.profiles
     SET role = 'admin', application_status = 'approved'
     WHERE email = 'admin@ngo.org';
     ```

5. **Configure environment variables**:
   - Copy the template file:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and fill in your Supabase and Resend credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-secret-key
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     NEXT_PUBLIC_NGO_SITE_LATITUDE=28.6139
     NEXT_PUBLIC_NGO_SITE_LONGITUDE=77.2090
     NEXT_PUBLIC_NGO_GEOFENCE_RADIUS_METERS=500
     RESEND_API_KEY=re_your_api_key
     RESEND_FROM_EMAIL="NGO Portal <onboarding@resend.dev>"
     ```

6. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The top banner will reflect **Live Mode** in green.

---

## Automated Testing Suite

The repository contains an automated test suite with **82 unit and integration tests** powered by **Vitest**.

A core component is [`tests/rls.test.ts`](tests/rls.test.ts), which boots a real, in-memory PostgreSQL engine ([PGlite](https://github.com/electric-sql/pglite)), applies [`supabase/schema.sql`](supabase/schema.sql), and validates Row-Level Security policies, recursion prevention, column protection triggers, and role isolation.

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage Summary

| Test File | Tests | Coverage |
| :--- | :---: | :--- |
| `tests/rls.test.ts` | 28 | Schema & RLS policies in in-memory PostgreSQL (PGlite). Validates policy recursion safety, column guards, and role permissions. |
| `tests/attendance.test.ts` | 10 | Attendance check-in/out sequencing, duplicate session prevention, coordinator verification, and user isolation. |
| `tests/send-email-route.test.ts` | 9 | `/api/send-email` authorization checks, service-role requirement, rate limiting, and email verification. |
| `tests/email.test.ts` | 9 | HTML escaping and injection prevention across transactional email templates. |
| `tests/application-approval.test.ts`| 8 | Application approval state updates, rejection handling, and Joinee ID collision retries. |
| `tests/settings.test.ts` | 8 | Organization profile updates, intake window toggles, and supervisor directory persistence. |
| `tests/project-assignment.test.ts` | 6 | Project allocation, quota limits, member deduplication, and unallocation integrity. |
| `tests/login-gate.test.ts` | 4 | Gatekeeping logic blocking pending and rejected applicants from entering dashboards. |

---

## Database Schema & Security Reference

### Relational Schema

| Table | Primary Key | Description | Key Security Rules (RLS) |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id (UUID)` | User profiles, roles (`student`, `intern`, `admin`), SOP, joinee ID | Users read own; Admins read all; Column lock trigger prevents self-elevation |
| `public.org_settings` | `id (INT=1)` | Organization profile, intake window, supervisor list, geofence config | Publicly readable; Admins have write permissions |
| `public.attendance` | `id (UUID)` | Check-in/out timestamps, latitude, longitude, accuracy, verified flag | Students insert/update own open session; Admins read and verify all |
| `public.projects` | `id (UUID)` | Project title, track, duration, target hours, quota, milestones, attachments | Assigned members view project; Admins have full CRUD permissions |
| `public.project_assignments`| `id (UUID)` | Links projects to student profiles with unique `(project_id, email)` constraint | Members view own assignments; Admins have full control |
| `public.leave_requests` | `id (UUID)` | Leave applications (dates, duration, reason, status, admin notes) | Users submit and view own requests; Admins update status and comments |
| `public.reported_issues` | `id (UUID)` | Issue tickets (category, priority, description, status, admin solution) | Users submit and view own issues; Admins update status and solution |
| `public.daily_work_logs` | `id (UUID)` | Daily task log entries, hours (max 16h/day), week grouping, review status | Users log own entries; Admins update review status and feedback |
| `storage.objects` (`resumes`) | `name` | Private bucket for volunteer resume files (PDF, DOC, DOCX up to 5 MB) | Applicants upload via path regex; Only Admins can read via signed URLs |
| `storage.objects` (`project-attachments`) | `name` | Public bucket for project documentation, guides, and briefs (up to 10 MB) | Public read; Admin write/delete |

### Row-Level Security Helper Function

To prevent infinite policy recursion in PostgreSQL when checking user roles against `public.profiles`, the database utilizes a dedicated `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

---

## API Endpoints Reference

### 1. Send Transactional Email
- **Endpoint**: `POST /api/send-email`
- **Authorization**:
  - `admin-approval`, `admin-rejection`, `project-assignment`: Requires caller to have role `admin`.
  - `application-received`: Requires matching profile in `public.profiles` verified via `SUPABASE_SERVICE_ROLE_KEY`.
- **Rate Limit**: Maximum 10 requests per minute per IP address.

### 2. Admin Team Invitation
- **Endpoint**: `POST /api/admin/invite`
- **Authorization**: Signed-in NGO Admin.
- **Function**: Uses `SUPABASE_SERVICE_ROLE_KEY` to provision an auth user, set `role = 'admin'`, and send an invitation link pointing to `/accept-invite`.

### 3. Manage Admin Members
- **Endpoint**: `GET /api/admin/members` — Lists all active and pending administrator accounts.
- **Endpoint**: `DELETE /api/admin/members?email=coordinator@ngo.org` — Revokes an administrator invitation.
- **Authorization**: Signed-in NGO Admin.

---

## Production Deployment

For complete, step-by-step production deployment instructions covering **Vercel**, **Supabase**, and **Resend**, see:

👉 **[Production Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md)**

The deployment guide includes:
- Production environment variable configuration
- Setting up custom domains and SSL
- Supabase callback and redirect URL setup
- Production smoke testing checklist
- Go-live operational checklist and backup guidelines

---

## Local Troubleshooting & FAQ

### 1. The portal shows "Demo Mode" instead of "Live Mode"
- Ensure `.env.local` exists in the project root and contains real Supabase credentials.
- Verify variable names: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Restart the development server (`npm run dev`) after creating or updating `.env.local`.

### 2. Volunteers cannot log in after applying ("Application Under Review")
- Applicants are blocked from accessing student or intern dashboards until an administrator approves their application.
- Log in with an admin account, navigate to `/admin/applications`, and click **Approve** on the applicant's row.

### 3. Location check-in reports "Location Permission Denied"
- Browsers require HTTPS (or `localhost`) to access HTML5 Geolocation APIs.
- Ensure location permissions are allowed for the site in your browser settings.

### 4. Admin invitation emails are not arriving locally
- When testing with Resend's free tier without a verified domain (`onboarding@resend.dev`), emails deliver only to the email address registered on your Resend account.
- For local testing, the **Admin Team** page (`/admin/admins`) displays the one-time activation link on screen so it can be copied directly.

---

## License

This project is licensed under the [MIT License](LICENSE).
Developed for the **Community Engagement Project (CEP)** to support non-governmental organizations and educational institutions with digital volunteer and internship administration.
