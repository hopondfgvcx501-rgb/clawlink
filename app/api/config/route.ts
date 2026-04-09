import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../lib/email"; // Check your exact path

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ─── 🚀 OFFER PERIOD PRICING MAP (Synced with CEO's 10-Day Strategy) ─── */
const IN_FILE_PRICING: Record<string, any> = {
  "gemini": { plus: 6, pro: 12, ultra: 24, adv_max: 599 },
  "gpt-5.2": { plus: 8, pro: 18, ultra: 36, adv_max: 899 },
  "claude": { plus: 10, pro: 24, ultra: 48, adv_max: 1199 },
  "omni": { monthly: 249, yearly: 1799 },
  "multi_model": { monthly: 249, yearly: 1799 }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, selectedModel, selectedChannel, telegramToken, waPhoneId, waPhoneNumber, plan } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required for deployment." }, { status: 400 });
    }

    const safePlan = (plan || "plus").toLowerCase();
    const safeModel = (selectedModel || "gpt-5.2").toLowerCase();

    // 🚀 1. SURGICAL TOKEN ECONOMICS (Margin Control for Profit)
    let allocatedTokens = 2000000; // Default 2M
    let monthlyMessages = 5000;
    let isUnlimited = false;

    if (safePlan === "plus" || safePlan === "starter") {
        allocatedTokens = 2000000; // 2 Million
        monthlyMessages = 5000;
    } else if (safePlan === "pro") {
        allocatedTokens = 10000000; // 10 Million
        monthlyMessages = 25000;
    } else if (safePlan === "ultra" || safePlan === "max") {
        allocatedTokens = 25000000; // 25 Million
        monthlyMessages = 75000;
    } else if (safePlan === "adv_max" || safePlan === "yearly" || safePlan === "monthly") {
        isUnlimited = true;
        allocatedTokens = 100000000; // 100M Fair Use Limit (Internal)
        monthlyMessages = 500000;
    }

    const expiryDate = new Date();
    if (safePlan === "adv_max" || safePlan === "yearly") {
        expiryDate.setDate(expiryDate.getDate() + 365);
    } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // 🚀 2. ENGINE VERSIONING & PROVIDER MAPPING
    let providerToSave = "openai";
    let exactModelVersion = "gpt-4o-mini";

    if (safeModel.includes("multi_model") || safeModel.includes("omni") || safeModel.includes("nexus")) {
        providerToSave = "multi_model";
        exactModelVersion = "omni-nexus-engine";
    } else if (safeModel.includes("claude") || safeModel.includes("anthropic")) {
        providerToSave = "anthropic";
        exactModelVersion = "claude-3-opus-20240229";
    } else if (safeModel.includes("gemini") || safeModel.includes("google")) {
        providerToSave = "google";
        exactModelVersion = "gemini-1.5-flash-8b";
    }

    const payload: any = {
        ai_model: safeModel,
        ai_provider: providerToSave,
        current_model_version: exactModelVersion,
        tokens_allocated: allocatedTokens,
        available_tokens: allocatedTokens,
        monthly_message_limit: monthlyMessages,
        is_unlimited: isUnlimited,
        plan: safePlan,
        plan_status: 'Active',
        expires_at: expiryDate.toISOString(),
        plan_expiry_date: expiryDate.toISOString(),
        selected_channel: selectedChannel || "widget"
    };

    if (selectedChannel === "telegram" && telegramToken) {
        payload.telegram_token = telegramToken;
    } else if (selectedChannel === "whatsapp" && waPhoneId) {
        payload.whatsapp_phone_id = waPhoneId;
        payload.whatsapp_token = telegramToken; // Keeping logic for WhatsApp Cloud API
        if (waPhoneNumber) payload.whatsapp_number = waPhoneNumber;
    }

    // 🚀 3. UPSERT LOGIC (Crash-Proof Verification)
    const { data: existingData } = await supabase
        .from("user_configs")
        .select("id")
        .eq("email", email.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1);

    if (existingData && existingData.length > 0) {
        await supabase.from("user_configs").update(payload).eq("id", existingData[0].id);
    } else {
        await supabase.from("user_configs").insert({
            ...payload,
            email: email.toLowerCase(),
            tokens_used: 0,
            messages_used_this_month: 0
        });
    }

    // 🚀 4. DYNAMIC BILLING LEDGER (CEO Offer Prices)
    const pricingGroup = IN_FILE_PRICING[providerToSave === "multi_model" ? "omni" : safeModel] || IN_FILE_PRICING["gpt-5.2"];
    let invoiceAmount = pricingGroup[safePlan] || pricingGroup["plus"] || 0;

    await supabase.from("billing_history").insert({
      email: email.toLowerCase(),
      plan_name: safePlan.toUpperCase(),
      amount: invoiceAmount.toString(),
      currency: "USD",
      status: "PAID",
      payment_provider: "clawlink_direct",
      razorpay_order_id: "DEPLOY_" + Math.random().toString(36).substring(7).toUpperCase()
    });

    // 🚀 5. WEBHOOK & LINK GENERATION
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) {
          botLink = `https://t.me/${tData.result.username}`;
          const webhookUrl = `https://www.clawlinkai.com/api/webhook/telegram?token=${telegramToken}&email=${email}`;
          await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
        }
      } catch (err) {}
    } else if (selectedChannel === "whatsapp") {
      botLink = waPhoneNumber ? `https://api.whatsapp.com/send?phone=${waPhoneNumber.replace(/\D/g, '')}` : "https://business.facebook.com/wa/manage/";
    } else if (selectedChannel === "widget") {
      botLink = `https://www.clawlinkai.com/dashboard`;
    }

    // 🚀 6. ENTERPRISE EMAIL DELIVERY
    const emailHtml = `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto; background: #0A0A0B; color: #ffffff; padding: 40px; border-radius: 15px; border: 1px solid #333;">
        <h2 style="color: #22c55e; letter-spacing: 2px;">DEPLOYMENT SUCCESSFUL 🚀</h2>
        <p>Hello,</p>
        <p>Your Enterprise AI agent is now live on the ClawLink Global Edge Network.</p>
        <div style="background: #111; padding: 20px; border-radius: 10px; border: 1px solid #222; margin: 20px 0;">
          <p><strong>Plan:</strong> <span style="color: #fff; text-transform: uppercase;">${safePlan}</span></p>
          <p><strong>Amount:</strong> <span style="color: #fff;">$${invoiceAmount}</span></p>
          <p><strong>Validity:</strong> <span style="color: #fff;">${isUnlimited ? '365 Days' : '30 Days'}</span></p>
        </div>
        <p>Manage your bot persona and CRM from your dashboard.</p>
        <br/>
        <a href="https://www.clawlinkai.com/dashboard" style="background: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Access Dashboard</a>
        <p style="color: #666666; font-size: 10px; margin-top: 40px;">© 2026 CLAWLINK INC.</p>
      </div>
    `;
    
    sendEmail(email, "Welcome to ClawLink - Your Bot is Live! 🚀", emailHtml).catch(() => {});

    return NextResponse.json({ success: true, botLink });
  } catch (error: any) {
    console.error("Fatal Config Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}