import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const pathname = request.nextUrl.pathname;
    
    // 🔥 Webhook aur Token verification bypass
    const isWebhook = pathname.startsWith('/api/webhook/');
    const isWidget = pathname.startsWith('/api/widget');
    const isAuth = pathname.startsWith('/api/auth');
    const isVerifyToken = pathname.startsWith('/api/verify-token'); 
    
    const isPublicRoute = isWebhook || isWidget || isAuth || isVerifyToken;

    // Block only completely unauthorized core API calls
    if (pathname.startsWith('/api/') && !isPublicRoute) {
        const allowedOrigins = [
            'https://clawlink.com',
            'https://www.clawlink.com',
            'https://clawlinkai.com', 
            'https://www.clawlinkai.com',
            'http://localhost:3000',
            'https://clawlink-six.vercel.app' // <-- 🔥 Tumhara Vercel Test Domain yahan add kar diya!
        ];

        // If origin is empty, it might be an internal server call
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