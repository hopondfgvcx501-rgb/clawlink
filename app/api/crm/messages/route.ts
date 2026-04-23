import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { email, chatId, channel, message } = await req.json();

        if (!email || !chatId || !channel || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        const { data: config, error: configError } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, whatsapp_phone_id")
            .eq("email", safeEmail)
            .single();

        if (configError || !config) {
            return NextResponse.json({ success: false, error: "User configuration not found" }, { status: 404 });
        }

        let apiWarning = "";

        // 🚀 1. DISPATCH TO PLATFORM (WITH SILENT FAIL-SAFE)
        if (channel === "telegram" && config.telegram_token) {
            const tgRes = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: message })
            });
            if (!tgRes.ok) apiWarning = "Telegram API rejected message.";
        } 
        else if (channel === "whatsapp" && config.whatsapp_token && config.whatsapp_phone_id) {
            const cleanPhoneId = chatId.replace('+', ''); // Meta hates '+' signs
            const waRes = await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${config.whatsapp_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    messaging_product: "whatsapp", recipient_type: "individual",
                    to: cleanPhoneId, type: "text", text: { body: message }
                })
            });
            if (!waRes.ok) {
                const errText = await waRes.text();
                console.error("[META_REJECTED]", errText);
                apiWarning = "Meta API rejected message (Check 24h window or test numbers).";
            }
        }

        // 🚀 2. ALWAYS SAVE TO DATABASE (Even if Meta fails, keep CRM history intact)
        const { error: dbError } = await supabase.from("chat_history").insert({
            email: safeEmail,
            platform: channel,
            platform_chat_id: chatId,
            customer_name: "Customer", 
            sender_type: "admin", 
            message: message
        });

        if (dbError) throw dbError;

        // Return true so the UI updates beautifully!
        return NextResponse.json({ success: true, warning: apiWarning });

    } catch (error: any) {
        console.error("[CRM_MESSAGES_FATAL]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}