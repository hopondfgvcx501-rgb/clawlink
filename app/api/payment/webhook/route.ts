import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase"; 

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // Security check: Verify the signature from Razorpay
    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Unauthorized Signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    // If payment is captured, upgrade the user's word limit
    if (payload.event === "payment.captured") {
      const email = payload.payload.payment.entity.notes.email;

      if (email) {
        // Boost limit to 500,000 words automatically
        const { error } = await supabase
          .from("user_configs")
          .update({ token_limit: 500000 }) 
          .eq("email", email);

        if (error) throw error;
        console.log(`✅ Limit successfully upgraded for: ${email}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment Webhook Error:", error.message);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}