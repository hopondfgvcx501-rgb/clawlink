import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔒 LOCKED: Always fetch fresh chat data, no caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET ALL CHATS FOR THE CRM DASHBOARD (100% Read-Only, Safe)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("email", email)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Group chats by customer (platform_chat_id)
        const groupedChats: Record<string, any[]> = {};
        data?.forEach(msg => {
            if (!groupedChats[msg.platform_chat_id]) {
                groupedChats[msg.platform_chat_id] = [];
            }
            groupedChats[msg.platform_chat_id].push(msg);
        });

        // Get unique leads info safely
        const leads = Object.values(groupedChats).map(msgs => {
            const firstMsg = msgs[0];
            return {
                platform_chat_id: firstMsg.platform_chat_id,
                customer_name: firstMsg.customer_name,
                platform: firstMsg.platform,
                last_message_time: msgs[msgs.length - 1].created_at
            };
        }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

        return NextResponse.json({ success: true, leads, groupedChats });
    } catch (error: any) {
        console.error("CRM GET Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to fetch CRM data" }, { status: 500 });
    }
}

// 2. DISPATCH MANUAL HUMAN REPLIES TO TELEGRAM/WHATSAPP (Isolated Engine)
export async function POST(req: Request) {
    try {
        const { email, chatId, message } = await req.json();

        if (!email || !chatId || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // A. Find which platform this chat belongs to
        const { data: chatInfo } = await supabase
            .from("chat_history")
            .select("platform, customer_name")
            .eq("platform_chat_id", chatId)
            .limit(1)
            .single();

        if (!chatInfo) return NextResponse.json({ success: false, error: "Chat not found" }, { status: 404 });

        // B. Get user's API Keys securely
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, whatsapp_phone_id")
            .eq("email", email)
            .single();

        if (!config) return NextResponse.json({ success: false, error: "Config not found" }, { status: 404 });

        // C. Dispatch Message to the correct platform
        let sentSuccessfully = false;

        if (chatInfo.platform === "telegram") {
            if (!config.telegram_token) throw new Error("Telegram token missing");
            const res = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });
            if (res.ok) sentSuccessfully = true;
        } 
        else if (chatInfo.platform === "whatsapp") {
            if (!config.whatsapp_token || !config.whatsapp_phone_id) throw new Error("WhatsApp config missing");
            const res = await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.whatsapp_token}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: message } })
            });
            if (res.ok) sentSuccessfully = true;
        }
        else if (chatInfo.platform === "web") {
            sentSuccessfully = true; // Web widget reads directly from DB
        }

        if (!sentSuccessfully) {
            return NextResponse.json({ success: false, error: "Failed to dispatch message to API" }, { status: 500 });
        }

        // D. Save Human Reply to Database
        await supabase.from("chat_history").insert({
            email: email,
            platform: chatInfo.platform,
            platform_chat_id: chatId,
            customer_name: chatInfo.customer_name,
            sender_type: "human", // Marks as manual overwrite
            message: message
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("CRM POST Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}