'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Info, Key, CheckCircle2, ArrowRight } from 'lucide-react';

export function DemoBanner() {
  const { isConfigured, role, switchRole } = useAuth();

  if (isConfigured) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span><strong>Live Mode:</strong> Connected to Supabase Auth & Database.</span>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">RLS Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Connected Mode:</strong> You can switch seamlessly between dashboards anytime.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-600 font-medium">Quick Jump:</span>
          <button
            onClick={() => switchRole('student')}
            className={`rounded-md px-2 py-1 font-semibold border transition-all cursor-pointer ${
              role === 'student'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white text-indigo-700 border-slate-200 hover:bg-indigo-50'
            }`}
          >
            🎓 Student Dashboard
          </button>
          <button
            onClick={() => switchRole('admin')}
            className={`rounded-md px-2 py-1 font-semibold border transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-white text-purple-700 border-slate-200 hover:bg-purple-50'
            }`}
          >
            🛡️ Admin Console
          </button>
        </div>
      </div>
    </div>
  );
}
