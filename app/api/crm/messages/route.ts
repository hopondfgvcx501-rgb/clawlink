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

        // 1. Strict Validation
        if (!email || !chatId || !channel || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // 2. Fetch ALL Tokens securely from DB (Omni-capable)
        const { data: config, error: configError } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, whatsapp_phone_id")
            .eq("email", safeEmail)
            .single();

        if (configError || !config) {
            return NextResponse.json({ success: false, error: "User configuration not found" }, { status: 404 });
        }

        // 🚀 3. THE OMNI-CHANNEL ROUTER (No mixing of data!)
        if (channel === "telegram") {
            if (!config.telegram_token) return NextResponse.json({ success: false, error: "Telegram token missing" }, { status: 400 });
            
            // Dispatch to Telegram API
            const tgRes = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });

            if (!tgRes.ok) throw new Error("Telegram API rejected the message.");

        } 
        else if (channel === "whatsapp") {
            if (!config.whatsapp_token || !config.whatsapp_phone_id) {
                return NextResponse.json({ success: false, error: "WhatsApp credentials missing in config" }, { status: 400 });
            }

            // Dispatch to Meta WhatsApp Cloud API
            const waRes = await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${config.whatsapp_token}`,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: chatId, // ChatId should be the user's phone number for WA
                    type: "text",
                    text: { body: message }
                })
            });

            if (!waRes.ok) throw new Error("Meta WhatsApp API rejected the message.");
        } 
        else {
            return NextResponse.json({ success: false, error: "Invalid channel specified" }, { status: 400 });
        }

        // 🚀 4. Save Admin Reply to Database (Using your old schema format to prevent crashes)
        const { error: dbError } = await supabase.from("chat_history").insert({
            email: safeEmail,
            platform: channel, // Explicitly isolates data by channel
            platform_chat_id: chatId,
            customer_name: "Customer", 
            sender_type: "admin", // 🔥 Mark as manual human reply
            message: message
        });

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, message: "Message dispatched and saved perfectly!" });

    } catch (error: any) {
        // Send exact backend error for debugging
        console.error("[CRM_MESSAGES_FATAL]", error.message);
        return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
    }
}