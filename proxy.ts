import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const userRole = request.cookies.get('cep_user_role')?.value;
  const userId = request.cookies.get('cep_user_id')?.value;
  const isAuthenticated = Boolean(userRole && userId);

  // 1. Guard Student & Intern Routes (/student/*, /intern/*)
  if (pathname.startsWith('/student') || pathname.startsWith('/intern')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole === 'admin') {
      // Admin should not be navigating as a student/intern
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // 2. Guard Admin Routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'admin') {
      // Student/Intern is blocked from accessing NGO Admin dashboard (Task 9 & Security Rule)
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 3. If already authenticated and accessing /login or /register, redirect to active dashboard
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (userRole === 'intern') {
      return NextResponse.redirect(new URL('/intern/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  return NextResponse.next();
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
