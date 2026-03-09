import { NextResponse } from "next/server";
// Path points correctly to app/lib/supabase.ts
import { supabase } from "../../lib/supabase"; 

// GET: Fetch the user's saved keys, personality, and usage stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Fetch user core configuration
    const { data: configData, error: configError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (configError && configError.code !== "PGRST116") { 
      throw configError;
    }

    // NEW LOGIC: Calculate total AI words (tokens) used by this user
    let totalTokensUsed = 0;
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    if (!usageError && usageData) {
      // Sum all the tokens from the logs
      totalTokensUsed = usageData.reduce((sum, record) => sum + record.estimated_tokens, 0);
    }

    const formattedData = configData ? {
      selectedModel: configData.selected_model,
      selectedChannel: configData.selected_channel,
      telegramToken: configData.telegram_token,
      whatsappToken: configData.whatsapp_token,
      whatsappPhoneId: configData.whatsapp_phone_id,
      openAIKey: configData.openai_key,
      anthropicKey: configData.anthropic_key,
      geminiKey: configData.gemini_key,
      systemPrompt: configData.system_prompt,
      tokensUsed: totalTokensUsed // Sending the calculated usage to frontend
    } : null;

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// POST: Save or update the new keys, settings, and personality in Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, selectedModel, selectedChannel, 
      telegramToken, whatsappToken, whatsappPhoneId, 
      openAIKey, anthropicKey, geminiKey, systemPrompt
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

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
        gemini_key: geminiKey,
        system_prompt: systemPrompt 
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    // AUTO-WEBHOOK SETUP
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const origin = request.headers.get("origin");
        if (origin) {
          const webhookUrl = `${origin}/api/webhook/telegram`;
          const tgResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
          const tgData = await tgResponse.json();
          console.log("Auto-Webhook Setup Status:", tgData);
        }
      } catch (webhookErr) {
        console.error("Failed to set Auto-Webhook:", webhookErr);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}