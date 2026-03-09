import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.message || !body.message.text) return NextResponse.json({ status: "ignored" });

    const chatId = body.message.chat.id.toString();
    const userMessage = body.message.text;
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0"; // Static for deployment

    // 1. Fetch Config & Check Limit
    const { data: config } = await supabase.from("user_configs").select("*").eq("telegram_token", botToken).single();
    if (!config) return NextResponse.json({ error: "Bot not configured" }, { status: 404 });

    // 2. Fetch Usage to prevent over-limit responses
    const { data: usage } = await supabase.from("usage_logs").select("estimated_tokens").eq("email", config.email);
    const totalUsed = (usage || []).reduce((sum, r) => sum + r.estimated_tokens, 0);

    if (totalUsed >= (config.token_limit || 50000)) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: "Quota Exhausted. Please upgrade your ClawLink plan." }),
      });
      return NextResponse.json({ status: "limit_reached" });
    }

    // 3. AI Logic with Auto-Fallback (Flash -> Pro)
    let aiReply = "";
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const systemInstruction = config.system_prompt || "You are a helpful AI.";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
      const result = await model.generateContent(userMessage);
      aiReply = result.response.text();
    } catch (err) {
      // Fallback to Pro model if Flash fails
      const backupModel = genAI.getGenerativeModel({ model: "gemini-pro", systemInstruction });
      const result = await backupModel.generateContent(userMessage);
      aiReply = result.response.text();
    }

    // 4. Save Logs & Send Response
    await supabase.from("usage_logs").insert({
      bot_token: botToken,
      email: config.email,
      model_used: "gemini",
      estimated_tokens: Math.ceil((userMessage.length + aiReply.length) / 4)
    });

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Exact system error message directly to bot for debugging
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}