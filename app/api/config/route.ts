import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../lib/email"; // Check your exact path

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, selectedModel, selectedChannel, telegramToken, waPhoneId, plan } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required for deployment." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    let allocatedTokens = 10000;
    let isUnlimited = false;

    // Plan Allowances
    if (plan === "starter") allocatedTokens = 50000;
    else if (plan === "pro") allocatedTokens = 500000; 
    else if (plan === "max" || plan === "monthly" || plan === "yearly") { 
      isUnlimited = true; 
      allocatedTokens = 9999999; 
    }

    // 🚀 CRITICAL FIX: Ensure 'multi_model' saves correctly as the provider for OmniAgent
    let providerToSave = "anthropic"; // default fallback
    if (selectedModel === "multi_model" || selectedModel === "omni") providerToSave = "multi_model"; 
    else if (selectedModel === "gpt-5.2" || selectedModel === "openai") providerToSave = "openai";
    else if (selectedModel === "gemini") providerToSave = "google";

    // 1. UPDATE OR INSERT USER CONFIGURATION (AGENCY MODEL)
    const payload: any = {
        ai_model: selectedModel,
        ai_provider: providerToSave,
        tokens_allocated: allocatedTokens, 
        available_tokens: allocatedTokens,
        is_unlimited: isUnlimited,
        plan: plan, 
        plan_status: 'Active',
        expires_at: expiryDate.toISOString(),
        selected_channel: selectedChannel
    };

    let botIdentifier = null;
    let botColumn = null;

    if (selectedChannel === "telegram" && telegramToken) {
        payload.telegram_token = telegramToken;
        botIdentifier = telegramToken;
        botColumn = "telegram_token";
    } else if (selectedChannel === "whatsapp" && waPhoneId) {
        payload.whatsapp_token = telegramToken; // Frontend passes token here
        payload.whatsapp_phone_id = waPhoneId;
        botIdentifier = waPhoneId;
        botColumn = "whatsapp_phone_id";
    }

    // 🚀 SURGICAL FIX: Safely check existingBot and fallback to latest config if no specific bot found
    if (botIdentifier && botColumn) {
        const { data: existingBot } = await supabase
            .from("user_configs")
            .select("id")
            .eq("email", email.toLowerCase())
            .eq(botColumn, botIdentifier)
            .limit(1)
            .single();

        if (existingBot) {
            const { error } = await supabase.from("user_configs").update(payload).eq("id", existingBot.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("user_configs").insert({
                ...payload,
                email: email.toLowerCase(),
                tokens_used: 0,
                messages_used_this_month: 0
            });
            if (error) throw error;
        }
    } else {
        // Legacy fallback or Widget creation
        const { data: latestFallback } = await supabase
            .from("user_configs")
            .select("id")
            .eq("email", email.toLowerCase())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
        if (latestFallback) {
             await supabase.from("user_configs").update(payload).eq("id", latestFallback.id);
        } else {
             await supabase.from("user_configs").insert({
                ...payload,
                email: email.toLowerCase(),
                tokens_used: 0,
                messages_used_this_month: 0
             });
        }
    }

    // 2. RECORD BILLING HISTORY FOR DASHBOARD INVOICES
    let amount = "19.00"; // Fallback
    if (plan === "pro") amount = "39.00";
    if (plan === "max") amount = "89.00";
    if (plan === "monthly") amount = "79.00"; 
    if (plan === "yearly") amount = "790.00"; 

    await supabase.from("billing_history").insert({
      email: email.toLowerCase(),
      plan_name: plan,
      amount: amount,
      currency: "USD", 
      status: "PAID",
      razorpay_order_id: "DEPLOY_" + Math.random().toString(36).substring(7).toUpperCase()
    });

    // 3. GENERATE BOT LINK & AUTO-SET TELEGRAM WEBHOOK
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) {
          botLink = `https://t.me/${tData.result.username}`;
          const webhookUrl = `https://clawlink-six.vercel.app/api/webhook/telegram?token=${telegramToken}&email=${email}`;
          await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
        }
      } catch (err) {
        console.error("Telegram link fetch failed.");
      }
    } else if (selectedChannel === "whatsapp") {
      botLink = "https://business.facebook.com/wa/manage/";
    } else if (selectedChannel === "widget") {
      botLink = `https://clawlink-six.vercel.app/dashboard`; // Just redirect to dashboard for widget
    }

    // 4. SEND BEAUTIFUL ONBOARDING EMAIL
    const emailHtml = `
      <div style="font-family: monospace; max-w: 600px; margin: 0 auto; background: #0A0A0B; color: #ffffff; padding: 40px; border-radius: 15px; border: 1px solid #333;">
        <h2 style="color: #22c55e; letter-spacing: 2px;">DEPLOYMENT SUCCESSFUL 🚀</h2>
        <p style="color: #cccccc; font-size: 16px;">Hello,</p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Welcome to ClawLink! Your Enterprise AI agent is now live and fully connected to the Global Edge Network.</p>
        
        <div style="background: #111; padding: 20px; border-radius: 10px; border: 1px solid #222; margin: 20px 0;">
          <p style="margin: 5px 0; color: #aaa;"><strong>Plan:</strong> <span style="color: #fff; text-transform: uppercase;">${plan}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>AI Engine:</strong> <span style="color: #fff; text-transform: uppercase;">${selectedModel === 'multi_model' ? 'OmniAgent Nexus' : selectedModel}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>Channel:</strong> <span style="color: #fff; text-transform: capitalize;">${selectedChannel}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>Validity:</strong> <span style="color: #fff;">30 Days</span></p>
        </div>

        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">You can manage your bot's CRM, view billing history, and update the AI Persona directly from your dashboard.</p>
        <br/>
        ${botLink && selectedChannel !== 'widget' ? `<a href="${botLink}" style="background: #22c55e; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; margin-right: 10px; display: inline-block;">Open Live Bot</a>` : ''}
        <a href="https://clawlink.com/dashboard" style="background: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; margin-top: 10px;">Access Dashboard</a>
        
        <hr style="border: 0; border-top: 1px solid #333; margin: 40px 0 20px 0;" />
        <p style="color: #666666; font-size: 12px; letter-spacing: 1px;">© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</p>
      </div>
    `;
    
    sendEmail(email, "Welcome to ClawLink - Your Bot is Live! 🚀", emailHtml).catch(console.error);

    return NextResponse.json({ success: true, botLink });
  } catch (error: any) {
    console.error("Config Deployment Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}