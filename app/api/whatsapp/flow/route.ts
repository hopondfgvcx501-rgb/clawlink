/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP FLOW BACKEND API
 * ==============================================================================================
 * @description Handles saving visual flow data and compiling it into Meta Graph API 
 * compatible JSON payloads. Integrated with the centralized Omni-Channel Alert Matrix.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dispatchAdminAlert } from "../../../lib/monitoring/adminAlert";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Load Flow Builder UI Canvas
export async function GET(req: Request) {
    let extractedEmail = "Unknown";
    
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized request payload." }, { status: 401 });
        }
        
        extractedEmail = email;

        const { data: config, error } = await supabase
            .from("user_configs")
            .select("whatsapp_flow_data")
            .eq("email", email.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error; 

        const flowData = config?.whatsapp_flow_data || { nodes: [], edges: [] };
        return NextResponse.json({ success: true, data: flowData });

    } catch (error: any) {
        console.error("[WA_FLOW_GET_ERROR]:", error);
        
        await dispatchAdminAlert(error.message, {
            module: "WhatsApp Flow Loader",
            channel: "whatsapp",
            userEmail: extractedEmail
        });
        
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// 🚀 POST: The Dual Engine (Save Canvas UI + Compile Meta Webhook Payload)
export async function POST(req: Request) {
    let extractedEmail = "Unknown";
    
    try {
        const { email, nodes, edges, keyword, responsePayload } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, error: "Authentication identity missing." }, { status: 400 });
        }
        
        extractedEmail = email;
        const cleanEmail = email.toLowerCase().trim();

        if (nodes && edges) {
            const flowData = { nodes: nodes, edges: edges };
            const { error: configErr } = await supabase
                .from("user_configs")
                .update({ whatsapp_flow_data: flowData })
                .eq("email", cleanEmail);

            if (configErr) throw configErr;
        }

        if (keyword && responsePayload) {
            const cleanKeyword = keyword.toLowerCase().trim();

            await supabase
                .from("automation_rules")
                .delete()
                .eq("email", cleanEmail)
                .eq("platform", "whatsapp")
                .eq("trigger_keyword", cleanKeyword);
                
            const { error: ruleErr } = await supabase
                .from("automation_rules")
                .insert({
                    email: cleanEmail,
                    platform: "whatsapp",
                    trigger_keyword: cleanKeyword,
                    response_text: responsePayload.text,
                    response_payload: responsePayload,
                    is_active: true
                });

            if (ruleErr) throw ruleErr;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[WA_FLOW_POST_ERROR]:", error);
        
        await dispatchAdminAlert(error.message, {
            module: "WhatsApp Flow Compiler",
            channel: "whatsapp",
            userEmail: extractedEmail
        });
        
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}