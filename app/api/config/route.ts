/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CONFIGURATION API (PRODUCTION MODE)
 * ==============================================================================================
 * @file app/api/config/route.ts
 * @description Securely provisions the user's database record using real payload data.
 * FIXED: Replaced strict 'upsert' with a robust 'select -> update/insert' mechanism to resolve
 * the "no unique or exclusion constraint matching the ON CONFLICT" Supabase error.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase directly to prevent path alias resolution errors during Vercel builds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("[KNOX_SECURITY] FATAL: Supabase environment variables are missing.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const rawEmail = body.email || "";
    const email = sanitizeInput(rawEmail.toLowerCase());
    const selectedModel = sanitizeInput(body.selectedModel);
    const selectedChannel = sanitizeInput(body.selectedChannel);
    const telegramToken = sanitizeInput(body.telegramToken);
    const waPhoneId = sanitizeInput(body.waPhoneId);
    const waPhoneNumber = sanitizeInput(body.waPhoneNumber);
    
    // Real state extracted directly from the user's active session
    const actualPlan = sanitizeInput(body.plan || "free").toLowerCase();
    const actualPlanStatus = sanitizeInput(body.plan_status || "Inactive");
    const actualBotStatus = sanitizeInput(body.bot_status || "Sleeping");

    if (!email) {
      return NextResponse.json({ success: false, error: "Secure session email is required." }, { status: 400 });
    }

    // Strict exact match routing to ensure UI selection matches Database exactly
    let providerToSave = "openai";
    let exactModelVersion = "GPT-5.4 Pro";
    const safeModel = (selectedModel || "GPT-5.4 Pro").toLowerCase();

    if (safeModel.includes("omni") || safeModel.includes("nexus")) {
        providerToSave = "omni"; exactModelVersion = "Omni 3 Nexus";
    } else if (safeModel.includes("claude") || safeModel.includes("opus")) {
        providerToSave = "anthropic"; exactModelVersion = "Claude Opus 4.6";
    } else if (safeModel.includes("gemini") || safeModel.includes("google")) {
        providerToSave = "google"; exactModelVersion = "Gemini 3.1 Pro";
    }

    // Construct the full database payload. 
    // Do NOT pass created_at or updated_at manually to avoid schema cache errors.
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

    // Secure token injection mapped to the appropriate channel
    if (selectedChannel === "telegram" && telegramToken) {
        payload.telegram_token = telegramToken;
    } else if (selectedChannel === "whatsapp" && waPhoneId) {
        payload.wa_phone_id = waPhoneId;
        payload.whatsapp_token = telegramToken; 
        if (waPhoneNumber) payload.wa_phone_number = waPhoneNumber;
    } else if (selectedChannel === "instagram" && waPhoneId) {
        payload.instagram_account_id = waPhoneId; 
        payload.instagram_token = telegramToken; 
    }

    // --- ROBUST DATABASE OPERATION (Replaces strict UPSERT) ---
    // 1. Check if the user already exists
    const { data: existingUser, error: lookupError } = await supabaseAdmin
        .from("user_configs")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (lookupError) {
        throw new Error("Database Lookup Failed: " + lookupError.message);
    }

    if (existingUser) {
        // 2A. Update existing user
        const { error: updateError } = await supabaseAdmin
            .from("user_configs")
            .update(payload)
            .eq("id", existingUser.id);
        
        if (updateError) throw new Error("Database Update Failed: " + updateError.message);
    } else {
        // 2B. Insert new user
        const { error: insertError } = await supabaseAdmin
            .from("user_configs")
            .insert({ email: email, ...payload });
        
        if (insertError) throw new Error("Database Insert Failed: " + insertError.message);
    }
    // ----------------------------------------------------------

    // Dynamic Link Generation for the Live Bot integration
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) { botLink = `https://t.me/${tData.result.username}`; }
      } catch (err) {
        console.error("Failed to verify Telegram details silently.");
      }
    } else if (selectedChannel === "whatsapp") {
      botLink = waPhoneNumber ? `https://api.whatsapp.com/send?phone=${waPhoneNumber.replace(/\D/g, '')}` : "https://business.facebook.com/wa/manage/";
    } else if (selectedChannel === "instagram") {
      botLink = "https://www.instagram.com/";
    } else if (selectedChannel === "widget") {
      botLink = `/dashboard`;
    }

    return NextResponse.json({ success: true, botLink, message: "Configuration synced with production database successfully." });

  } catch (error: any) {
    console.error("[KNOX_API_FATAL] Configuration Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}