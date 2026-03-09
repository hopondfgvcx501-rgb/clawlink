import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    // 🚀 FIX: MOVED INSIDE THE FUNCTION
    // Now Razorpay only initializes when an actual payment is requested, saving Vercel from crashing during build.
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const body = await request.json();
    const { email, planName, amount, currency } = body;

    // Validate incoming data
    if (!email || !amount || !currency) {
      return NextResponse.json({ error: "Missing required billing fields" }, { status: 400 });
    }

    // Amount needs to be in smallest currency unit (paise/cents)
    const options = {
      amount: amount * 100, 
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        email: email,
        plan: planName
      }
    };

    // Create the order on Razorpay servers
    const order = await razorpay.orders.create(options);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Dynamic Order Creation Error:", error);
    return NextResponse.json({ error: "Failed to create dynamic payment order" }, { status: 500 });
  }
}