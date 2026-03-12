import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, message, channel } = body;

        if (!email || !message || !channel) {
            return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
        }

        // 1. Fetch User Config (Bot Token)
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("telegram_token, is_unlimited, available_tokens")
            .eq("email", email)
            .single();

        if (configErr || !config || !config.telegram_token) {
            throw new Error("Telegram Bot configuration not found.");
        }

        // 2. Fetch all unique customers who have interacted with this bot
        const { data: chats, error: chatErr } = await supabase
            .from("bot_conversations")
            .select("chat_id")
            .eq("bot_email", email);

        if (chatErr) throw new Error("Failed to fetch customer list.");

        // Remove duplicate chat IDs (We only want to send 1 message per customer)
        const uniqueCustomers = [...new Set(chats.map(c => c.chat_id))];

        if (uniqueCustomers.length === 0) {
            return NextResponse.json({ success: false, error: "Your bot has no customers yet to broadcast to." });
        }

        // 3. Plan Protection (Don't let free users blast 10,000 messages)
        if (!config.is_unlimited && config.available_tokens < uniqueCustomers.length) {
            return NextResponse.json({ 
                success: false, 
                error: `Insufficient quota. You are trying to send to ${uniqueCustomers.length} customers, but only have ${config.available_tokens} messages left.` 
            });
        }

        // 4. BLAST THE MESSAGES (Parallel Processing)
        let successCount = 0;
        
        if (channel === "telegram") {
            // Using Promise.all for high-speed concurrent sending
            const sendPromises = uniqueCustomers.map(async (chatId) => {
                try {
                    const res = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            chat_id: chatId, 
                            text: `📢 *Announcement:*\n\n${message}`, 
                            parse_mode: "Markdown" 
                        })
                    });
                    if (res.ok) successCount++;
                } catch (e) {
                    console.error(`Failed to send to ${chatId}`);
                }
            });

            await Promise.all(sendPromises);
        }

        // 5. Deduct tokens based on successful sends
        if (!config.is_unlimited && successCount > 0) {
            await supabase.from("user_configs")
                .update({ available_tokens: config.available_tokens - successCount })
                .eq("email", email);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Broadcast complete! Successfully sent to ${successCount} out of ${uniqueCustomers.length} customers.` 
        });

    } catch (error: any) {
        console.error("Broadcast Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}