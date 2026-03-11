import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { generateAIReply } from "@/app/lib/ai-router";

export async function POST(req: NextRequest) {
  let chatId = null;
  // 🚀 NAYA LOGIC: URL se token uthaayenge taaki pata chale kis user ka bot hai
  const { searchParams } = new URL(req.url);
  const botToken = searchParams.get("token"); 

  try {
    if (!botToken) throw new Error("Bot token missing in webhook URL");

    const body = await req.json();
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    chatId = message.chat.id;
    const userText = message.text;

    // 🔍 1. DATABASE CHECK: Is token ka malik kaun hai?
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (configErr || !config) {
      throw new Error("Bot configuration not found in database.");
    }

    // 💰 2. QUOTA CHECKER (Paywall)
    const tokenLimit = config.available_tokens || 50000;
    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", config.email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    // Agar limit cross ho gayi (Paisa khatam)
    if (tokensUsed >= tokenLimit && !config.is_unlimited) {
      const upgradeMsg = `⚠️ *ClawLink Alert:*\n\nYour AI word quota (${tokenLimit.toLocaleString()} words) has been exhausted.\n\nPlease visit your dashboard to upgrade your plan: https://clawlink-six.vercel.app`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: upgradeMsg, parse_mode: "Markdown" })
      });
      return NextResponse.json({ ok: true }); 
    }

    // 🧠 3. AI ROUTER SE JAWAB MANGO
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are a helpful AI assistant.",
      [], 
      userText
    );

    // 🚀 4. TELEGRAM KO JAWAB BHEJO
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply, parse_mode: "Markdown" })
    });

    // 📊 5. USAGE UPDATE KARO (Token katega database mein)
    await supabase.from("usage_logs").insert({
      email: config.email,
      channel: "telegram",
      model_used: modelName,
      estimated_tokens: userText.split(" ").length + aiReply.split(" ").length
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("🚨 Telegram Webhook Error:", error);
    
    // ⚠️ Aapki strict demand: ERROR DO NOT HIDE
    if (chatId && botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚨 *SYSTEM ERROR (Do Not Hide):*\n\n\`${error.message}\``,
          parse_mode: "Markdown"
        })
      });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}