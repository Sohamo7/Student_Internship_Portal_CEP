'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/supabase/types';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (targetRole: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setRoleCookie(role: string | null, id: string | null) {
  if (role && id) {
    document.cookie = `cep_user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `cep_user_id=${id}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'cep_user_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'cep_user_id=; path=/; max-age=0; SameSite=Lax';
  }
}

const DEMO_ACCOUNTS: Record<string, { password: string; profile: UserProfile }> = {
  'student@ngo.org': {
    password: 'password123',
    profile: {
      id: 'demo-student-uuid-001',
      name: 'Rahul Sharma',
      email: 'student@ngo.org',
      role: 'student',
      created_at: new Date().toISOString(),
    },
  },
  'admin@ngo.org': {
    password: 'password123',
    profile: {
      id: 'demo-admin-uuid-001',
      name: 'Priya Patel (Director)',
      email: 'admin@ngo.org',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    async function loadSession() {
      try {
        if (isConfigured) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileData) {
              setProfile(profileData as UserProfile);
              setRole(profileData.role as UserRole);
              setRoleCookie(profileData.role, session.user.id);
            }
          }
        } else {
          const savedSession = localStorage.getItem('cep_demo_session');
          if (savedSession) {
            const parsed = JSON.parse(savedSession) as UserProfile;
            setUser({ id: parsed.id, email: parsed.email });
            setProfile(parsed);
            setRole(parsed.role);
            setRoleCookie(parsed.role, parsed.id);
          } else {
            // Default demo session: student
            const defaultStudent = DEMO_ACCOUNTS['student@ngo.org'].profile;
            setUser({ id: defaultStudent.id, email: defaultStudent.email });
            setProfile(defaultStudent);
            setRole('student');
            setRoleCookie('student', defaultStudent.id);
            localStorage.setItem('cep_demo_session', JSON.stringify(defaultStudent));
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [isConfigured]);

  const switchRole = (targetRole: UserRole) => {
    if (targetRole === 'admin') {
      const adminProfile = DEMO_ACCOUNTS['admin@ngo.org'].profile;
      setUser({ id: adminProfile.id, email: adminProfile.email });
      setProfile(adminProfile);
      setRole('admin');
      setRoleCookie('admin', adminProfile.id);
      localStorage.setItem('cep_demo_session', JSON.stringify(adminProfile));
      router.push('/admin/dashboard');
    } else {
      const studentProfile = DEMO_ACCOUNTS['student@ngo.org'].profile;
      setUser({ id: studentProfile.id, email: studentProfile.email });
      setProfile(studentProfile);
      setRole('student');
      setRoleCookie('student', studentProfile.id);
      localStorage.setItem('cep_demo_session', JSON.stringify(studentProfile));
      router.push('/student/dashboard');
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileErr || !profileData) {
            setIsLoading(false);
            return { success: false, error: 'User profile not found. Ensure schema.sql is executed.' };
          }

          const userProfile = profileData as UserProfile;
          setUser({ id: data.user.id, email: data.user.email || '' });
          setProfile(userProfile);
          setRole(userProfile.role);
          setRoleCookie(userProfile.role, data.user.id);
          setIsLoading(false);
          return { success: true, role: userProfile.role };
        }
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const storedUsers = JSON.parse(localStorage.getItem('cep_registered_users') || '{}');
        const candidate = DEMO_ACCOUNTS[normalizedEmail] || storedUsers[normalizedEmail];

        if (candidate) {
          if (candidate.password === password) {
            const loggedInProfile: UserProfile = candidate.profile;
            setUser({ id: loggedInProfile.id, email: loggedInProfile.email });
            setProfile(loggedInProfile);
            setRole(loggedInProfile.role);
            setRoleCookie(loggedInProfile.role, loggedInProfile.id);
            localStorage.setItem('cep_demo_session', JSON.stringify(loggedInProfile));
            setIsLoading(false);
            return { success: true, role: loggedInProfile.role };
          } else {
            setIsLoading(false);
            return { success: false, error: 'Invalid password.' };
          }
        } else {
          setIsLoading(false);
          return { success: false, error: 'No account found with this email. Try registering or use demo credentials.' };
        }
      }

      return { success: false, error: 'Unexpected authentication state' };
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: (err as Error).message || 'Authentication failed' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isConfigured) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name.trim() },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          const initialProfile: UserProfile = {
            id: data.user.id,
            name: name.trim(),
            email: normalizedEmail,
            role: 'student',
          };
          setProfile(initialProfile);
          setRole('student');
          setRoleCookie('student', data.user.id);
        }

        setIsLoading(false);
        return { success: true };
      } else {
        const storedUsers = JSON.parse(localStorage.getItem('cep_registered_users') || '{}');
        if (DEMO_ACCOUNTS[normalizedEmail] || storedUsers[normalizedEmail]) {
          setIsLoading(false);
          return { success: false, error: 'An account with this email already exists.' };
        }

        const newId = `student-${Date.now()}`;
        const newProfile: UserProfile = {
          id: newId,
          name: name.trim(),
          email: normalizedEmail,
          role: 'student',
          created_at: new Date().toISOString(),
        };

        storedUsers[normalizedEmail] = {
          password,
          profile: newProfile,
        };
        localStorage.setItem('cep_registered_users', JSON.stringify(storedUsers));
        
        setUser({ id: newId, email: normalizedEmail });
        setProfile(newProfile);
        setRole('student');
        setRoleCookie('student', newId);
        localStorage.setItem('cep_demo_session', JSON.stringify(newProfile));

        setIsLoading(false);
        return { success: true };
      }
    } catch (err: unknown) {
      setIsLoading(false);
      return { success: false, error: (err as Error).message || 'Registration failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem('cep_demo_session');
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
