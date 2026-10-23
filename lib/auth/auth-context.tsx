'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/supabase/types';
import { getIntakeStatus, loadSettings } from '@/lib/settings/settings-service';
import { getApplicationGateError } from '@/lib/auth/login-gate';

// Extra fields collected on the "New Volunteer" application form (login page apply tab)
export interface ApplicationDetails {
  role?: 'student' | 'intern';
  phone?: string;
  college?: string;
  degree?: string;
  skills?: string;
  program_interest?: string;
  statement_of_purpose?: string;
  // Set by the Apply form after the résumé has been uploaded (see lib/resumes)
  resume_path?: string;
  resume_name?: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    application?: ApplicationDetails
  ) => Promise<{ success: boolean; error?: string }>;
  switchRole?: (targetRole: UserRole) => void;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile?: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setRoleCookie(role: string | null, id: string | null) {
  if (typeof document === 'undefined') return;
  if (role && id) {
    document.cookie = `cep_user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `cep_user_id=${id}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'cep_user_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'cep_user_id=; path=/; max-age=0; SameSite=Lax';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        if (!isConfigured) {
          // No silent fallback to demo accounts or fake sessions
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setRole(null);
            setRoleCookie(null, null);
            setIsLoading(false);
          }
          return;
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          const { data: initialProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          let profileData = initialProfile;

          // If freshly registered and profile trigger is processing, retry once
          if (!profileData && !profileErr) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            if (!isMounted) return;
            const retry = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            profileData = retry.data;
          }

          const restored = profileData as UserProfile | null;

          if (restored) {
            // Apply login gate: pending/rejected volunteers cannot hold an active session
            const gateError = getApplicationGateError(restored.application_status);
            if (gateError) {
              await supabase.auth.signOut();
              if (isMounted) {
                setUser(null);
                setProfile(null);
                setRole(null);
                setRoleCookie(null, null);
              }
            } else if (isMounted) {
              setUser({ id: session.user.id, email: session.user.email || restored.email });
              setProfile(restored);
              setRole(restored.role);
              setRoleCookie(restored.role, session.user.id);
            }
          } else {
            // User authenticated in auth.users but has no profile row
            if (isMounted) {
              setUser(null);
              setProfile(null);
              setRole(null);
              setRoleCookie(null, null);
            }
          }
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setRoleCookie(null, null);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setRoleCookie(null, null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setIsLoading(true);
    try {
      if (!isConfigured) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Supabase authentication is not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        };
      }

      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'Sign-in failed. No user record returned.' };
      }

      let { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileData && !profileErr) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const retry = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        profileData = retry.data;
        profileErr = retry.error;
      }

      if (profileErr || !profileData) {
        setIsLoading(false);
        return {
          success: false,
          error: 'User profile not found. Please ensure database schema has been executed.',
        };
      }

      const userProfile = profileData as UserProfile;

      // Gate portal access: volunteers cannot sign in until an NGO admin approves their application
      const gateError = getApplicationGateError(userProfile.application_status);
      if (gateError) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { success: false, error: gateError };
      }

      setUser({ id: data.user.id, email: data.user.email || userProfile.email });
      setProfile(userProfile);
      setRole(userProfile.role);
      setRoleCookie(userProfile.role, data.user.id);
      setIsLoading(false);
      return { success: true, role: userProfile.role };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: (err as Error).message || 'Authentication failed' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    application?: ApplicationDetails
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!isConfigured) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Supabase authentication is not configured. Applications cannot be saved.',
        };
      }

      // Enforce the admin-configured intake window
      const { settings } = await loadSettings();
      if (!getIntakeStatus(settings.intake).open) {
        setIsLoading(false);
        return { success: false, error: settings.intake.closed_message };
      }

      const normalizedEmail = email.trim().toLowerCase();
      const supabase = createClient();
      const selectedRole = application?.role || 'student';

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            role: selectedRole,
            phone: application?.phone?.trim() || null,
            college: application?.college?.trim() || null,
            degree: application?.degree?.trim() || null,
            skills: application?.skills?.trim() || null,
            program_interest: application?.program_interest || null,
            statement_of_purpose: application?.statement_of_purpose?.trim() || null,
            resume_path: application?.resume_path || null,
            resume_name: application?.resume_name || null,
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // Supabase may return an active session if email confirmation is disabled.
      // Sign out immediately so applicants remain pending until approved by an admin.
      if (data.session) {
        await supabase.auth.signOut();
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: (err as Error).message || 'Registration failed' };
    }
  };

  // Disabled in production: impersonation/role-switching without authentication is disallowed
  const switchRole = (_targetRole: UserRole) => {
    void _targetRole;
    console.warn('Role switching / impersonation without authentication is disabled in production.');
  };

  const refreshProfile = async () => {
    if (!user || !isConfigured) return;
    try {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (data) setProfile(data as UserProfile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (isConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select('*')
          .single();
        if (error) return { success: false, error: error.message };
        if (data) setProfile(data as UserProfile);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to update profile' };
      }
    } else {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { success: true };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      setRoleCookie(null, null);
      setUser(null);
      setProfile(null);
      setRole(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isConfigured,
        login,
        register,
        switchRole,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
