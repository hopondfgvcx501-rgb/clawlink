import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    // 🚀 NEW: Frontend se amount ke sath Email, Plan, aur Model bhi le rahe hain
    const { amount, currency, email, planName, selectedModel } = await req.json();

    if (!email) {
       return NextResponse.json({ error: "User Email is required" }, { status: 400 });
    }

    // Razorpay engine initialize kar rahe hain
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Order create kar rahe hain
    const options = {
      amount: amount, // Amount in paise/cents
      currency: currency || "USD",
      receipt: `receipt_${Date.now()}`,
      // 🔒 THE MAGIC FIX: Ye notes webhook ko batayenge ki kya save karna hai
      notes: {
        email: email,
        plan_name: planName || "Unknown",
        selected_model: selectedModel || "google" // frontend se aaya hua model (claude/openai/google)
      }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    // Exact error message bhej rahe hain (No hiding!)
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}