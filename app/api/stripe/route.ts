/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE STRIPE CHECKOUT GATEWAY (SECURED)
 * ==============================================================================================
 * @file app/api/stripe/route.ts
 * @description Generates Stripe checkout sessions for international USD payments.
 * Strictly ignores frontend pricing, relying solely on backend verification.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, // 🚀 FIX: Added 'as any' to bypass TypeScript red squiggly line error
});

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (USD PRICING 2026) ─── */
const SECURE_USD_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 6, pro: 12, ultra: 24, adv_max: 599 },
  "GPT-5.5 Pro": { plus: 8, pro: 18, ultra: 36, adv_max: 899 },
  "Claude Opus 4.7": { plus: 10, pro: 24, ultra: 48, adv_max: 1199 },
  "omni 3 nexus": { monthly: 249, yearly: 1799 } 
};

export async function POST(req: Request) {
  try {
    const { email, planTier, model, selected_channel } = await req.json();

    if (!email || !planTier || !model) {
      return NextResponse.json({ error: "Missing required billing fields" }, { status: 400 });
    }

    // 🔒 SECURITY CHECK: Strict Model Mapping & Price Lookup
    const rawModel = String(model || "GPT-5.5 Pro").toLowerCase();
    let safeModel = "GPT-5.5 Pro";
    
    if (rawModel.includes("omni") || rawModel.includes("nexus")) safeModel = "omni 3 nexus";
    else if (rawModel.includes("claude") || rawModel.includes("opus")) safeModel = "Claude Opus 4.7";
    else if (rawModel.includes("gemini") || rawModel.includes("google")) safeModel = "gemini 3.1 Pro";

    const safePlan = planTier.toLowerCase();
    const secureUsdPrice = SECURE_USD_PRICING[safeModel]?.[safePlan];

    if (!secureUsdPrice) {
      console.error(`[STRIPE_SECURITY_BLOCK] Invalid mapping requested: Model(${safeModel}) Tier(${safePlan})`);
      return NextResponse.json({ error: "Invalid execution plan or model selected" }, { status: 400 });
    }

    // 🔒 MATH ROUNDING FIX: Prevent floating point precision errors
    const safeAmountInCents = Math.round(secureUsdPrice * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ClawLink - ${safeModel} (${safePlan.toUpperCase()})`,
              description: `24/7 Enterprise AI Agent via ${selected_channel || 'Web'}`,
            },
            unit_amount: safeAmountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment", 
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: email.toLowerCase(),
      metadata: {
        email: email.toLowerCase(),
        plan: safePlan, // Syncing keys with Razorpay webhook logic
        plan_name: safePlan,
        plan_tier: safePlan,
        selected_model: safeModel, // Sending the 2026 string securely
        selected_channel: selected_channel || "widget",
      },
    });

    console.log(`[STRIPE_CHECKOUT_CREATED] ${email} | ${safeModel} | $${secureUsdPrice}`);
    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error("[STRIPE_CREATION_FATAL]:", error.message);
    return NextResponse.json({ error: "Failed to generate secure checkout session" }, { status: 500 });
  } 
}