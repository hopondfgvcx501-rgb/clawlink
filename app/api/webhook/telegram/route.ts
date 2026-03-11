import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase"; // Path alias fixed
import { generateAIReply } from "@/app/lib/ai-router"; // Path alias fixed

export async function POST(req: NextRequest) {
  try {
    // 1. URL se token nikalna
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const userText = message.text;

    // 2. Supabase se User ki details nikalna
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", token)
      .single();

    if (configErr || !config) {
      console.error("Bot Config not found!");
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 🚀 NEW: QUOTA CHECKER (THE PAYWALL)
    // ==========================================
    const tokenLimit = config.available_tokens || 50000;
    
    // Check total tokens used by this email
    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", config.email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    // Agar limit cross ho gayi aur plan "Unlimited/Pro" nahi hai
    if (tokensUsed >= tokenLimit && !config.is_unlimited) {
      const upgradeMsg = `⚠️ *ClawLink Alert:*\n\nYour AI word quota (${tokenLimit.toLocaleString()} words) has been exhausted.\n\nPlease visit your dashboard to upgrade your plan and restore bot functionality: https://clawlink.com/dashboard`;
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: upgradeMsg, parse_mode: "Markdown" }),
      });
      
      // Yahan se return kar denge taaki AI API hit na ho (Aapke paise bachenge)
      return NextResponse.json({ ok: true });
    }
    // ==========================================

    // 3. Agar quota hai, toh AI se reply maango
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";
    const systemPrompt = config.system_prompt || "You are an advanced AI assistant.";

    const aiReply = await generateAIReply(provider, modelName, systemPrompt, [], userText);

    // 4. Telegram par reply bhejna
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply,
      }),
    });

    // 5. Usage Log save karna Supabase mein
    await supabase.from("usage_logs").insert({
      email: config.email,
      channel: "telegram",
      model_used: modelName,
      estimated_tokens: userText.split(" ").length + aiReply.split(" ").length // Rough word count
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 TELEGRAM WEBHOOK ERROR:", error.message);
    return NextResponse.json({ ok: true });
  }
}