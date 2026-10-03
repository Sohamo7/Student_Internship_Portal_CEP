'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  AdminMember,
  fetchAdmins,
  inviteAdmin,
  revokeInvite,
} from '@/lib/admins/admin-service';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

const INPUT =
  'block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20';

export default function AdminTeamPage() {
  const { profile } = useAuth();
  const configured = isSupabaseConfigured();

  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; link?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setAdmins(await fetchAdmins());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setCopied(false);
    if (!name.trim() || !email.trim()) {
      setError('Please enter the new admin’s name and email.');
      return;
    }
    setSending(true);
    const result = await inviteAdmin(name, email, profile?.email);
    setSending(false);

    if (!result.success) {
      setError(result.error || 'Could not send the invite.');
      return;
    }
    if (result.emailSent) {
      setNotice({ text: `Invite emailed to ${email.trim().toLowerCase()}. They’ll set their own password from the link.` });
    } else {
      setNotice({
        text: configured
          ? 'The invite was created, but the email could not be sent (is RESEND_API_KEY set?). Send this one-time link to them yourself:'
          : 'Demo mode: no email is sent. Open or copy this link to complete the invite:',
        link: result.inviteLink,
      });
    }
    setName('');
    setEmail('');
    await load();
  };

  const handleRevoke = async (member: AdminMember) => {
    if (!window.confirm(`Revoke the pending invite for ${member.email}?`)) return;
    setBusyId(member.id);
    const result = await revokeInvite(member);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || 'Could not revoke the invite.');
      return;
    }
    await load();
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Admin Team</h1>
          <p className="text-sm text-slate-600">
            Invite colleagues to manage the portal. They get an email link to set their own password — no database
            access needed.
          </p>
          {!configured && (
            <p className="mt-2 text-[11px] font-semibold text-amber-700">
              Demo mode: invites are kept in this browser and no email is sent.
            </p>
          )}
        </div>

        {/* Invite form */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs space-y-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-purple-500" /> Invite a new admin
          </h2>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{notice.text}</span>
              </div>
              {notice.link && (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={notice.link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyLink(notice.link as string)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleInvite} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anita Deshmukh"
                  className={INPUT}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anita@yourngo.org"
                  className={INPUT}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send invite
              </button>
              <p className="mt-2 text-[11px] text-slate-400">
                Admins can review applications, manage projects and invite other admins. Only invite people you trust.
              </p>
            </div>
          </form>
        </section>

        {/* Team list */}
        <section className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5 text-left">Admin</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-left">Invited by</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{a.name}</div>
                      <div className="text-[11px] text-slate-400">{a.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${
                          a.status === 'active'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        {a.status === 'active' ? 'Active' : 'Invite pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{a.invited_by_email || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'invited' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(a)}
                          disabled={busyId === a.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                          title="Revoke invite (to resend, just invite the same email again)"
                        >
                          <X className="h-3 w-3" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
