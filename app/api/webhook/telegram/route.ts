import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      return NextResponse.json({ error: "Unauthorized Bot" }, { status: 401 });
    }

    // 2. FETCH MEMORY (Chat History) 🧠
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", chatIdToReply)
      .order("created_at", { ascending: true })
      .limit(20);

    // Format history for Gemini API
    const formattedHistory = historyData ? historyData.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.message }]
    })) : [];

    // 3. AI Logic (Auto-Fallback: 2.5 Flash -> 2.5 Pro)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    let aiReply = "";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: config.system_prompt });
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(userText);
      aiReply = result.response.text();
    } catch (fallbackErr) {
      console.warn("⚠️ Flash failed, using Pro model...");
      const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro", systemInstruction: config.system_prompt });
      const chat = proModel.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(userText);
      aiReply = result.response.text();
    }

    // 4. Send Reply to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatIdToReply, text: aiReply }),
    });

    // 5. SAVE MEMORY (Save User + AI message to DB)
    await supabase.from("chat_history").insert([
      { session_id: chatIdToReply, role: "user", message: userText },
      { session_id: chatIdToReply, role: "assistant", message: aiReply }
    ]);

    // 6. Log Usage
    await supabase.from("usage_logs").insert({
      email: config.email,
      bot_token: botToken,
      model_used: "gemini-telegram-memory",
      estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error.message);
    
    // Exact system error messages directly to the Telegram bot for debugging
    if (chatIdToReply && botToken) {
       await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: chatIdToReply, text: `🚨 CLAWLINK SYSTEM ERROR:\n${error.message}` }),
       });
    }

    // 🚀 FIX: Hamesha {ok: true} return karein, taaki Telegram spam (retry) na kare!
    return NextResponse.json({ ok: true });
  }
}