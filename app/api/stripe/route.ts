import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia", // 🚀 Updated to the exact latest version
});

export async function POST(req: Request) {
  try {
    const { priceId, email, planTier } = await req.json();

    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create a secure Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // This ID comes from your Stripe Dashboard products
          quantity: 1,
        },
      ],
      mode: "subscription", // Use 'subscription' for recurring plans like OmniAgent Nexus
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      customer_email: email,
      metadata: {
        email: email,
        plan_tier: planTier, // Storing tier info to process in webhook later
      },
    });

    console.log(`[STRIPE-SESSION] Created session for ${email}: ${session.id}`);
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("[STRIPE-ERROR] Failed to create checkout session:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}