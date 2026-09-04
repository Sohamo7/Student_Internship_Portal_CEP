import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  icon: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'blue',
  icon,
}: StatCardProps) {
  const badgeClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  }[badgeColor];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        {badge && (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
