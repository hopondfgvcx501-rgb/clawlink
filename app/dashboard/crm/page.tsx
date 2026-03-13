import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET ALL CONVERSATIONS FOR THE CRM
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("bot_conversations")
      .select("*")
      .eq("bot_email", email)
      .order("created_at", { ascending: true }); // Ascending so chat reads top-to-bottom

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. HUMAN HANDOFF - SEND MANUAL REPLY
export async function POST(req: Request) {
  try {
    const { email, chatId, message } = await req.json();

    if (!email || !chatId || !message) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    // A. Get User's Tokens/Credentials
    const { data: config } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (!config) return NextResponse.json({ success: false, error: "Config not found" }, { status: 404 });

    // B. Send Message to the Correct Platform
    if (config.whatsapp_token && config.whatsapp_phone_id) {
      // Send via WhatsApp Meta Cloud API
      await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp_phone_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: chatId,
          text: { body: message },
        }),
      });
    } else if (config.telegram_token) {
      // Send via Telegram Bot API
      await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
    }

    // C. Save the Human Reply in Database (So AI knows context later)
    await supabase.from("bot_conversations").insert({
      bot_email: email,
      chat_id: chatId,
      role: "human",
      content: message,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CRM Send Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}