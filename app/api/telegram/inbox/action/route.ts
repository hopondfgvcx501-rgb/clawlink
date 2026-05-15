/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: CRM ACTION API (HUMAN TAKEOVER)
 * ==============================================================================================
 * @file app/api/telegram/inbox/action/route.ts
 * @description Handles Manual Messaging and AI Pause/Resume toggling.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, chatId, message, action, currentStatus } = body;

        if (!email || !chatId) return NextResponse.json({ success: false, error: "Missing identity" }, { status: 400 });

        // ACTION 1: TOGGLE AI PAUSE/RESUME
        if (action === "toggle_pause") {
            const { error } = await supabaseAdmin
                .from("crm_controls")
                .upsert({ 
                    owner_email: email.toLowerCase(), 
                    platform_chat_id: chatId.toString(), 
                    is_ai_paused: !currentStatus,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'owner_email,platform_chat_id' });
            
            if (error) throw error;
            return NextResponse.json({ success: true, newStatus: !currentStatus });
        }

        // ACTION 2: SEND MANUAL MESSAGE
        if (action === "send_message") {
            // 1. Get Bot Token
            const { data: config } = await supabaseAdmin.from("user_configs").select("telegram_token").eq("email", email.toLowerCase()).single();
            if (!config?.telegram_token) throw new Error("Bot token not found.");

            // 2. Dispatch to Telegram
            const tgRes = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });

            if (!tgRes.ok) throw new Error("Telegram API delivery failed.");

            // 3. Log to Chat History as 'human_agent'
            await supabaseAdmin.from("chat_history").insert({
                email: email.toLowerCase(),
                platform: "telegram",
                platform_chat_id: chatId.toString(),
                sender_type: "bot", // Displayed as Bot in customer's TG
                message: message,
                customer_name: "Agent Reply" // For internal CRM tracking
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Invalid Action" });

    } catch (error: any) {
        console.error("[CRM_ACTION_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}