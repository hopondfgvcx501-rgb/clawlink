import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET() {
  try {
    // 1. Total Users Count
    const { count: totalUsers } = await supabase
      .from("user_configs")
      .select("*", { count: 'exact', head: true });

    // 2. All Active Configs
    const { data: configs } = await supabase
      .from("user_configs")
      .select("email, ai_provider, ai_model, selected_channel, created_at")
      .order("created_at", { ascending: false });

    // 3. Total Tokens Consumed (Across all users)
    const { data: logs } = await supabase
      .from("usage_logs")
      .select("estimated_tokens");
    
    const totalTokens = logs?.reduce((sum, log) => sum + (log.estimated_tokens || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalTokens,
        activeBots: configs?.length || 0,
        recentConfigs: configs
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}