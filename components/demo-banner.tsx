'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Info, Key, CheckCircle2 } from 'lucide-react';

export function DemoBanner() {
  const { isConfigured } = useAuth();

  if (isConfigured) {
    return (
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs text-emerald-800 dark:text-emerald-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span><strong>Live Mode:</strong> Connected to Supabase Auth & Database.</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">RLS Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Week 1 Demo Mode:</strong> Ready for testing. Connect Supabase by setting <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono text-[11px] dark:bg-amber-900/50">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono text-[11px] dark:bg-amber-900/50">.env.local</code>.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Key className="h-3.5 w-3.5" />
            Demo Accounts: <span className="font-mono">student@ngo.org</span> / <span className="font-mono">admin@ngo.org</span> (pw: <span className="font-mono">password123</span>)
          </span>
        </div>
      </div>
    </div>
  );
}
