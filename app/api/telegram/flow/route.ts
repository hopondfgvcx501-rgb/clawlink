/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: MULTI-FLOW CRUD API
 * ==============================================================================================
 * @file app/api/telegram/flow/route.ts
 * @description Master API to permanently Save, Fetch, Update & Delete Multiple Flows.
 * 🚀 UPGRADED: Now auto-syncs triggers to the Telegram UI Menu Command List!
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 🚀 HELPER: AUTO-SYNC COMMANDS WITH TELEGRAM UI MENU
// ============================================================================
async function syncTelegramMenu(email: string) {
    try {
        const { data: config } = await supabaseAdmin.from("user_configs").select("telegram_token").eq("email", email.toLowerCase()).single();
        if (!config || !config.telegram_token) return;

        // Fetch flows that have a trigger starting with "/"
        const { data: flows } = await supabaseAdmin.from("telegram_flows")
            .select("flow_name, trigger_keyword")
            .eq("email", email.toLowerCase())
            .eq("is_active", true);

        const tgCommands = (flows || [])
            .filter(f => f.trigger_keyword && f.trigger_keyword.startsWith('/'))
            .map(f => ({
                command: f.trigger_keyword.replace(/^\//, '').toLowerCase().substring(0, 32),
                description: f.flow_name.substring(0, 256) || "Trigger this visual flow"
            }));

        if (tgCommands.length > 0) {
            const tgUrl = `https://api.telegram.org/bot${config.telegram_token}/setMyCommands`;
            await fetch(tgUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commands: tgCommands })
            });
        }
    } catch (e) {
        console.error("[SYNC_EXCEPTION]", e);
    }
}

// 🚀 GET: Fetch Flow Data (Supports Single Flow or All Flows List)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const flowId = searchParams.get("flowId"); // If present, fetch single flow

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        if (flowId) {
            const { data, error } = await supabaseAdmin.from("telegram_flows").select("*").eq("id", flowId).eq("email", email.toLowerCase()).single();
            if (error) throw error;
            return NextResponse.json({ success: true, data });
        } else {
            const { data, error } = await supabaseAdmin.from("telegram_flows").select("id, flow_name, trigger_keyword, is_active").eq("email", email.toLowerCase()).order("created_at", { ascending: false });
            if (error) throw error;
            return NextResponse.json({ success: true, flows: data });
        }
    } catch (error: any) {
        console.error("[FLOW_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 POST: Create or Update a Flow from Canvas
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, flowId, flowName, triggerKeyword, nodes, edges } = body;

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        if (flowId) {
            // Update Existing Flow
            const { error } = await supabaseAdmin.from("telegram_flows").update({ 
                flow_name: flowName, trigger_keyword: triggerKeyword, nodes, edges, updated_at: new Date().toISOString() 
            }).eq("id", flowId).eq("email", email.toLowerCase());
            if (error) throw error;
        } else {
            // Create New Flow
            const { error } = await supabaseAdmin.from("telegram_flows").insert({ 
                email: email.toLowerCase(), flow_name: flowName || "Untitled Flow", trigger_keyword: triggerKeyword, nodes, edges 
            });
            if (error) throw error;
        }

        // Auto Sync with Telegram UI Menu
        await syncTelegramMenu(email);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[FLOW_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// 🚀 DELETE: Remove a specific Flow
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const flowId = searchParams.get("flowId");

        if (!email || !flowId) return NextResponse.json({ success: false, error: "Unauthorized or missing parameters" }, { status: 401 });

        const { error } = await supabaseAdmin.from("telegram_flows").delete().eq("id", flowId).eq("email", email.toLowerCase());
        if (error) throw error;

        await syncTelegramMenu(email); // Re-sync menu after deletion
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}