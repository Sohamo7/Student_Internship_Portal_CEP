'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const { role, logout } = useAuth();

  const returnDashboard = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          403 — Access Restricted
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Your account role (<span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{role || 'guest'}</span>) does not have permission to access this page. Per the security policy, students cannot view the NGO administration portal.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {role ? (
            <Link
              href={returnDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Login</span>
            </Link>
          )}

          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home Page</span>
            </Link>
            {role && (
              <button
                onClick={() => logout()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Switch Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
