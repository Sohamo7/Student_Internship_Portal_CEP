import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Résumé / document upload for the Apply form.
//
//  * Supabase configured  -> file goes to the private "resumes" Storage bucket
//    (see supabase/schema.sql section 9). Admins read it via signed URLs.
//  * Supabase NOT configured (demo mode) -> LOCAL FALLBACK: the file is kept as
//    a data URL in this browser's localStorage. It is never uploaded anywhere,
//    only works on the same browser, and the UI labels it as such.
// ---------------------------------------------------------------------------

export const RESUME_BUCKET = 'resumes';
export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB (matches bucket limit)
export const MAX_LOCAL_RESUME_BYTES = 1 * 1024 * 1024; // localStorage is ~5 MB total
export const RESUME_ACCEPT = '.pdf,.doc,.docx';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const LOCAL_FILES_KEY = 'cep_resume_files';
const LOCAL_PREFIX = 'local/';

export function isLocalResumePath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(LOCAL_PREFIX));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateResume(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Please upload a PDF or Word document (.pdf, .doc, .docx).';
  }
  if (file.size === 0) return 'That file is empty.';
  const limit = isSupabaseConfigured() ? MAX_RESUME_BYTES : MAX_LOCAL_RESUME_BYTES;
  if (file.size > limit) {
    return `File is too large (${formatFileSize(file.size)}). The limit is ${formatFileSize(limit)}${
      isSupabaseConfigured() ? '.' : ' in demo mode.'
    }`;
  }
  return null;
}

function safeFileName(name: string): string {
  // Keep it URL/path safe; the original name is stored separately for display.
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return (cleaned || 'resume').slice(-80);
}

export interface UploadedResume {
  path: string;
  name: string;
  /** Where the bytes actually went — lets the UI be honest about demo mode. */
  storage: 'supabase' | 'local';
}

function readLocalFiles(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_FILES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a résumé and returns where it was stored. Throws an Error with a
 * user-presentable message on failure (callers should stop the submission
 * rather than silently dropping the file).
 */
export async function uploadResume(file: File): Promise<UploadedResume> {
  const invalid = validateResume(file);
  if (invalid) throw new Error(invalid);

  const id = crypto.randomUUID();
  const fileName = safeFileName(file.name);

  if (isSupabaseConfigured()) {
    const path = `applications/${id}/${fileName}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) {
      throw new Error(
        `Résumé upload failed: ${error.message}. If this keeps happening, tell the NGO team (the "resumes" storage bucket may not be set up).`
      );
    }
    return { path, name: file.name, storage: 'supabase' };
  }

  // ---- LOCAL FALLBACK (demo mode only) ----
  const path = `${LOCAL_PREFIX}${id}/${fileName}`;
  const dataUrl = await fileToDataUrl(file);
  try {
    const files = readLocalFiles();
    files[path] = dataUrl;
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  } catch {
    throw new Error('Browser storage is full, so the demo could not keep this file. Try a smaller file.');
  }
  return { path, name: file.name, storage: 'local' };
}

/** Best-effort cleanup if the application fails after the file was stored locally. */
export function discardLocalResume(path: string): void {
  if (!isLocalResumePath(path)) return;
  try {
    const files = readLocalFiles();
    delete files[path];
    localStorage.setItem(LOCAL_FILES_KEY, JSON.stringify(files));
  } catch {
    /* ignore */
  }
}

/**
 * Resolves a URL the admin can open. `download: true` forces a file download
 * with the original name; otherwise the browser may render it inline (PDFs).
 * The URL is short-lived (Supabase) or a temporary blob URL (local demo file).
 */
export async function getResumeUrl(
  path: string,
  fileName: string | null | undefined,
  download: boolean
): Promise<string> {
  if (isLocalResumePath(path)) {
    const dataUrl = readLocalFiles()[path];
    if (!dataUrl) {
      throw new Error('This demo file only exists in the browser that submitted it.');
    }
    const blob = await (await fetch(dataUrl)).blob();
    return URL.createObjectURL(blob);
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(path, 120, download ? { download: fileName || true } : undefined);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Could not create a link to this file.');
  }
  return data.signedUrl;
}
