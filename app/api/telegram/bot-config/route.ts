import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 🚀 HELPER: AUTO-SYNC COMMANDS WITH TELEGRAM UI MENU
// ============================================================================
async function syncTelegramMenu(email: string) {
    try {
        // 1. Get User's Telegram Token
        const { data: config } = await supabase.from("user_configs").select("telegram_token").eq("email", email).single();
        if (!config || !config.telegram_token) return;

        // 2. Fetch all ACTIVE commands for this user
        const { data: commands } = await supabase.from("bot_commands")
            .select("command, description")
            .eq("email", email)
            .eq("platform", "telegram")
            .eq("is_active", true);

        // 3. Format commands strictly according to Telegram API rules
        // Rule: Must be lowercase, no leading slash, 1-32 chars
        const tgCommands = (commands || []).map(c => ({
            command: c.command.replace(/^\//, '').toLowerCase().substring(0, 32),
            description: c.description.substring(0, 256)
        }));

        // 4. Push to Telegram UI
        const tgUrl = `https://api.telegram.org/bot${config.telegram_token}/setMyCommands`;
        const res = await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands: tgCommands })
        });

        const tgData = await res.json();
        if (!tgData.ok) {
            console.error("[TG_SYNC_ERROR] Telegram rejected menu sync:", tgData.description);
        } else {
            console.log(`[TG_SYNC_SUCCESS] Synced ${tgCommands.length} commands to Telegram UI.`);
        }
    } catch (e) {
        console.error("[SYNC_EXCEPTION]", e);
    }
}
// ============================================================================


// 1. FETCH COMMANDS ONLY (Clean GET method)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase(); 

        const { data: commands, error } = await supabase
            .from("bot_commands")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedCommands = commands?.map(cmd => ({
            id: cmd.id,
            command: cmd.command,
            description: cmd.description,
            action: cmd.action,
            isActive: cmd.is_active !== false 
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
            
            await syncTelegramMenu(safeEmail); // 🚀 AUTO-SYNC
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: DELETE SINGLE COMMAND
        if (body.action === 'delete_command') {
            const { error } = await supabase.from("bot_commands")
                .delete()
                .eq("id", body.commandId)
                .eq("email", safeEmail);
            if (error) throw error;
            
            await syncTelegramMenu(safeEmail); // 🚀 AUTO-SYNC
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: CLEAR ALL COMMANDS (Nuke Button)
        if (body.action === 'clear_all_commands') {
            const { error } = await supabase.from("bot_commands")
                .delete()
                .eq("email", safeEmail)
                .eq("platform", "telegram");
            if (error) throw error;
            
            await syncTelegramMenu(safeEmail); // 🚀 AUTO-SYNC
            return NextResponse.json({ success: true });
        }

        // 👉 ACTION: TOGGLE ACTIVE/INACTIVE
        if (body.action === 'toggle_command_rule') {
            const { error } = await supabase.from("bot_commands")
                .update({ is_active: body.isActive })
                .eq("id", body.commandId)
                .eq("email", safeEmail);
            if (error) throw error;
            
            await syncTelegramMenu(safeEmail); // 🚀 AUTO-SYNC
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Invalid Action Provided" }, { status: 400 });

    } catch (error: any) {
        console.error("[BOT_CONFIG_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}