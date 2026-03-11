import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    // 1. Get Support Tickets count
    const { count: ticketCount } = await supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Open");

    // 2. Get Total Users count
    const { count: userCount } = await supabase
      .from("user_configs")
      .select("*", { count: "exact", head: true });

    // 3. Calculate Total Revenue & Fetch Recent Transactions
    const { data: billingData, error: billingErr } = await supabase
      .from("billing_history")
      .select("email, plan_name, amount, currency, created_at")
      .eq("status", "Paid")
      .order("created_at", { ascending: false });

    let totalRevenue = 0;
    // 🚀 FIX: Added : any[] so TypeScript knows it's a data array
    let recentTransactions: any[] = []; 

    if (!billingErr && billingData) {
      totalRevenue = billingData.reduce((sum, record) => sum + Number(record.amount || 0), 0);
      recentTransactions = billingData.slice(0, 5); // Take top 5 latest payments
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userCount || 0,
        activeTickets: ticketCount || 0,
        totalRevenue: totalRevenue,
        recentTransactions: recentTransactions,
        systemStatus: "Healthy"
      }
    });
  } catch (error: any) {
    console.error("Admin Stats API Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to load stats" }, { status: 500 });
  }
}