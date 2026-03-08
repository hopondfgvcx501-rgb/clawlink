import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Using strict Next.js 16+ types with Promises for dynamic routes
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    // Extract the token securely by awaiting the params promise
    const { token: botToken } = await context.params;
    
    const body = await request.json();

    // Ignore the request if it does not contain a standard text message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // Verify the bot token and fetch the user's AI configuration
    const { data: config, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (dbError || !config) {
      return NextResponse.json({ error: "Unauthorized Bot Token" }, { status: 404 });
    }

    let aiReply = "AI Engine is currently unavailable.";

    try {
      if (config.selected_model === "gpt-5.2" && config.openai_key) {
        const openai = new OpenAI({ apiKey: config.openai_key });
        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: userMessage }],
          model: 'gpt-4o',
        });
        aiReply = chatCompletion.choices[0].message.content || "";

      } else if (config.selected_model === "claude" && config.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: config.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: userMessage }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;

      } else if (config.selected_model === "gemini" && config.gemini_key) {
        const genAI = new GoogleGenerativeAI(config.gemini_key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userMessage);
        aiReply = result.response.text();
      }
    } catch (aiErr) {
      aiReply = "The AI model failed to respond. Please check your API keys.";
    }

    // Deliver the AI response back to the Telegram chat
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply }),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}