import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase"; 

// GET: Fetch user's settings and real-time AI word usage stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Fetch User Configuration and their specific Token Limit
    const { data: configData, error: configError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (configError && configError.code !== "PGRST116") throw configError;

    // 2. Sum up total AI words (tokens) consumed from usage_logs
    let totalTokensUsed = 0;
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    if (!usageError && usageData) {
      totalTokensUsed = usageData.reduce((sum, record) => sum + record.estimated_tokens, 0);
    }

    // 3. Return the complete package to the Frontend Dashboard
    const formattedData = configData ? {
      selectedModel: configData.selected_model,
      selectedChannel: configData.selected_channel,
      telegramToken: configData.telegram_token,
      geminiKey: configData.gemini_key,
      systemPrompt: configData.system_prompt,
      tokensUsed: totalTokensUsed,
      tokenLimit: configData.token_limit || 50000 // Default limit if not set
    } : null;

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("Config API Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save or Update user settings and bot credentials
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, selectedModel, selectedChannel, telegramToken, geminiKey, systemPrompt } = body;

    if (!email) return NextResponse.json({ error: "Missing identity" }, { status: 400 });

    const { data, error } = await supabase
      .from("user_configs")
      .upsert({ 
        email, 
        selected_model: selectedModel, 
        selected_channel: selectedChannel, 
        telegram_token: telegramToken, 
        gemini_key: geminiKey,
        system_prompt: systemPrompt 
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Database Save Error:", error.message);
    return NextResponse.json({ error: "Failed to persist configuration" }, { status: 500 });
  }
}