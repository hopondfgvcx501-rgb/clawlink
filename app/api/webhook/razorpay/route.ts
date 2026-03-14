import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/app/lib/supabase"; // Make sure this path is correct

export async function POST(req: NextRequest) {
  try {
    // 1. Read the raw body and signature for security verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || !signature) {
      console.error("🚨 RAZORPAY WEBHOOK ERROR: Missing signature or secret");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 400 });
    }

    // 2. Cryptographic Verification (ClawLink Security Standard)
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("🚨 RAZORPAY WEBHOOK ERROR: Invalid Cryptographic Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Process the Event safely
    const event = JSON.parse(rawBody);

    // When payment is fully captured by the bank
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      
      // 🚀 MAGIC EXTRACTION: Fetching exactly what user selected from Razorpay Notes
      const notes = paymentEntity.notes || {};
      const userEmail = notes.email || paymentEntity.email; 
      const planName = (notes.plan_name || "Starter").toLowerCase();
      const rawModel = (notes.selected_model || "openai").toLowerCase();

      if (userEmail) {
        console.log(`💰 PAYMENT RECEIVED! Upgrading ${userEmail} to ${planName.toUpperCase()} with ${rawModel.toUpperCase()} engine...`);

        // 🧠 Smart AI Provider Routing
        let aiProvider = "openai";
        if (rawModel.includes("claude") || rawModel.includes("anthropic")) aiProvider = "anthropic";
        else if (rawModel.includes("gemini") || rawModel.includes("google")) aiProvider = "google";

        // 💎 Smart Plan Token Allocation
        let isUnlimited = false;
        let tokensAllocated = 10000; // Default Starter

        if (planName === "pro") {
            isUnlimited = true;
            tokensAllocated = 500000;
        } else if (planName === "max" || planName === "unlimited") {
            isUnlimited = true;
            tokensAllocated = 9999999;
        }

        // 4. Update EXACT Data in Supabase User Configs
        const { error: dbError } = await supabase
          .from("user_configs")
          .update({ 
            plan: planName,            // So dashboard overview shows correct plan
            is_unlimited: isUnlimited, 
            tokens_allocated: tokensAllocated,
            selected_model: rawModel,  // E.g., 'claude-3-opus'
            ai_provider: aiProvider    // E.g., 'anthropic'
          })
          .eq("email", userEmail);

        if (dbError) {
            console.error("DB Update Error:", dbError);
            throw dbError;
        }

        // 5. 🧾 BONUS: Save to Billing History so Invoices show up in Dashboard!
        try {
            await supabase.from("billing_history").insert({
                email: userEmail,
                plan_name: planName.toUpperCase(),
                amount: (paymentEntity.amount / 100).toString(), // Convert from paise to main currency
                currency: paymentEntity.currency,
                status: "PAID",
                razorpay_order_id: paymentEntity.order_id
            });
        } catch (invoiceError) {
            console.error("Failed to generate invoice record, but payment was successful:", invoiceError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("🚨 RAZORPAY WEBHOOK SYSTEM ERROR:", error.message);
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}