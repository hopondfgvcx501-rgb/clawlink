import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js"; 
// 🚀 FIXED: Adjusted import path to match your specific app/lib folder structure
import { sendTelegramAdminAlert } from "@/app/lib/telegramAlert";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: DUAL-ENGINE WEBHOOK SYNCHRONIZATION
 * ==============================================================================================
 * @file app/api/webhook/razorpay/route.ts
 * @description Serves as a unified ingress point for both Telegram Gatekeeper verification
 * and Razorpay cryptographic payment synchronization.
 * 🚀 ADDED: Direct integration with global Telegram Admin Alert utility.
 * 🚀 UPDATED: Synchronized immutable ledger insertion with the new billing_history schema.
 * 🚀 SECURED: Strict HMAC validation and dynamic fallback parameters enforced.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

export const dynamic = "force-dynamic";

// Initialize elevated Service Role client to bypass RLS for background system execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 🛑 ------------------------------------------------------------ 🛑
    //                 THE GATEKEEPER LOGIC (FREE TIER CHECK)
    // 🛑 ------------------------------------------------------------ 🛑
    const url = new URL(req.url);
    const botToken = url.searchParams.get("token"); 

    // If a token exists in the URL, this is a Telegram incoming message webhook
    if (botToken) {
        try {
            const update = JSON.parse(rawBody);
            
            // Check if this is a standard text message routing attempt
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;

                // 1. Fetch User Configuration securely from the database
                const { data: userConfig } = await supabase
                  .from("user_configs")
                  .select("plan_tier, plan_status")
                  .eq("telegram_token", botToken)
                  .single();

                if (userConfig) {
                    const currentPlan = userConfig.plan_tier?.toLowerCase() || "free";
                    
                    // 2. Gatekeeper Check: If Free/Starter or Not Active -> Block & Warn instantly
                    if (currentPlan === "free" || currentPlan === "starter" || userConfig.plan_status !== "Active") {
                      
                      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            chat_id: chatId, 
                            text: "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their enterprise plan in the dashboard to enable 24/7 autonomous capabilities.",
                            parse_mode: "Markdown"
                        }),
                      });
                      
                      console.log(`[GATEKEEPER] Blocked unpaid execution sequence for token: ${botToken}`);
                      // Return success immediately to terminate Telegram's webhook retry cycle
                      return NextResponse.json({ success: true }); 
                    }
                }
            }
        } catch (gatekeeperException) {
            console.error("[GATEKEEPER ERROR] Payload parsing failed:", gatekeeperException);
        }
    }
    // 🛑 ---------------- END GATEKEEPER LOGIC ------------------------ 🛑


    // 💵 ------------------------------------------------------------ 💵
    //                 RAZORPAY SECURE PAYMENT SYNCHRONIZATION
    // 💵 ------------------------------------------------------------ 💵
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      console.error("[RAZORPAY_WEBHOOK_ERROR] Missing cryptographic signature or secret environment variable.");
      await sendTelegramAdminAlert("🚨 [SECURITY ALERT] Razorpay Webhook accessed without signature. Potential unauthorized intrusion attempt.", "Payment Webhook");
      return NextResponse.json({ error: "Unauthorized request constraints" }, { status: 400 });
    }

    // Cryptographic validation to prevent payload spoofing
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[RAZORPAY_WEBHOOK_ERROR] Cryptographic signature mismatch detected.");
      await sendTelegramAdminAlert("🚨 [HACK ATTEMPT] Razorpay cryptographic signature mismatch detected. Payload rejected to prevent unauthorized upgrade.", "Payment Webhook");
      return NextResponse.json({ error: "Cryptographic Validation Failed" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Filter strictly for captured successful payments
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      
      const notes = paymentEntity.notes || {};
      const userEmail = (notes.email || paymentEntity.email || "").toLowerCase(); 
      const planName = (notes.plan_name || "plus").toLowerCase();
      const rawModel = (notes.selected_model || notes.model || "GPT-5.5 Pro").toLowerCase();
      
      const selectedChannel = (notes.selected_channel || "widget").toLowerCase();
      const isRenewal = notes.is_renewal === "true" || notes.plan_type === "RENEWAL";

      if (userEmail) {
        // 1. Establish Master Mapping for AI Providers and Exact Engine Versions (2026 UPDATE)
        let aiProvider = "openai";
        let exactModelVersion = "GPT-5.5 Pro"; 

        if (rawModel.includes("claude") || rawModel.includes("anthropic") || rawModel.includes("opus")) {
            aiProvider = "anthropic";
            exactModelVersion = "Claude Opus 4.7";
        }
        else if (rawModel.includes("gemini") || rawModel.includes("google")) {
            aiProvider = "google";
            exactModelVersion = "gemini 3.1 Pro";
        }
        else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) {
            aiProvider = "omni";
            exactModelVersion = "omni 3 nexus";
        }

        // 2. Establish Strict Tier Limits based on enterprise plans
        let isUnlimited = false;
        let tokensAllocated = 2000000; 
        let monthlyLimit = 1500;

        if (planName === "pro") { 
            tokensAllocated = 5000000; 
            monthlyLimit = 3000; 
        } else if (planName === "ultra") { 
            tokensAllocated = 10000000; 
            monthlyLimit = 5000; 
        } else if (planName === "adv_max" || planName === "yearly") { 
            isUnlimited = true; 
            tokensAllocated = 99999999; 
            monthlyLimit = 7000; 
        } else if (planName === "monthly") { 
            tokensAllocated = 5000000; 
            monthlyLimit = 3000; 
        }

        const newExpiryDate = new Date();
        if (planName === "adv_max" || planName === "yearly") {
            newExpiryDate.setDate(newExpiryDate.getDate() + 365);
        } else {
            newExpiryDate.setDate(newExpiryDate.getDate() + 30); 
        }

        // 3. Secure Payload Generation for Database Mutability
        const payload: any = {
            plan: planName,            
            plan_tier: planName, 
            is_unlimited: isUnlimited, 
            tokens_allocated: tokensAllocated,
            monthly_message_limit: monthlyLimit,
            plan_expiry_date: newExpiryDate.toISOString(),
            plan_status: 'Active',
            selected_channel: selectedChannel, 
            current_model_version: exactModelVersion,
            ai_model: exactModelVersion,
            ai_provider: aiProvider
        };

        // Extract sensitive credential tokens strictly from verified payload notes
        if (notes.telegram_token) payload.telegram_token = notes.telegram_token;
        if (notes.whatsapp_token) payload.whatsapp_token = notes.whatsapp_token;
        if (notes.whatsapp_phone_id) payload.whatsapp_phone_id = notes.whatsapp_phone_id;
        if (notes.whatsapp_number) payload.whatsapp_number = notes.whatsapp_number;

        if (!isRenewal) {
            payload.selected_model = exactModelVersion;  
        } else {
            payload.tokens_used = 0;
            payload.messages_used_this_month = 0;
        }

        let botIdentifier = null;
        let botColumn = null;

        if (notes.telegram_token) { botIdentifier = notes.telegram_token; botColumn = "telegram_token"; }
        if (notes.whatsapp_token) { botIdentifier = notes.whatsapp_token; botColumn = "whatsapp_token"; }

        // 4. Secure Database Update Execution for Configurations
        try {
            if (isRenewal) {
                let query = supabase.from("user_configs").select("id").eq("email", userEmail);
                if (botColumn && botIdentifier) { query = query.eq(botColumn, botIdentifier); } 
                else { query = query.order("created_at", { ascending: false }); }

                const { data } = await query.limit(1);
                const latestBot = data?.[0];

                if (latestBot) {
                    await supabase.from("user_configs").update(payload).eq("id", latestBot.id);
                }
            } else if (botIdentifier && botColumn) {
                const { data } = await supabase.from("user_configs").select("id").eq("email", userEmail).eq(botColumn, botIdentifier).limit(1);
                const existingBot = data?.[0];

                if (existingBot) {
                    await supabase.from("user_configs").update(payload).eq("id", existingBot.id);
                } else {
                    await supabase.from("user_configs").insert({ 
                        ...payload, 
                        email: userEmail,
                        tokens_used: 0,
                        messages_used_this_month: 0 
                    });
                }
            } else {
                const { data } = await supabase.from("user_configs").select("id").eq("email", userEmail).limit(1);
                if (data && data[0]) {
                     await supabase.from("user_configs").update(payload).eq("id", data[0].id);
                } else {
                     await supabase.from("user_configs").insert({
                        ...payload,
                        email: userEmail,
                        tokens_used: 0,
                        messages_used_this_month: 0 
                     });
                }
            }
        } catch (dbError: any) {
            console.error("[RAZORPAY_PROVISIONING_ERROR] Configuration update failed:", dbError);
            await sendTelegramAdminAlert(`🔴 [CRITICAL ERROR] Payment captured for ${userEmail}, but user_config database update FAILED. Manual system configuration required.`, "Database Synchronization");
        }

        // 5. Record Immutable Ledger Entry into the newly secured billing_history table
        try {
            await supabase.from("billing_history").insert({
                user_email: userEmail,
                plan_tier: planName.toUpperCase(),
                amount: paymentEntity.amount / 100, 
                currency: paymentEntity.currency,
                status: "Paid",
                payment_id: paymentEntity.id
            });
            
            await sendTelegramAdminAlert(`💵 *PAYMENT RECEIVED*\nRazorpay transaction verified.\nAccount: ${userEmail}\nAmount: ${paymentEntity.currency} ${paymentEntity.amount / 100}\nPlan: ${planName.toUpperCase()}`, "Financial Ledger");
        } catch (invoiceError: any) {
            console.error("[LEDGER_INSERTION_ERROR]", invoiceError);
            await sendTelegramAdminAlert(`⚠️ [WARNING] Payment captured for ${userEmail} but failed to record in billing_history ledger. Reference ID: ${paymentEntity.id}`, "Financial Ledger");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK_FATAL] Processing error:", error);
    await sendTelegramAdminAlert(`🔴 [RAZORPAY WEBHOOK CRASH]: Internal server error during payment processing. Investigate immediately.\nError: ${error.message}`, "Payment Webhook");
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}