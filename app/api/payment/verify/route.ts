/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE PAYMENT VERIFICATION API
 * ==============================================================================================
 * @file app/api/payment/verify/route.ts
 * @description Secures and verifies the Razorpay signature. On success, it instantly 
 * provisions the user's database configuration with 2026 Model mapping using STRICT UPDATE
 * to prevent token overwriting/loss.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      plan,
      amount,
      selected_model,     // Expected: 'gpt-5.4 Pro', 'Claude Opus 4.6', 'gemini 3.1 Pro', or 'omni 3 nexus'
      selected_channel    // Expected: 'whatsapp', 'telegram', 'instagram', or 'widget'
    } = body;

    // 1. Verify Payment Signature (Enterprise Security)
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid cryptographic signature. Request terminated." }, { status: 400 });
    }

    // 2. Dynamic Resource Allocation based on 2026 Plan Tier
    let allocatedTokens = 2000000; // Default Plus
    let monthlyMessages = 5000;
    let isUnlimited = false;
    const currentPlan = (plan || "plus").toLowerCase();
    
    if (currentPlan === "pro") {
        allocatedTokens = 10000000;
        monthlyMessages = 25000;
    } else if (currentPlan === "ultra") {
        allocatedTokens = 25000000;
        monthlyMessages = 75000;
    } else if (currentPlan === "max" || currentPlan === "adv_max" || currentPlan === "yearly" || currentPlan === "monthly") {
       allocatedTokens = 100000000;
       monthlyMessages = 500000;
       isUnlimited = true;
    }

    const expiryDate = new Date();
    if (currentPlan === "adv_max" || currentPlan === "yearly") {
        expiryDate.setDate(expiryDate.getDate() + 365);
    } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // 3. Establish Master Mapping for AI Providers (2026 Strict Sync)
    let aiProvider = "openai";
    const rawModel = (selected_model || "gpt-5.4 Pro").toLowerCase();

    if (rawModel.includes("claude") || rawModel.includes("opus") || rawModel.includes("anthropic")) {
        aiProvider = "anthropic";
    }
    else if (rawModel.includes("gemini") || rawModel.includes("google")) {
        aiProvider = "google";
    }
    else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) {
        aiProvider = "omni";
    }

    const secureEmail = email.toLowerCase();

    // 4. THE PERMANENT FIX: Update existing row strictly instead of upserting (Protects Tokens!)
    const payload = {
        plan: currentPlan,
        plan_tier: currentPlan, 
        plan_status: "Active", 
        selected_model: selected_model || "gpt-5.4 Pro", 
        ai_model: selected_model || "gpt-5.4 Pro",
        ai_provider: aiProvider,
        current_model_version: selected_model || "gpt-5.4 Pro",
        selected_channel: selected_channel || "telegram",        
        tokens_allocated: allocatedTokens,
        available_tokens: allocatedTokens, 
        monthly_message_limit: monthlyMessages,
        is_unlimited: isUnlimited,
        plan_expiry_date: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
    };

    // Locate the user's specific config row to update it, avoiding upsert row-wipe conflicts
    const { data: existingConfig } = await supabase
        .from("user_configs")
        .select("id")
        .eq("email", secureEmail)
        .order("created_at", { ascending: false })
        .limit(1);

    if (existingConfig && existingConfig.length > 0) {
        const { error: updateError } = await supabase
            .from("user_configs")
            .update(payload)
            .eq("id", existingConfig[0].id);
        if (updateError) throw updateError;
    } else {
         const { error: insertError } = await supabase
            .from("user_configs")
            .insert({ ...payload, email: secureEmail });
         if (insertError) throw insertError;
    }

    // 5. Record the Immutable Bill in Dashboard
    await supabase.from("billing_history").insert({
      email: secureEmail,
      plan_name: currentPlan.toUpperCase(),
      amount: amount.toString(),
      currency: "INR", 
      status: "PAID",
      payment_provider: "razorpay_direct_verify",
      razorpay_order_id: razorpay_order_id
    });

    return NextResponse.json({ success: true, message: "Payment verified and Infrastructure unlocked successfully!" });

  } catch (error: any) {
    console.error("[PAYMENT_VERIFICATION_FATAL]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}