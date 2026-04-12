/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE DASHBOARD UPGRADE API (SECURED)
 * ==============================================================================================
 * @file app/api/payment/create-order/route.ts
 * @description Generates Razorpay orders for dashboard upgrades/renewals. 
 * Strictly ignores frontend pricing and maps full notes payload to ensure Webhook success.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (TESTING MODE PRICING) ─── */
const SECURE_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 5, pro: 999, ultra: 1999, adv_max: 49999 },
  "gpt-5.4 Pro": { plus: 5, pro: 1499, ultra: 2999, adv_max: 74999 },
  "Claude Opus 4.6": { plus: 5, pro: 1999, ultra: 3999, adv_max: 99999 },
  "omni 3 nexus": { monthly: 20916, yearly: 149999 }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🛑 IGNORING 'amount' from frontend to prevent any hacker manipulation
    const { email, planName, currency, notes: frontendNotes } = body;

    if (!email || !planName) {
      return NextResponse.json({ error: "Missing required billing fields" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      console.error("[RAZORPAY_ERROR] Missing API Keys in environment.");
      return NextResponse.json({ error: "Payment gateway misconfigured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 🔒 SECURITY CHECK: Model Mapping & Exact Price Lookup
    // Since Dashboard passes model inside frontendNotes, we extract it safely
    const rawModel = String(frontendNotes?.selected_model || "gpt-5.4 Pro").toLowerCase();
    let safeModel = "gpt-5.4 Pro";
    
    if (rawModel.includes("omni") || rawModel.includes("nexus")) safeModel = "omni 3 nexus";
    else if (rawModel.includes("claude") || rawModel.includes("opus")) safeModel = "Claude Opus 4.6";
    else if (rawModel.includes("gemini") || rawModel.includes("google")) safeModel = "gemini 3.1 Pro";

    const safePlan = planName.toLowerCase();
    const secureInrPrice = SECURE_PRICING[safeModel]?.[safePlan];

    if (!secureInrPrice) {
      console.error(`[DASHBOARD_PAYMENT_ERROR] Invalid plan mapping requested: Model(${safeModel}) Tier(${safePlan})`);
      return NextResponse.json({ error: "Invalid execution plan or model" }, { status: 400 });
    }

    // 🔒 SURGICAL FIX: Prevent floating point precision errors using Math.round
    const safeAmountInPaise = Math.round(secureInrPrice * 100);

    const options = {
      amount: safeAmountInPaise, 
      currency: (currency || "INR").toUpperCase(),
      receipt: `rcpt_${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      notes: {
        email: email.toLowerCase(),
        plan: safePlan,
        plan_name: safePlan,
        selected_model: safeModel,
        ...(frontendNotes || {}) // 🚀 THIS IS CRITICAL: Passes telegram token, channel, etc., to Webhook
      }
    };

    // Create the order on Razorpay servers
    const order = await razorpay.orders.create(options);
    console.log(`[RAZORPAY_DASHBOARD_ORDER] ${email} | ${safeModel} | ₹${secureInrPrice}`);

    // Returning both raw order and extracted keys for robust frontend compatibility
    return NextResponse.json({ 
        success: true, 
        order: order, 
        id: order.id, 
        amount: order.amount, 
        currency: order.currency 
    });

  } catch (error: any) {
    console.error("Razorpay Dynamic Order Creation Error:", error);
    return NextResponse.json({ error: "Failed to create dynamic payment order" }, { status: 500 });
  }
}