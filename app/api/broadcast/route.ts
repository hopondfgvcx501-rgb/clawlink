import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 1. GET: Fetch Total Audience Size for the User
// =========================================================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Get all unique chat IDs the bot has interacted with
        const { data, error } = await supabase
            .from('chat_history')
            .select('platform_chat_id')
            .eq('email', email);
        
        if (error) throw error;

        // Use a Set to count unique customers only
        const uniqueUsers = new Set(data.map(d => d.platform_chat_id));
        
        return NextResponse.json({ success: true, audienceCount: uniqueUsers.size });
    } catch (error: any) {
        console.error("Broadcast GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// =========================================================================
// 2. POST: Execute the Mass Broadcast Blast
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, message, channel } = body;

        if (!email || !message || !channel) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // 1. Get bot owner's configuration & tokens
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("email", email)
            .single();

        if (configErr || !config) throw new Error("Bot configuration not found");

        // 2. Fetch all unique users specifically for the selected channel
        const { data: users } = await supabase
            .from('chat_history')
            .select('platform_chat_id')
            .eq('email', email)
            .eq('platform', channel); // Filter by whatsapp or telegram

        const uniqueChatIds = Array.from(new Set((users || []).map(u => u.platform_chat_id)));

        if (uniqueChatIds.length === 0) {
            return NextResponse.json({ success: false, error: `No audience found on ${channel}.` });
        }

        // 3. Token Limits Check (Cost: 1 Token per Broadcast Message)
        if (!config.is_unlimited && (config.tokens_used + uniqueChatIds.length) > config.tokens_allocated) {
            return NextResponse.json({ success: false, error: `Insufficient tokens. You need ${uniqueChatIds.length} tokens for this blast.` });
        }

        // 4. 🔥 THE BLAST LOOP (Sending messages)
        let sentCount = 0;
        for (const chatId of uniqueChatIds) {
            try {
                if (channel === "telegram" && config.telegram_token) {
                    await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: chatId, text: `📢 Broadcast:\n\n${message}` })
                    });
                    sentCount++;
                } else if (channel === "whatsapp" && config.whatsapp_token && config.whatsapp_phone_id) {
                    await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
                        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.whatsapp_token}` },
                        body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: message } })
                    });
                    sentCount++;
                }
            } catch (e) {
                console.log(`Failed to send to ${chatId}`);
            }
        }

        // 5. Update token usage & save blast record to memory
        if (sentCount > 0) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + sentCount }).eq("email", email);
            }
            
            // Save to memory so CRM shows the broadcast was sent
            await supabase.from("chat_history").insert({
                email: email,
                platform: channel,
                platform_chat_id: "BROADCAST_BLAST",
                customer_name: "All Audience",
                sender_type: "human", // Mark as admin action
                message: `[MASS BROADCAST SENT TO ${sentCount} USERS]: ${message}`
            });
        }

        return NextResponse.json({ success: true, sentCount });

    } catch (error: any) {
        console.error("Broadcast POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}