/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE RAZORPAY VERIFIER (TITANIUM SECURED)
 * ==============================================================================================
 * @file app/api/payment/verify/route.ts
 * @description The Ultimate RLS-Bypass & Error-Proof Updater for Enterprise SaaS.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan, amount, selected_model } = body;

    // 1. HARD VERCEL ENV CHECK - Force Crash if keys are missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!supabaseUrl || !serviceKey || !razorpaySecret) {
        console.error("🔴 MISSING CRITICAL ENV VARIABLES IN VERCEL.");
        return NextResponse.json({ success: false, error: "Critical Environment Variables Missing." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // 2. CRYPTOGRAPHIC VERIFICATION
    const generated_signature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error(`🚨 HACK ATTEMPT BLOCKED for: ${email}`);
      return NextResponse.json({ success: false, error: "Invalid Cryptographic Signature." }, { status: 400 });
    }

    // 3. SECURE DATA PREP
    const safeEmail = (email || "").toLowerCase().trim();
    const planTier = (plan || "plus").toLowerCase();
    const exactModelVersion = (selected_model || "gpt-5.4 Pro").toLowerCase();

    let aiProvider = "openai";
    if (exactModelVersion.includes("claude")) aiProvider = "anthropic";
    else if (exactModelVersion.includes("gemini")) aiProvider = "google";
    else if (exactModelVersion.includes("omni")) aiProvider = "omni";

    let isUnlimited = false;
    let allocatedTokens = 2000000;
    let monthlyLimit = 5000;

    if (planTier === "pro") { allocatedTokens = 10000000; monthlyLimit = 25000; }
    else if (planTier === "ultra") { allocatedTokens = 25000000; monthlyLimit = 75000; }
    else if (["adv_max", "yearly", "max"].includes(planTier)) {
        isUnlimited = true; allocatedTokens = 100000000; monthlyLimit = 500000;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (isUnlimited ? 365 : 30));

    // 4. THE MINIMALIST PAYLOAD (Only absolutely core DB columns to prevent crashes)
    const configPayload = {
        plan_status: 'Active',
        bot_status: 'Active',
        plan: planTier,
        plan_tier: planTier,
        plan_name: planTier,
        plan_type: isUnlimited ? "yearly" : "monthly",
        tokens_allocated: allocatedTokens,
        available_tokens: allocatedTokens,
        monthly_message_limit: monthlyLimit,
        expires_at: expiryDate.toISOString()
    };

    console.log(`[VERIFY] Process Started for ${safeEmail} -> Target Plan: ${planTier}`);

    // 🚀 5. THE FAIL-SAFE DB INJECTION (UPSERT)
    // We fetch first to see if they exist. If they do, we update by ID. If not, we error.
    const { data: userRecord, error: fetchErr } = await supabase
        .from('user_configs')
        .select('id, email')
        .ilike('email', safeEmail)
        .single();

    if (fetchErr || !userRecord) {
        console.error(`🔴 ACCOUNT NOT FOUND FOR ${safeEmail}`);
        return NextResponse.json({ 
            success: false, 
            error: `Email ${safeEmail} not found in database. Make sure you login first before upgrading.` 
        }, { status: 404 });
    }

    // Direct Update by Row ID (The most secure way in Postgres)
    const { data: finalUpdate, error: updateErr } = await supabase
        .from('user_configs')
        .update(configPayload)
        .eq('id', userRecord.id)
        .select();

    if (updateErr) {
        console.error("🔴 DB UPDATE ERROR:", updateErr);
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    if (!finalUpdate || finalUpdate.length === 0) {
        console.error(`🔴 UPDATE SILENTLY REJECTED FOR ID ${userRecord.id}`);
        return NextResponse.json({ success: false, error: "Database rejected the change silently." }, { status: 500 });
    }

    // 6. RECORD BILLING
    await supabase.from("billing_history").insert({
      email: safeEmail,
      plan_name: planTier.toUpperCase(),
      amount: amount.toString(),
      currency: "INR",
      status: "PAID",
      payment_provider: "razorpay",
      transaction_id: razorpay_payment_id
    });

    console.log(`✅ [SUCCESS] Bot successfully Awakened for ${safeEmail}!`);
    return NextResponse.json({ success: true, message: "Bot Infrastructure is ACTIVE!" });

  } catch (error: any) {
    console.error("[FATAL VERIFY ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown Server Error" }, { status: 500 });
  }
}