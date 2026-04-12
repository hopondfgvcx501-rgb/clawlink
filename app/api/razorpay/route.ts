import { NextResponse } from "next/server";
import Razorpay from "razorpay";

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (HACKER-PROOF PRICING) ─── */
const SECURE_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 5, pro: 999, ultra: 1999, adv_max: 49999 },
  "gpt-5.4 Pro": { plus: 5, pro: 1499, ultra: 2999, adv_max: 74999 },
  "Claude Opus 4.6": { plus: 5, pro: 1999, ultra: 3999, adv_max: 99999 },
  "omni 3 nexus": { monthly: 20916, yearly: 149999 }
};
export async function POST(req: Request) {
  try {
    const { email, planName, selectedModel, planType, notes: frontendNotes } = await req.json();

    if (!email || !planName || !selectedModel) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // 🔒 SECURITY CHECK: Lookup actual INR price from backend, completely IGNORE frontend amount
    const safeModel = SECURE_PRICING[selectedModel] ? selectedModel : "gpt-5.2";
    const secureInrPrice = SECURE_PRICING[safeModel][planName.toLowerCase()];

    if (!secureInrPrice) {
      return NextResponse.json({ error: "Invalid plan or model selected" }, { status: 400 });
    }

    // 🔒 SURGICAL FIX: Razorpay strictly expects integers in PAISE.
    const safeAmount = secureInrPrice * 100;

    // 🚀 SURGICAL FIX: Dynamically merge all frontendNotes to prevent Data Drop!
    const options = {
      amount: safeAmount, 
      currency: "INR", 
      receipt: `receipt_${Date.now()}`,
      notes: {
        email: email,
        plan_name: planName || "Unknown",
        selected_model: safeModel,
        plan_type: planType || "NEW",
        ...frontendNotes // <--- THIS SAVES EVERYTHING! (is_renewal, token, channel, etc)
      }
    };

    const order = await razorpay.orders.create(options);
    console.log(`[RAZORPAY-ORDER] Created for ${email} | Amount: ₹${secureInrPrice}`);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}