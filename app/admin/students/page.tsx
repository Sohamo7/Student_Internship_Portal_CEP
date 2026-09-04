'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  Users,
  Search,
  ArrowLeft,
  Mail,
  Award,
  GraduationCap
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const students = [
    { id: 1, name: 'Rahul Sharma', email: 'student@ngo.org', project: 'Community Digital Literacy', attendance: '95.8%', logs: 3, status: 'Active' },
    { id: 2, name: 'Ananya Verma', email: 'ananya@bits.edu', project: 'Rural Healthcare & Nutrition', attendance: '100%', logs: 4, status: 'Active' },
    { id: 3, name: 'Sneha Kulkarni', email: 'sneha@coep.ac.in', project: 'Women Empowerment Camp', attendance: '91.2%', logs: 3, status: 'Active' },
    { id: 4, name: 'Vikram Choudhury', email: 'vikram@iitd.ac.in', project: 'Clean Water Initiative', attendance: '88.5%', logs: 2, status: 'Active' },
    { id: 5, name: 'Kavita Nair', email: 'kavita@du.ac.in', project: 'Community Digital Literacy', attendance: '94.0%', logs: 4, status: 'Active' },
  ];

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.project.toLowerCase().includes(search.toLowerCase())
  );

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
                Student Directory
              </h1>
              <p className="text-sm text-slate-600">
                Active student interns, project placements, and performance metrics.
              </p>
            </div>

            <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {students.length} Registered Interns
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or assigned project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5 text-left">Student</th>
                <th className="px-6 py-3.5 text-left">Assigned Project</th>
                <th className="px-6 py-3.5 text-left">Attendance Rate</th>
                <th className="px-6 py-3.5 text-left">Logs Submitted</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{s.project}</td>
                  <td className="px-6 py-4 font-bold text-emerald-700">{s.attendance}</td>
                  <td className="px-6 py-4 font-mono font-semibold">{s.logs} reports</td>
                  <td className="px-6 py-4 text-right">
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {s.status}
                    </span>
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
