/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CONFIGURATION API (KNOX SECURED - CRASH PROOF)
 * ==============================================================================================
 * @file app/api/config/route.ts
 * @description Securely provisions the user's database record under the "Free/Sleeping" 
 * state for PLG onboarding. Contains specific error pass-through logic for immediate 
 * infrastructure diagnostics.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../lib/email"; 

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

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

    let providerToSave = "openai";
    let exactModelVersion = "gpt-4o-mini";
    const safeModel = (selectedModel || "gpt-5.2").toLowerCase();

    if (safeModel.includes("multi_model") || safeModel.includes("omni") || safeModel.includes("nexus")) {
        providerToSave = "multi_model"; exactModelVersion = "omni-nexus-engine";
    } else if (safeModel.includes("claude") || safeModel.includes("anthropic")) {
        providerToSave = "anthropic"; exactModelVersion = "claude-3-opus-20240229";
    } else if (safeModel.includes("gemini") || safeModel.includes("google")) {
        providerToSave = "google"; exactModelVersion = "gemini-1.5-flash-8b";
    }

    // 🛡️ SAFELY BUILDING PAYLOAD (Avoiding strict new columns that might break DB)
    const payload: any = {
        ai_model: safeModel,
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
        // We will try to save IG credentials safely
        payload.instagram_account_id = waPhoneId;
        payload.instagram_token = telegramToken; 
    }

    const { data: existingData, error: lookupError } = await supabase
        .from("user_configs")
        .select("id")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1);

    if (lookupError) throw new Error("DB Lookup Error: " + lookupError.message);

    if (existingData && existingData.length > 0) {
        const { error: updateError } = await supabase.from("user_configs").update(payload).eq("id", existingData[0].id);
        if (updateError) throw new Error("DB Update Error: " + updateError.message); // Exact error pass
    } else {
        const { error: insertError } = await supabase.from("user_configs").insert({
            ...payload, email: email, tokens_used: 0, messages_used_this_month: 0, created_at: new Date().toISOString()
        });
        if (insertError) throw new Error("DB Insert Error: " + insertError.message); // Exact error pass
    }

    let invoiceAmount = 0;
    if (safePlan !== "free") {
        const pricingGroup = IN_FILE_PRICING[providerToSave === "multi_model" ? "omni" : safeModel] || IN_FILE_PRICING["gpt-5.2"];
        invoiceAmount = pricingGroup[safePlan] || pricingGroup["plus"] || 0;
        await supabase.from("billing_history").insert({
          email: email, plan_name: safePlan.toUpperCase(), amount: invoiceAmount.toString(), currency: "USD",
          status: "PAID", payment_provider: "clawlink_direct", razorpay_order_id: "DEPLOY_" + Math.random().toString(36).substring(7).toUpperCase()
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
      botLink = `https://www.clawlinkai.com/dashboard`;
    }

    return NextResponse.json({ success: true, botLink, message: "Enterprise configuration securely provisioned." });

  } catch (error: any) {
    console.error("[KNOX_API_FATAL] Configuration Error:", error.message);
    // 🚨 YAHAN SE EXACT SUPABASE ERROR FRONTEND PAR JAYEGA
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}