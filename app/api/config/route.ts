/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CONFIGURATION API (KNOX SECURED - TEST MODE ACTIVE)
 * ==============================================================================================
 * @file app/api/config/route.ts
 * @description Securely provisions the user's database record. 
 * CURRENT STATE: Testing Mode (Plus plan at ₹5 INR for CEO validation).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

/**
 * 🚀 TEST PRICING MATRIX (INR Mode for Plus Plan)
 * Transition Note: Revert 'plus' values to USD standard ($6, $8, $10) post-testing.
 */
const IN_FILE_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 5, pro: 999, ultra: 1999, adv_max: 49999 },
  "gpt-5.4 Pro": { plus: 5, pro: 1499, ultra: 2999, adv_max: 74999 },
  "Claude Opus 4.6": { plus: 5, pro: 1999, ultra: 3999, adv_max: 99999 },
  "omni 3 nexus": { monthly: 20916, yearly: 149999 }
};

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
    
    const safePlan = sanitizeInput(body.plan || "free").toLowerCase();
    const planStatus = sanitizeInput(body.plan_status || "Inactive");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    let allocatedTokens = 0; 
    let monthlyMessages = 0;
    let isUnlimited = false;

    // Token Allocation Logic
    if (safePlan === "plus" || safePlan === "starter") {
        allocatedTokens = 2000000; 
        monthlyMessages = 5000;
    } else if (safePlan === "pro") {
        allocatedTokens = 10000000; 
        monthlyMessages = 25000;
    } else if (safePlan === "ultra" || safePlan === "max") {
        allocatedTokens = 25000000; 
        monthlyMessages = 75000;
    } else if (safePlan === "adv_max" || safePlan === "yearly" || safePlan === "monthly") {
        isUnlimited = true;
        allocatedTokens = 100000000; 
        monthlyMessages = 500000;
    }

    const expiryDate = new Date();
    if (safePlan === "adv_max" || safePlan === "yearly") {
        expiryDate.setDate(expiryDate.getDate() + 365);
    } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // Exact Match Routing for 2026 Models
    let providerToSave = "openai";
    let exactModelVersion = "gpt-5.4 Pro";
    const safeModel = (selectedModel || "gpt-5.4 Pro").toLowerCase();

    if (safeModel.includes("omni") || safeModel.includes("nexus")) {
        providerToSave = "omni"; exactModelVersion = "omni 3 nexus";
    } else if (safeModel.includes("claude") || safeModel.includes("opus")) {
        providerToSave = "anthropic"; exactModelVersion = "Claude Opus 4.6";
    } else if (safeModel.includes("gemini") || safeModel.includes("google")) {
        providerToSave = "google"; exactModelVersion = "gemini 3.1 Pro";
    }

    // Full Database Payload Construction
    const payload: any = {
        ai_model: exactModelVersion,
        selected_model: exactModelVersion, 
        ai_provider: providerToSave,
        current_model_version: exactModelVersion,
        tokens_allocated: allocatedTokens,
        available_tokens: allocatedTokens,
        monthly_message_limit: monthlyMessages,
        is_unlimited: isUnlimited,
        plan: safePlan,
        plan_status: planStatus,
        expires_at: expiryDate.toISOString(),
        plan_expiry_date: expiryDate.toISOString(),
        selected_channel: selectedChannel || "widget"
    };

    if (selectedChannel === "telegram" && telegramToken) {
        payload.telegram_token = telegramToken;
    } else if (selectedChannel === "whatsapp" && waPhoneId) {
        payload.whatsapp_phone_id = waPhoneId;
        payload.whatsapp_token = telegramToken; 
        if (waPhoneNumber) payload.whatsapp_number = waPhoneNumber;
    } else if (selectedChannel === "instagram" && waPhoneId) {
        payload.instagram_account_id = waPhoneId;
        payload.instagram_token = telegramToken; 
    }

    // Database Sync Execution
    const { data: existingData, error: lookupError } = await supabase
        .from("user_configs")
        .select("id")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1);

    if (lookupError) throw new Error("DB Lookup Error: " + lookupError.message);

    if (existingData && existingData.length > 0) {
        const { error: updateError } = await supabase.from("user_configs").update(payload).eq("id", existingData[0].id);
        if (updateError) throw new Error("DB Update Error: " + updateError.message); 
    } else {
        const { error: insertError } = await supabase.from("user_configs").insert({
            ...payload, email: email, tokens_used: 0, messages_used_this_month: 0, created_at: new Date().toISOString()
        });
        if (insertError) throw new Error("DB Insert Error: " + insertError.message); 
    }

    // Automated Invoice Generation (Testing Mode: INR)
    let invoiceAmount = 0;
    if (safePlan !== "free") {
        const pricingGroup = IN_FILE_PRICING[exactModelVersion] || IN_FILE_PRICING["gpt-5.4 Pro"];
        invoiceAmount = pricingGroup[safePlan] || pricingGroup["plus"] || 0;
        
        await supabase.from("billing_history").insert({
          email: email, 
          plan_name: safePlan.toUpperCase(), 
          amount: invoiceAmount.toString(), 
          currency: "INR", 
          status: "PAID", 
          payment_provider: "clawlink_direct", 
          razorpay_order_id: "DEPLOY_TEST_" + Math.random().toString(36).substring(7).toUpperCase()
        });
    }

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

    return NextResponse.json({ success: true, botLink, message: "Enterprise configuration securely provisioned for testing." });

  } catch (error: any) {
    console.error("[KNOX_API_FATAL] Configuration Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}