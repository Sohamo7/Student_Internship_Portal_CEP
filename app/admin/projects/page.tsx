'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/sidebar';
import {
  Briefcase,
  Users,
  Plus,
  ArrowLeft,
  Clock,
  Target
} from 'lucide-react';

export default function AdminProjectsPage() {
  const projects = [
    { id: 1, title: 'Community Digital Literacy Outreach', track: 'Education', quota: 5, assigned: 3, supervisor: 'Dr. Arvind Rao' },
    { id: 2, title: 'Rural Healthcare & Nutrition Awareness', track: 'Healthcare', quota: 4, assigned: 2, supervisor: 'Dr. Meera Sen' },
    { id: 3, title: 'Clean Drinking Water & Sanitation', track: 'Environment', quota: 3, assigned: 2, supervisor: 'Er. Rajesh Bose' },
    { id: 4, title: 'Women Empowerment & Vocational Skills', track: 'Vocational', quota: 4, assigned: 4, supervisor: 'Smt. Geeta Joshi' },
  ];

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
                NGO Project Allocation
              </h1>
              <p className="text-sm text-slate-600">
                Manage community impact programs and student intern allocations.
              </p>
            </div>

            <button
              onClick={() => alert('New project form opened in Week 3.')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New Project Program
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                  {p.track}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {p.assigned} / {p.quota} Filled
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Lead Supervisor: <span className="font-semibold text-slate-700">{p.supervisor}</span></p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{ width: `${(p.assigned / p.quota) * 100}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Capacity: {p.quota - p.assigned} slots left</span>
                <button
                  onClick={() => alert(`Opening student mapper for ${p.title}`)}
                  className="font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  Manage Students →
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
