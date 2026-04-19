import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. FETCH TOKEN STATUS & COMMANDS
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Get Bot Status & Token
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token, telegram_bot_active")
            .eq("email", email)
            .single();

        // Get Saved Commands
        const { data: commands } = await supabase
            .from("bot_commands")
            .select("*")
            .eq("email", email)
            .eq("platform", "telegram")
            .order("created_at", { ascending: false });

        return NextResponse.json({ 
            success: true, 
            bot: {
                username: config?.telegram_token ? "ClawLink_Node" : "",
                isActive: config?.telegram_bot_active || false,
                hasToken: !!config?.telegram_token
            },
            commands: commands || [] 
        });

    } catch (error: any) {
        console.error("[BOT_CONFIG_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. ADD NEW COMMAND
export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (body.action === 'add_command') {
            const { data, error } = await supabase.from("bot_commands").insert({
                email: body.email,
                platform: "telegram",
                command: body.commandData.command,
                description: body.commandData.description,
                action: body.commandData.action
            });

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: "Invalid Action" }, { status: 400 });
    } catch (error: any) {
        console.error("[BOT_CONFIG_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 3. TOGGLE BOT ENGINE STATUS
export async function PUT(req: Request) {
    try {
        const { email, isActive } = await req.json();
        const { error } = await supabase
            .from("user_configs")
            .update({ telegram_bot_active: isActive })
            .eq("email", email);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 4. DELETE COMMAND
export async function DELETE(req: Request) {
    try {
        const { email, commandId } = await req.json();
        const { error } = await supabase
            .from("bot_commands")
            .delete()
            .eq("id", commandId)
            .eq("email", email); // Extra security check

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}