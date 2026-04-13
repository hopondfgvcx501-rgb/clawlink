/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE RAZORPAY VERIFIER (GOD-MODE ACTIVE)
 * ==============================================================================================
 * @file app/api/payment/verify/route.ts
 * @description Forcefully awakens the bot. Uses Insert/Update fallback to bypass ALL Supabase silent failures.
 * Removes non-existent columns to prevent crashes.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// Disabled persistSession to prevent cache blocking
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

// 🛡️ SECURITY & MONITORING ALERT SYSTEM
async function sendTelegramAdminAlert(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (token && adminChatId) {
        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: adminChatId, text: message })
            });
        } catch (e) { console.error("[TELEGRAM_ALERT_FAILED]", e); }
    }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan, amount, selected_model } = body;

    // 🔒 LEVEL 1: HMAC Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!secret) throw new Error("Razorpay Secret Missing in Backend");

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error(`[RAZORPAY_HACK_ATTEMPT] Invalid signature from: ${email}`);
      await sendTelegramAdminAlert(`🚨 [HACK ATTEMPT BLOCKED] Fake Razorpay Verification attempt caught for email: ${email}.`);
      return NextResponse.json({ success: false, error: "Cryptographic validation failed. Incident Logged." }, { status: 400 });
    }

    const safeEmail = (email || "").trim(); // Kept original case for the search
    const planTier = (plan || "plus").toLowerCase();
    const rawModel = (selected_model || "gpt-5.4 Pro").toLowerCase();

    console.log(`[RAZORPAY_VERIFIED] True payment confirmed for ${safeEmail}. Forcing DB Activation...`);

    // 🔒 LEVEL 2: 2026 Omni-Engine Mapping
    let aiProvider = "openai";
    let exactModelVersion = selected_model || "gpt-5.4 Pro";

    if (rawModel.includes("claude") || rawModel.includes("opus") || rawModel.includes("anthropic")) {
        aiProvider = "anthropic";
        exactModelVersion = "Claude Opus 4.6";
    } else if (rawModel.includes("gemini") || rawModel.includes("google")) {
        aiProvider = "google";
        exactModelVersion = "gemini 3.1 Pro";
    } else if (rawModel.includes("omni") || rawModel.includes("nexus")) {
        aiProvider = "omni";
        exactModelVersion = "omni 3 nexus";
    }

    // 🔒 LEVEL 3: Strict Token & Quota Allocation
    let isUnlimited = false;
    let allocatedTokens = 2000000; 
    let monthlyLimit = 5000;

    if (planTier === "pro") { allocatedTokens = 10000000; monthlyLimit = 25000; } 
    else if (planTier === "ultra") { allocatedTokens = 25000000; monthlyLimit = 75000; } 
    else if (planTier === "adv_max" || planTier === "yearly" || planTier === "max") { 
        isUnlimited = true; allocatedTokens = 100000000; monthlyLimit = 500000; 
    }

    const expiryDate = new Date();
    if (planTier === "adv_max" || planTier === "yearly") expiryDate.setDate(expiryDate.getDate() + 365);
    else expiryDate.setDate(expiryDate.getDate() + 30); 

    // 🔒 LEVEL 4: THE ABSOLUTE OVERRIDE PAYLOAD (No dates, no extra columns that can fail)
    const configPayload = {
        plan_status: 'Active', 
        bot_status: 'Active', 
        plan: planTier,
        plan_tier: planTier,
        plan_name: planTier,
        plan_type: planTier === "adv_max" || planTier === "yearly" ? "yearly" : "monthly",
        is_unlimited: isUnlimited, 
        tokens_allocated: allocatedTokens,
        available_tokens: allocatedTokens,
        monthly_message_limit: monthlyLimit,
        expires_at: expiryDate.toISOString(), 
        current_model_version: exactModelVersion,
        ai_model: exactModelVersion,
        selected_model: exactModelVersion,
        ai_provider: aiProvider
    };

    // 🚀 LEVEL 5: INDESTRUCTIBLE DB UPDATE (Handles missing rows and case sensitivity)
    let dbError = null;
    
    // Step A: Dhoondo user ko (case-insensitive search using .ilike)
    const { data: existingUser } = await supabase.from("user_configs").select("email").ilike("email", safeEmail).single();

    if (existingUser && existingUser.email) {
        // Step B: Agar user mil gaya, toh uski exact email par Update maaro
        console.log(`User found (${existingUser.email}), executing UPDATE...`);
        const { error } = await supabase.from("user_configs").update(configPayload).eq("email", existingUser.email);
        dbError = error;
    } else {
        // Step C: Agar user DB mein hai hi nahi, toh naya Insert maaro!
        console.log(`User NOT found. Executing INSERT for ${safeEmail}...`);
        const { error } = await supabase.from("user_configs").insert({ email: safeEmail, ...configPayload });
        dbError = error;
    }

    if (dbError) {
        console.error("🔴 DB OVERRIDE FAILED:", dbError);
        return NextResponse.json({ success: false, error: `Database Error: ${dbError.message}` }, { status: 500 });
    }

    // 🔒 LEVEL 6: RECORD BILLING
    await supabase.from("billing_history").insert({
      email: safeEmail,
      plan_name: planTier.toUpperCase(),
      amount: amount.toString(),
      currency: "INR",
      status: "PAID",
      payment_provider: "razorpay",
      razorpay_order_id: razorpay_order_id,
      transaction_id: razorpay_payment_id
    });

    console.log(`✅ [SUCCESS] Bot is now LIVE for ${safeEmail}`);
    await sendTelegramAdminAlert(`💵 [INR PAYMENT SUCCESS] ${safeEmail} upgraded to ${planTier.toUpperCase()} on ${exactModelVersion}. Infrastructure is now ACTIVE.`);
    
    return NextResponse.json({ success: true, message: "Payment verified and Bot Unlocked!" });

  } catch (error: any) {
    console.error("[FATAL VERIFY ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}