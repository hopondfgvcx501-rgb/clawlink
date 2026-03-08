import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Final Webhook Logic - Simplified for ClawLink
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic check: Message hai ya nahi?
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    /** * IMPORTANT: Since we fixed the 404 error by flattening the folder,
     * we will fetch your specific config using your email or the bot token.
     *
     */
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    // Fetching configuration from Supabase
    const { data: config, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (dbError || !config) {
      console.error("Database Error (PGRST116 means no record found):", dbError);
      return NextResponse.json({ error: "Configuration not found" }, { status: 200 }); 
    }

    let aiReply = "AI is thinking...";

    try {
      // Logic for Gemini (Using your new Free Tier Key)
      if (config.selected_model === "gemini" && config.gemini_key) {
        const genAI = new GoogleGenerativeAI(config.gemini_key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userMessage);
        aiReply = result.response.text();
      } 
      // Logic for OpenAI
      else if (config.selected_model === "gpt-5.2" && config.openai_key) {
        const openai = new OpenAI({ apiKey: config.openai_key });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: userMessage }],
          model: "gpt-4o",
        });
        aiReply = completion.choices[0].message.content || "";
      }
      // Logic for Claude
      else if (config.selected_model === "claude" && config.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: config.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: userMessage }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;
      }
    } catch (aiErr) {
      console.error("AI Generation Error:", aiErr);
      aiReply = "Sorry, my AI brain is a bit tired. Check your API keys!";
    }

    // Sending reply back to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply,
      }),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Fatal Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}