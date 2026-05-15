/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM COMMAND ROUTER API
 * ==============================================================================================
 * @file app/api/telegram/commands/route.ts
 * @description Manages Bot Commands and syncs them live with Telegram's setMyCommands API.
 * 🚀 SECURED: Strict DB handling and real-time Telegram Menu Sync.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "", 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", 
    { auth: { persistSession: false } }
);

// Helper function to sync commands directly to Telegram Menu
async function syncTelegramMenu(email: string) {
    try {
        const { data: config } = await supabaseAdmin.from("user_configs").select("telegram_token").eq("email", email.toLowerCase()).single();
        if (!config || !config.telegram_token) return;

        const { data: commands } = await supabaseAdmin.from("bot_commands")
            .select("command, description")
            .eq("email", email.toLowerCase())
            .eq("platform", "telegram")
            .eq("is_active", true);

        // Format for Telegram API (removes leading slash if user added it)
        const tgCommands = (commands || []).map(cmd => ({
            command: cmd.command.replace(/^\//, '').toLowerCase().substring(0, 32),
            description: cmd.description.substring(0, 256)
        }));

        const tgUrl = `https://api.telegram.org/bot${config.telegram_token}/setMyCommands`;
        const res = await fetch(tgUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands: tgCommands.length > 0 ? tgCommands : [] }) // Empty array clears the menu
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[TELEGRAM_SYNC_ERROR]", errText);
        }
    } catch (e: any) {
        console.error("[SYNC_EXCEPTION]", e.message);
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabaseAdmin.from("bot_commands")
            .select("*").eq("email", email.toLowerCase()).eq("platform", "telegram").order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, commands: data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        let { email, command, description, action } = await req.json();
        if (!email || !command || !description || !action) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

        // Auto-format command (ensure it starts with / and has no spaces)
        command = command.trim().toLowerCase();
        if (!command.startsWith('/')) command = '/' + command;
        command = command.replace(/\s+/g, '_');

        const { error } = await supabaseAdmin.from("bot_commands").upsert({
            email: email.toLowerCase(), platform: "telegram", command, description, action, is_active: true
        }, { onConflict: 'email,platform,command' });

        if (error) throw error;

        await syncTelegramMenu(email); // Fire Sync to Telegram
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[COMMAND_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const id = searchParams.get("id");

        if (!email || !id) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        const { error } = await supabaseAdmin.from("bot_commands").delete().eq("id", id).eq("email", email.toLowerCase());
        if (error) throw error;

        await syncTelegramMenu(email); // Re-sync to remove from TG menu
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}