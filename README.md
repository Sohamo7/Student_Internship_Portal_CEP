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
├── middleware.ts                   # Route Guards (/student/* vs /admin/*)
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

### Step 4: Create NGO Admin Account
Per the security roadmap, **public admin registration is disabled**.
To create an NGO Admin account:
1. In Supabase Dashboard → **Authentication** → **Users**, click **Add User** (e.g. `admin@ngo.org`).
2. Run this query in the **SQL Editor**:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@ngo.org';
```

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

## 🚢 Vercel Deployment

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: Week 1 Foundation complete"
   git remote add origin https://github.com/<your-username>/ngo-internship-portal.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## 📅 Roadmap Ahead

- **Week 2**: Detailed Student Application Form, Resume Upload & Admin Review Workflow.
- **Week 3**: NGO Project Catalog, Capacity Limits & Student Allocation.
- **Week 4**: Daily Attendance Check-In, Geolocation/QR, and Weekly Work Logs.
- **Week 5**: Verification Sign-Off, Automated Certificate Generation & Export.
