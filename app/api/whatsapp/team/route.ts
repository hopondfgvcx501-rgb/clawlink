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

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        // 🚀 Fetch all team members across the workspace
        const { data: members, error } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("owner_email", safeEmail)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // 🚀 Inject Owner at the top
        const allMembers = [
            { id: 'owner', member_email: safeEmail, role: 'OWNER', status: 'Active' },
            ...(members || [])
        ];

        return NextResponse.json({ success: true, members: allMembers });
    } catch (error: any) {
        console.error("[TEAM_GET_ERROR]", error);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { owner_email, member_email, role } = body;

        // 🛡️ EXACT MATCH: Prevents "Missing fields" error
        if (!owner_email || !member_email) {
            return NextResponse.json({ success: false, error: "Missing fields: Ensure owner and member emails are provided." }, { status: 400 });
        }

        if (owner_email.toLowerCase() === member_email.toLowerCase()) {
            return NextResponse.json({ success: false, error: "You cannot invite yourself to your own workspace." }, { status: 400 });
        }

        // 🚀 Insert into Real DB
        const { error } = await supabase.from("workspace_members").insert({
            owner_email: owner_email.toLowerCase(),
            member_email: member_email.toLowerCase(),
            platform: "global", // Universal Team Access
            role: role || "Editor",
            status: "Active"
        });

        if (error) {
            if (error.code === '23505') return NextResponse.json({ success: false, error: "User is already in this workspace!" }, { status: 400 });
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[TEAM_POST_ERROR]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { owner_email, id } = await req.json();

        if (!owner_email || !id) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

        const { error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("owner_email", owner_email.toLowerCase())
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}