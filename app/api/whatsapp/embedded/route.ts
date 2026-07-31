import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS for backend updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// 🚨 TG Admin Error Reporter
async function reportErrorToTG(errorMessage: string, email: string) {
    const tgBotToken = process.env.TG_ADMIN_BOT_TOKEN;
    const tgChatId = process.env.TG_ADMIN_CHAT_ID;
    if (!tgBotToken || !tgChatId) return;
    
    await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: tgChatId,
            text: `🚨 *ClawLink Meta 1-Click Error*\n\nUser: ${email}\nReason: ${errorMessage}`
        })
    });
}

export async function POST(req: Request) {
    let body: any = {}; // 🚀 FIX: Declared outside so 'catch' can read it
    try {
        body = await req.json();
        const { email, accessToken, channel } = body;

        if (!email || !accessToken) {
            throw new Error("Missing Email or Meta Access Token from Frontend.");
        }

        // Step 1: Verify token with Meta Graph API
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
        const metaData = await metaRes.json();

        if (metaData.error) {
            throw new Error(`Meta Graph API Rejected Token: ${metaData.error.message}`);
        }

        // Step 2: Save the Permanent Token into Supabase
        const updateData: any = {
            whatsapp_token: accessToken,
            wa_connected: true
        };
        
        const { error: dbError } = await supabase
            .from('user_configs')
            .update(updateData)
            .eq('email', email);

        if (dbError) {
            throw new Error(`Supabase DB Update Failed: ${dbError.message}`);
        }

        return NextResponse.json({ success: true, message: "Meta Infrastructure Linked Successfully!" });

    } catch (error: any) {
        // 🚨 NO ERRORS HIDDEN
        console.error("Meta Embedded Auth Backend Error:", error);
        await reportErrorToTG(error.message || "Unknown Backend Crash", body?.email || "Unknown");
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}