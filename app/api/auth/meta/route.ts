import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Setup
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// TG Admin Error Reporter
async function reportErrorToTG(errorMessage: string) {
    const tgBotToken = process.env.TG_ADMIN_BOT_TOKEN;
    const tgChatId = process.env.TG_ADMIN_CHAT_ID;
    if (!tgBotToken || !tgChatId) return;
    
    await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: tgChatId,
            text: `🚨 *ClawLink Meta Auth Error*\n\nReason: ${errorMessage}`
        })
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { accessToken, userId } = body; // Token from frontend Meta SDK

        if (!accessToken) {
            throw new Error("Meta Access Token is missing from frontend request.");
        }

        // 1. Exchange token with Meta to get WABA ID & Phone Number ID
        // (This is a simplified Meta Graph API call, you will need exact endpoints based on Meta docs)
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
        const metaData = await metaRes.json();

        if (metaData.error) {
            throw new Error(`Meta Graph API Error: ${metaData.error.message}`);
        }

        // 2. Extract specific Phone ID and WABA ID (Logic depends on Meta response structure)
        // Dummy extraction for architecture reference:
        const wabaId = "extracted_waba_id"; 
        const phoneId = "extracted_phone_id";

        // 3. Save to Supabase user_configs
        const { error: dbError } = await supabase
            .from('user_configs')
            .update({
                whatsapp_phone_id: phoneId,
                whatsapp_waba_id: wabaId,
                whatsapp_access_token: accessToken,
                wa_connected: true
            })
            .eq('id', userId);

        if (dbError) throw new Error(`Supabase DB Error: ${dbError.message}`);

        return NextResponse.json({ success: true, message: "Agent Live Successfully!" });

    } catch (error: any) {
        // NEVER HIDE ERRORS: Send exact issue to TG Admin
        await reportErrorToTG(error.message || "Unknown error in Meta Auth Route");
        console.error("Backend Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}