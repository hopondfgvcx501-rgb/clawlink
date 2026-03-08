import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Next.js requires dynamic route params to be handled as a Promise
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // 1. Await the params to extract the Telegram Bot Token securely
    const resolvedParams = await params;
    const botToken = resolvedParams.token;
    
    const body = await request.json();

    // Ignore the request if it does not contain a standard text message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ status: "ignored" });
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // 2. Verify the bot token and fetch the user's AI keys from Supabase
    const { data: config, error: dbError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("telegram_token", botToken)
      .single();

    if (dbError || !config) {
      console.error("Security Alert: Unregistered Bot Token or Database Error!");
      return NextResponse.json({ error: "Bot not registered in ClawLink" }, { status: 404 });
    }

    // 3. AI Engine Logic: Route the message to the user's selected model
    let aiReply = "Error: AI Engine is unreachable.";

    try {
      if (config.selected_model === "gpt-5.2" && config.openai_key) {
        // Handle OpenAI Request (GPT-4o)
        const openai = new OpenAI({ apiKey: config.openai_key });
        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: userMessage }],
          model: 'gpt-4o',
        });
        aiReply = chatCompletion.choices[0].message.content || "No response generated.";

      } else if (config.selected_model === "claude" && config.anthropic_key) {
        // Handle Anthropic Request (Claude 3 Opus)
        const anthropic = new Anthropic({ apiKey: config.anthropic_key });
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: userMessage }],
        });
        // @ts-ignore
        aiReply = msg.content[0].text;

      } else if (config.selected_model === "gemini" && config.gemini_key) {
        // Handle Google Request (Gemini 1.5 Flash)
        const genAI = new GoogleGenerativeAI(config.gemini_key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(userMessage);
        aiReply = result.response.text();
        
      } else {
         aiReply = "Configuration error: Missing API Key for the selected model. Please update your ClawLink dashboard.";
      }
    } catch (aiError) {
      console.error("AI Generation Error:", aiError);
      aiReply = "Sorry, my AI brain encountered an error processing your request. Please check your API credits or keys.";
    }

    // 4. Send the generated AI response back to the user on Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply,
      }),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook Engine Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}