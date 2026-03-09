import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Webhook endpoint to process incoming Telegram messages securely
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ignore if the incoming payload is not a valid text message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;
    
    // The exact Telegram bot token used for configuration mapping
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    let activeConfig;

    // 1. Fetch user configuration and personality from the database
    const { data: dbConfig, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    // 2. Fallback to secure environment variables if DB fails or is empty
    if (dbError || !dbConfig) {
      console.log("Database fetch failed. Engaging SECURE environment variables.");
      activeConfig = {
        selected_model: "gemini",
        gemini_key: process.env.GEMINI_API_KEY, 
        openai_key: process.env.OPENAI_API_KEY || "",
        anthropic_key: process.env.ANTHROPIC_API_KEY || "",
        telegram_token: botToken,
        system_prompt: "You are an advanced AI assistant powered by ClawLink. Be helpful and concise."
      };
    } else {
      console.log("Configuration fetched successfully from database.");
      activeConfig = dbConfig;
      
      // 🚀 MASTER OVERRIDE: Overwrite any expired DB keys with fresh Vercel vault keys
      if (process.env.GEMINI_API_KEY) {
        activeConfig.gemini_key = process.env.GEMINI_API_KEY;
      }
    }

    // Default response while AI is processing
    let aiReply = "AI is processing your request...";
    
    // Extract the personality instruction or use a default one
    const systemInstruction = activeConfig.system_prompt || "You are a helpful AI assistant.";

    try {
      // ==== SMART GEMINI ENGINE WITH PERSONALITY ====
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        
        try {
          // Attempt 1: Route to the fastest 'flash' model with System Instructions
          console.log("Routing to primary model: gemini-flash-latest");
          const primaryModel = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction 
          });
          const result = await primaryModel.generateContent(userMessage);
          aiReply = result.response.text();
        } catch (flashError) {
          try {
            // Attempt 2: Auto-fallback to the 'pro' model if flash fails
            console.log("Primary model failed. Engaging fallback model: gemini-pro-latest");
            const backupModel = genAI.getGenerativeModel({ 
              model: "gemini-pro-latest",
              systemInstruction: systemInstruction 
            });
            const result = await backupModel.generateContent(userMessage);
            aiReply = result.response.text();
          } catch (proError: any) {
            // Forward exact system errors directly to the user for instant debugging
            aiReply = `AI Engine Failure. Both Models Threw Error:\n\n${proError.message}`;
          }
        }
      } 
      // ==== OPENAI ENGINE WITH PERSONALITY ====
      else if (activeConfig.selected_model === "gpt-5.2" && activeConfig.openai_key) {
        const openai = new OpenAI({ apiKey: activeConfig.openai_key });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage }
          ],
        });
        aiReply = completion.choices[0].message.content || "";
      }
      // ==== ANTHROPIC CLAUDE ENGINE WITH PERSONALITY ====
      else if (activeConfig.selected_model === "claude" && activeConfig.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: activeConfig.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          system: systemInstruction,
          messages: [{ role: "user", content: userMessage }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;
      }
    } catch (globalErr: any) {
      // Forward global execution errors to Telegram
      aiReply = `Global Engine Error:\n\n${globalErr.message}`;
    }

    // Deliver the finalized AI response back to the Telegram chat
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
    console.error("Fatal Webhook Execution Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}