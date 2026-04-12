/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE RAZORPAY WEBHOOK HANDLER
 * ==============================================================================================
 * @file app/api/payment/webhook/route.ts
 * @description Securely receives background payment confirmations from Razorpay.
 * Instantly provisions resources, updates the 2026 model ledger, and wakes up the AI agents.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase Client with Service Role for admin bypass
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // 1. Security Check: Verify the cryptographic signature from Razorpay
    if (!signature) {
      console.error("[WEBHOOK ERROR] Missing signature.");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[WEBHOOK ERROR] Signature mismatch. Potential spoofing attempt.");
      return NextResponse.json({ error: "Unauthorized Signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    // 2. Process only if the payment is successfully captured
    if (payload.event === "payment.captured" || payload.event === "order.paid") {
      const paymentEntity = payload.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      
      const email = (notes.email || paymentEntity.email || "").toLowerCase();
      const planName = (notes.plan_name || "plus").toLowerCase();
      const rawModel = (notes.selected_model || notes.model || "gpt-5.4 Pro").toLowerCase();

      if (email) {
        // 3. Establish Strict Tier Limits based on 2026 Pricing
        let allocatedTokens = 2000000; 
        let monthlyMessages = 5000;
        let isUnlimited = false;
        const expiryDate = new Date();

        if (planName === "pro") { 
            allocatedTokens = 10000000; 
            monthlyMessages = 25000;
        } else if (planName === "ultra") { 
            allocatedTokens = 25000000; 
            monthlyMessages = 75000;
        } else if (planName === "adv_max" || planName === "yearly" || planName === "monthly") { 
            isUnlimited = true; 
            allocatedTokens = 100000000; 
            monthlyMessages = 500000;
        }

        if (planName === "adv_max" || planName === "yearly") {
            expiryDate.setDate(expiryDate.getDate() + 365);
        } else {
            expiryDate.setDate(expiryDate.getDate() + 30); 
        }

        // 4. Establish Master Mapping for AI Providers
        let aiProvider = "openai";
        let exactModelVersion = "gpt-5.4 Pro"; 

        if (rawModel.includes("claude") || rawModel.includes("anthropic") || rawModel.includes("opus")) {
            aiProvider = "anthropic";
            exactModelVersion = "Claude Opus 4.6";
        }
        else if (rawModel.includes("gemini") || rawModel.includes("google")) {
            aiProvider = "google";
            exactModelVersion = "gemini 3.1 Pro";
        }
        else if (rawModel.includes("omni") || rawModel.includes("multi") || rawModel.includes("nexus")) {
            aiProvider = "omni";
            exactModelVersion = "omni 3 nexus";
        }

        // 5. Build the comprehensive payload to fully awaken the system
        const updatePayload = {
            plan: planName,
            plan_tier: planName, 
            plan_status: "Active", // Instant Activation
            is_unlimited: isUnlimited, 
            tokens_allocated: allocatedTokens,
            available_tokens: allocatedTokens, // Reset tokens on fresh payment
            monthly_message_limit: monthlyMessages,
            plan_expiry_date: expiryDate.toISOString(),
            ai_model: exactModelVersion, 
            selected_model: exactModelVersion,
            current_model_version: exactModelVersion,
            ai_provider: aiProvider,
            updated_at: new Date().toISOString()
        };

        // 6. Execute the secure database update
        const { error: updateError } = await supabase
          .from("user_configs")
          .update(updatePayload)
          .eq("email", email);

        if (updateError) {
           console.error(`[WEBHOOK DB ERROR] Failed to provision ${email}:`, updateError.message);
           throw updateError;
        }

        console.log(`[WEBHOOK SUCCESS] ✅ Account ${email} fully upgraded to ${planName.toUpperCase()} on ${exactModelVersion}. Bots awakened.`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[WEBHOOK FATAL ERROR]:", error.message);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}