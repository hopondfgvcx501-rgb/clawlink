import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase"; 
import { generateAIReply } from "../../../lib/ai-router"; // 🚀 Hamara Naya Dimaag

export async function POST(req: NextRequest) {
  let chatIdToReply: string | null = null;
  const botToken = req.nextUrl.searchParams.get("token");

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    chatIdToReply = message.chat.id.toString();
    const userText = message.text;

    // 1. Fetch Config from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (configErr || !config) {
      console.error("❌ Telegram Config Not Found for Token:", botToken);
      return NextResponse.json({ ok: true });
    }

    // 2. FETCH MEMORY (Chat History) 🧠
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", chatIdToReply)
      .order("created_at", { ascending: true })
      .limit(20);

    const history = historyData || [];

    // 3. 🚀 MASTER AI ROUTER KO CALL KARNA
    // Agar database mein provider set nahi hai, toh by default gemini flash chalega
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are a helpful AI.",
      history,
      userText
    );

    // 4. Send Reply to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatIdToReply, text: aiReply }),
    });

    // 5. SAVE MEMORY & LOG USAGE
    await supabase.from("chat_history").insert([
      { session_id: chatIdToReply, role: "user", message: userText },
      { session_id: chatIdToReply, role: "assistant", message: aiReply }
    ]);

    await supabase.from("usage_logs").insert({
      email: config.email,
      bot_token: botToken,
      model_used: `${provider}-${modelName}`, // Track hoga ki kaunsa AI use hua
      estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
    });

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

    // 🚀 FIX: Hamesha {ok: true} return karein, taaki Telegram spam (retry) na kare!
    return NextResponse.json({ ok: true });
  }
}