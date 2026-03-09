import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
// Ensure this path matches your supabase config file location
import { supabase } from "../../../lib/supabase"; 

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // Security Check: Verify that the request is actually coming from Razorpay
    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);

    // The Magic: Upgrade user limits when payment is captured successfully
    if (payload.event === "payment.captured") {
      // Extract the email we sent during the "Create Order" step
      const email = payload.payload.payment.entity.notes.email;

      if (email) {
        // Automatically upgrade the user's quota in Supabase to 500,000 words
        const { error } = await supabase
          .from("user_configs")
          .update({ token_limit: 500000 }) 
          .eq("email", email);

        if (error) {
          console.error("Database limit upgrade failed:", error);
          return NextResponse.json({ error: "Failed to update user limit" }, { status: 500 });
        }
        console.log(`✅ Payment successful! Limit upgraded dynamically for: ${email}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}