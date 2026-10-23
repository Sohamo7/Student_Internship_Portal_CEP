'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DemoBanner() {
  const { isConfigured } = useAuth();

  if (isConfigured) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-300 px-4 py-2 text-xs text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Configuration Required:</strong> Supabase credentials are not set. Please configure{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </span>
        </div>
        <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          Setup Needed
        </span>
      </div>
    </div>
  );
}
