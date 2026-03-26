import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js"; 

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      console.error("🚨 RAZORPAY WEBHOOK ERROR: Missing signature or secret");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("🚨 RAZORPAY WEBHOOK ERROR: Invalid Cryptographic Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      
      const notes = paymentEntity.notes || {};
      const userEmail = (notes.email || paymentEntity.email || "").toLowerCase(); 
      const planName = (notes.plan_name || "plus").toLowerCase();
      const rawModel = (notes.selected_model || "openai").toLowerCase();
      
      const isRenewal = notes.is_renewal === "true" || notes.plan_type === "RENEWAL";

      if (userEmail) {
        let aiProvider = "openai";
        if (rawModel.includes("claude") || rawModel.includes("anthropic")) aiProvider = "anthropic";
        else if (rawModel.includes("gemini") || rawModel.includes("google")) aiProvider = "google";
        else if (rawModel.includes("omni") || rawModel.includes("multi_model") || rawModel.includes("nexus")) aiProvider = "multi_model";

        // 🚀 MASTER PRICING UPGRADE LIMITS
        let isUnlimited = false;
        let tokensAllocated = 2000000; 
        let monthlyLimit = 1500;

        if (planName === "pro") { tokensAllocated = 5000000; monthlyLimit = 3000; } 
        else if (planName === "ultra") { tokensAllocated = 10000000; monthlyLimit = 5000; }
        else if (planName === "adv_max" || planName === "yearly") { isUnlimited = true; tokensAllocated = 99999999; monthlyLimit = 7000; }
        else if (planName === "monthly") { tokensAllocated = 5000000; monthlyLimit = 3000; }

        const newExpiryDate = new Date();
        if (planName === "adv_max" || planName === "yearly") {
            newExpiryDate.setDate(newExpiryDate.getDate() + 365);
        } else {
            newExpiryDate.setDate(newExpiryDate.getDate() + 30); 
        }

        const payload: any = {
            plan: planName,            
            is_unlimited: isUnlimited, 
            tokens_allocated: tokensAllocated,
            monthly_message_limit: monthlyLimit,
            plan_expiry_date: newExpiryDate.toISOString(),
            plan_status: 'Active'
        };

        if (!isRenewal) {
            payload.selected_model = rawModel;  
            payload.ai_provider = aiProvider; 
        } else {
            payload.tokens_used = 0;
            payload.messages_used_this_month = 0;
        }

        let botIdentifier = null;
        let botColumn = null;

        if (notes.telegram_token) { payload.telegram_token = notes.telegram_token; botIdentifier = notes.telegram_token; botColumn = "telegram_token"; }
        if (notes.whatsapp_token) { payload.whatsapp_token = notes.whatsapp_token; botIdentifier = notes.whatsapp_token; botColumn = "whatsapp_token"; }
        if (notes.whatsapp_phone_id) { payload.whatsapp_phone_id = notes.whatsapp_phone_id; }

        if (isRenewal) {
            // 🚀 SURGICAL FIX: Token identity matching inside your exact original structure!
            let query = supabase.from("user_configs").select("id").eq("email", userEmail);
            
            if (botColumn && botIdentifier) {
                query = query.eq(botColumn, botIdentifier);
            } else {
                query = query.order("created_at", { ascending: false });
            }

            const { data } = await query.limit(1);

            const latestBot = data?.[0];

            if (latestBot) {
                const { error: dbError } = await supabase.from("user_configs").update(payload).eq("id", latestBot.id);
                if (dbError) throw dbError;
            }
        } else if (botIdentifier && botColumn) {
            const { data } = await supabase
                .from("user_configs")
                .select("id")
                .eq("email", userEmail)
                .eq(botColumn, botIdentifier)
                .limit(1);

            const existingBot = data?.[0];

            if (existingBot) {
                const { error: dbError } = await supabase.from("user_configs").update(payload).eq("id", existingBot.id);
                if (dbError) throw dbError;
            } else {
                const { error: dbError } = await supabase.from("user_configs").insert({ 
                    ...payload, 
                    email: userEmail,
                    tokens_used: 0,
                    messages_used_this_month: 0 
                });
                if (dbError) throw dbError;
            }
        } else {
            const { error: dbError } = await supabase
              .from("user_configs")
              .update(payload)
              .eq("email", userEmail);
            if (dbError) throw dbError;
        }

        try {
            await supabase.from("billing_history").insert({
                email: userEmail,
                plan_name: planName.toUpperCase(),
                amount: (paymentEntity.amount / 100).toString(), 
                currency: paymentEntity.currency,
                status: "PAID",
                razorpay_order_id: paymentEntity.order_id
            });
        } catch (invoiceError) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}