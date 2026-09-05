'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Shield,
  GraduationCap,
  User,
  Phone,
  School,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

type Tab = 'signin' | 'apply';

const PROGRAM_INTERESTS = [
  'Community Digital Literacy & Youth Education',
  'Rural Healthcare & Nutrition Awareness',
  'Environmental Sustainability & Clean Water',
  'Women Empowerment & Vocational Training',
];

function SignInForm() {
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
    } else {
      router.push('/student/dashboard');
    }
  };

  const handleFillDemo = (type: 'student' | 'admin') => {
    setError(null);
    if (type === 'student') {
      setEmail('student@ngo.org');
      setPassword('password123');
    } else {
      setEmail('admin@ngo.org');
      setPassword('password123');
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

      {/* Quick Demo Fillers */}
      <div className="pt-6 border-t border-slate-100">
        <p className="text-center text-[11px] font-medium text-slate-500 mb-3">
          ⚡ Quick 1-Click Verification Fillers:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo('student')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
          >
            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
            <span>Demo Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('admin')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors cursor-pointer"
          >
            <Shield className="h-3.5 w-3.5 text-purple-500" />
            <span>Demo Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { register, isLoading } = useAuth();

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
    const result = await register(name, email, password, {
      phone,
      college,
      degree,
      skills,
      program_interest: interest,
      statement_of_purpose: sop,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Application submission failed. Please try again.');
      return;
    }

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
          disabled={submitting || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
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

function LoginTabs() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get('tab') === 'apply' ? 'apply' : 'signin';
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
          {tab === 'signin' ? 'Sign in to your account' : 'Apply for an Internship'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {tab === 'signin'
            ? 'Access your personalized student or NGO administration dashboard'
            : 'New volunteer? Submit your details — an NGO admin will review and approve your access.'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
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
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {tab === 'signin' ? (
          <SignInForm />
        ) : (
          <ApplyForm onSubmitted={() => setTab('signin')} />
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
        ) : (
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
