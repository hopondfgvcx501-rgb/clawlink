import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const userText = message.text;
    const botToken = req.nextUrl.searchParams.get("token");

    // 1. Fetch Config from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (configErr || !config) {
      console.error("❌ Telegram Config Not Found");
      return NextResponse.json({ error: "Unauthorized Bot" }, { status: 401 });
    }

    // 2. AI Logic (Upgraded to Gemini 2.5)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: config.system_prompt 
    });

    const result = await model.generateContent(userText);
    const aiReply = result.response.text();

    // 3. Send Reply to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply }),
    });

    // 4. Log Usage
    await supabase.from("usage_logs").insert({
      email: config.email,
      bot_token: botToken,
      model_used: "gemini-telegram",
      estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 TELEGRAM ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}