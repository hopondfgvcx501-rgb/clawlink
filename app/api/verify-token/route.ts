import { NextResponse } from "next/server";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE API CREDENTIAL VERIFIER
 * ==============================================================================================
 * @file app/api/verify-token/route.ts
 * @description Securely verifies Meta (WhatsApp/Instagram) and Telegram tokens before saving.
 * 🚀 FIXED: Implemented strict sanitization to remove hidden line breaks from copy-pasting.
 * 🚀 FIXED: Sent token via Authorization Header instead of URL param to fix Meta parsing errors.
 * ==============================================================================================
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { channel, token, phoneId } = await req.json();

        if (!token) return NextResponse.json({ success: false, error: "Token is empty." });

        // 🛡️ SECURITY: Aggressive Sanitization (Removes hidden spaces, tabs, and newlines)
        const cleanToken = token.replace(/[\n\r\s]+/g, '').trim();

        if (channel === "telegram") {
            // 🚀 REAL VERIFICATION: Hitting Telegram Servers
            const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
            const data = await res.json();
            
            if (data.ok) {
                return NextResponse.json({ success: true, bot: data.result.username });
            } else {
                return NextResponse.json({ success: false, error: "Fake or Expired Telegram Token." });
            }
        } 
        
        else if (channel === "whatsapp" || channel === "instagram") {
            if (!phoneId) return NextResponse.json({ success: false, error: "Meta Phone/Account ID is missing." });

            // Clean the ID as well
            const cleanPhoneId = phoneId.replace(/[\n\r\s]+/g, '').trim();

            // 🚀 REAL VERIFICATION: Hitting Meta Graph API using Secure Bearer Headers
            const res = await fetch(`https://graph.facebook.com/v18.0/${cleanPhoneId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${cleanToken}`,
                    "Content-Type": "application/json"
                }
            });
            
            const data = await res.json();

            // If Meta returns an ID, the token and ID are 100% valid
            if (data.id) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ success: false, error: data.error?.message || "Fake Token or Invalid Account ID." });
            }
        }

        return NextResponse.json({ success: false, error: "Unknown channel selected." });

    } catch (error: any) {
        console.error("[VERIFICATION_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server validation failed." }, { status: 500 });
    }
}