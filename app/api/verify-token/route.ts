import { NextResponse } from "next/server";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE API CREDENTIAL VERIFIER (DEBUG MODE)
 * ==============================================================================================
 * @description Securely verifies Meta (WhatsApp/Instagram) and Telegram tokens.
 * FIXED: Reverted to URL params with encodeURIComponent (bypasses Vercel header drops).
 * ADDED: Smart Gatekeeper for Instagram to prevent users from using IG Basic Display tokens.
 * ==============================================================================================
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { channel, token, phoneId } = await req.json();

        if (!token) return NextResponse.json({ success: false, error: "Token is empty on server." });

        // 🛡️ SECURITY: Aggressive Sanitization
        const cleanToken = token.replace(/[\n\r\s]+/g, '').trim();

        // ==========================================
        // 🟢 TELEGRAM LOGIC (UNTOUCHED)
        // ==========================================
        if (channel === "telegram") {
            const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
            const data = await res.json();
            
            if (data.ok) {
                return NextResponse.json({ success: true, bot: data.result.username });
            } else {
                return NextResponse.json({ success: false, error: "Fake or Expired Telegram Token." });
            }
        } 
        
        // ==========================================
        // 🟢 WHATSAPP LOGIC (UNTOUCHED)
        // ==========================================
        else if (channel === "whatsapp") {
            if (!phoneId) return NextResponse.json({ success: false, error: "WhatsApp Account ID is missing." });

            const cleanPhoneId = phoneId.replace(/[\n\r\s]+/g, '').trim();

            const metaUrl = `https://graph.facebook.com/v18.0/${cleanPhoneId}?access_token=${encodeURIComponent(cleanToken)}`;
            
            const res = await fetch(metaUrl, { method: "GET" });
            const data = await res.json();

            if (data.id) {
                return NextResponse.json({ success: true });
            } else {
                const tokenStart = cleanToken.substring(0, 5) + "...";
                const metaError = data.error?.message || "Unknown Meta Error";
                return NextResponse.json({ 
                    success: false, 
                    error: `${metaError} (Token sent to server starts with: ${tokenStart})` 
                });
            }
        }

        // ==========================================
        // 🟣 INSTAGRAM LOGIC (SMART GATEKEEPER ADDED)
        // ==========================================
        else if (channel === "instagram") {
            if (!phoneId) return NextResponse.json({ success: false, error: "Instagram Account ID is missing." });

            // 🚀 THE SMART GATEKEEPER: Stop users from using the wrong token type immediately
            if (cleanToken.toUpperCase().startsWith("IG") || cleanToken.toUpperCase().startsWith("IGAAN")) {
                return NextResponse.json({ 
                    success: false, 
                    error: "❌ Invalid Token Type: For Instagram Automation, you MUST generate a Page Access Token (starts with EAA...). Basic tokens (IG...) will not work. Please check Meta Developer Console." 
                });
            }

            const cleanPhoneId = phoneId.replace(/[\n\r\s]+/g, '').trim();

            const metaUrl = `https://graph.facebook.com/v18.0/${cleanPhoneId}?access_token=${encodeURIComponent(cleanToken)}`;
            
            const res = await fetch(metaUrl, { method: "GET" });
            const data = await res.json();

            if (data.id) {
                return NextResponse.json({ success: true });
            } else {
                const tokenStart = cleanToken.substring(0, 5) + "...";
                const metaError = data.error?.message || "Unknown Meta Error";
                return NextResponse.json({ 
                    success: false, 
                    error: `${metaError} (Token sent: ${tokenStart})` 
                });
            }
        }

        return NextResponse.json({ success: false, error: "Unknown channel selected." });

    } catch (error: any) {
        console.error("[VERIFICATION_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server validation failed." }, { status: 500 });
    }
}