import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Standard English code structure for global scale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ignore if not a text message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;
    
    // Your exact Telegram bot token
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    let activeConfig;

    // 1. Try to fetch from database
    const { data: dbConfig, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    // 2. THE FIX: If database is empty (PGRST116), use hardcoded keys!
    if (dbError || !dbConfig) {
      console.log("Database empty or failed. Using hardcoded fallback config!");
      activeConfig = {
        selected_model: "gemini",
        // IMPORTANT: PURI GEMINI KEY YAHAN PASTE KAREIN (Jo 7XQg pe khatam hoti hai)
        gemini_key: "AIzaSyBHjjO9MFzw7KR-o8nVd0dzR0MSdYA7XQg", 
        openai_key: "",
        anthropic_key: "",
        telegram_token: botToken
      };
    } else {
      console.log("Successfully fetched config from database.");
      activeConfig = dbConfig;
    }

    let aiReply = "AI is thinking...";

    try {
      // Gemini Engine Logic
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        // Using gemini-1.5-flash as it's best for the free tier
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userMessage);
        aiReply = result.response.text();
      } 
      // OpenAI Logic
      else if (activeConfig.selected_model === "gpt-5.2" && activeConfig.openai_key) {
        const openai = new OpenAI({ apiKey: activeConfig.openai_key });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: userMessage }],
          model: "gpt-4o",
        });
        aiReply = completion.choices[0].message.content || "";
      }
      // Claude Logic
      else if (activeConfig.selected_model === "claude" && activeConfig.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: activeConfig.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: userMessage }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;
      }
    } catch (aiErr) {
      console.error("AI Generation Failed:", aiErr);
      aiReply = "My AI engine encountered an error. Please check the API key.";
    }

    // Deliver message back to Telegram
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