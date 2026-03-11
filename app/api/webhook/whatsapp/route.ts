import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { generateAIReply } from "@/app/lib/ai-router";

// 1. META PLATFORM VERIFICATION ENDPOINT
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

// 2. ADVANCED CRM MESSAGE INGESTION ENDPOINT
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlToken = searchParams.get("token");

  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const userPhone = message.from;
    const userText = message.text.body;
    const phoneId = changes.metadata.phone_number_id;

    if (!urlToken) {
      throw new Error("Critical: Missing routing token in WhatsApp webhook payload.");
    }

    // 1. Authenticate Bot Owner Configuration
    const { data: config, error: configErr } = await supabase
      .from("user_configs")
      .select("*")
      .eq("whatsapp_token", urlToken)
      .single();

    if (configErr || !config) {
      throw new Error("Authentication Failed: WhatsApp configuration not found.");
    }

    // 2. Validate Usage Quota (Paywall Enforcement)
    const tokenLimit = config.available_tokens || 50000;
    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", config.email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    if (tokensUsed >= tokenLimit && !config.is_unlimited) {
      const upgradeMsg = `System Alert:\nYour AI processing quota (${tokenLimit.toLocaleString()} tokens) has been exhausted.\nPlease navigate to the ClawLink Dashboard to upgrade your service tier.`;
      
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

    // 3. FETCH CUSTOMER MEMORY & CRM DATA
    let customerData = {
      customer_name: "Valued Customer",
      outstanding_balance: 0.00,
      last_order_status: "No active orders",
      active_ticket_id: "None",
      past_behavior_notes: "First time interaction"
    };

    const { data: memoryRecord, error: memoryErr } = await supabase
      .from("customer_memory")
      .select("*")
      .eq("bot_owner_email", config.email)
      .eq("customer_phone", userPhone)
      .single();

    if (memoryRecord) {
      customerData = memoryRecord;
      // Update last interaction timestamp
      await supabase.from("customer_memory").update({ last_interaction: new Date() }).eq("id", memoryRecord.id);
    } else {
      // Create new customer profile on first interaction
      await supabase.from("customer_memory").insert({
        bot_owner_email: config.email,
        customer_phone: userPhone
      });
    }

    // 4. DYNAMIC CONTEXT INJECTION (The Secret Sauce)
    const baseSystemPrompt = config.system_prompt || "You are an advanced enterprise AI assistant.";
    const dynamicPrompt = `
      ${baseSystemPrompt}
      
      CUSTOMER CONTEXT (CRITICAL):
      - Phone Number: ${userPhone}
      - Name: ${customerData.customer_name}
      - Outstanding Billing Balance: $${customerData.outstanding_balance}
      - Last Order Status: ${customerData.last_order_status}
      - Active Support Ticket: ${customerData.active_ticket_id}
      - Behavioral Notes: ${customerData.past_behavior_notes}

      INSTRUCTIONS:
      If the user asks about their bill, orders, or support, use the exact data provided above. 
      Maintain a highly professional, polite, and helpful tone.
    `;

    // 5. Route to AI Engine
    const provider = config.ai_provider || "openai";
    const modelName = config.ai_model || "gpt-5.2";

    const aiReply = await generateAIReply(
      provider,
      modelName,
      dynamicPrompt,
      [],
      userText
    );

    // 6. Dispatch Response via Meta Graph API
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

    // 7. Log Consumption
    await supabase.from("usage_logs").insert({
      email: config.email,
      channel: "whatsapp",
      model_used: modelName,
      estimated_tokens: userText.split(" ").length + aiReply.split(" ").length
    });

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error("Critical WhatsApp Webhook Processing Error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}