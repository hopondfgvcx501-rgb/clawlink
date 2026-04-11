import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js"; 

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // 🛑 ------------------------------------------------------------ 🛑
    //                 THE GATEKEEPER LOGIC (FREE TIER CHECK)
    // 🛑 ------------------------------------------------------------ 🛑
    const url = new URL(req.url);
    const botToken = url.searchParams.get("token"); 

    if (botToken) {
        try {
            const update = JSON.parse(rawBody);
            // Check if this is a normal message
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;

                // 1. Fetch User Config from DB
                const { data: userConfig } = await supabase
                  .from("user_configs")
                  .select("plan_tier, plan_status")
                  .eq("telegram_token", botToken)
                  .single();

                if (userConfig) {
                    const currentPlan = userConfig.plan_tier?.toLowerCase() || "free";
                    
                    // 2. Gatekeeper Check: If Free or Not Active -> Block & Warn
                    if (currentPlan === "free" || currentPlan === "starter" || userConfig.plan_status !== "Active") {
                      // Call Telegram API directly to send the warning message
                      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            chat_id: chatId, 
                            text: "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their plan in the dashboard to enable 24/7 autonomous replies.",
                            parse_mode: "Markdown"
                        }),
                      });
                      console.log(`[GATEKEEPER] Blocked unpaid bot message for token: ${botToken}`);
                      // Return success so Telegram stops retrying
                      return NextResponse.json({ success: true }); 
                    }
                }
            }
        } catch (e) {
            console.error("[GATEKEEPER ERROR]", e);
        }
    }
    // 🛑 ---------------- END GATEKEEPER LOGIC ------------------------ 🛑

    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      console.error("[RAZORPAY_WEBHOOK_ERROR] Missing cryptographic signature or secret environment variable.");
      await sendTelegramAdminAlert("🚨 [SECURITY ALERT] Razorpay Webhook accessed without signature. Potential unauthorized intrusion attempt.");
      return NextResponse.json({ error: "Unauthorized request" }, { status: 400 });
    }

    // Cryptographic validation to prevent payload spoofing
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[RAZORPAY_WEBHOOK_ERROR] Cryptographic signature mismatch detected.");
      await sendTelegramAdminAlert("🚨 [HACK ATTEMPT] Razorpay cryptographic signature mismatch detected. Payload rejected to prevent unauthorized upgrade.");
      return NextResponse.json({ error: "Validation Failed" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      
      const notes = paymentEntity.notes || {};
      const userEmail = (notes.email || paymentEntity.email || "").toLowerCase(); 
      const planName = (notes.plan_name || "plus").toLowerCase();
      const rawModel = (notes.selected_model || "gpt-5.2").toLowerCase();
      
      const selectedChannel = (notes.selected_channel || "widget").toLowerCase();
      const isRenewal = notes.is_renewal === "true" || notes.plan_type === "RENEWAL";

      if (userEmail) {
        // 1. Establish Master Mapping for AI Providers and Exact Engine Versions
        let aiProvider = "openai";
        let exactModelVersion = "gpt-4o-mini"; 

        if (rawModel.includes("claude") || rawModel.includes("anthropic")) {
            aiProvider = "anthropic";
            exactModelVersion = "claude-3-opus-20240229";
        }
        else if (rawModel.includes("gemini") || rawModel.includes("google")) {
            aiProvider = "google";
            exactModelVersion = "gemini-1.5-flash-8b";
        }
        else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) {
            aiProvider = "multi_model";
            exactModelVersion = "omni-nexus-engine";
        }

        // 2. Establish Strict Tier Limits
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

        // 3. Secure Payload Generation
        const payload: any = {
            plan: planName,            
            plan_tier: planName, // <-- ADDED THIS FOR THE GATEKEEPER
            is_unlimited: isUnlimited, 
            tokens_allocated: tokensAllocated,
            monthly_message_limit: monthlyLimit,
            plan_expiry_date: newExpiryDate.toISOString(),
            plan_status: 'Active',
            selected_channel: selectedChannel, 
            current_model_version: exactModelVersion 
        };

        // Extract sensitive credential tokens strictly from verified payload
        if (notes.telegram_token) payload.telegram_token = notes.telegram_token;
        if (notes.whatsapp_token) payload.whatsapp_token = notes.whatsapp_token;
        if (notes.whatsapp_phone_id) payload.whatsapp_phone_id = notes.whatsapp_phone_id;
        if (notes.whatsapp_number) payload.whatsapp_number = notes.whatsapp_number;

        if (!isRenewal) {
            payload.selected_model = rawModel;  
            payload.ai_provider = aiProvider; 
        } else {
            payload.tokens_used = 0;
            payload.messages_used_this_month = 0;
        }

        let botIdentifier = null;
        let botColumn = null;

        if (notes.telegram_token) { botIdentifier = notes.telegram_token; botColumn = "telegram_token"; }
        if (notes.whatsapp_token) { botIdentifier = notes.whatsapp_token; botColumn = "whatsapp_token"; }

        // 4. Secure Database Update Execution
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
            await sendTelegramAdminAlert(`🔴 [CRITICAL ERROR] Payment captured for ${userEmail}, but database update FAILED. Manual system configuration required.`);
        }

        // 5. Record Immutable Ledger Entry
        try {
            await supabase.from("billing_history").insert({
                email: userEmail,
                plan_name: planName.toUpperCase(),
                amount: (paymentEntity.amount / 100).toString(), 
                currency: paymentEntity.currency,
                status: "PAID",
                razorpay_order_id: paymentEntity.order_id
            });
            
            await sendTelegramAdminAlert(`💵 [PAYMENT RECEIVED] Razorpay transaction verified. Account ${userEmail} initialized on ${planName.toUpperCase()} plan.`);
        } catch (invoiceError) {
            await sendTelegramAdminAlert(`⚠️ [WARNING] Payment captured for ${userEmail} but failed to record in billing_history ledger.`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[RAZORPAY_WEBHOOK_FATAL] Processing error:", error);
    await sendTelegramAdminAlert(`🔴 [RAZORPAY WEBHOOK CRASH]: Internal server error during payment processing. Investigate immediately.`);
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}