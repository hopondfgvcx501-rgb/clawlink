/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE EDGE MIDDLEWARE
 * ==============================================================================================
 * @file middleware.ts
 * @description Executes at the Edge (before hitting the server) to prevent DDoS attacks, 
 * spam, and API credit exhaustion using Upstash Redis Sliding Window Rate Limiting.
 * FIXED: Resolved TypeScript 'request.ip' strict typing error. Sourcing IP strictly from Vercel Edge Headers.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis only if keys are present to prevent build crashes
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (redisUrl && redisToken) {
    ratelimit = new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(7, '10 s'), // Strict rule: Max 7 messages per 10 seconds per IP
        analytics: true,
    });
}

export async function middleware(request: NextRequest) {
    // Only apply rate limiting to our webhook endpoints to protect AI credits
    if (request.nextUrl.pathname.startsWith('/api/webhook/')) {
        
        if (!ratelimit) {
            console.warn("[KNOX_WARNING] Upstash Redis credentials missing. DDoS protection is OFFLINE.");
            return NextResponse.next();
        }

        try {
            // 🔥 CRITICAL FIX: Extract IP securely via Vercel Edge Headers to bypass TS strict mode errors
            const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous_attacker';
            
            const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
            
            if (!success) {
                console.error(`[KNOX_SHIELD] DDoS Attempt Blocked from IP: ${ip}`);
                
                // Return a 429 Too Many Requests instantly at the Edge
                return NextResponse.json(
                    { error: "Too many requests. Knox Security DDoS protection active. Please slow down." },
                    { status: 429 }
                );
            }
        } catch (error) {
            console.error("[KNOX_ERROR] Redis Rate Limiter failed to execute:", error);
            // Fail open to avoid blocking legitimate traffic if Redis goes down temporarily
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

// Ensure this middleware ONLY runs on Webhook routes
export const config = {
    matcher: '/api/webhook/:path*',
};