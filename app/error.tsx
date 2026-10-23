'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Shown when a page crashes at runtime. Without this, visitors would see a
// blank screen / the framework's raw error page.
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-slate-50/60 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800/80 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We hit an unexpected problem loading this page. Your data is safe — please try again.
          </p>
          {error.digest && <p className="mt-2 text-[11px] text-slate-400">Reference: {error.digest}</p>}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
