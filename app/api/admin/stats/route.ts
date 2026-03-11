import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    // Ye API Admin panel ke liye live stats fetch karegi
    const { count: ticketCount } = await supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Open");

    const { count: userCount } = await supabase
      .from("user_configs")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userCount || 0,
        activeTickets: ticketCount || 0,
        systemStatus: "Healthy"
      }
    });
  } catch (error: any) {
    console.error("Admin Stats API Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to load stats" }, { status: 500 });
  }
}