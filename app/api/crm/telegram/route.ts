import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

    // 1. Fetch raw chat history from DB
    const { data: chats, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("email", email)
      .eq("platform", "telegram")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🧠 THE FIX: Group messages by Unique Users for the CRM Sidebar
    const contactsMap = new Map();

    if (chats && chats.length > 0) {
        chats.forEach(chat => {
            // Agar ye user pehle map mein nahi hai, toh add karo (latest message ke sath)
            if (!contactsMap.has(chat.platform_chat_id)) {
                contactsMap.set(chat.platform_chat_id, {
                    // Providing multiple key formats to guarantee UI compatibility
                    id: chat.platform_chat_id,
                    chat_id: chat.platform_chat_id,
                    platform_chat_id: chat.platform_chat_id,
                    name: chat.customer_name || "Customer",
                    customer_name: chat.customer_name || "Customer",
                    message: chat.message || "[Media/System]",
                    last_message: chat.message || "[Media/System]",
                    created_at: chat.created_at,
                    updated_at: chat.created_at,
                    unread_count: 0
                });
            }
        });
    }

    // Convert the map back to a clean array for the frontend
    const formattedContacts = Array.from(contactsMap.values());

    return NextResponse.json({ success: true, data: formattedContacts });

  } catch (error: any) {
    console.error("🚨 [CRM API ERROR]:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}