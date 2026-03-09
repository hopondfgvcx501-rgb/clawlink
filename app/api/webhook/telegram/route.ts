import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Standard English code structure with Auto-Fallback Engine & Model Discovery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    let activeConfig;

    const { data: dbConfig, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (dbError || !dbConfig) {
      activeConfig = {
        selected_model: "gemini",
        gemini_key: "AIzaSyBHjjO9MFzw7KR-o8nVd0dzR0MSdYA7XQg", // Fallback Key
        openai_key: "",
        anthropic_key: "",
        telegram_token: botToken
      };
    } else {
      activeConfig = dbConfig;
    }

    let aiReply = "AI is thinking...";

    try {
      // ==== SMART GEMINI ENGINE ====
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        
        try {
          // Attempt 1: Try flash
          const primaryModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await primaryModel.generateContent(userMessage);
          aiReply = result.response.text();
        } catch (flashError) {
          try {
            // Attempt 2: Try pro
            const backupModel = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await backupModel.generateContent(userMessage);
            aiReply = result.response.text();
          } catch (proError: any) {
            // THE MASTER STROKE: Ask Google for the exact list of supported models!
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${activeConfig.gemini_key}`);
            const data = await res.json();
            
            if (data.models) {
              const supportedModels = data.models
                .map((m: any) => m.name.replace('models/', ''))
                .filter((name: string) => name.includes("gemini") || name.includes("learnlm"))
                .join("\n✅ ");
              
              aiReply = `Model Name Error!\nGoogle is saying our model names are outdated.\n\nHere is the exact list of models your key ACTUALLY supports right now:\n\n✅ ${supportedModels}\n\n(Bhai, mujhe is list mein se koi ek naam bataiye, hum usko code mein fix kar denge!)`;
            } else {
              aiReply = `API Key Error: Google refused to list models. Response: ${JSON.stringify(data)}`;
            }
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
      aiReply = `Global Engine Error:\n\n${globalErr.message}`;
    }

    // Deliver message back to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply }),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}