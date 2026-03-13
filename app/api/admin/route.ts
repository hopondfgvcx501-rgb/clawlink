import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚨🚨 APNI ASLI EMAIL ID YAHAN DAALEIN 🚨🚨
const CEO_EMAIL = "hopondfgvcx501@gmail.com"; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || email !== CEO_EMAIL) {
      return NextResponse.json({ success: false, error: "ACCESS DENIED." }, { status: 403 });
    }

    // 1. Calculate Total MRR
    const { data: billingData } = await supabase.from("billing_history").select("amount");
    let totalMRR = 0;
    if (billingData) {
      totalMRR = billingData.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
    }

    // 2. Count Active Clients
    const { count: activeClients } = await supabase.from("user_configs").select("*", { count: "exact", head: true });

    // 3. Count Total API Calls
    const { count: totalApiCalls } = await supabase.from("bot_conversations").select("*", { count: "exact", head: true });

    // 4. Fetch Client Roster
    const { data: clients } = await supabase
      .from("user_configs")
      .select("email, whatsapp_token, telegram_token, ai_model, plan, available_tokens, is_unlimited")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      stats: {
        mrr: totalMRR,
        activeClients: activeClients || 0,
        apiCalls: totalApiCalls || 0
      },
      clients: clients || []
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}