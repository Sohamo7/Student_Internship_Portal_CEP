'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptInvitePage() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    const search = typeof window !== 'undefined' ? window.location.search || '' : '';
    const target = `/login?setup_password=true${search ? '&' + search.replace(/^\?/, '') : ''}${hash}`;
    router.replace(target);
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-slate-50/60">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        <span>Redirecting to password setup on login page...</span>
      </div>
    </div>
  );
}
