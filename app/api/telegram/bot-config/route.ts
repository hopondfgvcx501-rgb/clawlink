import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. FETCH COMMANDS ONLY (Clean GET method)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase(); 

        // Fetch Commands directly from table
        const { data: commands, error } = await supabase
            .from("bot_commands")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Map DB 'is_active' to frontend 'isActive'
        const formattedCommands = commands?.map(cmd => ({
            id: cmd.id,
            command: cmd.command,
            description: cmd.description,
            action: cmd.action,
            isActive: cmd.is_active !== false // Default to true if null
        }));

        return NextResponse.json({ success: true, commands: formattedCommands || [] });

    } catch (error: any) {
        console.error("[BOT_CONFIG_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. MASTER POST HANDLER (Handles Add, Delete, Clear All, Toggle)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const safeEmail = body.email?.toLowerCase();

        if (!safeEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // 👉 ACTION: ADD COMMAND
        if (body.action === 'add_command') {
            const { error } = await supabase.from("bot_commands").insert({
                email: safeEmail,
                platform: "telegram",
                command: body.commandData.command,
                description: body.commandData.description,
                action: body.commandData.action,
                is_active: body.commandData.isActive ?? true
            });
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: DELETE SINGLE COMMAND
        if (body.action === 'delete_command') {
            const { error } = await supabase.from("bot_commands")
                .delete()
                .eq("id", body.commandId)
                .eq("email", safeEmail);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: CLEAR ALL COMMANDS (Nuke Button)
        if (body.action === 'clear_all_commands') {
            const { error } = await supabase.from("bot_commands")
                .delete()
                .eq("email", safeEmail)
                .eq("platform", "telegram");
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: TOGGLE ACTIVE/INACTIVE
        if (body.action === 'toggle_command_rule') {
            const { error } = await supabase.from("bot_commands")
                .update({ is_active: body.isActive })
                .eq("id", body.commandId)
                .eq("email", safeEmail);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // If no action matched
        return NextResponse.json({ success: false, error: "Invalid Action Provided" }, { status: 400 });

    } catch (error: any) {
        console.error("[BOT_CONFIG_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}