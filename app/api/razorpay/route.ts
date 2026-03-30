import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { amount, currency, email, planName, selectedModel, planType, notes: frontendNotes } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "User Email is required" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("❌ [RAZORPAY] API keys missing in environment variables.");
      return NextResponse.json({ error: "Payment Gateway configuration error. Keys missing." }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 🔒 SURGICAL FIX: Razorpay strictly expects integers in PAISE.
    const safeAmount = Math.round(amount * 100);

    // 🚀 SURGICAL FIX: Dynamically merge all frontendNotes to prevent Data Drop!
    const options = {
      amount: safeAmount, 
      currency: currency || "INR", 
      receipt: `receipt_${Date.now()}`,
      notes: {
        email: email,
        plan_name: planName || "Unknown",
        selected_model: selectedModel || "google", // Ensure this is explicitly set from frontend
        plan_type: planType || "NEW",
        ...frontendNotes // <--- THIS SAVES EVERYTHING! (is_renewal, token, channel, etc)
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