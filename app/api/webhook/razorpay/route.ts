import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/app/lib/supabase"; // Path alias fixed

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
      const userEmail = paymentEntity.email; // Extracted directly from bank payload

      if (userEmail) {
        console.log(`💰 PAYMENT RECEIVED! Upgrading ${userEmail} to PRO...`);

        // 4. Upgrade User in Supabase directly
        const { error: dbError } = await supabase
          .from("user_configs")
          .update({ 
            is_unlimited: true, 
            available_tokens: 500000, // Monthly refresh limit
            plan_type: "pro" 
          })
          .eq("email", userEmail);

        if (dbError) throw dbError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Log the exact system error for Vercel logs
    console.error("🚨 RAZORPAY WEBHOOK SYSTEM ERROR:", error.message);
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}