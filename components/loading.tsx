'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake } from 'lucide-react';

/**
 * Full-screen animated loader shown during auth session restore
 * and during page-level async data fetches.
 */
export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <AnimatePresence>
      <motion.div
        key="page-loader"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Outer ring */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute h-24 w-24 rounded-full border-2 border-indigo-200 dark:border-indigo-800"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute h-16 w-16 rounded-full border-2 border-violet-300 dark:border-violet-700"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />

          {/* Icon + spinner */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30">
            <HeartHandshake className="h-7 w-7 text-white" />
            {/* Spinning arc */}
            <motion.div
              className="absolute -inset-1.5 rounded-2xl border-2 border-transparent border-t-indigo-400 dark:border-t-indigo-300"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>

        <motion.p
          className="mt-8 text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.p>

        {/* Progress bar */}
        <div className="mt-4 h-0.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline skeleton shimmer — use inside page content while data loads.
 */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-6 shadow-xs animate-pulse">
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 rounded bg-slate-100 dark:bg-slate-700/70 mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Row-level skeleton for tables / lists.
 */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/40 px-4 py-3 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-2.5 w-3/5 rounded bg-slate-100 dark:bg-slate-700/60" />
      </div>
      <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-700/60" />
    </div>
  );
}

/**
 * Grid of skeleton stat cards — matches dashboard layout.
 */
export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
