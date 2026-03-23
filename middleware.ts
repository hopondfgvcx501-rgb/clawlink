import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const isApi = req.nextUrl.pathname.startsWith('/api/');
    const isWebhook = req.nextUrl.pathname.startsWith('/api/webhook/');

    // 🛑 Block unauthorized API calls, but allow Webhooks (Telegram/WhatsApp meta servers)
    if (isApi && !isWebhook) {
        const allowedOrigins = [
            'https://clawlink.com',
            'https://www.clawlink.com',
            'https://clawlinkai.com', 
            'https://clawlink-six.vercel.app', 
            'http://localhost:3000'
        ];

        const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

        // Agar request in authorized domains se nahi aayi, toh block kardo
        if (!origin || !isAllowed) {
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