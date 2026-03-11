import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase"; 
import { generateAIReply } from "@/app/lib/ai-router"; 

// 1. Meta Webhook Verification (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clawlink_secret";

  if (mode && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// 2. WhatsApp Message Handling & Quota Check (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const from = message.from; // User's phone number
    const userText = message.text.body;
    const phoneId = changes.metadata.phone_number_id;

    // Fetch User Configuration from Supabase
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_phone_id", phoneId)
      .single();

    if (configErr || !config) {
      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 🚀 THE PAYWALL: QUOTA CHECKER FOR WHATSAPP
    // ==========================================
    const tokenLimit = config.available_tokens || 50000;
    
    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", config.email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    // Agar limit cross ho gayi aur plan "Unlimited/Pro" nahi hai
    if (tokensUsed >= tokenLimit && !config.is_unlimited) {
      const upgradeMsg = `⚠️ *ClawLink Alert:*\n\nYour AI word quota (${tokenLimit.toLocaleString()} words) has been exhausted.\n\nPlease visit your dashboard to upgrade your plan and restore bot functionality: https://clawlink.com/dashboard`;
      
      await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.whatsapp_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          text: { body: upgradeMsg },
        }),
      });
      
      return NextResponse.json({ ok: true }); // Stop here, save API costs
    }
    // ==========================================

    // Generate AI response if quota is available
    const provider = config.ai_provider || "gemini";
    const modelName = config.ai_model || "gemini-1.5-flash";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      config.system_prompt || "You are an advanced AI assistant.",
      [], 
      userText
    );

    // Reply back via Meta Cloud API
    await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
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

    // Save Usage Log in Supabase
    await supabase.from("usage_logs").insert({
      email: config.email,
      channel: "whatsapp",
      model_used: modelName,
      estimated_tokens: userText.split(" ").length + aiReply.split(" ").length
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("🚨 WHATSAPP WEBHOOK ERROR:", error.message);
    return NextResponse.json({ ok: true });
  }
}