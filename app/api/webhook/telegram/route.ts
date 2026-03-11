import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// API key process.env se le rahe hain (Kabhi hardcode nahi karna)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  let chatId = null;
  let botToken = process.env.TELEGRAM_BOT_TOKEN!; // Test karne ke liye Env variable use karenge

  try {
    const body = await req.json();
    
    // Telegram message body ke andar text bhejta hai
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true }); // Agar photo/sticker ho toh ignore karo (abhi ke liye)
    }

    chatId = message.chat.id;
    const userText = message.text;

    let aiReply = "";

    try {
      // 🚀 1. AUTO-FALLBACK LOGIC: Pehle Fast & Sasta model try karo
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(userText);
      aiReply = result.response.text();
      
    } catch (flashError: any) {
      console.warn("Gemini Flash failed, falling back to Pro...");
      try {
        // 🔄 2. FALLBACK: Agar Flash fail hua, toh Gemini Pro use karo
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(userText);
        aiReply = result.response.text();
        
      } catch (proError: any) {
        // Dono fail ho gaye toh error feko
        throw new Error(`AI_FALLBACK_FAILED: ${proError.message}`);
      }
    }

    // 🚀 3. TELEGRAM KO WAPAS JAWAB BHEJO
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiReply,
        parse_mode: "Markdown"
      })
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("🚨 Webhook Error:", error);
    
    // ⚠️ AAPKI REQUEST: Error ko kabhi hide nahi karna, seedha Telegram par bhejna hai!
    if (chatId && botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚨 *SYSTEM ERROR (Do Not Hide):*\n\n\`${error.message}\``,
          parse_mode: "Markdown"
        })
      });
    }

    // Vercel logs ke liye bhi return karo
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}