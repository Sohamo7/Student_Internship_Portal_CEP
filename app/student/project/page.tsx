'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  Briefcase,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Mail,
  Phone,
  FileCheck
} from 'lucide-react';

export default function StudentProjectPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete NGO onboarding & field safety orientation', done: true },
    { id: 2, title: 'Prepare curriculum for 4-week computer basics class', done: true },
    { id: 3, title: 'Deliver week 1 hands-on workshop at center', done: true },
    { id: 4, title: 'Mid-term evaluation & attendance review with supervisor', done: false },
    { id: 5, title: 'Submit final project report and learning portfolio', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-slate-50/60">
      <Sidebar role="student" />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <div>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                My Assigned Project
              </h1>
              <p className="text-sm text-slate-600">
                Detailed scope, deliverables, and supervisor mentorship details.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs">
              <Briefcase className="h-4 w-4 text-purple-600" />
              Allotted & Active
            </span>
          </div>
        </div>

        {/* Project Overview Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                Education Track
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                Community Digital Literacy Outreach 2026
              </h2>
              <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">
                Empowering secondary school students and village youths with basic computational fluency, typing skills, digital payments awareness, and internet security fundamentals.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-1.5 min-w-[220px]">
              <div className="font-bold text-slate-900">Project Parameters:</div>
              <div className="text-slate-600">Duration: <span className="font-semibold text-slate-800">8 Weeks</span></div>
              <div className="text-slate-600">Target Hours: <span className="font-semibold text-slate-800">120 Hours</span></div>
              <div className="text-slate-600">Deliverables: <span className="font-semibold text-slate-800">5 Milestones</span></div>
            </div>
          </div>

          {/* Supervisor Card */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-base">
                DR
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned NGO Supervisor</span>
                <h3 className="text-sm font-bold text-slate-900">Dr. Arvind Rao</h3>
                <p className="text-xs text-slate-500">Director of Community Engagement, Navodaya Trust</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" /> arvind.rao@ngo.org</span>
              <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" /> +91 98765 43210</span>
            </div>
          </div>
        </div>

        {/* Deliverables Checklist */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">Project Deliverables & Milestones</h2>
          <div className="space-y-3">
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  t.done ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => {}}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`text-xs font-medium flex-1 ${t.done ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                  {t.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {t.done ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
