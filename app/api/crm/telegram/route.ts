import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Ensures fresh data, no caching

// Supabase Connection (Bypassing RLS for Admin API)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // 1. Fetch raw chat history from DB (Ascending so we can grab the latest easily)
    const { data: chats, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("email", email)
      .eq("platform", "telegram")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // 2. Group messages exactly how the Frontend expects them
    const groupedChats: Record<string, any[]> = {};
    chats?.forEach(msg => {
        if (!groupedChats[msg.platform_chat_id]) {
            groupedChats[msg.platform_chat_id] = [];
        }
        groupedChats[msg.platform_chat_id].push(msg);
    });

    // 3. Map into the 'leads' format expected by your UI
    const leads = Object.values(groupedChats).map(msgs => {
        const firstMsg = msgs[0];
        const lastMsg = msgs[msgs.length - 1]; // The most recent message

        return {
            id: firstMsg.platform_chat_id,
            platform_chat_id: firstMsg.platform_chat_id,
            name: firstMsg.customer_name || "Customer",
            customer_name: firstMsg.customer_name || "Customer",
            platform: firstMsg.platform || "telegram",
            message: lastMsg.message || "[Media/System]",
            last_message_time: lastMsg.created_at,
            created_at: lastMsg.created_at,
            unread_count: 0
        };
    }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

    // 🔥 THE FIX: Sending it exactly as 'leads' and 'groupedChats'
    return NextResponse.json({ success: true, leads: leads, groupedChats: groupedChats });

  } catch (error: any) {
    console.error("🚨 [CRM API ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}