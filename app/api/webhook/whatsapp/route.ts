import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a valid WhatsApp text message, ignore status updates
    if (
      !body.entry ||
      !body.entry[0].changes ||
      !body.entry[0].changes[0].value.messages ||
      !body.entry[0].changes[0].value.messages[0]
    ) {
      return NextResponse.json({ ok: true }); 
    }

    const messageObj = body.entry[0].changes[0].value.messages[0];
    if (messageObj.type !== "text") {
      return NextResponse.json({ ok: true }); 
    }

    const userPhone = messageObj.from;
    const userText = messageObj.text.body;
    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;

    // 1. Fetch Config from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_phone_id", phoneNumberId)
      .single();

    if (configErr || !config) {
      console.error("❌ WhatsApp Config Not Found");
      return NextResponse.json({ ok: true });
    }

    // 2. FETCH MEMORY (Chat History) 🧠
    const { data: historyData } = await supabase
      .from("chat_history")
      .select("*")
      .eq("session_id", userPhone)
      .order("created_at", { ascending: true })
      .limit(20);

    // Format history for Gemini API
    const formattedHistory = historyData ? historyData.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.message }]
    })) : [];

    // 3. AI Logic (Auto-Fallback: 2.5 Flash -> 2.5 Pro)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    let aiReply = "";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: config.system_prompt });
      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(userText);
      aiReply = result.response.text();
    } catch (fallbackErr) {
      console.warn("⚠️ Flash failed, using Pro model...");
      const proModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro", systemInstruction: config.system_prompt });
      const chat = proModel.startChat({ history: formattedHistory });
      const result = await chat.sendMessage(userText);
      aiReply = result.response.text();
    }

    // 4. Send Reply to WhatsApp
    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.whatsapp_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: userPhone,
        text: { body: aiReply },
      }),
    });
    
    const metaData = await metaResponse.json();
    
    // 5. Check Meta Response & Save Memory
    if (metaData.error) {
       console.error("❌ META REJECTED OUR REPLY:", JSON.stringify(metaData));
    } else {
       // Save user + AI message to DB
       await supabase.from("chat_history").insert([
         { session_id: userPhone, role: "user", message: userText },
         { session_id: userPhone, role: "assistant", message: aiReply }
       ]);

       // Log Usage
       await supabase.from("usage_logs").insert({
         email: config.email,
         model_used: "gemini-whatsapp-memory",
         estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
       });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // 🚨 System Error Tracking (Never hide)
    console.error("🚨 CRITICAL ERROR IN WHATSAPP:", error.message);
    
    // 🚀 FIX: Hamesha {ok: true} return karein taaki Meta ka spam loop hamesha ke liye band ho jaye!
    return NextResponse.json({ ok: true });
  }
}