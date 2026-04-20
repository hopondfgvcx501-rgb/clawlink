import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. SYNC GROUPS FROM TELEGRAM
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        // 1. Get User's Telegram Token
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token")
            .eq("email", safeEmail)
            .single();

        if (!config || !config.telegram_token) {
             return NextResponse.json({ success: false, error: "Telegram Token not found" }, { status: 404 });
        }

        // 2. Ideally, Telegram API doesn't have a simple "get all my groups" endpoint for bots. 
        // A bot only knows about a group if someone adds it or sends a message to it while it's in the group.
        // For Enterprise SaaS, you typically capture group IDs via Webhook when the bot is added (my_chat_member event) 
        // and save them to the DB.
        // For this sync button, we will fetch the currently known groups from the DB to refresh the UI.
        
        const { data: groups, error } = await supabase
            .from("telegram_groups")
            .select("*")
            .eq("email", safeEmail);

        if (error) throw error;

        const formattedGroups = (groups || []).map(group => ({
            id: group.id,
            groupId: group.group_id,
            name: group.group_name,
            type: group.group_type,
            members: group.member_count || 0,
            autoDeleteLinks: group.auto_delete_links,
            antiSpam: group.anti_spam,
            welcomeMessage: group.welcome_message
        }));

        return NextResponse.json({ success: true, groups: formattedGroups });

    } catch (error: any) {
        console.error("[GROUPS_SYNC_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}