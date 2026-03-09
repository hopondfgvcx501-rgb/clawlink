import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

// Meta requires a GET request to verify the webhook initially
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // This token must be added to your Vercel Environment Variables
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 🚀 THE MAHA-JASOOS: Print everything WhatsApp sends before any checks!
    console.log("🔥 INCOMING META PAYLOAD:", JSON.stringify(body, null, 2));

    // 1. Ignore if it's just a status update (like "message read") and not an actual text message
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      console.log("⚠️ Ignored: Not a text message (probably a status update).");
      return NextResponse.json({ status: "ignored" });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from; 
    const userText = message.text?.body;
    const phoneId = body.entry[0].changes[0].value.metadata.phone_number_id;

    console.log(`📩 REAL MESSAGE -> From: ${from}, Text: ${userText}, PhoneID: ${phoneId}`);

    // 2. Fetch User Config from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_phone_id", phoneId)
      .single();

    if (configErr || !config) {
      console.error(`❌ ERROR: No database config found for Phone ID: ${phoneId}`);
      return NextResponse.json({ status: "config_not_found" });
    }

    // 3. AI Logic
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    let aiReply = "";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: config.system_prompt });
      const result = await model.generateContent(userText);
      aiReply = result.response.text();
    } catch (fallbackErr) {
      console.warn("⚠️ Flash failed, using Pro model...");
      const proModel = genAI.getGenerativeModel({ model: "gemini-pro", systemInstruction: config.system_prompt });
      const result = await proModel.generateContent(userText);
      aiReply = result.response.text();
    }

    // 4. Send Reply to WhatsApp
    const metaResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.whatsapp_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: from,
        text: { body: aiReply },
      }),
    });

    if (!metaResponse.ok) {
      const errorData = await metaResponse.json();
      console.error("❌ META REJECTED OUR REPLY:", errorData);
    } else {
      console.log("✅ SUCCESS: AI Reply Sent to WhatsApp!");
      
      // Update tokens in Supabase
      await supabase.from("usage_logs").insert({
        email: config.email,
        bot_token: phoneId,
        model_used: "gemini-whatsapp",
        estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🚨 CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}