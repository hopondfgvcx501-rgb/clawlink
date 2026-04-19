import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { email, chatId, channel, message } = await req.json();

        if (!email || !chatId || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // 1. Get user's Telegram Token securely from DB
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token")
            .eq("email", email)
            .single();

        if (!config || !config.telegram_token) {
            return NextResponse.json({ success: false, error: "Telegram token not found" }, { status: 404 });
        }

        // 2. Dispatch Message to Telegram API (Seedha user ke phone par)
        const tgRes = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: message })
        });

        if (!tgRes.ok) {
            console.error("[CRM_DISPATCH_ERROR] Telegram rejected message.");
            return NextResponse.json({ success: false, error: "Telegram API failed" }, { status: 500 });
        }

        // 3. Save Admin Reply to Database (Taaki hamesha history mein dikhe)
        await supabase.from("chat_history").insert({
            email: email,
            platform: channel || "telegram",
            platform_chat_id: chatId,
            customer_name: "Customer", 
            sender_type: "admin", // 🔥 Mark as manual human reply
            message: message
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[CRM_MESSAGES_FATAL]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}