'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

  const glowColor = {
    emerald: 'rgba(16, 185, 129, 0.08)',
    amber: 'rgba(245, 158, 11, 0.08)',
    blue: 'rgba(59, 130, 246, 0.08)',
    purple: 'rgba(139, 92, 246, 0.08)',
    slate: 'rgba(100, 116, 139, 0.06)',
  }[badgeColor];

  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -5);
    setRotateY(((x - centerX) / centerX) * 5);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      whileHover={{
        boxShadow: `0 20px 40px -12px ${glowColor}, 0 8px 16px -8px rgba(0, 0, 0, 0.04)`,
        borderColor: 'rgba(99, 102, 241, 0.2)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 800 }}
    >
      {/* Subtle gradient overlay that appears on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)`,
        }}
        whileHover={{ opacity: 1 }}
      />

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <motion.div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgClasses}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
          {badge && (
            <motion.span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClasses}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            >
              {badge}
            </motion.span>
          )}
        </div>
        {subtitle && (
          <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
