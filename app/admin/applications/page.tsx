'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  FileText,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Check,
  X
} from 'lucide-react';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([
    { id: 1, name: 'Rahul Sharma', email: 'rahul@dtu.edu', college: 'Delhi Tech Univ', track: 'Digital Literacy', date: 'Sep 03, 2026', status: 'Pending' },
    { id: 2, name: 'Ananya Verma', email: 'ananya@bits.edu', college: 'BITS Pilani', track: 'Rural Healthcare', date: 'Sep 02, 2026', status: 'Approved' },
    { id: 3, name: 'Rohan Iyer', email: 'rohan@mu.ac.in', college: 'Mumbai University', track: 'Clean Water Initiative', date: 'Sep 02, 2026', status: 'Pending' },
    { id: 4, name: 'Sneha Kulkarni', email: 'sneha@coep.ac.in', college: 'COEP Pune', track: 'Women Empowerment', date: 'Sep 01, 2026', status: 'Approved' },
    { id: 5, name: 'Aditya Mehta', email: 'aditya@iitb.ac.in', college: 'IIT Bombay', track: 'Digital Literacy', date: 'Aug 31, 2026', status: 'Pending' },
  ]);

  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const updateStatus = (id: number, newStatus: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const filtered = applications.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.college.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="admin" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        <div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Console
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Review Student Applications
              </h1>
              <p className="text-sm text-slate-600">
                Evaluate prospective interns and assign admissions with instant status updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                {applications.filter(a => a.status === 'Pending').length} Pending Intake
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicant name or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {['All', 'Pending', 'Approved', 'Declined'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Applicant</th>
                <th className="px-6 py-3.5 text-left">University</th>
                <th className="px-6 py-3.5 text-left">Program Track</th>
                <th className="px-6 py-3.5 text-left">Applied Date</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{app.name}</div>
                    <div className="text-[11px] text-slate-400">{app.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{app.college}</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                      {app.track}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{app.date}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${
                      app.status === 'Approved'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : app.status === 'Declined'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => updateStatus(app.id, 'Approved')}
                        className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Approve Applicant"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'Declined')}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Decline Applicant"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
