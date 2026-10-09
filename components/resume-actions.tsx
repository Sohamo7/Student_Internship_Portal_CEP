'use client';

import React, { useState } from 'react';
import { Download, Eye, Loader2, FileText } from 'lucide-react';
import { getResumeUrl, isLocalResumePath } from '@/lib/resumes/resume-service';

/**
 * View / Download buttons for an applicant's résumé (admin review screen).
 * Signed URLs are created on click so they are always fresh.
 */
export function ResumeActions({
  path,
  fileName,
}: {
  path?: string | null;
  fileName?: string | null;
}) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!path) return <span className="text-slate-400">None</span>;

  const local = isLocalResumePath(path);

  const open = async (mode: 'view' | 'download') => {
    setBusy(mode);
    setError(null);
    try {
      const url = await getResumeUrl(path, fileName, mode === 'download');
      if (mode === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'resume';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file.');
    } finally {
      setBusy(null);
    }
  };

  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[11px] text-slate-600">
        <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
        <span className="max-w-[140px] truncate font-medium" title={fileName || undefined}>
          {fileName || 'Résumé'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => open('view')} disabled={busy !== null} className={btn} title="Open in a new tab">
          {busy === 'view' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />} View
        </button>
        <button type="button" onClick={() => open('download')} disabled={busy !== null} className={btn} title="Download file">
          {busy === 'download' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Download
        </button>
      </div>
      {local && (
        <p className="text-[10px] font-semibold text-amber-700">Demo file — stored in this browser only</p>
      )}
      {error && <p className="text-[10px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
