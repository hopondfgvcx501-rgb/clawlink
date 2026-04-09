import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia" as any,
});

// Initialize Supabase Client with Service Role for admin bypass
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// SECURITY & MONITORING ALERT SYSTEM
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
            console.error("[TELEGRAM_ALERT_FAILED] Failed to dispatch admin alert.", e);
        }
    }
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        console.error("[STRIPE_WEBHOOK_ERROR] Missing cryptographic signature.");
        await sendTelegramAdminAlert("🚨 [SECURITY ALERT] Stripe Webhook accessed without signature. Potential unauthorized intrusion attempt.");
        return new NextResponse("Unauthorized request", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // Cryptographically verify origin
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`[STRIPE_WEBHOOK_ERROR] Signature validation failed: ${error.message}`);
        await sendTelegramAdminAlert(`🚨 [HACK ATTEMPT] Stripe cryptographic signature mismatch detected. Payload rejected.`);
        return new NextResponse(`Webhook Error: Validation Failed`, { status: 400 });
    }

    // Process secure checkout completion
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const email = session.metadata?.email;
        const planTier = (session.metadata?.plan_tier || "plus").toLowerCase();
        const rawModel = (session.metadata?.model || "gpt-5.2").toLowerCase();

        if (email) {
            console.log(`[STRIPE_PROVISIONING] Verified payment for ${email}. Initializing tier: ${planTier}.`);

            // 1. Establish Master Mapping for AI Providers and Exact Engine Versions
            let aiProvider = "openai";
            let exactModelVersion = "gpt-4o-mini";

            if (rawModel.includes("claude") || rawModel.includes("anthropic")) {
                aiProvider = "anthropic";
                exactModelVersion = "claude-3-opus-20240229";
            } else if (rawModel.includes("gemini") || rawModel.includes("google")) {
                aiProvider = "google";
                exactModelVersion = "gemini-1.5-flash-8b";
            } else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) {
                aiProvider = "multi_model";
                exactModelVersion = "omni-nexus-engine";
            }

            // 2. Establish Strict Tier Limits
            let isUnlimited = false;
            let tokensAllocated = 2000000; 
            let monthlyLimit = 1500;

            if (planTier === "pro") { 
                tokensAllocated = 5000000; 
                monthlyLimit = 3000; 
            } else if (planTier === "ultra") { 
                tokensAllocated = 10000000; 
                monthlyLimit = 5000; 
            } else if (planTier === "adv_max" || planTier === "yearly") { 
                isUnlimited = true; 
                tokensAllocated = 99999999; 
                monthlyLimit = 7000; 
            } else if (planTier === "monthly") { 
                tokensAllocated = 5000000; 
                monthlyLimit = 3000; 
            }

            const newExpiryDate = new Date();
            if (planTier === "adv_max" || planTier === "yearly") {
                newExpiryDate.setDate(newExpiryDate.getDate() + 365);
            } else {
                newExpiryDate.setDate(newExpiryDate.getDate() + 30); 
            }

            const configPayload = {
                plan: planTier,            
                is_unlimited: isUnlimited, 
                tokens_allocated: tokensAllocated,
                monthly_message_limit: monthlyLimit,
                plan_expiry_date: newExpiryDate.toISOString(),
                plan_status: 'Active',
                current_model_version: exactModelVersion,
                ai_provider: aiProvider,
                selected_model: rawModel
            };

            // 3. Securely Update Database Configuration
            const { error: configError } = await supabase
                .from("user_configs")
                .update(configPayload)
                .eq("email", email);

            if (configError) {
                console.error("[STRIPE_PROVISIONING_ERROR] Failed to update user configuration database:", configError);
                await sendTelegramAdminAlert(`🔴 [CRITICAL ERROR] Stripe payment verified for ${email}, but configuration deployment failed. Manual intervention required.`);
            }

            // 4. Record Immutable Ledger Entry
            const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
            
            const { error: billingError } = await supabase
                .from("billing_history")
                .insert([{
                    email: email,
                    amount: amountPaid,
                    currency: session.currency?.toUpperCase(),
                    status: "PAID",
                    payment_provider: "stripe",
                    transaction_id: session.id,
                    plan_name: planTier.toUpperCase()
                }]);

            if (billingError) {
                 console.error("[STRIPE_LEDGER_ERROR] Failed to persist billing record:", billingError);
            } else {
                 await sendTelegramAdminAlert(`💵 [PAYMENT RECEIVED] Stripe transaction successful. Account ${email} upgraded to ${planTier.toUpperCase()} tier.`);
            }

            console.log(`[STRIPE_PROVISIONING_SUCCESS] Account automation enabled for ${email}.`);
        }
    }

    return new NextResponse("Acknowledgment received", { status: 200 });
}