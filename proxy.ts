import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isProtected =
    pathname.startsWith('/student') ||
    pathname.startsWith('/intern') ||
    pathname.startsWith('/admin');

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (!isSupabaseConfigured()) {
    if (isProtected) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Server-side session verification via Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Guard protected routes (/student/*, /intern/*, /admin/*)
  if (isProtected) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify role and approval status against database (profiles table)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, application_status, invited_at, invite_accepted_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Gate pending or rejected applicants
    if (profile.role !== 'admin' && profile.application_status !== 'approved') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes strictly require role === 'admin'
    if (pathname.startsWith('/admin')) {
      if (profile.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      // If invited admin has not accepted invite / set password yet:
      if (profile.invited_at && !profile.invite_accepted_at) {
        const setupUrl = new URL('/login', request.url);
        setupUrl.searchParams.set('setup_password', 'true');
        return NextResponse.redirect(setupUrl);
      }
    }

    // Admin should not navigate student/intern routes
    if ((pathname.startsWith('/student') || pathname.startsWith('/intern')) && profile.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Students cannot access intern-specific routes
    if (pathname.startsWith('/intern') && profile.role === 'student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }

    // Interns navigating student routes -> route to intern dashboard
    if (pathname.startsWith('/student') && profile.role === 'intern') {
      return NextResponse.redirect(new URL('/intern/dashboard', request.url));
    }
  }

  // 2. If already authenticated and accessing login/register, route to active dashboard
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, application_status, invited_at, invite_accepted_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && (profile.role === 'admin' || profile.application_status === 'approved')) {
      // Invited admin who has not accepted/set password stays on /login to set it
      if (profile.role === 'admin' && profile.invited_at && !profile.invite_accepted_at) {
        return response;
      }

      if (profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (profile.role === 'intern') {
        return NextResponse.redirect(new URL('/intern/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/student/:path*',
    '/intern/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
