import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-app-pathname', pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );

  // Prevent caching of private auth/profile API responses
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/profile')
  ) {
    response.headers.set('Cache-Control', 'no-store');
  }

  const publicPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/callback';
  const isApiRoute = pathname.startsWith('/api/');
  const hasSessionCookie = request.cookies.has('uaqa_access_token') || request.cookies.has('uaqa_refresh_token');
  if (!publicPage && !isApiRoute && !hasSessionCookie) {
    const redirect = NextResponse.redirect(new URL('/login', request.url));
    for (const [key, value] of response.headers) redirect.headers.set(key, value);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
