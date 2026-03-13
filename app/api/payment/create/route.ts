import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, email, plan, selected_model, selected_channel } = body;

    if (!amount || !email) {
      return NextResponse.json({ success: false, error: "Missing amount or email" }, { status: 400 });
    }

    // Razorpay initialization
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const options = {
      amount: amount * 100, // Razorpay takes amount in paise (multiply by 100)
      currency: "INR", // Change to USD if needed
      receipt: `rcptid_${Math.floor(Math.random() * 10000)}`,
      notes: {
        email: email.toLowerCase(),
        plan: plan,
        selected_model: selected_model,       // 🚀 MAGIC: Saving User's Model Choice
        selected_channel: selected_channel    // 🚀 MAGIC: Saving User's Channel Choice
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create order" }, { status: 500 });
  }
}