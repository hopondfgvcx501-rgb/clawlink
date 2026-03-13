import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // 1. Fetch All Conversations for this Bot
    const { data: conversations, error } = await supabase
      .from("bot_conversations")
      .select("chat_id, role, created_at")
      .eq("bot_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    let userMessages = 0;
    let aiReplies = 0;
    const leadsMap = new Map();

    conversations?.forEach((msg) => {
      // Count Roles
      if (msg.role === "user") userMessages++;
      if (msg.role === "ai") aiReplies++;

      // Track Unique Leads and their last active time
      if (!leadsMap.has(msg.chat_id)) {
        leadsMap.set(msg.chat_id, msg.created_at);
      }
    });

    // Format recent leads for the table
    const recentLeads = Array.from(leadsMap.entries()).map(([chatId, lastActive]) => ({
      chatId,
      lastActive,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalLeads: leadsMap.size,
        userMessages,
        aiReplies,
        recentLeads: recentLeads.slice(0, 50) // Return top 50 recent leads
      }
    });

  } catch (error: any) {
    console.error("Analytics API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}