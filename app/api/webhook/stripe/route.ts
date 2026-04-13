/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE STRIPE WEBHOOK (SECURED AWAKENER)
 * ==============================================================================================
 * @file app/api/webhook/stripe/route.ts
 * @description Strictly verifies Stripe signatures before updating user database configurations.
 * Prevents unauthorized activation. Maps metadata perfectly to the 2026 schema.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16" as any, // 🚀 FIX: Added 'as any' to bypass TypeScript red squiggly line error
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
        } catch (e) {
            console.error("[TELEGRAM_ALERT_FAILED]", e);
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("stripe-signature");

        // 🔒 LEVEL 1: Absolute Signature Requirement
        if (!signature || !webhookSecret) {
            console.error("[STRIPE_WEBHOOK_ERROR] Missing cryptographic signature or secret.");
            await sendTelegramAdminAlert("🚨 [SECURITY ALERT] Stripe Webhook accessed without signature. Potential unauthorized intrusion attempt blocked.");
            return new NextResponse("Unauthorized request", { status: 400 });
        }

        let event: Stripe.Event;

        // 🔒 LEVEL 2: Cryptographic Payload Verification
        try {
            event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
        } catch (error: any) {
            console.error(`[STRIPE_WEBHOOK_ERROR] Signature validation failed: ${error.message}`);
            await sendTelegramAdminAlert(`🚨 [HACK ATTEMPT] Stripe signature mismatch detected. Payload rejected.`);
            return new NextResponse(`Webhook Error: Validation Failed`, { status: 400 });
        }

        // 🔒 LEVEL 3: Execution on Valid Payment Only
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;

            if (!metadata || !metadata.email) {
                console.error("[STRIPE_PROVISIONING_ERROR] Missing essential metadata.");
                return new NextResponse("Invalid metadata", { status: 400 });
            }

            const email = metadata.email.toLowerCase();
            const planTier = (metadata.plan_tier || metadata.plan || "plus").toLowerCase();
            const rawModel = (metadata.selected_model || "gpt-5.4 Pro").toLowerCase();

            console.log(`[STRIPE_PROVISIONING] Verified payment for ${email}. Assigning Tier: ${planTier.toUpperCase()} | Engine: ${rawModel}`);

            // 1. Establish Master Mapping for AI Providers (2026 Schema)
            let aiProvider = "openai";
            let exactModelVersion = metadata.selected_model || "gpt-5.4 Pro";

            if (rawModel.includes("claude") || rawModel.includes("opus") || rawModel.includes("anthropic")) {
                aiProvider = "anthropic";
                exactModelVersion = "Claude Opus 4.6";
            } else if (rawModel.includes("gemini") || rawModel.includes("google")) {
                aiProvider = "google";
                exactModelVersion = "gemini 3.1 Pro";
            } else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) {
                aiProvider = "omni";
                exactModelVersion = "omni 3 nexus";
            }

            // 2. Establish Strict Tier Limits
            let isUnlimited = false;
            let allocatedTokens = 2000000; 
            let monthlyLimit = 5000;

            if (planTier === "pro") { 
                allocatedTokens = 10000000; 
                monthlyLimit = 25000; 
            } else if (planTier === "ultra") { 
                allocatedTokens = 25000000; 
                monthlyLimit = 75000; 
            } else if (planTier === "adv_max" || planTier === "yearly" || planTier === "monthly" || planTier === "max") { 
                isUnlimited = true; 
                allocatedTokens = 100000000; 
                monthlyLimit = 500000; 
            }

            const expiryDate = new Date();
            if (planTier === "adv_max" || planTier === "yearly") {
                expiryDate.setDate(expiryDate.getDate() + 365);
            } else {
                expiryDate.setDate(expiryDate.getDate() + 30); 
            }

            // 3. Assemble Payload (Perfect DB Sync)
            const configPayload = {
                plan: planTier,
                plan_tier: planTier,
                is_unlimited: isUnlimited, 
                tokens_allocated: allocatedTokens,
                available_tokens: allocatedTokens,
                monthly_message_limit: monthlyLimit,
                plan_expiry_date: expiryDate.toISOString(),
                plan_status: 'Active', // 🔥 AWAKENS THE BOT
                current_model_version: exactModelVersion,
                ai_model: exactModelVersion,
                selected_model: exactModelVersion,
                ai_provider: aiProvider,
                updated_at: new Date().toISOString()
            };

            // 4. Securely Update Database
            const { error: configError } = await supabase
                .from("user_configs")
                .update(configPayload)
                .eq("email", email);

            if (configError) {
                console.error("[STRIPE_PROVISIONING_ERROR] DB Update Failed:", configError);
                await sendTelegramAdminAlert(`🔴 [CRITICAL ERROR] Stripe payment verified for ${email}, but DB update failed.`);
                throw configError;
            }

            // 5. Record Immutable Ledger Entry
            const amountPaidUSD = session.amount_total ? (session.amount_total / 100).toString() : "0";
            
            await supabase.from("billing_history").insert({
                email: email,
                plan_name: planTier.toUpperCase(),
                amount: amountPaidUSD,
                currency: "USD",
                status: "PAID",
                payment_provider: "stripe",
                razorpay_order_id: session.id // Storing stripe session ID here for reference
            });

            console.log(`[STRIPE_PROVISIONING_SUCCESS] Account automation unlocked for ${email}. Bots are now LIVE.`);
            await sendTelegramAdminAlert(`💵 [STRIPE SUCCESS] USD Payment verified. ${email} upgraded to ${planTier.toUpperCase()} on ${exactModelVersion}.`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[STRIPE_WEBHOOK_FATAL]:", error.message);
        return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
    }
}