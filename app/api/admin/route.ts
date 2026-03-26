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

    // 1. Calculate Total MRR
    const { data: billingData } = await supabase.from("billing_history").select("amount, currency");
    let totalMRR = 0;
    if (billingData) {
      // Basic sum, ignoring currency conversion for now (Assuming INR mostly)
      totalMRR = billingData.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0);
    }

    // 2. Count Active Bots (Not just users, but total deployed bots)
    const { count: activeBots } = await supabase.from("user_configs").select("*", { count: "exact", head: true });

    // 3. Fetch Client Roster (Now fetching ALL bots, including their IDs for management)
    const { data: clients } = await supabase
      .from("user_configs")
      .select("id, email, selected_channel, telegram_token, whatsapp_phone_id, selected_model, ai_provider, plan, tokens_allocated, tokens_used, is_unlimited, created_at, plan_expiry_date")
      .order("created_at", { ascending: false });

    // 4. Calculate total messages used across all bots
    let totalMessages = 0;
    if (clients) {
        totalMessages = clients.reduce((acc, bot) => acc + (bot.tokens_used || 0), 0);
    }

    // 5. System Logs (Mocked for now, can be hooked to actual logging table later)
    const logs = [
      { id: 1, type: "INFO", message: "Admin Dashboard successfully initialized with God Mode.", time: new Date().toLocaleTimeString() }
    ];

    // 6. Support Tickets
    const tickets = [
      { id: "TKT-001", user: "demo.client@gmail.com", issue: "Bot integration help required.", status: "OPEN", time: "1 hr ago" }
    ];

    return NextResponse.json({
      success: true,
      stats: {
        mrr: totalMRR,
        activeBots: activeBots || 0,
        totalMessages: totalMessages
      },
      clients: clients || [],
      logs: logs,
      tickets: tickets
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 🚀 NEW: PUT METHOD FOR GOD MODE ACTIONS (Edit, Renew, Block)
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
            updatePayload.is_unlimited = false; // Reset to metered if manual token given
        } else if (action === "FORCE_RENEW") {
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
            updatePayload.plan_expiry_date = newExpiryDate.toISOString();
            updatePayload.tokens_used = 0; // Reset usage
        } else if (action === "BLOCK_BOT") {
             // To block a bot, we set tokens allocated to 0 and remove unlimited status
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