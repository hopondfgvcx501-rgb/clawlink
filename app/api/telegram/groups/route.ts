import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. FETCH CONNECTED GROUPS
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        const { data: groups, error } = await supabase
            .from("telegram_groups")
            .select("*")
            .eq("email", safeEmail)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Transform DB schema to match UI interface
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
        console.error("[GROUPS_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. UPDATE MODERATION SETTINGS
export async function PUT(req: Request) {
    try {
        const { email, groupId, rule, value } = await req.json();

        if (!email || !groupId || !rule) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // Map JS camelCase to DB snake_case
        let dbColumn = "";
        if (rule === "autoDeleteLinks") dbColumn = "auto_delete_links";
        else if (rule === "antiSpam") dbColumn = "anti_spam";
        else if (rule === "welcomeMessage") dbColumn = "welcome_message";
        else return NextResponse.json({ success: false, error: "Invalid rule" }, { status: 400 });

        const { error } = await supabase
            .from("telegram_groups")
            .update({ [dbColumn]: value })
            .eq("email", safeEmail)
            .eq("group_id", groupId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[GROUPS_PUT_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}