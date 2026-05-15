import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch & Auto-Sync Subscribers
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        const safeEmail = email.toLowerCase();

        // 1. Fetch Real Users from Chat History (To find new users)
        const { data: chatHistory } = await supabaseAdmin
            .from("chat_history")
            .select("platform_chat_id, customer_name, created_at")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("created_at", { ascending: true }); // Oldest first to get 'joined_at'

        // 2. Auto-Sync to CRM Table (Upsert)
        if (chatHistory && chatHistory.length > 0) {
            const upsertPayload = new Map();
            chatHistory.forEach(row => {
                if (row.platform_chat_id) {
                    upsertPayload.set(row.platform_chat_id, {
                        chat_id: row.platform_chat_id,
                        email: safeEmail,
                        platform: "telegram",
                        name: row.customer_name || "Telegram User",
                        last_interaction: row.created_at
                        // status and tags are handled by DB defaults for new rows
                    });
                }
            });

            const arrayToUpsert = Array.from(upsertPayload.values());
            // Upsert without overwriting existing status/tags if they already exist
            await supabaseAdmin.from("bot_subscribers").upsert(arrayToUpsert, { onConflict: 'chat_id', ignoreDuplicates: false });
        }

        // 3. Fetch Final CRM Data for UI
        const { data: crmUsers, error } = await supabaseAdmin
            .from("bot_subscribers")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("last_interaction", { ascending: false });

        if (error) throw error;

        // Map for UI
        const subscribers = crmUsers.map(u => ({
            id: u.chat_id,
            name: u.name,
            username: u.username || 'N/A',
            chatId: u.chat_id,
            status: u.status,
            tags: u.tags || [],
            joinedAt: new Date(u.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        }));

        return NextResponse.json({ success: true, subscribers });

    } catch (error: any) {
        console.error("[SUBSCRIBERS_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 POST: Handle Ban/Unban Actions
export async function POST(req: Request) {
    try {
        const { email, action, chatId, status } = await req.json();

        if (!email || !chatId || action !== 'toggle_status') {
            return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("bot_subscribers")
            .update({ status: status })
            .eq("chat_id", chatId)
            .eq("email", email.toLowerCase());

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[SUBSCRIBERS_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}