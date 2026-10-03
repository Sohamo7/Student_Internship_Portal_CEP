'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { acceptDemoInvite, readDemoInvites } from '@/lib/admins/admin-service';
import { AlertCircle, ArrowRight, Loader2, Lock, ShieldCheck, User } from 'lucide-react';

const INPUT =
  'block w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20';

type Phase = 'checking' | 'ready' | 'invalid';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoToken = searchParams.get('demo_token');
  const configured = isSupabaseConfigured();

  const [phase, setPhase] = useState<Phase>('checking');
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Establish who is accepting the invite.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // ---- Demo mode ----
      if (!configured) {
        const invite = readDemoInvites().find((i) => i.token === demoToken);
        if (cancelled) return;
        if (!invite) {
          setProblem('This invite link is invalid or has already been used.');
          setPhase('invalid');
          return;
        }
        setName(invite.name);
        setEmail(invite.email);
        setPhase('ready');
        return;
      }

      // ---- Supabase mode ----
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashError = hash.get('error_description');

      // getSession() waits for the client's own URL handling to finish, so
      // check it first; only fall back to manual handling if it found nothing.
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash) {
          await supabase.auth.verifyOtp({ type: 'invite', token_hash: tokenHash });
        }
        ({ data: { session } } = await supabase.auth.getSession());
      }

      if (cancelled) return;
      if (!session?.user) {
        setProblem(
          hashError
            ? `${hashError.replace(/\+/g, ' ')}. Ask the admin who invited you to send a new invite.`
            : 'This invite link is invalid or has expired. Ask the admin who invited you to send a new invite.'
        );
        setPhase('invalid');
        return;
      }

      // Don't leave tokens sitting in the address bar.
      window.history.replaceState(null, '', window.location.pathname);
      setEmail(session.user.email || '');
      setName((session.user.user_metadata?.name as string) || '');
      setPhase('ready');
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [configured, demoToken, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Please enter your name.');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSaving(true);
    try {
      if (!configured) {
        const result = acceptDemoInvite(demoToken || '', name, password);
        if (!result.success) throw new Error(result.error);
      } else {
        const supabase = createClient();
        const { data: userData, error: pwErr } = await supabase.auth.updateUser({
          password,
          data: { name: name.trim() },
        });
        if (pwErr) throw new Error(pwErr.message);

        // Mark the invite as accepted (a user may update their own profile row).
        const userId = userData.user?.id;
        if (userId) {
          await supabase
            .from('profiles')
            .update({ name: name.trim(), invite_accepted_at: new Date().toISOString() })
            .eq('id', userId);
        }
      }
      // Route the new admin to sign in with their password.
      router.push('/login');
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Could not finish setting up your account.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Join as NGO admin</h2>
        <p className="mt-2 text-sm text-slate-600">Choose a password to activate your admin account.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        {phase === 'checking' && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your invite...
          </div>
        )}

        {phase === 'invalid' && (
          <div className="space-y-4 text-center">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-left text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{problem}</span>
            </div>
            <a href="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
              Go to sign in
            </a>
          </div>
        )}

        {phase === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!configured && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
                Demo mode: this account is created in this browser only.
              </p>
            )}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input
                readOnly
                value={email}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Full name</label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Create password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Confirm password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={INPUT}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>Activate account</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 p-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        }
      >
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
