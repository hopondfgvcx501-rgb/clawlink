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

    // Ensure there is a valid message in the payload
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return NextResponse.json({ status: "ignored" });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const from = message.from; 
    const userText = message.text?.body;
    const phoneId = body.entry[0].changes[0].value.metadata.phone_number_id;

    // Fetch configuration from Supabase using Phone ID
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_phone_id", phoneId)
      .single();

    if (configErr || !config || !userText) return NextResponse.json({ status: "config_not_found" });

    // Initialize Gemini with Auto-Fallback logic
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    let aiReply = "";

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        systemInstruction: config.system_prompt 
      });
      const result = await model.generateContent(userText);
      aiReply = result.response.text();
    } catch (fallbackErr) {
      // Fallback to Pro model if Flash fails
      const proModel = genAI.getGenerativeModel({ 
        model: "gemini-pro", 
        systemInstruction: config.system_prompt 
      });
      const result = await proModel.generateContent(userText);
      aiReply = result.response.text();
    }

    // Send AI response back to user via Meta Cloud API
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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

    // Save consumption to usage logs
    await supabase.from("usage_logs").insert({
      email: config.email,
      bot_token: phoneId,
      model_used: "gemini-whatsapp",
      estimated_tokens: Math.ceil((userText.length + aiReply.length) / 4)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Send exact error for debugging if something breaks
    console.error("WhatsApp Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}