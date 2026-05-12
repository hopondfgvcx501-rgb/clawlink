/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM FLOW API
 * ==============================================================================================
 * @file app/api/telegram/flow/route.ts
 * @description Master API to permanently Save & Fetch Flow Builder nodes from Real DB.
 * 🚀 FIXED: Directly targets 'telegram_flow_data' in 'user_configs' for Webhook sync.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch Flow Data on Page Load (Fixes the refresh disappearing bug)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabaseAdmin
            .from("user_configs")
            .select("telegram_flow_data")
            .eq("email", email.toLowerCase())
            .single();

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            data: data?.telegram_flow_data || { nodes: [], edges: [] } 
        });

    } catch (error: any) {
        console.error("[FLOW_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 POST: Save Flow Data from Canvas (Locks to DB)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, nodes, edges } = body;

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Save directly to user_configs so Webhook can read it instantly
        const { error } = await supabaseAdmin
            .from("user_configs")
            .update({ 
                telegram_flow_data: { nodes, edges } 
            })
            .eq("email", email.toLowerCase());

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[FLOW_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}