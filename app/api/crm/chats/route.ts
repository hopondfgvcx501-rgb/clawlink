/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: CRM AI CHAT INBOX & TOGGLE API
 * ==============================================================================================
 * @file app/api/crm/chats/route.ts
 * @description Fetches grouped chats and instantly toggles the AI Paused state, flushing cache.
 * ==============================================================================================
 */

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ALWAYS SEND FATAL ERRORS TO TG ADMIN
async function sendErrorToTG(errorMsg: string) {
    const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!TG_BOT_TOKEN || !TG_ADMIN_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TG_ADMIN_ID, text: `🚨 [CLAWLINK CRM CRASH]:\n\n${errorMsg}` })
        });
    } catch (e) {
        console.error("Failed to send TG alert.");
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel");

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Missing email or channel parameters." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("platform", channel.toLowerCase())
            .order("created_at", { ascending: false });

        if (error) throw error;

        const chatSessionsMap = new Map();

        data?.forEach((msg) => {
            if (!chatSessionsMap.has(msg.platform_chat_id)) {
                chatSessionsMap.set(msg.platform_chat_id, {
                    id: msg.platform_chat_id,
                    userId: msg.platform_chat_id,
                    name: msg.customer_name || "Unknown User",
                    lastMessage: msg.message,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: 0, 
                    aiPaused: false,
                    messages: [] 
                });
            }

            const session = chatSessionsMap.get(msg.platform_chat_id);
            session.messages.unshift({
                id: msg.id || Math.random().toString(),
                sender: msg.sender_type === 'human' || msg.sender_type === 'admin' ? 'admin' : msg.sender_type,
                text: msg.message,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        const chats = Array.from(chatSessionsMap.values());
        return NextResponse.json({ success: true, chats });

    } catch (error: any) {
        console.error("[CRM_API_FATAL]", error);
        await sendErrorToTG(`Failed to load CRM data for ${req.url}\nError: ${error.message}`);
        return NextResponse.json({ success: false, error: "Failed to load CRM data." }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    let reqBody: any = {}; // FIX: Defined outside 'try' to resolve scope issues
    
    try {
        reqBody = await req.json();
        const { email, chatId, channel, aiPaused } = reqBody;

        if (!email || !chatId || !channel || aiPaused === undefined) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const targetTable = channel.toLowerCase() === "instagram" ? "instagram_contacts" : "contacts";

        const { error } = await supabase
            .from(targetTable)
            .update({ ai_paused: aiPaused }) 
            .eq("platform_chat_id", chatId)
            .eq("email", email.toLowerCase());

        if (error) {
            console.warn(`[WARNING] Failed to update 'ai_paused' in ${targetTable}.`);
        } else {
             console.log(`[AI_STATE_UPDATED] Chat: ${chatId}, Channel: ${channel}, Paused: ${aiPaused}`);
        }

        // THE MAGIC: Instantly kill the cache for all incoming webhooks
        revalidatePath('/api/webhook/whatsapp');
        revalidatePath('/api/webhook/telegram');
        revalidatePath('/api/webhook/instagram');
        revalidatePath('/api/omni');
        revalidatePath('/dashboard/crm');

        return NextResponse.json({ success: true, message: `AI status securely updated to ${aiPaused ? 'PAUSED' : 'ACTIVE'}` });

    } catch (error: any) {
        const errorMessage = error.message || "Unknown Backend Execution Error";
        console.error("[CRM_PUT_ERROR]", errorMessage);
        
        await sendErrorToTG(`Failed to toggle AI for Chat ID: ${reqBody?.chatId || 'Unknown'}\nError: ${errorMessage}`);
        
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}