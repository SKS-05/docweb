import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define protected routes
  const isProtectedRoute = 
    path.startsWith('/docs') || 
    path.startsWith('/blog') || 
    path === '/send-passwords';

  // Get the token from the cookies
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true';

  // If the route is protected and user is not logged in
  if (isProtectedRoute && !isLoggedIn) {
    // Redirect to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
} 