-- ==============================================================================
-- Production Fixes Migration 01: Attendance & RLS Execution Security
-- Run this migration in the Supabase SQL Editor for your production project.
-- ==============================================================================

-- 1. Ensure function execution permissions on public.is_admin()
-- PostgreSQL 15+ restricts public function execution by default; this ensures
-- RLS policies evaluating public.is_admin() do not fail with permission denied.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 2. Harden attendance check-out RLS policy
-- Volunteers can only update their own open sessions (check_out_at IS NULL)
-- and are strictly prohibited from modifying verified = TRUE during checkout.
DROP POLICY IF EXISTS "Students can check out own attendance" ON public.attendance;
CREATE POLICY "Students can check out own attendance"
  ON public.attendance
  FOR UPDATE
  USING (
    auth.uid() = student_id
    AND check_out_at IS NULL
    AND verified = FALSE
  )
  WITH CHECK (
    auth.uid() = student_id
    AND verified = FALSE
  );

-- 3. Ensure admins can read all attendance and profile rows
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance"
  ON public.attendance
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any attendance" ON public.attendance;
CREATE POLICY "Admins can update any attendance"
  ON public.attendance
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Fast lookup indexes for attendance reporting and period calculations
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_at ON public.attendance(check_in_at DESC);
