import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia" as any, // 🚀 Updated to the exact latest version with TS bypass
});

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (HACKER-PROOF PRICING) ─── */
const SECURE_PRICING: Record<string, any> = {
  "gemini": { plus: 6, pro: 12, ultra: 24, adv_max: 599 },
  "gpt-5.2": { plus: 8, pro: 18, ultra: 36, adv_max: 899 },
  "claude": { plus: 10, pro: 24, ultra: 48, adv_max: 1199 },
  "omni": { monthly: 249, yearly: 1799 },
  "multi_model": { monthly: 249, yearly: 1799 } // Alias for Omni
};

export async function POST(req: Request) {
  try {
    const { email, planTier, model } = await req.json();

    if (!email || !planTier || !model) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🔒 SECURITY CHECK: Lookup actual price from backend, IGNORE frontend amount
    const safeModel = SECURE_PRICING[model] ? model : "gpt-5.2";
    const secureUsdPrice = SECURE_PRICING[safeModel][planTier];

    if (!secureUsdPrice) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const amountInCents = secureUsdPrice * 100;

    // Create a secure Stripe Checkout Session dynamically (No need to manually create Price IDs in Stripe dashboard)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ClawLink - ${safeModel.toUpperCase()} (${planTier.toUpperCase()})`,
              description: "Enterprise 24/7 AI Agent Deployment",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment", // Using 'payment' to support dynamic price_data flawlessly
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: email,
      metadata: {
        email: email,
        plan_tier: planTier,
        model: safeModel
      },
    });

    console.log(`[STRIPE-SESSION] Created session for ${email}: ${session.id} | Amount: $${secureUsdPrice}`);
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("[STRIPE-ERROR] Failed to create checkout session:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}