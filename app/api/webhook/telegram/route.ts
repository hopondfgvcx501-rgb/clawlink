import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || !body.message.text) return NextResponse.json({ status: "ignored" });

    const chatId = body.message.chat.id.toString();
    const userMessage = body.message.text;
    const botToken = "8569279311:AAFNOHoazE-vrvYfXivh4p5dQSNlFljAgo0";

    let activeConfig;

    // 1. Fetch Configuration
    const { data: dbConfig } = await supabase.from("user_configs").select("*").eq("telegram_token", botToken).single();

    if (!dbConfig) {
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
      if (process.env.GEMINI_API_KEY) activeConfig.gemini_key = process.env.GEMINI_API_KEY;
    }

    // 2. Fetch the LAST 10 messages for Memory (Descending order to get newest, then reverse)
    const { data: historyData, error: fetchErr } = await supabase
      .from("chat_history")
      .select("*")
      .eq("bot_token", botToken)
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false }) 
      .limit(10);
      
    if (fetchErr) console.error("History Fetch Error:", fetchErr);

    const chatHistory = (historyData || []).reverse();

    // 3. Save incoming user message to database
    const { error: insertUserErr } = await supabase.from("chat_history").insert({
      bot_token: botToken,
      chat_id: chatId,
      role: "user",
      content: userMessage
    });
    if (insertUserErr) console.error("User Insert Error:", insertUserErr);

    // 4. THE MAGIC: Context Injection Memory String
    let memoryContext = "Here is the previous chat history with this user:\n\n";
    if (chatHistory.length === 0) {
      memoryContext += "(No previous history. This is a new conversation.)\n";
    } else {
      chatHistory.forEach(msg => {
        memoryContext += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }
    // Inject the current message at the end
    memoryContext += `\nNow, respond to the user's latest message: "${userMessage}"`;

    let aiReply = "AI is processing your request...";
    const systemInstruction = activeConfig.system_prompt || "You are a helpful AI assistant.";

    try {
      // ==== SMART GEMINI ENGINE WITH CONTEXT INJECTION ====
      if (activeConfig.selected_model === "gemini" && activeConfig.gemini_key) {
        const genAI = new GoogleGenerativeAI(activeConfig.gemini_key);
        
        try {
          const primaryModel = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction 
          });
          // Send the entire memory context as the prompt
          const result = await primaryModel.generateContent(memoryContext);
          aiReply = result.response.text();
        } catch (flashError) {
          const backupModel = genAI.getGenerativeModel({ 
            model: "gemini-pro-latest",
            systemInstruction: systemInstruction 
          });
          const result = await backupModel.generateContent(memoryContext);
          aiReply = result.response.text();
        }
      } 
      // ==== OPENAI ENGINE ====
      else if (activeConfig.selected_model === "gpt-5.2" && activeConfig.openai_key) {
        const openai = new OpenAI({ apiKey: activeConfig.openai_key });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: memoryContext }
          ],
        });
        aiReply = completion.choices[0].message.content || "";
      }
      // ==== CLAUDE ENGINE ====
      else if (activeConfig.selected_model === "claude" && activeConfig.anthropic_key) {
        const anthropic = new Anthropic({ apiKey: activeConfig.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          system: systemInstruction,
          messages: [{ role: "user", content: memoryContext }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;
      }
    } catch (globalErr: any) {
      aiReply = `Global Engine Error:\n\n${globalErr.message}`;
    }

    // 5. Save AI's reply to database
    const { error: insertModelErr } = await supabase.from("chat_history").insert({
      bot_token: botToken,
      chat_id: chatId,
      role: "model",
      content: aiReply
    });
    if (insertModelErr) console.error("Model Insert Error:", insertModelErr);

    // 6. Deliver to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: aiReply }),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Fatal Webhook Execution Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}