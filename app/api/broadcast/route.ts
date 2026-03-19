import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔒 Edge disabled to prevent mass-sending timeouts
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 1. GET: Fetch Total Audience Size (Clawlink Core)
// =========================================================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from('chat_history')
            .select('platform_chat_id')
            .eq('email', email);
        
        if (error) throw error;

        const uniqueUsers = new Set(data.map(d => d.platform_chat_id));
        return NextResponse.json({ success: true, audienceCount: uniqueUsers.size });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// =========================================================================
// 2. POST: Execute Blast with Token Management
// =========================================================================
export async function POST(req: Request) {
    try {
        const { email, message, channel } = await req.json();

        if (!email || !message || !channel) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // 1. Verify Bot Configuration & Tokens
        const { data: config } = await supabase
            .from("user_configs")
            .select("*")
            .eq("email", email)
            .single();

        if (!config) return NextResponse.json({ success: false, error: "Config not found" }, { status: 404 });

        // 2. Target specific audience based on channel
        const { data: users } = await supabase
            .from('chat_history')
            .select('platform_chat_id')
            .eq('email', email)
            .eq('platform', channel);

        const uniqueChatIds = Array.from(new Set((users || []).map(u => u.platform_chat_id)));

        if (uniqueChatIds.length === 0) {
            return NextResponse.json({ success: false, error: `No audience found on ${channel}.` });
        }

        // 3. Token Check logic (Clawlink Business Logic)
        if (!config.is_unlimited && (config.tokens_used + uniqueChatIds.length) > config.tokens_allocated) {
            return NextResponse.json({ 
                success: false, 
                error: `Insufficient tokens. Need ${uniqueChatIds.length}, you have ${config.tokens_allocated - config.tokens_used}` 
            });
        }

        // 4. 🔥 THE BLAST LOOP
        let sentCount = 0;
        const blastPromises = uniqueChatIds.map(async (chatId) => {
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
            } catch (e) { console.error(`Error sending to ${chatId}`); }
        });

        await Promise.all(blastPromises);

        // 5. Update usage & logs
        if (sentCount > 0) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + sentCount }).eq("email", email);
            }
            
            await supabase.from("chat_history").insert({
                email: email,
                platform: channel,
                platform_chat_id: "BROADCAST_LOG",
                customer_name: "Broadcast System",
                sender_type: "human", 
                message: `[BLAST SENT TO ${sentCount} USERS]: ${message}`
            });
        }

        return NextResponse.json({ success: true, sentCount });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}