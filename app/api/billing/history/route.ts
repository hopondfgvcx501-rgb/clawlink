import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE REAL-TIME BILLING INVOICE ROUTE
 * ==============================================================================================
 * @file app/api/billing/history/route.ts
 * @description Secure server-side endpoint fetching verified transaction history from Supabase.
 * Strictly linked to Razorpay live hooks ledger. No dummy data operations allowed.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Authentication payload mismatch. Email missing." },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Infrastructure missing production database credentials keys." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Queries verified transaction ledgers inserted live via your Razorpay/Stripe webhooks
    const { data: databaseRecords, error: databaseError } = await supabase
      .from("billing_history")
      .select("id, created_at, plan_tier, amount, currency, status, payment_id")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (databaseError) {
      return NextResponse.json(
        { success: false, error: databaseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: databaseRecords || [],
    });

  } catch (executionException) {
    const systemError = executionException as Error;
    return NextResponse.json(
      { success: false, error: systemError.message },
      { status: 500 }
    );
  }
}