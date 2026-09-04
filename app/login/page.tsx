'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Lock, Mail, ArrowRight, AlertCircle, Shield, GraduationCap } from 'lucide-react';

function LoginForm() {
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

    // Role-based routing
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
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Access your personalized student or NGO administration dashboard
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
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
        <div className="mt-6 pt-6 border-t border-slate-100">
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

      {/* Footer */}
      <p className="text-center text-xs text-slate-500">
        Are you a new student?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create a student account
        </Link>
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
        <LoginForm />
      </Suspense>
    </div>
  );
}
