import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase"; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const { data: configData, error: configError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (configError && configError.code !== "PGRST116") throw configError;

    let totalTokensUsed = 0;
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    if (!usageError && usageData) {
      totalTokensUsed = usageData.reduce((sum, record) => sum + record.estimated_tokens, 0);
    }

    const formattedData = configData ? {
      selectedModel: configData.selected_model,
      selectedChannel: configData.selected_channel,
      telegramToken: configData.telegram_token,
      whatsappToken: configData.whatsapp_token,        // Added WhatsApp Token
      whatsappPhoneId: configData.whatsapp_phone_id,   // Added WhatsApp Phone ID
      systemPrompt: configData.system_prompt,
      tokensUsed: totalTokensUsed,
      tokenLimit: configData.token_limit || 50000 
    } : null;

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, selectedModel, selectedChannel, telegramToken, whatsappToken, whatsappPhoneId, systemPrompt } = body;

    if (!email) return NextResponse.json({ error: "Missing identity" }, { status: 400 });

    const { data, error } = await supabase
      .from("user_configs")
      .upsert({ 
        email, 
        selected_model: selectedModel, 
        selected_channel: selectedChannel, 
        telegram_token: telegramToken, 
        whatsapp_token: whatsappToken,        // Saving WhatsApp Token
        whatsapp_phone_id: whatsappPhoneId,   // Saving WhatsApp Phone ID
        system_prompt: systemPrompt 
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to persist configuration" }, { status: 500 });
  }
}