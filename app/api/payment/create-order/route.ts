import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay securely using environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, planName, amount, currency } = body;

    // Validate incoming data to ensure dynamic pricing details are present
    if (!email || !amount || !currency) {
      return NextResponse.json({ error: "Missing required billing fields" }, { status: 400 });
    }

    // Razorpay requires the amount in the smallest subunit (paise for INR, cents for USD).
    // Multiply the base amount (e.g., 299 or 29) by 100.
    const options = {
      amount: amount * 100, 
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        email: email,
        plan: planName
      }
    };

    // Create the order on Razorpay servers with the dynamic currency
    const order = await razorpay.orders.create(options);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Dynamic Order Creation Error:", error);
    return NextResponse.json({ error: "Failed to create dynamic payment order" }, { status: 500 });
  }
}