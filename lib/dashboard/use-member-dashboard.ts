'use client';

import { useEffect, useState } from 'react';
import { MemberDashboardStats, loadMemberDashboard } from '@/lib/dashboard/stats';

/** Loads the signed-in student/intern's live dashboard figures. null until ready. */
export function useMemberDashboard(user: { id: string; email: string } | null): MemberDashboardStats | null {
  const [stats, setStats] = useState<MemberDashboardStats | null>(null);
  const userId = user?.id;
  const userEmail = user?.email;

  useEffect(() => {
    if (!userId || !userEmail) return;
    let cancelled = false;
    loadMemberDashboard({ id: userId, email: userEmail })
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((err) => console.error('Failed to load dashboard stats:', err));
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail]);

  return stats;
}
