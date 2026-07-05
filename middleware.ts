import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CLAWLINK EDGE MIDDLEWARE FOR CLOUDFLARE
export function middleware(request: NextRequest) {
  // Pass all requests smoothly
  return NextResponse.next();
}

// Force Cloudflare Edge Runtime
export const config = {
  runtime: 'edge', 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};