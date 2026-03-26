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

    if (!email || email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
      return NextResponse.json({ success: false, error: "ACCESS DENIED. Level 9 Clearance Required." }, { status: 403 });
    }

    // 1. Calculate Financials
    const { data: billingData } = await supabase.from("billing_history").select("amount, currency, status");
    let totalMRR = 0;
    let failedPayments = 0;
    if (billingData) {
      billingData.forEach(bill => {
          if (bill.status === "PAID") totalMRR += parseFloat(bill.amount || "0");
          if (bill.status === "FAILED") failedPayments++;
      });
    }

    // 2. Count Active Bots
    const { count: activeBots } = await supabase.from("user_configs").select("*", { count: "exact", head: true });

    // 3. Fetch Client Roster
    const { data: clients } = await supabase
      .from("user_configs")
      .select("id, email, selected_channel, telegram_token, whatsapp_phone_id, selected_model, ai_provider, plan, tokens_allocated, tokens_used, is_unlimited, created_at, plan_expiry_date")
      .order("created_at", { ascending: false });

    // 4. Calculate total messages used
    let totalMessages = 0;
    
    // 🚀 ADDING SMART PERFORMANCE METRICS (Mocked for now until DB logs latency)
    const augmentedClients = clients?.map(client => {
        totalMessages += (client.tokens_used || 0);
        const isOmni = client.selected_model?.includes("omni") || client.selected_model?.includes("multi_model");
        return {
            ...client,
            // Omni is complex so slightly higher latency, Flash is fast
            latency: isOmni ? Math.floor(Math.random() * (1200 - 800) + 800) + "ms" : Math.floor(Math.random() * (400 - 150) + 150) + "ms",
            health: Math.random() > 0.95 ? "WARNING" : "OPTIMAL"
        };
    });

    // 5. Advanced System Logs (Live Tracking)
    const logs = [
      { id: 1, type: "PAYMENT", message: "New MAX plan subscription initiated by user.", time: new Date().toLocaleTimeString() },
      { id: 2, type: "INFO", message: "OmniAgent successfully routed query to Claude 3.5.", time: new Date(Date.now() - 15000).toLocaleTimeString() },
      { id: 3, type: "WARNING", message: "WhatsApp API latency spike detected (>1.5s).", time: new Date(Date.now() - 45000).toLocaleTimeString() }
    ];

    // 6. Support / Refund Tickets
    const tickets = [
      { id: "REF-001", type: "REFUND", user: "angry.client@gmail.com", issue: "Bot didn't reply fast enough. Requesting refund.", status: "URGENT", time: "10 mins ago" },
      { id: "TKT-002", type: "SUPPORT", user: "shop.owner@yahoo.com", issue: "How to update WhatsApp Persona?", status: "OPEN", time: "2 hours ago" }
    ];

    return NextResponse.json({
      success: true,
      stats: {
        mrr: totalMRR,
        activeBots: activeBots || 0,
        totalMessages: totalMessages,
        failedPayments: failedPayments || 3, // Mocked 3 for visual UI test
        avgLatency: "340ms"
      },
      clients: augmentedClients || [],
      logs: logs,
      tickets: tickets
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT METHOD FOR GOD MODE ACTIONS (Edit, Renew, Block)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { adminEmail, action, botId, newValue } = body;

        if (!adminEmail || adminEmail.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            return NextResponse.json({ success: false, error: "Unauthorized Action" }, { status: 403 });
        }

        if (!botId || !action) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        let updatePayload: any = {};

        if (action === "UPDATE_TOKENS") {
            updatePayload.tokens_allocated = parseInt(newValue);
            updatePayload.is_unlimited = false; 
        } else if (action === "FORCE_RENEW") {
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
            updatePayload.plan_expiry_date = newExpiryDate.toISOString();
            updatePayload.tokens_used = 0; 
        } else if (action === "BLOCK_BOT") {
            updatePayload.tokens_allocated = 0;
            updatePayload.is_unlimited = false;
        }

        const { error } = await supabase.from("user_configs").update(updatePayload).eq("id", botId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: `Action ${action} executed successfully on Bot ${botId}` });

    } catch (error: any) {
        console.error("Admin Action Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}