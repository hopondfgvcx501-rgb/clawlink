import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIX 1: Ye Next.js ko batayega ki is file ko Build time pe test-run NAHI karna hai
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 🚀 FIX 2: Supabase connection code ko function ke ANDAR move kar diya
    // Ab ye tabhi chalega jab sach mein cron job hit hogi, build time pe nahi.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase Keys" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🔒 SECURITY LOCK
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized access', { status: 401 });
    }

    const now = new Date().toISOString();

    // 1. Find expired users
    const { data: expiredUsers, error: fetchError } = await supabase
      .from("user_configs")
      .select("email")
      .lt("expires_at", now)
      .eq("plan_status", "Active");

    if (fetchError) throw fetchError;

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No expired plans found today." });
    }

    // 2. Downgrade accounts
    for (const user of expiredUsers) {
      await supabase
        .from("user_configs")
        .update({
          plan_status: "Expired",
          available_tokens: 0,
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