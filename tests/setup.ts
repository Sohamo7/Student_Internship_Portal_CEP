import { beforeEach } from 'vitest';

// Minimal in-memory stand-ins for the browser globals the demo-mode services
// use. NEXT_PUBLIC_SUPABASE_* are not set under test, so isSupabaseConfigured()
// is false and every service takes its localStorage path.

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

const storage = new MemoryStorage();
const globals = globalThis as unknown as Record<string, unknown>;
globals.localStorage = storage;
// Several services guard on `typeof window === 'undefined'` (SSR safety).
globals.window = globals;

beforeEach(() => {
  storage.clear();
});
