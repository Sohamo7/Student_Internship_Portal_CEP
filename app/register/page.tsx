'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The volunteer application form now lives on the login page as the "Apply"
// tab (see /app/login/page.tsx), so that new volunteers and existing
// volunteers land in one place. This route is kept so existing links
// (navbar, landing page CTAs, bookmarks) continue to work.
export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?tab=apply');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-slate-50/60">
      <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span>Redirecting to the internship application...</span>
      </div>
    </div>
  );
}
