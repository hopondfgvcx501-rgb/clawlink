import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      plan,
      amount,
      selected_model,     // Expected: 'gpt-5.4 Pro', 'Claude Opus 4.6', 'gemini 3.1 Pro', or 'omni 3 nexus'
      selected_channel    // Expected: 'whatsapp', 'telegram', 'instagram', or 'widget'
    } = body;

    // 1. Verify Payment Signature (Security)
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Dynamic Token Allocation based on Plan
    let tokens = 50000; // Default Starter
    let unlimited = false;
    const currentPlan = (plan || "starter").toLowerCase();
    
    if (currentPlan === "pro") tokens = 500000;
    if (currentPlan === "max" || currentPlan === "adv_max" || currentPlan === "ultra") {
       tokens = 999999999;
       unlimited = true;
    }

    // 3. THE PERMANENT FIX: Update Supabase exactly with user's choices using 2026 models
    const { error: updateError } = await supabase
      .from("user_configs")
      .upsert({
        email: email.toLowerCase(),
        plan: currentPlan,
        plan_status: "Active", // Ensure the plan is activated upon successful payment
        selected_model: selected_model || "gpt-5.4 Pro",    // Fallback to the primary default 2026 model
        selected_channel: selected_channel || "telegram",        
        tokens_allocated: tokens,
        is_unlimited: unlimited,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (updateError) throw updateError;

    // 4. Record the Bill in Dashboard
    await supabase.from("billing_history").insert({
      email: email.toLowerCase(),
      plan_name: currentPlan,
      amount: amount,
      currency: "INR", 
      status: "PAID",
      razorpay_order_id: razorpay_order_id
    });

    return NextResponse.json({ success: true, message: "Payment verified and AI Model assigned successfully!" });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}