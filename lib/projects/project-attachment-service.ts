import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const PROJECT_ATTACHMENTS_BUCKET = 'project-attachments';
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_LOCAL_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB in localStorage
export const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg';

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'zip', 'png', 'jpg', 'jpeg'
];

const LOCAL_STORAGE_KEY = 'cep_project_attachments';
const LOCAL_PREFIX = 'local/projects/';

export function isLocalAttachmentPath(path?: string | null): boolean {
  return Boolean(path && path.startsWith(LOCAL_PREFIX));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateAttachment(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Please upload a supported document (PDF, Word, PowerPoint, Excel, text, zip or image).';
  }
  if (file.size === 0) return 'The selected file is empty.';
  const limit = isSupabaseConfigured() ? MAX_ATTACHMENT_BYTES : MAX_LOCAL_ATTACHMENT_BYTES;
  if (file.size > limit) {
    return `Attachment is too large (${formatFileSize(file.size)}). Maximum limit is ${formatFileSize(limit)}.`;
  }
  return null;
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return (cleaned || 'attachment').slice(-80);
}

function readLocalAttachments(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalAttachments(files: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('Failed to save local attachment:', err);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export interface UploadedAttachment {
  path: string;
  name: string;
  url: string;
}

/**
 * Uploads a project attachment file to Supabase Storage (or localStorage fallback in demo mode).
 */
export async function uploadProjectAttachment(file: File): Promise<UploadedAttachment> {
  const invalid = validateAttachment(file);
  if (invalid) throw new Error(invalid);

  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
  const fileName = safeFileName(file.name);

  if (isSupabaseConfigured()) {
    const path = `projects/${id}/${fileName}`;
    const supabase = createClient();

    try {
      const { error } = await supabase.storage
        .from(PROJECT_ATTACHMENTS_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: true });

      if (!error) {
        const { data } = supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).getPublicUrl(path);
        return { path, name: file.name, url: data.publicUrl };
      }
      console.warn('[attachments] storage bucket upload error, attempting fallback:', error.message);
    } catch (err) {
      console.warn('[attachments] upload exception, falling back to local data URL:', err);
    }
  }

  // Fallback: save as data URL in localStorage
  const path = `${LOCAL_PREFIX}${id}/${fileName}`;
  const dataUrl = await fileToDataUrl(file);
  const files = readLocalAttachments();
  files[path] = dataUrl;
  writeLocalAttachments(files);
  return { path, name: file.name, url: dataUrl };
}

/**
 * Resolves a downloadable / viewable URL for a project attachment.
 */
export async function getProjectAttachmentUrl(
  path?: string | null,
  fallbackUrl?: string | null,
  fileName?: string | null
): Promise<string | null> {
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://') || fallbackUrl.startsWith('data:'))) {
    return fallbackUrl;
  }

  if (isLocalAttachmentPath(path)) {
    const files = readLocalAttachments();
    const dataUrl = path ? files[path] : null;
    if (dataUrl) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        return URL.createObjectURL(blob);
      } catch {
        return dataUrl;
      }
    }
  }

  if (path && isSupabaseConfigured()) {
    const supabase = createClient();
    try {
      const { data } = supabase.storage.from(PROJECT_ATTACHMENTS_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    } catch {
      /* ignore */
    }
  }

  return fallbackUrl || null;
}

/**
 * Triggers a direct download or opens the attachment in a new tab.
 */
export async function downloadAttachment(
  path?: string | null,
  url?: string | null,
  fileName?: string | null
): Promise<void> {
  const resolved = await getProjectAttachmentUrl(path, url, fileName);
  if (!resolved) {
    alert('Attachment URL could not be resolved.');
    return;
  }

  const link = document.createElement('a');
  link.href = resolved;
  link.download = fileName || 'project-attachment';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
