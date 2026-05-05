import { NextResponse } from "next/server";
import Razorpay from "razorpay";

/* ─── 🚀 BACKEND SINGLE SOURCE OF TRUTH (HACKER-PROOF PRICING 2026) ─── */
const SECURE_PRICING: Record<string, any> = {
  "gemini 3.1 Pro": { plus: 5, pro: 999, ultra: 1999, adv_max: 49999 },
  "gpt-5.4 Pro": { plus: 5, pro: 1499, ultra: 2999, adv_max: 74999 },
  "Claude Opus 4.7": { plus: 5, pro: 1999, ultra: 3999, adv_max: 99999 },
  "omni 3 nexus": { monthly: 20916, yearly: 149999 }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Safely extract payload variables, anticipating potential missing fields from the frontend
    const { email, planName, selectedModel, model, planType, notes: frontendNotes } = body;

    const actualEmail = email || frontendNotes?.email;
    const actualPlan = (planName || frontendNotes?.plan_name || "plus").toLowerCase();

    if (!actualEmail || !actualPlan) {
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

    // 🔒 SECURITY CHECK: Robust model string parsing to prevent undefined errors
    const rawModel = String(selectedModel || model || frontendNotes?.selected_model || frontendNotes?.model || "gpt-5.4 Pro").toLowerCase();
    
    let safeModel = "gpt-5.4 Pro";
    if (rawModel.includes("omni") || rawModel.includes("nexus")) safeModel = "omni 3 nexus";
    else if (rawModel.includes("claude") || rawModel.includes("opus")) safeModel = "Claude Opus 4.7";
    else if (rawModel.includes("gemini")) safeModel = "gemini 3.1 Pro";

    // Lookup actual INR price from backend, completely IGNORE frontend amount
    const secureInrPrice = SECURE_PRICING[safeModel]?.[actualPlan];

    if (!secureInrPrice) {
      console.error(`[RAZORPAY ERROR] Price mapping failed for Model: ${safeModel}, Plan: ${actualPlan}`);
      return NextResponse.json({ error: "Invalid plan or model selected" }, { status: 400 });
    }

    // 🔒 SURGICAL FIX: Razorpay strictly expects integers in PAISE. Math.round prevents float errors.
    const safeAmount = Math.round(secureInrPrice * 100);

    // 🚀 SURGICAL FIX: Dynamically merge all frontendNotes to prevent Data Drop!
    const options = {
      amount: safeAmount, 
      currency: "INR", 
      receipt: `receipt_${Date.now()}`,
      notes: {
        email: actualEmail,
        plan_name: actualPlan,
        selected_model: safeModel,
        plan_type: planType || "NEW",
        ...(frontendNotes || {}) // <--- THIS SAVES EVERYTHING! (is_renewal, token, channel, etc)
      }
    };

    const order = await razorpay.orders.create(options);
    console.log(`[RAZORPAY-ORDER] Created for ${actualEmail} | Model: ${safeModel} | Amount: ₹${secureInrPrice}`);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[RAZORPAY FATAL] Order Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}