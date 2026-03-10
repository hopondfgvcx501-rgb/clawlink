import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase"; 
import { generateAIReply } from "../../../lib/ai-router"; 

export async function POST(req: NextRequest) {
  let chatIdToReply: string | null = null;
  const botToken = req.nextUrl.searchParams.get("token");

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    chatIdToReply = message.chat.id.toString();
    const userText = message.text;

    // 1. Fetch Config & Plan Info from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (configErr || !config) {
      console.error("❌ Telegram Config Not Found for Token:", botToken);
      return NextResponse.json({ ok: true });
    }

    // 2. 🚨 THE GATEKEEPER: Check Token Limits
    if (!config.is_unlimited && config.available_tokens <= 0) {
       const upgradeMsg = "⚠️ *ClawLink Alert*\nAapke account ka AI quota khatam ho gaya hai. Kripya naye tokens recharge karein ya Pro plan mein upgrade karein! 🚀";
       
       await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: chatIdToReply, text: upgradeMsg }),
       });
       
       return NextResponse.json({ ok: true }); // Rok do, AI ko call mat karo
    }

    // 3. FETCH MEMORY (Chat History) 🧠
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", chatIdToReply)
      .order("created_at", { ascending: true })
      .limit(20);

    const history = historyData || [];

    // 4. 🚀 MASTER AI ROUTER KO CALL KARNA
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are a helpful AI.",
      history,
      userText
    );

    // 5. Send Reply to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatIdToReply, text: aiReply }),
    });

    // 6. SAVE MEMORY
    await supabase.from("chat_history").insert([
      { session_id: chatIdToReply, role: "user", message: userText },
      { session_id: chatIdToReply, role: "assistant", message: aiReply }
    ]);

    // 7. 💰 THE ACCOUNTANT: Token Deduction & Usage Logging
    const estimatedTokens = Math.ceil((userText.length + aiReply.length) / 4);

    await supabase.from("usage_logs").insert({
      email: config.email,
      bot_token: botToken,
      model_used: `${provider}-${modelName}`,
      estimated_tokens: estimatedTokens
    });

    // Agar user Pro nahi hai, toh uske balance se tokens kaat lo
    if (!config.is_unlimited) {
      const newBalance = Math.max(0, config.available_tokens - estimatedTokens);
      await supabase
        .from("user_configs")
        .update({ available_tokens: newBalance })
        .eq("telegram_token", botToken);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error.message);
    
    // Exact system error messages directly to the Telegram bot for debugging (NEVER hide them)
    if (chatIdToReply && botToken) {
       const userFriendlyMsg = "⚠️ *ClawLink Alert*\nAI server abhi busy hai ya error face kar raha hai. Kripya thodi der baad try karein! 🙏\n\n----------------------------\n🛠️ DEBUG INFO (System Error):\n" + error.message;

       await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: chatIdToReply, text: userFriendlyMsg }),
       });
    }

    // 🚀 FIX: Hamesha {ok: true} return karein taaki spam na ho
    return NextResponse.json({ ok: true });
  }
}