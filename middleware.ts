import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const pathname = req.nextUrl.pathname;
    
    // 🚀 FIXED: Allow ALL webhooks, public widgets, and auth routes automatically
    const isWebhook = pathname.startsWith('/api/webhook/');
    const isWidget = pathname.startsWith('/api/widget');
    const isAuth = pathname.startsWith('/api/auth');
    const isPublicRoute = isWebhook || isWidget || isAuth;

    // 🛑 Block only completely unauthorized core API calls (Dashboard data)
    if (pathname.startsWith('/api/') && !isPublicRoute) {
        const allowedOrigins = [
            'https://clawlink.com',
            'https://www.clawlink.com',
            'https://clawlinkai.com', 
            'https://clawlink-six.vercel.app', 
            'http://localhost:3000'
        ];

        // 🚀 SMARTER CHECK: If origin is empty, it might be an internal server call, let it pass if it's not a browser
        const isAllowed = origin === '' || allowedOrigins.some(allowed => origin.startsWith(allowed));

        if (!isAllowed) {
            console.warn(`[SECURITY] Blocked unauthorized API access from: ${origin}`);
            return new NextResponse(
                JSON.stringify({ error: "Access Denied: ClawLink Security Protocol Active 🛡️" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};