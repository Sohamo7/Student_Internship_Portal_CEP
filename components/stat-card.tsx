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
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  const iconBgClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-100 text-slate-600',
  }[badgeColor];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-sm hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgClasses}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
