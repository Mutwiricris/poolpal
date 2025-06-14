import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/', '/api'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next();
  }
  
  // Check for auth token cookie
  const authToken = request.cookies.get('auth-token')?.value;
  
  if (!authToken) {
    // Redirect to login if no auth token
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // User has auth token, allow access
  // The client-side auth context will handle validation
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Apply to all routes except public assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
