-- ==============================================================================
-- NGO Internship Portal - Week 1 Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'intern', 'admin')) DEFAULT 'student',

  -- Internship application fields (collected on the "Apply" tab of /login)
  phone TEXT,
  college TEXT,
  degree TEXT,
  skills TEXT,
  program_interest TEXT,
  statement_of_purpose TEXT,

  -- Gates portal login for new volunteers. Admins / approved students can sign in;
  -- pending or rejected applicants are blocked at login with an explanatory message.
  application_status TEXT NOT NULL CHECK (application_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Résumé / document uploaded on the Apply form. The file itself lives in the
-- private "resumes" Storage bucket (section 9); these columns only hold its path
-- and original file name. ADD COLUMN IF NOT EXISTS keeps this safe to re-run.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_path TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_name TEXT;

-- Admin-invite tracking (section 10). An admin created through the in-app invite
-- flow has invited_at set; invite_accepted_at is filled in when they choose a
-- password. Admins created by the one-off bootstrap SQL leave both NULL.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;

-- Joinee Identification: Unique ID formatted as <ROLE>-<YYYYMMDD>-<SEQ> (e.g. STU-20261003-001 vs INT-20261003-001)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joinee_id TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;

-- Index on email, role, and application_status for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_application_status ON public.profiles(application_status);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Policy A: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy B: Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy C: Users can update their own profile name (but not their role or application status)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    application_status = (SELECT application_status FROM public.profiles WHERE id = auth.uid())
  );

-- Policy D: Admins can update any profile (e.g. promoting roles)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Automatic Profile Trigger on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, email, role,
    phone, college, degree, skills, program_interest, statement_of_purpose,
    resume_path, resume_name,
    application_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'student', -- Public registration (the "Apply" form) is strictly student role
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'degree',
    NEW.raw_user_meta_data->>'skills',
    NEW.raw_user_meta_data->>'program_interest',
    NEW.raw_user_meta_data->>'statement_of_purpose',
    -- Sign-up metadata is user-controlled, so only accept a path that matches
    -- the exact shape the Apply form generates (see section 9 policies).
    CASE WHEN NEW.raw_user_meta_data->>'resume_path' ~ '^applications/[0-9a-f-]{36}/[^/]+$'
         THEN NEW.raw_user_meta_data->>'resume_path' END,
    CASE WHEN NEW.raw_user_meta_data->>'resume_path' ~ '^applications/[0-9a-f-]{36}/[^/]+$'
         THEN left(NEW.raw_user_meta_data->>'resume_name', 255) END,
    'pending' -- New volunteers cannot log in until an NGO admin approves their application
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4b. NGO Portal Settings (organization profile, application intake window,
--     supervisor contacts). A single row (id = 1) holding a JSON document.
--     Readable by everyone (the public Apply form needs the intake window);
--     writable by NGO admins only.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.org_settings (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read org settings" ON public.org_settings;
CREATE POLICY "Anyone can read org settings"
  ON public.org_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert org settings" ON public.org_settings;
CREATE POLICY "Admins can insert org settings"
  ON public.org_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update org settings" ON public.org_settings;
CREATE POLICY "Admins can update org settings"
  ON public.org_settings
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ==============================================================================
-- 5. Helper Script to Promote an NGO Admin Account:
-- To grant NGO Admin permissions to an account created via Supabase Auth:
--
-- UPDATE public.profiles
-- SET role = 'admin', application_status = 'approved'
-- WHERE email = 'admin@ngo.org';
--
-- 6. Helper Script to Approve / Reject a Volunteer's Internship Application:
-- (This is exactly what the "Approve" / "Decline" buttons on
--  /admin/applications run on the applicant's row.)
--
-- UPDATE public.profiles
-- SET application_status = 'approved', reviewed_at = NOW()
-- WHERE email = 'student@example.com';
--
-- 7. Helper Script to Promote a Volunteer to Full Intern Track:
-- Interns get the extra Leave and Report Issue modules (see components/sidebar.tsx).
--
-- UPDATE public.profiles
-- SET role = 'intern'
-- WHERE email = 'student@example.com';
-- ==============================================================================

-- ==============================================================================
-- 7. Attendance table — persists real check-in/check-out records with the
-- GPS coordinates captured on each action (see lib/geolocation.ts and
-- lib/attendance.ts). This is what makes the location-capture feature real
-- instead of living only in component state.
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_at TIMESTAMPTZ,

  in_latitude DOUBLE PRECISION NOT NULL,
  in_longitude DOUBLE PRECISION NOT NULL,
  in_accuracy DOUBLE PRECISION,

  out_latitude DOUBLE PRECISION,
  out_longitude DOUBLE PRECISION,
  out_accuracy DOUBLE PRECISION,

  -- Set true by an NGO admin on /admin/attendance after cross-checking the
  -- captured GPS pin against the registered site location.
  verified BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON public.attendance(check_in_at DESC);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Students can see their own attendance history
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.uid() = student_id);

-- Admins can see every attendance record (needed for /admin/attendance)
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance"
  ON public.attendance
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- A student may only ever check themselves in, and only if they don't
-- already have an open (not-checked-out) session.
DROP POLICY IF EXISTS "Students can check in" ON public.attendance;
CREATE POLICY "Students can check in"
  ON public.attendance
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND check_out_at IS NULL
    AND verified = FALSE
    AND NOT EXISTS (
      SELECT 1 FROM public.attendance
      WHERE student_id = auth.uid() AND check_out_at IS NULL
    )
  );

-- A student may only update their own still-open session (to check out) —
-- they cannot touch someone else's row or re-open/edit a closed one.
DROP POLICY IF EXISTS "Students can check out own attendance" ON public.attendance;
CREATE POLICY "Students can check out own attendance"
  ON public.attendance
  FOR UPDATE
  USING (auth.uid() = student_id AND check_out_at IS NULL)
  WITH CHECK (auth.uid() = student_id);

-- Admins can update any row (used to mark a record "verified")
DROP POLICY IF EXISTS "Admins can update any attendance" ON public.attendance;
CREATE POLICY "Admins can update any attendance"
  ON public.attendance
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- ==============================================================================

-- ==============================================================================
-- 8. Projects, Leave Requests, Issue Reports and Daily Work Logs.
-- These back lib/projects, lib/leave, lib/issues and lib/work-log. When Supabase
-- is not configured the services fall back to localStorage, so this section is
-- only needed for a real deployment.
--
-- Policies below call public.is_admin() (SECURITY DEFINER) rather than
-- inlining "EXISTS (SELECT 1 FROM public.profiles ...)". Reading profiles from
-- inside a policy re-triggers the profiles policies; the helper bypasses RLS
-- for that one lookup, so it cannot recurse.
-- ==============================================================================
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

-- ---- 8a. Projects + assignments ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  track TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  supervisor_email TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  target_hours INTEGER NOT NULL CHECK (target_hours > 0),
  quota INTEGER NOT NULL CHECK (quota > 0),
  milestones TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_created ON public.projects(created_at DESC);

-- Admins may assign someone who has no profile yet (typed in by hand), so the
-- member is identified by email; member_id links to the profile when known.
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_assignments_member
  ON public.project_assignments(project_id, lower(member_email));
CREATE INDEX IF NOT EXISTS idx_project_assignments_email
  ON public.project_assignments(lower(member_email));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Members see an assignment row only if it is theirs; admins see everything.
DROP POLICY IF EXISTS "Members can view own assignments" ON public.project_assignments;
CREATE POLICY "Members can view own assignments"
  ON public.project_assignments
  FOR SELECT
  USING (lower(member_email) = lower(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Admins can view all assignments" ON public.project_assignments;
CREATE POLICY "Admins can view all assignments"
  ON public.project_assignments
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert assignments" ON public.project_assignments;
CREATE POLICY "Admins can insert assignments"
  ON public.project_assignments
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete assignments" ON public.project_assignments;
CREATE POLICY "Admins can delete assignments"
  ON public.project_assignments
  FOR DELETE
  USING (public.is_admin());

-- A member can read a project only when they are assigned to it.
DROP POLICY IF EXISTS "Members can view assigned projects" ON public.projects;
CREATE POLICY "Members can view assigned projects"
  ON public.projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_assignments a
      WHERE a.project_id = projects.id
        AND lower(a.member_email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects"
  ON public.projects
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
CREATE POLICY "Admins can insert projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
CREATE POLICY "Admins can update projects"
  ON public.projects
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  USING (public.is_admin());

-- ---- 8b. Leave requests ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_role TEXT NOT NULL CHECK (applicant_role IN ('intern', 'student')),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  admin_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_applicant ON public.leave_requests(applicant_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_created ON public.leave_requests(created_at DESC);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
CREATE POLICY "Users can view own leave requests"
  ON public.leave_requests
  FOR SELECT
  USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Admins can view all leave requests" ON public.leave_requests;
CREATE POLICY "Admins can view all leave requests"
  ON public.leave_requests
  FOR SELECT
  USING (public.is_admin());

-- Applicants can only file requests for themselves, and always as pending.
DROP POLICY IF EXISTS "Users can submit own leave requests" ON public.leave_requests;
CREATE POLICY "Users can submit own leave requests"
  ON public.leave_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id
    AND status = 'pending'
    AND reviewed_at IS NULL
    AND admin_comment IS NULL
  );

-- Only admins decide on requests.
DROP POLICY IF EXISTS "Admins can update leave requests" ON public.leave_requests;
CREATE POLICY "Admins can update leave requests"
  ON public.leave_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- 8c. Issue reports -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reported_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
  admin_solution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issues_applicant ON public.reported_issues(applicant_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.reported_issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created ON public.reported_issues(created_at DESC);

ALTER TABLE public.reported_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own issues" ON public.reported_issues;
CREATE POLICY "Users can view own issues"
  ON public.reported_issues
  FOR SELECT
  USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Admins can view all issues" ON public.reported_issues;
CREATE POLICY "Admins can view all issues"
  ON public.reported_issues
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can report own issues" ON public.reported_issues;
CREATE POLICY "Users can report own issues"
  ON public.reported_issues
  FOR INSERT
  WITH CHECK (
    auth.uid() = applicant_id
    AND status = 'open'
    AND admin_solution IS NULL
    AND resolved_at IS NULL
  );

DROP POLICY IF EXISTS "Admins can update issues" ON public.reported_issues;
CREATE POLICY "Admins can update issues"
  ON public.reported_issues
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---- 8d. Daily work logs -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intern_name TEXT NOT NULL,
  intern_email TEXT NOT NULL,
  log_date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  week_label TEXT NOT NULL,
  hours NUMERIC(4, 1) NOT NULL CHECK (hours > 0 AND hours <= 16),
  tasks TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending Review', 'Approved')) DEFAULT 'Pending Review',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_intern ON public.daily_work_logs(intern_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_week ON public.daily_work_logs(intern_email, week_label);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON public.daily_work_logs(log_date DESC);

ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own work logs" ON public.daily_work_logs;
CREATE POLICY "Users can view own work logs"
  ON public.daily_work_logs
  FOR SELECT
  USING (auth.uid() = intern_id);

DROP POLICY IF EXISTS "Admins can view all work logs" ON public.daily_work_logs;
CREATE POLICY "Admins can view all work logs"
  ON public.daily_work_logs
  FOR SELECT
  USING (public.is_admin());

-- Volunteers can only log their own days, and a new log always starts pending.
DROP POLICY IF EXISTS "Users can add own work logs" ON public.daily_work_logs;
CREATE POLICY "Users can add own work logs"
  ON public.daily_work_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = intern_id
    AND status = 'Pending Review'
    AND admin_notes IS NULL
  );

-- Only admins approve logs (weekly approval updates every day in the week).
DROP POLICY IF EXISTS "Admins can update work logs" ON public.daily_work_logs;
CREATE POLICY "Admins can update work logs"
  ON public.daily_work_logs
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
-- ==============================================================================

-- ==============================================================================
-- 9. Résumé uploads (Supabase Storage)
-- A PRIVATE bucket: nothing is publicly readable. Applicants upload from the
-- Apply form (before they have a session, so INSERT is open to anon but locked
-- to one exact path shape + the bucket's size/type limits). Only admins can read,
-- and the app hands them short-lived signed URLs.
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 'resumes', FALSE,
  5242880, -- 5 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Applicants can upload resumes" ON storage.objects;
CREATE POLICY "Applicants can upload resumes"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND name ~ '^applications/[0-9a-f-]{36}/[^/]+$'
  );

DROP POLICY IF EXISTS "Admins can read resumes" ON storage.objects;
CREATE POLICY "Admins can read resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND public.is_admin());

-- ==============================================================================
-- 10. Admin invites
-- No extra tables needed: the invite is created by the server route
-- /api/admin/invite (service-role key, only callable by a signed-in admin), which
-- creates the auth user, marks the profile role = 'admin' and emails a one-time
-- link to /accept-invite. The columns added in section 1 track invite status.
--
-- The SQL snippet in section 5 above is now ONLY for creating the very first
-- admin of a new deployment. After that, use Admin Team in the portal.
-- ==============================================================================
