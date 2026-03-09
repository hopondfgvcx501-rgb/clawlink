import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Standard English code structure with Secure Env Override & Auto-Fallback
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

    // 2. THE FIX: Secure fallback if DB is empty
    if (dbError || !dbConfig) {
      console.log("Database empty or failed. Using SECURE env variables!");
      activeConfig = {
        selected_model: "gemini",
        gemini_key: process.env.GEMINI_API_KEY, 
        openai_key: process.env.OPENAI_API_KEY || "",
        anthropic_key: process.env.ANTHROPIC_API_KEY || "",
        telegram_token: botToken
      };
    } else {
      console.log("Successfully fetched config from database.");
      activeConfig = dbConfig;
      
      // 🚀 THE MASTER OVERRIDE FIX 🚀
      // Overwrite the expired DB key with the fresh, secure key from Vercel!
      if (process.env.GEMINI_API_KEY) {
        activeConfig.gemini_key = process.env.GEMINI_API_KEY;
      }
    }

    let aiReply = "AI is thinking...";

    try {
      // ==== SMART GEMINI ENGINE ====
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        
        try {
          // Attempt 1: Try the NEWEST fast 'flash' model based on Google's list
          console.log("Attempting primary model: gemini-flash-latest");
          const primaryModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
          const result = await primaryModel.generateContent(userMessage);
          aiReply = result.response.text();
        } catch (flashError) {
          try {
            // Attempt 2: Auto-fallback to the NEWEST 'pro' model
            console.log("Flash failed. Attempting backup model: gemini-pro-latest");
            const backupModel = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
            const result = await backupModel.generateContent(userMessage);
            aiReply = result.response.text();
          } catch (proError: any) {
            // Forward exact error
            aiReply = `AI Generation Failed. Both Models Threw Error:\n\n${proError.message}`;
          }
        }
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
    } catch (globalErr: any) {
      // Forward the exact error to Telegram so we never have to guess again
      aiReply = `Global Engine Error:\n\n${globalErr.message}`;
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

  } catch (error: any) {
    console.error("Fatal Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}