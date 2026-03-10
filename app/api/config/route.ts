import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase"; // 🚀 EXACT PATH (Sirf 2 step peeche)
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

    // Calculate total AI word consumption
    let totalTokensUsed = 0;
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    if (!usageError && usageData) {
      // 🚀 FIX: Added strict TypeScript definitions (sum: number, record: any) to clear the error
      totalTokensUsed = usageData.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0);
    }

    // Map database columns back to UI state
    let uiSelectedModel = "gemini";
    if (configData?.ai_provider === "openai") uiSelectedModel = "gpt";
    if (configData?.ai_provider === "anthropic") uiSelectedModel = "claude";

    const formattedData = configData ? {
      selectedModel: uiSelectedModel,
      selectedChannel: configData.selected_channel || "telegram",
      telegramToken: configData.telegram_token || "",
      whatsappToken: configData.whatsapp_token || "",        
      whatsappPhoneId: configData.whatsapp_phone_id || "",   
      systemPrompt: configData.system_prompt || "You are an advanced AI assistant.",
      tokensUsed: totalTokensUsed,
      tokenLimit: configData.available_tokens || 50000 
    } : null;

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("🚨 GET Config Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, selectedModel, selectedChannel, telegramToken, whatsappToken, whatsappPhoneId, systemPrompt } = body;

    if (!email) return NextResponse.json({ error: "Missing identity" }, { status: 400 });

    // Map UI selection to strictly verified AI Router requirements
    let aiProvider = "gemini";
    let aiModelName = "gemini-2.5-flash"; // Stable default

    if (selectedModel === "gpt") {
      aiProvider = "openai";
      aiModelName = "gpt-4.5"; 
    } else if (selectedModel === "claude") {
      aiProvider = "anthropic";
      aiModelName = "claude-4.6-haiku";
    }

    // Lock configuration in the database
    const { data, error } = await supabase
      .from("user_configs")
      .upsert({ 
        email, 
        ai_provider: aiProvider,
        ai_model: aiModelName,
        selected_channel: selectedChannel || "telegram", 
        telegram_token: telegramToken || null, 
        whatsapp_token: whatsappToken || null,        
        whatsapp_phone_id: whatsappPhoneId || null,   
        system_prompt: systemPrompt || "You are an advanced AI assistant."
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("🚨 POST Config Error:", error.message);
    return NextResponse.json({ error: "Failed to persist configuration" }, { status: 500 });
  }
}