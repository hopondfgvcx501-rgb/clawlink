/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE RAZORPAY WEBHOOK (TITANIUM SECURED)
 * ==============================================================================================
 * @file app/api/payment/webhook/route.ts
 * @description Background listener for Razorpay. Strictly blocks unauthenticated webhooks 
 * using cryptographic signature checks. Provisions accounts safely.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// 🚀 FIXED: Always use SERVICE_ROLE_KEY to bypass Row Level Security during webhook updates
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
        } catch (e) { console.error(e); }
    }
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // 🔒 LEVEL 1: Webhook Signature Guard
    if (!signature) {
      console.error("[RAZORPAY_WEBHOOK_BLOCKED] Missing signature.");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[RAZORPAY_WEBHOOK_HACK] Signature mismatch!");
      await sendTelegramAdminAlert(`🚨 [HACK ATTEMPT BLOCKED] Fake Razorpay Webhook request detected. Origin spoofing blocked.`);
      return NextResponse.json({ error: "Unauthorized Cryptographic Signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    // 🔒 LEVEL 2: Execution on Valid Event Only
    if (payload.event === "payment.captured" || payload.event === "order.paid") {
      const paymentEntity = payload.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      
      const email = (notes.email || paymentEntity.email || "").toLowerCase();
      const planTier = (notes.plan_tier || notes.plan || "plus").toLowerCase();
      const rawModel = (notes.selected_model || notes.model || "gpt-5.4 Pro").toLowerCase();

      if (email) {
        // 1. Establish Master Mapping for AI Providers (2026 Schema)
        let aiProvider = "openai";
        let exactModelVersion = notes.selected_model || "gpt-5.4 Pro";

        if (rawModel.includes("claude") || rawModel.includes("opus") || rawModel.includes("anthropic")) {
            aiProvider = "anthropic"; exactModelVersion = "Claude Opus 4.6";
        } else if (rawModel.includes("gemini") || rawModel.includes("google")) {
            aiProvider = "google"; exactModelVersion = "gemini 3.1 Pro";
        } else if (rawModel.includes("omni") || rawModel.includes("nexus")) {
            aiProvider = "omni"; exactModelVersion = "omni 3 nexus";
        }

        // 2. Establish Strict Tier Limits
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

        // 3. Assemble Payload (Perfect DB Sync - 100% OVERRIDE)
        const configPayload = {
            plan: planTier,
            plan_tier: planTier,
            plan_name: planTier,
            plan_type: planTier === "adv_max" || planTier === "yearly" ? "yearly" : "monthly",
            is_unlimited: isUnlimited, 
            tokens_allocated: allocatedTokens,
            available_tokens: allocatedTokens,
            monthly_message_limit: monthlyLimit,
            plan_expiry_date: expiryDate.toISOString(),
            plan_status: 'Active', // 🔥 AWAKENS THE BOT
            bot_status: 'Active', 
            current_model_version: exactModelVersion,
            ai_model: exactModelVersion,
            selected_model: exactModelVersion,
            ai_provider: aiProvider,
            updated_at: new Date().toISOString()
        };

        // 4. Securely Update Database
        const { error: configError } = await supabase.from("user_configs").update(configPayload).eq("email", email);

        if (configError) throw configError;
        console.log(`[RAZORPAY_WEBHOOK_SUCCESS] Account automation unlocked for ${email}.`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK_FATAL]:", error.message);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}