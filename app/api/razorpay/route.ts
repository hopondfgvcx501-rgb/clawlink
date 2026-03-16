import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    // 🚀 Extracting payload from the frontend
    const { amount, currency, email, planName, selectedModel } = await req.json();

    if (!email) {
       return NextResponse.json({ error: "User Email is required" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 🔒 SAFETY CHECK: Prevent silent crashes if Test/Live keys are missing
    if (!keyId || !keySecret) {
      console.error("❌ [RAZORPAY] API keys missing in environment variables.");
      return NextResponse.json({ error: "Payment Gateway configuration error. Keys missing." }, { status: 500 });
    }

    // Initialize Razorpay engine
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 🔒 SAFETY CHECK: Razorpay strictly expects integers in PAISE.
    // Math.round() ensures there are no decimal points that could crash the payment.
    const safeAmount = Math.round(amount);

    // Create the order
    const options = {
      amount: safeAmount, 
      currency: currency || "INR", 
      receipt: `receipt_${Date.now()}`,
      // 🔒 THE MAGIC FIX: These notes ensure the webhook/frontend knows exactly what was purchased
      notes: {
        email: email,
        plan_name: planName || "Unknown",
        selected_model: selectedModel || "google" 
      }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}