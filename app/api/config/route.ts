/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CONFIGURATION API (PRODUCTION MODE)
 * ==============================================================================================
 * @file app/api/config/route.ts
 * @description Securely provisions the user's database record using real payload data.
 * FIXED: Removed all dummy/testing billing logic.
 * FIXED: Uses supabaseAdmin client for RLS bypass.
 * FIXED: Exact Model Names and user-selected states are strictly preserved.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase"; // 🚀 SECURE: Using admin client

export const dynamic = "force-dynamic";

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
    
    // 🚀 REAL STATE: Directly taking what the user/system selected, no forced defaults
    const actualPlan = sanitizeInput(body.plan || "free").toLowerCase();
    const actualPlanStatus = sanitizeInput(body.plan_status || "Inactive");
    const actualBotStatus = sanitizeInput(body.bot_status || "Sleeping");

    if (!email) {
      return NextResponse.json({ success: false, error: "Secure session email is required." }, { status: 400 });
    }

    // 🚀 STRICT EXACT MATCH ROUTING: Maps exactly to what is displayed on UI
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

    // Full Database Payload Construction based on REAL data
    const payload: any = {
        ai_model: exactModelVersion, 
        selected_model: exactModelVersion, 
        ai_provider: providerToSave,
        current_model_version: exactModelVersion,
        plan_tier: actualPlan,
        plan_status: actualPlanStatus,
        bot_status: actualBotStatus,
        selected_channel: selectedChannel || "telegram",
        updated_at: new Date().toISOString()
    };

    // Secure Token injection based on selected channel
    if (selectedChannel === "telegram" && telegramToken) {
        payload.telegram_token = telegramToken;
    } else if (selectedChannel === "whatsapp" && waPhoneId) {
        payload.wa_phone_id = waPhoneId;
        payload.whatsapp_token = telegramToken; 
        if (waPhoneNumber) payload.wa_phone_number = waPhoneNumber;
    } else if (selectedChannel === "instagram" && waPhoneId) {
        payload.wa_phone_id = waPhoneId; 
        payload.instagram_token = telegramToken; 
    }

    // 🚀 REAL SECURE DB UPSERT: No dummy logic, pure database state management
    const { error: upsertError } = await supabaseAdmin
        .from("user_configs")
        .upsert(
            { email: email, ...payload, created_at: new Date().toISOString() }, 
            { onConflict: "email" }
        );

    if (upsertError) throw new Error("DB Operation Error: " + upsertError.message);

    // Dynamic Link Generation for the Live Bot
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) { botLink = `https://t.me/${tData.result.username}`; }
      } catch (err) {}
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