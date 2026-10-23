import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 bg-slate-50/60">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Compass className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Page not found</h1>
          <p className="mt-2 text-sm text-slate-600">The page you were looking for doesn&apos;t exist or has moved.</p>
        </div>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
