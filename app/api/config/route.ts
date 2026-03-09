import { NextResponse } from "next/server";
// Path points correctly to app/lib/supabase.ts
import { supabase } from "../../lib/supabase"; 

// GET: Fetch the user's saved keys when the dashboard loads
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") { 
      throw error;
    }

    const formattedData = data ? {
      selectedModel: data.selected_model,
      selectedChannel: data.selected_channel,
      telegramToken: data.telegram_token,
      whatsappToken: data.whatsapp_token,
      whatsappPhoneId: data.whatsapp_phone_id,
      openAIKey: data.openai_key,
      anthropicKey: data.anthropic_key,
      geminiKey: data.gemini_key,
    } : null;

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// POST: Save or update the new keys and settings in Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, selectedModel, selectedChannel, 
      telegramToken, whatsappToken, whatsappPhoneId, 
      openAIKey, anthropicKey, geminiKey 
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // 1. Save all keys to Supabase First
    const { data, error } = await supabase
      .from("user_configs")
      .upsert({ 
        email: email, 
        selected_model: selectedModel, 
        selected_channel: selectedChannel, 
        telegram_token: telegramToken, 
        whatsapp_token: whatsappToken,
        whatsapp_phone_id: whatsappPhoneId,
        openai_key: openAIKey, 
        anthropic_key: anthropicKey, 
        gemini_key: geminiKey
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    // 🚀 2. THE CLAWLINK MAGIC: AUTO-WEBHOOK SETUP 🚀
    // Agar user ne Telegram select kiya hai aur token diya hai, toh webhook auto-set kar do!
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        // Automatically get your current Vercel Website URL
        const origin = request.headers.get("origin");
        
        if (origin) {
          // Pointing to our flat routing system!
          const webhookUrl = `${origin}/api/webhook/telegram`;
          
          // Command Telegram to send messages to our webhook
          const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
          const tgData = await tgResponse.json();
          
          console.log("Auto-Webhook Setup Status:", tgData);
        }
      } catch (webhookErr) {
        console.error("Failed to set Auto-Webhook:", webhookErr);
        // Hum yahan error throw nahi kar rahe hain taaki DB save fail na ho, bas log kar lenge.
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}