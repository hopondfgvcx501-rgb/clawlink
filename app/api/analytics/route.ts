import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });

        // Fetch all conversations for this specific bot owner
        const { data: chats, error } = await supabase
            .from("bot_conversations")
            .select("chat_id, role, created_at")
            .eq("bot_email", email)
            .order("created_at", { ascending: true });

        if (error) throw new Error(error.message);

        // 🚀 CALCULATE THE DATA GOLDMINE
        const totalMessages = chats.length;
        const aiReplies = chats.filter(c => c.role === "ai").length;
        const userMessages = chats.filter(c => c.role === "user").length;
        
        // Extract Unique Leads (Customers)
        const uniqueCustomers = [...new Set(chats.map(c => c.chat_id))];
        const totalLeads = uniqueCustomers.length;

        // Get Recent 10 Unique Leads for the Lead Table
        const recentLeads = [];
        const seen = new Set();
        for (let i = chats.length - 1; i >= 0; i--) {
            const chat = chats[i];
            if (!seen.has(chat.chat_id)) {
                seen.add(chat.chat_id);
                recentLeads.push({
                    chatId: chat.chat_id,
                    lastActive: chat.created_at
                });
                if (recentLeads.length >= 10) break;
            }
        }

        return NextResponse.json({ 
            success: true, 
            data: {
                totalMessages,
                aiReplies,
                userMessages,
                totalLeads,
                recentLeads
            } 
        });

    } catch (error: any) {
        console.error("Analytics API Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
    }
}