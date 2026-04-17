import { NextResponse } from "next/server";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE API CREDENTIAL VERIFIER (DEBUG MODE)
 * ==============================================================================================
 * @description Securely verifies Meta (WhatsApp/Instagram) and Telegram tokens.
 * FIXED: Reverted to URL params with encodeURIComponent (bypasses Vercel header drops).
 * ADDED: Token footprint logger to identify exact payload corruption on the client side.
 * ==============================================================================================
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { channel, token, phoneId } = await req.json();

        if (!token) return NextResponse.json({ success: false, error: "Token is empty on server." });

        // 🛡️ SECURITY: Aggressive Sanitization
        const cleanToken = token.replace(/[\n\r\s]+/g, '').trim();

        if (channel === "telegram") {
            const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
            const data = await res.json();
            
            if (data.ok) {
                return NextResponse.json({ success: true, bot: data.result.username });
            } else {
                return NextResponse.json({ success: false, error: "Fake or Expired Telegram Token." });
            }
        } 
        
        else if (channel === "whatsapp" || channel === "instagram") {
            if (!phoneId) return NextResponse.json({ success: false, error: "Account ID is missing." });

            const cleanPhoneId = phoneId.replace(/[\n\r\s]+/g, '').trim();

            // 🚀 REAL VERIFICATION: Using Encoded URL to bypass Vercel Header Stripping
            const metaUrl = `https://graph.facebook.com/v18.0/${cleanPhoneId}?access_token=${encodeURIComponent(cleanToken)}`;
            
            const res = await fetch(metaUrl, { method: "GET" });
            const data = await res.json();

            // If Meta returns an ID, the token and ID are valid
            if (data.id) {
                return NextResponse.json({ success: true });
            } else {
                // 🛑 DEBUG TRACKER: Shows the first 5 chars of the token received by the server
                const tokenStart = cleanToken.substring(0, 5) + "...";
                const metaError = data.error?.message || "Unknown Meta Error";
                
                return NextResponse.json({ 
                    success: false, 
                    error: `${metaError} (Token sent to server starts with: ${tokenStart})` 
                });
            }
        }

        return NextResponse.json({ success: false, error: "Unknown channel selected." });

    } catch (error: any) {
        console.error("[VERIFICATION_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server validation failed." }, { status: 500 });
    }
}