import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
});

// Initialize Supabase Client with Service Role for admin bypass
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    // Next.js App Router requires reading the raw body text for Stripe signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        console.error("[STRIPE-WEBHOOK] Missing Stripe signature header.");
        return new NextResponse("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // Cryptographically verify that this request actually came from Stripe
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`[STRIPE-WEBHOOK] Signature verification failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Process the successful checkout event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract metadata passed during session creation
        const email = session.metadata?.email;
        const planTier = session.metadata?.plan_tier || "pro";

        if (email) {
            console.log(`[STRIPE-WEBHOOK] Payment verified for ${email}. Upgrading to ${planTier}...`);

            // Example dynamic token allocation based on the tier
            const allocatedTokens = planTier === "omni" || planTier === "multi_model" ? 100000 : 50000;

            // 1. Upgrade the user's tier and token balance in Supabase
            const { error: configError } = await supabase
                .from("user_configs")
                .update({
                    plan_tier: planTier,
                    tokens_allocated: allocatedTokens,
                    ai_provider: planTier === "omni" ? "multi_model" : "gpt-4o" // Syncing Omni Engine logic
                })
                .eq("email", email);

            if (configError) {
                console.error("[STRIPE-WEBHOOK] Failed to update user_configs:", configError);
            }

            // 2. Log the transaction into billing_history for dashboard analytics
            const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
            
            const { error: billingError } = await supabase
                .from("billing_history")
                .insert([{
                    email: email,
                    amount: amountPaid,
                    currency: session.currency?.toUpperCase(),
                    status: "success",
                    payment_provider: "stripe",
                    transaction_id: session.id
                }]);

            if (billingError) {
                 console.error("[STRIPE-WEBHOOK] Failed to insert billing_history:", billingError);
            }

            console.log(`[STRIPE-WEBHOOK] Successfully completed provisioning for ${email}.`);
        }
    }

    // Return a 200 OK so Stripe knows the webhook was received successfully
    return new NextResponse("Webhook processed successfully", { status: 200 });
}