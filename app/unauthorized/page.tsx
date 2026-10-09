'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, GraduationCap } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            403 - Access Restricted
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            NGO Administrator Area
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            This section is strictly reserved for authenticated NGO staff and administrators. Your current student account is not authorized to access administrative operations.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Return to Student Workspace</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
