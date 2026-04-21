import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // 🚀 Fetch Real Users from Chat History
        const { data: chatHistory, error } = await supabase
            .from("chat_history")
            .select("platform_chat_id, customer_name, created_at")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // 🧠 Deduplication Engine: Get unique users with their latest interaction time
        const subscribersMap = new Map();
        
        chatHistory?.forEach(row => {
            if (row.platform_chat_id && !subscribersMap.has(row.platform_chat_id)) {
                
                const interactionDate = new Date(row.created_at);
                const formattedDate = interactionDate.toLocaleDateString('en-GB', { 
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                });

                subscribersMap.set(row.platform_chat_id, {
                    id: row.platform_chat_id,
                    name: row.customer_name || "Telegram User",
                    chatId: row.platform_chat_id,
                    status: "Active",
                    tags: ["Subscriber", "Telegram"],
                    lastInteraction: formattedDate
                });
            }
        });

        const subscribers = Array.from(subscribersMap.values());

        return NextResponse.json({ success: true, subscribers });

    } catch (error: any) {
        console.error("[SUBSCRIBERS_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}