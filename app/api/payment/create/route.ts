/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE PAYMENT CREATION API (SECURED)
 * ==============================================================================================
 * @file app/api/payment/create/route.ts
 * @description Generates Razorpay orders. Strictly ignores frontend pricing 
 * and enforces backend single-source-of-truth to prevent payload manipulation.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto"; // 🚀 THE FIX: Imported crypto module for secure receipt generation

export const dynamic = "force-dynamic";

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (TESTING MODE PRICING) ─── */
const SECURE_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 5, pro: 999, ultra: 1999, adv_max: 49999 },
  "gpt-5.4 Pro": { plus: 5, pro: 1499, ultra: 2999, adv_max: 74999 },
  "Claude Opus 4.7": { plus: 5, pro: 1999, ultra: 3999, adv_max: 99999 },
  "omni 3 nexus": { monthly: 20916, yearly: 149999 }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Intentionally ignoring 'amount' from frontend to prevent hacker manipulation
    const { email, plan, selected_model, selected_channel } = body;

    if (!email || !plan) {
      return NextResponse.json({ success: false, error: "Missing email or plan tier" }, { status: 400 });
    }

    // Razorpay initialization
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      console.error("[RAZORPAY_ERROR] Missing API Keys in environment.");
      return NextResponse.json({ success: false, error: "Payment gateway configuration error" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 🔒 SECURITY CHECK: Model Mapping & Exact Price Lookup
    const rawModel = String(selected_model || "gpt-5.4 Pro").toLowerCase();
    let safeModel = "gpt-5.4 Pro";
    
    if (rawModel.includes("omni") || rawModel.includes("nexus")) safeModel = "omni 3 nexus";
    else if (rawModel.includes("claude") || rawModel.includes("opus")) safeModel = "Claude Opus 4.7";
    else if (rawModel.includes("gemini") || rawModel.includes("google")) safeModel = "gemini 3.1 Pro";

    const safePlan = plan.toLowerCase();
    const secureInrPrice = SECURE_PRICING[safeModel]?.[safePlan];

    if (!secureInrPrice) {
      console.error(`[PAYMENT_ERROR] Invalid plan mapping requested: Model(${safeModel}) Tier(${safePlan})`);
      return NextResponse.json({ success: false, error: "Invalid execution plan or model" }, { status: 400 });
    }

    // 🔒 SURGICAL FIX: Prevent floating point precision errors using Math.round
    const safeAmountInPaise = Math.round(secureInrPrice * 100);

    const options = {
      amount: safeAmountInPaise, 
      currency: "INR", 
      receipt: `rcpt_${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      notes: {
        email: email.toLowerCase(),
        plan: safePlan,
        plan_name: safePlan,
        selected_model: safeModel,        // 🚀 MAGIC: Saving Verified 2026 Model
        selected_channel: selected_channel || "widget", 
        is_renewal: "false"
      },
    };

    const order = await razorpay.orders.create(options);
    console.log(`[RAZORPAY_ORDER_CREATED] ${email} | ${safeModel} | ₹${secureInrPrice}`);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("[ORDER_CREATION_FATAL]:", error);
    return NextResponse.json({ success: false, error: "Failed to generate secure checkout order" }, { status: 500 });
  }
}