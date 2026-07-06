import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const pathname = request.nextUrl.pathname;
    
    // Allow all webhooks, public widgets, and authentication routes automatically
    const isWebhook = pathname.startsWith('/api/webhook/');
    const isWidget = pathname.startsWith('/api/widget');
    const isAuth = pathname.startsWith('/api/auth');
    const isPublicRoute = isWebhook || isWidget || isAuth;

    // Block unauthorized core API calls
    if (pathname.startsWith('/api/') && !isPublicRoute) {
        const allowedOrigins = [
            'https://clawlink.com',
            'https://www.clawlink.com',
            'https://clawlinkai.com', 
            'https://www.clawlinkai.com',
            'http://localhost:3000'
        ];

        // Allow internal server calls where origin might be empty
        const isAllowed = origin === '' || allowedOrigins.some(allowed => origin.startsWith(allowed));

        if (!isAllowed) {
            console.warn(`[SECURITY] Blocked unauthorized API access from: ${origin}`);
            return new NextResponse(
                JSON.stringify({ error: "Access Denied: ClawLink Security Protocol Active" }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    return NextResponse.next();
}
// The invalid 'config' export has been completely removed to satisfy the compiler.