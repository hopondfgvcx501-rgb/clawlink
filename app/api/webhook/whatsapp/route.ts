import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { generateAIReply } from "@/app/lib/ai-router";

// 1. META VERIFICATION ENDPOINT
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ClawLink123";

  if (mode && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden Verification", { status: 403 });
}

// 2. META MESSAGE INGESTION ENDPOINT
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlToken = searchParams.get("token");

  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    // Acknowledge non-message status updates immediately
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const userPhone = message.from;
    const userText = message.text.body;
    const phoneId = changes.metadata.phone_number_id;

    if (!urlToken) {
      throw new Error("Missing routing token in WhatsApp webhook URL.");
    }

    // Database lookup for active configuration
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_token", urlToken)
      .single();

    if (configErr || !config) {
      throw new Error("WhatsApp configuration not found in database.");
    }

    // Quota Validation (Paywall Logic)
    const tokenLimit = config.available_tokens || 50000;
    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", config.email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    if (tokensUsed >= tokenLimit && !config.is_unlimited) {
      const upgradeMsg = `System Alert:\nYour API quota (${tokenLimit.toLocaleString()} words) has been exhausted.\nPlease upgrade your plan at ClawLink Dashboard.`;
      
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: userPhone,
          text: { body: upgradeMsg },
        }),
      });
      return NextResponse.json({ ok: true });
    }

    // AI Processing via Master Router
    const provider = config.ai_provider || "openai";
    const modelName = config.ai_model || "gpt-5.2";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are an advanced enterprise AI assistant.",
      [],
      userText
    );

    // Dispatch Meta Response
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
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

    // Logging consumption
    await supabase.from("usage_logs").insert({
      email: config.email,
      channel: "whatsapp",
      model_used: modelName,
      estimated_tokens: userText.split(" ").length + aiReply.split(" ").length
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}