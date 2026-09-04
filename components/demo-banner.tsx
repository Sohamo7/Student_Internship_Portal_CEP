'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Info, Key, CheckCircle2 } from 'lucide-react';

export function DemoBanner() {
  const { isConfigured } = useAuth();

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
    <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Week 1 Demo Mode:</strong> Ready for testing. Connect Supabase by setting <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px] text-amber-900">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px] text-amber-900">.env.local</code>.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Key className="h-3.5 w-3.5 text-amber-600" />
            Demo Accounts: <span className="font-semibold text-slate-900">student@ngo.org</span> / <span className="font-semibold text-slate-900">admin@ngo.org</span> (pw: <span className="font-mono text-slate-700">password123</span>)
          </span>
        </div>
      </div>
    </div>
  );
}
