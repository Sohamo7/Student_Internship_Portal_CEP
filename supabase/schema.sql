-- ==============================================================================
-- NGO Internship Portal - Week 1 Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')) DEFAULT 'student',

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
