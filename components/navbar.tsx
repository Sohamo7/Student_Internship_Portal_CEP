'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { GraduationCap, Shield, LogOut, HeartHandshake } from 'lucide-react';

export function Navbar() {
  const { user, profile, role, isConfigured, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                NGO Internship Portal
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase text-indigo-600">
                Week 1 Foundation
              </span>
            </div>
          </Link>

          {/* Environment status indicator */}
          <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {isConfigured ? 'Supabase Connected' : 'Demo / Local Mode'}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user && profile ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                {role === 'admin' ? (
                  <Shield className="h-4 w-4 text-purple-600" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800">
                    {profile.name}
                  </span>
                  <span className="text-[10px] font-medium capitalize text-slate-500">
                    {role === 'admin' ? 'NGO Administrator' : 'Student'}
                  </span>
                </div>
              </div>

              {/* Dashboard Link */}
              <Link
                href={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="inline-flex items-center rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Dashboard
              </Link>

              {/* Logout button */}
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
              >
                Student Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
