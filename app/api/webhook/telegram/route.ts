import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id.toString();
    const userMessage = body.message.text;
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    let activeConfig;

    // 1. Fetch user configuration and personality
    const { data: dbConfig, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

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
      activeConfig = dbConfig;
      // MASTER OVERRIDE: Secure Keys
      if (process.env.GEMINI_API_KEY) activeConfig.gemini_key = process.env.GEMINI_API_KEY;
    }

    // 2. Save the incoming user message to Chat History
    await supabase.from("chat_history").insert({
      bot_token: botToken,
      chat_id: chatId,
      role: "user",
      content: userMessage
    });

    // 3. Fetch the last 15 messages for context (Memory)
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("bot_token", botToken)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(15);

    const chatHistory = historyData || [];
    let aiReply = "AI is processing your request...";
    const systemInstruction = activeConfig.system_prompt || "You are a helpful AI assistant.";

    try {
      // ==== SMART GEMINI ENGINE WITH MEMORY ====
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        
        // Format history exactly how Gemini expects it
        const geminiHistory = chatHistory
          .filter(msg => msg.content !== userMessage) // exclude current message to avoid duplication
          .map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          }));

        try {
          console.log("Routing to primary model: gemini-flash-latest with memory");
          const primaryModel = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction 
          });
          
          const chat = primaryModel.startChat({ history: geminiHistory });
          const result = await chat.sendMessage(userMessage);
          aiReply = result.response.text();
        } catch (flashError) {
          try {
            console.log("Primary failed. Engaging fallback: gemini-pro-latest with memory");
            const backupModel = genAI.getGenerativeModel({ 
              model: "gemini-pro-latest",
              systemInstruction: systemInstruction 
            });
            const chat = backupModel.startChat({ history: geminiHistory });
            const result = await chat.sendMessage(userMessage);
            aiReply = result.response.text();
          } catch (proError: any) {
            aiReply = `AI Engine Failure:\n\n${proError.message}`;
          }
        }
      } 
      // ==== OPENAI ENGINE WITH MEMORY ====
      else if (activeConfig.selected_model === "gpt-5.2" && activeConfig.openai_key) {
        const openai = new OpenAI({ apiKey: activeConfig.openai_key });
        
        const openAIMessages: any = [
          { role: "system", content: systemInstruction },
          ...chatHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          }))
        ];
        
        // The last message is already in chatHistory from our insert above
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: openAIMessages,
        });
        aiReply = completion.choices[0].message.content || "";
      }
      // ==== ANTHROPIC CLAUDE ENGINE WITH MEMORY ====
      else if (activeConfig.selected_model === "claude" && activeConfig.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: activeConfig.anthropic_key });
        
        const claudeMessages: any = chatHistory.map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        }));

        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          system: systemInstruction,
          messages: claudeMessages,
        });
        // @ts-ignore
        aiReply = msg.content[0].text;
      }
    } catch (globalErr: any) {
      aiReply = `Global Engine Error:\n\n${globalErr.message}`;
    }

    // 4. Save the AI's reply to Chat History
    await supabase.from("chat_history").insert({
      bot_token: botToken,
      chat_id: chatId,
      role: "model",
      content: aiReply
    });

    // 5. Deliver message back to Telegram
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