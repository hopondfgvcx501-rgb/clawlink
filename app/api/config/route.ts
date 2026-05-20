/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CONFIGURATION API (PRODUCTION MODE)
 * ==============================================================================================
 * @description Securely provisions the user's database record.
 * 🚀 UPGRADE: Knox Security Protocol V2 & Telegram Admin Error Logging.
 * 🚀 UPGRADE: Strict Token Isolation (Zero Bleeding). Omni-Catcher active.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; // TITANIUM SECURITY LOCK

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 🚨 TERA STRICT RULE: Send ALL backend errors to TG Admin
async function sendErrorToTG(errorMsg: string) {
    const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_ADMIN_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!TG_BOT_TOKEN || !TG_ADMIN_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TG_ADMIN_ID, text: `🚨 [CLAWLINK CONFIG CRASH]:\n\n${errorMsg}` })
        });
    } catch (e) { console.error("TG Alert Failed", e); }
}

if (!supabaseUrl || !supabaseKey) {
    const msg = "[KNOX_SECURITY] FATAL: Supabase environment variables are missing.";
    console.error(msg);
    sendErrorToTG(msg);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

export async function POST(req: Request) {
  try {
    // 🛡️ SECURITY LAYER 1: STRICT JWT AUTHENTICATION
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
        await sendErrorToTG("Unauthorized Access Attempt: No valid JWT Session.");
        return NextResponse.json({ success: false, error: "Unauthorized. Secure Session Required." }, { status: 401 });
    }

    const body = await req.json();
    
    // 🛡️ SECURITY LAYER 2: CRYPTOGRAPHIC EMAIL OVERRIDE
    const email = sanitizeInput(token.email.toLowerCase());
    
    // 🚀 OMNI-CATCHER: Grabs both CamelCase (UI) and Snake_case (Backend)
    const selectedModel = sanitizeInput(body.selectedModel || body.selected_model);
    const selectedChannel = sanitizeInput(body.selectedChannel || body.selected_channel);
    
    // 🔒 STRICT ISOLATION: No cross-contamination of tokens
    const telegramToken = sanitizeInput(body.telegramToken || body.telegram_token);
    const whatsappPhoneId = sanitizeInput(body.whatsappPhoneId || body.whatsapp_phone_id || body.waPhoneId);
    const whatsappToken = sanitizeInput(body.whatsappToken || body.whatsapp_token); 
    const whatsappPhoneNumber = sanitizeInput(body.whatsappPhoneNumber || body.whatsapp_number || body.waPhoneNumber);
    const instagramAccountId = sanitizeInput(body.instagramAccountId || body.instagram_account_id);
    const instagramToken = sanitizeInput(body.instagramToken || body.instagram_token);

    const actualPlan = sanitizeInput(body.plan || "free").toLowerCase();
    const actualPlanStatus = sanitizeInput(body.plan_status || "Inactive");
    const actualBotStatus = sanitizeInput(body.bot_status || "Sleeping");

    // 🤖 OMNI-FALLBACK ENGINE ROUTING
    let providerToSave = "openai";
    let exactModelVersion = "GPT-5.5 Pro"; // Default
    const safeModel = (selectedModel || "GPT-5.5 Pro").toLowerCase();

    if (safeModel.includes("omni") || safeModel.includes("nexus")) {
        providerToSave = "omni"; exactModelVersion = "Omni 3 Nexus";
    } else if (safeModel.includes("claude") || safeModel.includes("opus")) {
        providerToSave = "anthropic"; exactModelVersion = "Claude Opus 4.7";
    } else if (safeModel.includes("gemini") || safeModel.includes("google")) {
        providerToSave = "google"; exactModelVersion = "Gemini 3.1 Pro";
    }

    const payload: any = {
        ai_model: exactModelVersion, 
        selected_model: exactModelVersion, 
        ai_provider: providerToSave,
        current_model_version: exactModelVersion,
        plan_tier: actualPlan,
        plan_status: actualPlanStatus,
        bot_status: actualBotStatus,
        selected_channel: selectedChannel || "telegram"
    };

    // 🚦 TRAFFIC CONTROLLER: Ensures pure channel data writing
    if (selectedChannel === "telegram") {
        if (telegramToken) payload.telegram_token = telegramToken;
    } 
    else if (selectedChannel === "whatsapp") {
        if (whatsappPhoneId) payload.whatsapp_phone_id = whatsappPhoneId;
        if (whatsappToken) payload.whatsapp_token = whatsappToken; 
        if (whatsappPhoneNumber) payload.whatsapp_number = whatsappPhoneNumber;
    } 
    else if (selectedChannel === "instagram") {
        if (instagramAccountId) payload.instagram_account_id = instagramAccountId; 
        if (instagramToken) payload.instagram_token = instagramToken; 
    }

    // 🛡️ SECURITY LAYER 3: CRASH-PROOF DB EXECUTION
    const { data: existingUsers, error: lookupError } = await supabaseAdmin
        .from("user_configs")
        .select("id")
        .eq("email", email)
        .order("created_at", { ascending: false }) 
        .limit(1); 

    if (lookupError) throw new Error("DB Lookup Failed: " + lookupError.message);

    const existingUser = existingUsers?.[0];

    if (existingUser) {
        const { error: updateError } = await supabaseAdmin
            .from("user_configs")
            .update(payload)
            .eq("id", existingUser.id);
        if (updateError) throw new Error("DB Update Failed: " + updateError.message);
    } else {
        const { error: insertError } = await supabaseAdmin
            .from("user_configs")
            .insert({ email: email, ...payload });
        if (insertError) throw new Error("DB Insert Failed: " + insertError.message);
    }

    // Dynamic Link Generation
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) { botLink = `https://t.me/${tData.result.username}`; }
      } catch (err) { /* Silent fail */ }
    } else if (selectedChannel === "whatsapp") {
      botLink = whatsappPhoneNumber ? `https://api.whatsapp.com/send?phone=${whatsappPhoneNumber.replace(/\D/g, '')}` : "https://business.facebook.com/wa/manage/";
    } else if (selectedChannel === "instagram") {
      botLink = "https://www.instagram.com/";
    } else if (selectedChannel === "widget") {
      botLink = `/dashboard`;
    }

    return NextResponse.json({ success: true, botLink, message: "Configuration synced with Knox Security successfully." });

  } catch (error: any) {
    const errorMsg = error.message || "Unknown Runtime Exception";
    console.error("[KNOX_API_FATAL] Configuration Error:", errorMsg);
    // 🚨 SENDING ERROR TO ADMIN TELEGRAM
    await sendErrorToTG(`Payload Sync Failed for user.\nError: ${errorMsg}`);
    
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}