import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Mandatory: Must use Service Role Key to bypass RLS policies during background jobs
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    // 🔒 SECURITY LOCK: Only Vercel can run this using a secret token
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized access', { status: 401 });
    }

    const now = new Date().toISOString();

    // 1. Find all users whose expiry date has passed
    const { data: expiredUsers, error: fetchError } = await supabase
      .from("user_configs")
      .select("email")
      .lt("expires_at", now)
      .eq("plan_status", "Active");

    if (fetchError) throw fetchError;

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No expired plans found today." });
    }

    // 2. Downgrade all expired accounts
    for (const user of expiredUsers) {
      await supabase
        .from("user_configs")
        .update({
          plan_status: "Expired",
          available_tokens: 0, // Cuts off AI generation in webhooks
          is_unlimited: false
        })
        .eq("email", user.email);
    }

    return NextResponse.json({ 
      success: true, 
      message: `System successfully downgraded ${expiredUsers.length} expired accounts.` 
    });

  } catch (error: any) {
    console.error("Auto-Downgrade Cron Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}