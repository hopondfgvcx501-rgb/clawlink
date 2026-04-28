import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0; // 🔒 LOCKED: Always fetch fresh chat data

// Supabase Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });

    const { data: chats, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("email", email)
      .eq("platform", "telegram")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const groupedChats: Record<string, any[]> = {};
    chats?.forEach(msg => {
        if (!groupedChats[msg.platform_chat_id]) groupedChats[msg.platform_chat_id] = [];
        groupedChats[msg.platform_chat_id].push(msg);
    });

    const leads = Object.values(groupedChats).map(msgs => {
        const firstMsg = msgs[0];
        const lastMsg = msgs[msgs.length - 1];
        
        return {
            id: firstMsg.platform_chat_id,
            platform_chat_id: firstMsg.platform_chat_id,
            name: firstMsg.customer_name || "Customer",
            customer_name: firstMsg.customer_name || "Customer",
            platform: "telegram",
            message: lastMsg.message || "[Media/System]",
            last_message_time: lastMsg.created_at,
            created_at: lastMsg.created_at,
            unread_count: 0
        };
    }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

    // 🔥 THE OMNI-PAYLOAD FIX: Frontend jo bhi naam se mange, usko de do!
    return NextResponse.json({ 
        success: true, 
        data: leads,       // Agar UI 'data' array dhoondh raha hai
        leads: leads,      // Agar UI 'leads' array dhoondh raha hai
        contacts: leads,   // Agar UI 'contacts' array dhoondh raha hai
        groupedChats: groupedChats
    });

  } catch (error: any) {
    console.error("🚨 [CRM API ERROR]:", error.message);
    // 🔥 ALWAYS LOG TO TG ADMIN
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}