import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 1. GET: Fetch Live Conversations for CRM Dashboard
// ============================================================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all chat history for this bot owner
        const { data, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("email", email)
            .order("created_at", { ascending: true }); // Oldest to newest for chat flow

        if (error) throw error;

        // The frontend groupedChats expects 'chat_id' and 'role'
        // We map our DB schema (platform_chat_id, sender_type) to match frontend expectations
        const formattedData = data.map(msg => ({
            id: msg.id,
            chat_id: msg.platform_chat_id,
            role: msg.sender_type, // 'user', 'bot', or 'human'
            content: msg.message,
            created_at: msg.created_at,
            platform: msg.platform
        }));

        return NextResponse.json({ success: true, data: formattedData });
    } catch (error: any) {
        console.error("CRM GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// ============================================================================
// 2. POST: Human Takeover (Manual Reply from CRM)
// ============================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, chatId, message } = body;

        if (!email || !chatId || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // 1. Get user configuration to fetch correct bot tokens
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, whatsapp_phone_id")
            .eq("email", email)
            .single();

        if (configErr || !config) throw new Error("Bot configuration not found.");

        // 2. Determine platform by checking the last message from this chatId
        const { data: lastMsg } = await supabase
            .from("chat_history")
            .select("platform")
            .eq("email", email)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
        const platform = lastMsg?.platform || "telegram"; // Fallback

        // 3. Dispatch manual message to the correct platform
        if (platform === "telegram" && config.telegram_token) {
            await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });
        } else if (platform === "whatsapp" && config.whatsapp_token && config.whatsapp_phone_id) {
            await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.whatsapp_token}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: message } })
            });
        } else {
            throw new Error("No active token found for the target platform.");
        }

        // 4. Save Human Reply to Database (Memory)
        await supabase.from("chat_history").insert({
            email: email,
            platform: platform,
            platform_chat_id: chatId,
            customer_name: "Human Agent",
            sender_type: "human", // Marks this as manual takeover
            message: message
        });

        return NextResponse.json({ success: true, message: "Reply sent successfully." });

    } catch (error: any) {
        console.error("CRM POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}