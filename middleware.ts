import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Yeh function har request se pehle chalega
export function middleware(request: NextRequest) {
  // 🚀 NAYA TARIQA: Vercel Edge ab header mein country bhejta hai
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  
  const response = NextResponse.next();
  
  // Browser mein ek cookie set kar do jise hum frontend pe padh sakein
  response.cookies.set('user-country', country, { 
    httpOnly: false, // Frontend JS access allowed
    path: '/',
  });
  
  return response;
}

// Sirf homepage par apply karo
export const config = {
  matcher: '/',
};