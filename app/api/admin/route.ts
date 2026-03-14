import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚨🚨 ASLI CEO EMAIL ID YAHAN HAI 🚨🚨
const CEO_EMAIL = "hopondfgvcx501@gmail.com"; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || email !== CEO_EMAIL) {
      return NextResponse.json({ success: false, error: "ACCESS DENIED. Level 9 Clearance Required." }, { status: 403 });
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

    // 5. System Logs (Gadbad Tracker)
    const logs = [
      { id: 1, type: "WARNING", message: "High latency detected on WhatsApp Cloud API routing.", time: new Date(Date.now() - 500000).toLocaleTimeString() },
      { id: 2, type: "ERROR", message: "Failed to generate RAG embedding for a user (API Key Expired?)", time: new Date(Date.now() - 3600000).toLocaleTimeString() },
      { id: 3, type: "INFO", message: "Auto-scaling triggered. Server capacity increased.", time: new Date(Date.now() - 7200000).toLocaleTimeString() }
    ];

    // 6. Support Tickets (Help Tracker)
    const tickets = [
      { id: "TKT-001", user: "demo.client@gmail.com", issue: "Payment deducted but plan not upgraded to PRO.", status: "URGENT", time: "10 mins ago" },
      { id: "TKT-002", user: "shop.owner@yahoo.com", issue: "Telegram bot is not responding to voice notes.", status: "OPEN", time: "2 hours ago" }
    ];

    return NextResponse.json({
      success: true,
      stats: {
        mrr: totalMRR,
        activeClients: activeClients || 0,
        apiCalls: totalApiCalls || 0
      },
      clients: clients || [],
      logs: logs,
      tickets: tickets
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}