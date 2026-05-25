/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP FLOW BACKEND API
 * ==============================================================================================
 * @description Handles saving visual flow data and compiling it into Meta Graph API 
 * compatible JSON payloads. Integrated with the centralized Omni-Channel Alert Matrix.
 * 🚀 FIXED: Aggressively bypassed 23502 DB constraint by feeding dual columns with Titanium Fallbacks.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dispatchAdminAlert } from "../../../lib/monitoring/adminAlert";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
        const body = await req.json();
        const { email, nodes, edges, keyword, responsePayload } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Authentication identity missing." }, { status: 400 });
        }
        
        extractedEmail = email;
        const cleanEmail = email.toLowerCase().trim();

        // 1. SAVE THE VISUAL GRAPH DATA
        if (nodes && edges) {
            const flowData = { nodes: nodes, edges: edges };
            const { error: configErr } = await supabase
                .from("user_configs")
                .update({ whatsapp_flow_data: flowData })
                .eq("email", cleanEmail);

            if (configErr) throw configErr;
        }

        // 2. COMPILE & SAVE TO AUTOMATION ENGINE FOR WEBHOOK
        if (keyword && responsePayload) {
            // 🔥 TITANIUM FALLBACKS: Never allow null/undefined to hit the database
            const rawKeyword = keyword ? String(keyword) : "unnamed_flow_trigger";
            const cleanKeyword = rawKeyword.toLowerCase().trim();
            
            const cleanResponseText = responsePayload?.text ? String(responsePayload.text) : "Interactive Flow Payload";
            const cleanActionType = responsePayload?.type ? String(responsePayload.type) : "flow";

            // Wipe existing rule for this exact keyword and tenant
            await supabase
                .from("automation_rules")
                .delete()
                .eq("email", cleanEmail)
                .eq("platform", "whatsapp")
                .eq("trigger_keyword", cleanKeyword);
                
            // Insert compiled logic into automation_rules (bypassing 23502 NOT NULL)
            const { error: ruleErr } = await supabase
                .from("automation_rules")
                .insert({
                    email: cleanEmail,
                    platform: "whatsapp",
                    match_type: "exact", // Flows usually trigger on exact keyword matches
                    action_type: cleanActionType,
                    is_active: true,
                    // Dual Column Feeding with guaranteed strings for Database Constraint Safety
                    keyword: cleanKeyword,
                    content: cleanResponseText,
                    trigger_keyword: cleanKeyword,
                    response_text: cleanResponseText,
                    response_payload: responsePayload
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