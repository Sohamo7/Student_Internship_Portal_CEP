'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { notifyApplicationSubmitted } from '@/lib/email/client';
import { useOrgSettings } from '@/lib/settings/use-org-settings';
import { getIntakeStatus } from '@/lib/settings/settings-service';

import {
  RESUME_ACCEPT,
  UploadedResume,
  discardLocalResume,
  formatFileSize,
  uploadResume,
  validateResume,
} from '@/lib/resumes/resume-service';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Briefcase,
  User,
  Phone,
  School,
  Sparkles,
  CheckCircle2,
  Clock,
  Paperclip,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

type Tab = 'signin' | 'apply' | 'setup_password';

const PROGRAM_INTERESTS = [
  'Community Digital Literacy & Youth Education',
  'Rural Healthcare & Nutrition Awareness',
  'Environmental Sustainability & Clean Water',
  'Women Empowerment & Vocational Training',
];

function SignInForm({ onSetupPassword }: { onSetupPassword: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      return;
    }

    if (redirectPath) {
      router.push(redirectPath);
    } else if (result.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (result.role === 'intern') {
      router.push('/intern/dashboard');
    } else {
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org or student.edu"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center border-t border-slate-100">
        <button
          type="button"
          onClick={onSetupPassword}
          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Received an admin invite link? <span className="font-semibold text-indigo-600 underline">Set up password</span>
        </button>
      </div>
    </div>
  );
}

function ApplyForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { register, isLoading } = useAuth();
  const { settings: orgSettings } = useOrgSettings();
  const intakeOpen = getIntakeStatus(orgSettings.intake).open;

  const [role, setRole] = useState<'student' | 'intern'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [skills, setSkills] = useState('');
  const [interest, setInterest] = useState(PROGRAM_INTERESTS[0]);
  const [sop, setSop] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);
    if (file) {
      const problem = validateResume(file);
      if (problem) {
        setError(problem);
        e.target.value = '';
        setResumeFile(null);
        return;
      }
    }
    setResumeFile(file);
  };

  const clearResume = () => {
    setResumeFile(null);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!intakeOpen) {
      setError(orgSettings.intake.closed_message);
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !college.trim() || !degree.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    // Upload the résumé first so its path can travel with the sign-up (the
    // applicant has no session yet). A failed upload stops the submission so a
    // file is never silently dropped.
    let uploaded: UploadedResume | null = null;
    if (resumeFile) {
      try {
        uploaded = await uploadResume(resumeFile);
      } catch (err) {
        setSubmitting(false);
        setError(err instanceof Error ? err.message : 'Résumé upload failed. Please try again.');
        return;
      }
    }

    const result = await register(name, email, password, {
      role,
      phone,
      college,
      degree,
      skills,
      program_interest: interest,
      statement_of_purpose: sop,
      resume_path: uploaded?.path,
      resume_name: uploaded?.name,
    });
    setSubmitting(false);

    if (!result.success) {
      if (uploaded?.storage === 'local') discardLocalResume(uploaded.path);
      setError(result.error || 'Application submission failed. Please try again.');
      return;
    }

    notifyApplicationSubmitted(email.trim(), name.trim());
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Thanks for applying, <strong>{name.trim()}</strong>. Your application is now{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" /> under review
            </span>{' '}
            by our NGO team.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            You&apos;ll receive an email as soon as your application is approved — that&apos;s when the{' '}
            <strong>Sign In</strong> option will work for your account.
          </p>
        </div>
        <button
          type="button"
          onClick={onSubmitted}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!intakeOpen && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900">
          <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Applications are closed</p>
            <p className="mt-0.5">{orgSettings.intake.closed_message}</p>
            {orgSettings.organization.contact_email && (
              <p className="mt-1 text-amber-800/80">
                Questions? Contact {orgSettings.organization.name} at{' '}
                <a href={`mailto:${orgSettings.organization.contact_email}`} className="font-semibold underline">
                  {orgSettings.organization.contact_email}
                </a>
                .
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-800">
        <Sparkles className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
        <span>
          New volunteers apply here first. An NGO admin reviews every application — once approved, this same
          email &amp; password unlock the <strong>Sign In</strong> tab.
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Track Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Apply As / Program Track</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                role === 'student'
                  ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  role === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <div className={`text-xs font-bold ${role === 'student' ? 'text-indigo-950' : 'text-slate-800'}`}>
                  Student Track
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">Academic &amp; CEP Credits</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('intern')}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                role === 'intern'
                  ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  role === 'intern' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <div className={`text-xs font-bold ${role === 'intern' ? 'text-teal-950' : 'text-slate-800'}`}>
                  Intern Track
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">Advanced + Leave/Issue Modules</div>
              </div>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Contact Number</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 12345"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Email Address</label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@college.edu"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">College Name</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <School className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Delhi Technological University"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Course / Degree</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <GraduationCap className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech in Information Technology"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Key Skills</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Python, community outreach, graphic design..."
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Program Field of Interest</label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {PROGRAM_INTERESTS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Statement of Purpose <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={sop}
            onChange={(e) => setSop(e.target.value)}
            placeholder="Tell us why you'd like to volunteer with us..."
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Résumé / Supporting Document <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            ref={resumeInputRef}
            id="resume-upload"
            type="file"
            accept={RESUME_ACCEPT}
            onChange={handleResumeChange}
            className="sr-only"
          />
          {resumeFile ? (
            <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-800">
                <Paperclip className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="truncate font-medium">{resumeFile.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{formatFileSize(resumeFile.size)}</span>
              </span>
              <button
                type="button"
                onClick={clearResume}
                aria-label="Remove file"
                className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white hover:text-rose-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="resume-upload"
              className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-3.5 py-3 text-sm text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/40"
            >
              <Paperclip className="h-4 w-4 text-slate-400" />
              Choose a PDF or Word file
            </label>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            PDF, DOC or DOCX, up to 5 MB.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Create Password</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || isLoading || !intakeOpen}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Submit Application</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

type SetupPhase = 'checking' | 'ready' | 'success' | 'need_link' | 'already_active' | 'invalid';

function SetupPasswordForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();

  const [phase, setPhase] = useState<SetupPhase>('checking');
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkInvite() {
      if (!configured) {
        if (cancelled) return;
        setProblem('Supabase authentication is not configured. Admin invitations cannot be verified.');
        setPhase('invalid');
        return;
      }

      const supabase = createClient();
      const hashStr = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      const hash = new URLSearchParams(hashStr);
      const hashError = hash.get('error_description');

      if (hashError) {
        if (cancelled) return;
        setProblem(`${hashError.replace(/\+/g, ' ')}. Please request a fresh invitation from an existing admin.`);
        setPhase('invalid');
        return;
      }

      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');

        try {
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          } else if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          } else if (tokenHash) {
            await supabase.auth.verifyOtp({ type: 'invite', token_hash: tokenHash });
          }
        } catch (err) {
          console.error('Error exchanging invite tokens:', err);
        }
        ({ data: { session } } = await supabase.auth.getSession());
      }

      if (cancelled) return;

      if (!session?.user) {
        setPhase('need_link');
        return;
      }

      const { data: invited, error: fetchErr } = await supabase
        .from('profiles')
        .select('name, email, role, invited_at, invite_accepted_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchErr || !invited) {
        setProblem('Could not locate an admin account corresponding to this session. Please ask for a new invite.');
        setPhase('invalid');
        return;
      }

      if (invited.role !== 'admin' || !invited.invited_at) {
        setProblem('This account was not invited as an admin. If you are a student or intern, please sign in.');
        setPhase('invalid');
        return;
      }

      if (invited.invite_accepted_at) {
        setEmail(invited.email || session.user.email || '');
        setPhase('already_active');
        return;
      }

      setName(invited.name || '');
      setEmail(invited.email || session.user.email || '');
      setPhase('ready');
    }

    checkInvite();

    return () => {
      cancelled = true;
    };
  }, [configured, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userData, error: pwErr } = await supabase.auth.updateUser({
        password,
        data: { name: name.trim() },
      });
      if (pwErr) throw new Error(pwErr.message);

      const userId = userData.user?.id;
      if (userId) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            name: name.trim(),
            invite_accepted_at: new Date().toISOString(),
          })
          .eq('id', userId);
        if (profileErr) throw new Error(profileErr.message);
      }

      setPhase('success');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1200);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Could not set up password. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {phase === 'checking' && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
          <span>Verifying your admin invitation...</span>
        </div>
      )}

      {phase === 'need_link' && (
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Admin Invitation Verification</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              To set up your admin password, please click the one-time link sent to your email by the NGO admin team.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              If you received the invitation link directly, copy and paste it into your browser address bar.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      )}

      {phase === 'already_active' && (
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Account Already Active</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              The admin account for <strong>{email}</strong> has already accepted the invite and configured a password.
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            <span>Sign In Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {phase === 'invalid' && (
        <div className="space-y-4 text-center">
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-left text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{problem}</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      )}

      {phase === 'success' && (
        <div className="space-y-5 text-center py-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Password Set Successfully!</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Your NGO admin account is now active. Redirecting you to the admin dashboard...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50/80 p-3.5 text-xs text-purple-900">
            <ShieldCheck className="h-4 w-4 shrink-0 text-purple-600 mt-0.5" />
            <span>
              You&apos;ve been invited to join as an NGO Administrator. Choose a secure password to activate your portal access.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                readOnly
                value={email}
                className="block w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-3 py-2.5 text-sm text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin Name"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Create Password</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-purple-600/20 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Activate Account &amp; Set Password</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function LoginTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, role, isLoading } = useAuth();

  const isSetupPasswordRequested =
    searchParams.get('setup_password') === 'true' ||
    searchParams.get('tab') === 'setup-password' ||
    searchParams.get('tab') === 'setup_password' ||
    Boolean(searchParams.get('token_hash')) ||
    Boolean(searchParams.get('code'));

  const initialTab: Tab = isSetupPasswordRequested
    ? 'setup_password'
    : searchParams.get('tab') === 'apply'
    ? 'apply'
    : 'signin';

  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('access_token') || hash.includes('type=invite') || isSetupPasswordRequested) {
      setTab('setup_password');
    }
  }, [isSetupPasswordRequested]);

  useEffect(() => {
    if (!isLoading && user && profile) {
      // If invited admin who hasn't accepted invite yet, ensure they are on setup_password tab
      if (profile.role === 'admin' && profile.invited_at && !profile.invite_accepted_at) {
        setTab('setup_password');
        return;
      }
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'intern') {
        router.push('/intern/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [user, profile, role, isLoading, router]);

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-all ${
            tab === 'setup_password'
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/20'
              : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-600/20'
          }`}
        >
          {tab === 'setup_password' ? <ShieldCheck className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </div>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
          {tab === 'signin'
            ? 'Sign in to your account'
            : tab === 'apply'
            ? 'Apply for an Internship'
            : 'Set Up Admin Password'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {tab === 'signin'
            ? 'Access your personalized student or NGO administration dashboard'
            : tab === 'apply'
            ? 'New volunteer? Submit your details — an NGO admin will review and approve your access.'
            : 'Choose a password to activate your NGO administrator account.'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div
        className={`grid ${
          tab === 'setup_password' ? 'grid-cols-3' : 'grid-cols-2'
        } gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1`}
      >
        <button
          type="button"
          onClick={() => setTab('signin')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
            tab === 'signin'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Sign In
          <span className="block text-[10px] font-medium text-slate-400">Existing volunteers</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('apply')}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
            tab === 'apply'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Apply
          <span className="block text-[10px] font-medium text-slate-400">New volunteers</span>
        </button>
        {tab === 'setup_password' && (
          <button
            type="button"
            onClick={() => setTab('setup_password')}
            className="rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer bg-white text-purple-700 shadow-sm"
          >
            Setup Password
            <span className="block text-[10px] font-medium text-slate-400">Admin invite</span>
          </button>
        )}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {tab === 'signin' ? (
          <SignInForm onSetupPassword={() => setTab('setup_password')} />
        ) : tab === 'apply' ? (
          <ApplyForm onSubmitted={() => setTab('signin')} />
        ) : (
          <SetupPasswordForm onSwitchToSignIn={() => setTab('signin')} />
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500">
        {tab === 'signin' ? (
          <>
            New volunteer, not yet applied?{' '}
            <button
              type="button"
              onClick={() => setTab('apply')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              Apply for an internship
            </button>
          </>
        ) : tab === 'apply' ? (
          <>
            Already approved?{' '}
            <button
              type="button"
              onClick={() => setTab('signin')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              Sign in to your account
            </button>
          </>
        ) : (
          <>
            Already set up your password?{' '}
            <button
              type="button"
              onClick={() => setTab('signin')}
              className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              Sign in to your account
            </button>
          </>
        )}
      </p>
      <p className="text-center text-[11px] text-slate-400">
        NGO staff account? Use the Sign In tab above — admin accounts are created directly by the NGO, not through Apply.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-8 text-xs text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="mt-2">Loading sign in...</span>
        </div>
      }>
        <LoginTabs />
      </Suspense>
    </div>
  );
}
