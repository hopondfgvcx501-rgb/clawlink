import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { channel, token, phoneId } = await req.json();

        if (!token) return NextResponse.json({ success: false, error: "Token is empty." });

        if (channel === "telegram") {
            // 🚀 REAL VERIFICATION: Hitting Telegram Servers
            const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await res.json();
            
            if (data.ok) {
                return NextResponse.json({ success: true, bot: data.result.username });
            } else {
                return NextResponse.json({ success: false, error: "Fake or Expired Telegram Token." });
            }
        } 
        
        else if (channel === "whatsapp") {
            if (!phoneId) return NextResponse.json({ success: false, error: "WhatsApp Phone ID is missing." });

            // 🚀 REAL VERIFICATION: Hitting Meta Graph API
            const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}?access_token=${token}`);
            const data = await res.json();

            // If Meta returns an ID, the token and Phone ID are 100% valid
            if (data.id) {
                return NextResponse.json({ success: true });
            } else {
                // Return exact Meta error (e.g., Invalid OAuth access token)
                return NextResponse.json({ success: false, error: data.error?.message || "Fake Token or Invalid Phone ID." });
            }
        }

        return NextResponse.json({ success: false, error: "Unknown channel." });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server validation failed." }, { status: 500 });
    }
}