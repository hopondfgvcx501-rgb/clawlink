/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP AUTOMATION API
 * ==============================================================================================
 * @description Syncs UI Keyword Routing and Global Rules (Welcome/Away) with the Real DB.
 * Mapped to Webhook-compatible columns (trigger_keyword, response_text).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 ISOLATED WHATSAPP GET API
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        const { data: rules, error } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "whatsapp"); // Strictly WhatsApp Isolation

        if (error) {
            console.error("[AUTOMATION_GET_DB_ERROR]", error);
            throw error;
        }

        let formattedRules: any[] = [];
        let globalSettings = { welcomeMsg: false, awayMsg: false, businessHours: false };

        if (rules) {
            rules.forEach(row => {
                // Map DB columns back to UI state
                if (row.match_type === 'global') {
                    if (row.trigger_keyword === 'welcomeMsg') globalSettings.welcomeMsg = (row.response_text === 'true');
                    if (row.trigger_keyword === 'awayMsg') globalSettings.awayMsg = (row.response_text === 'true');
                    if (row.trigger_keyword === 'businessHours') globalSettings.businessHours = (row.response_text === 'true');
                } else {
                    formattedRules.push({
                        id: row.id, 
                        keyword: row.trigger_keyword, // Sent to UI as 'keyword'
                        matchType: row.match_type, 
                        actionType: row.action_type, 
                        content: row.response_text // Sent to UI as 'content'
                    });
                }
            });
        }

        return NextResponse.json({ success: true, rules: formattedRules, globalSettings });
    } catch (error: any) {
        console.error("[AUTOMATION_GET_FATAL]", error);
        return NextResponse.json({ success: false, error: "Server Error Fetching Rules" }, { status: 500 });
    }
}

// 🚀 ISOLATED WHATSAPP POST API
export async function POST(req: Request) {
    try {
        const { email, rules = [], globalSettings = {} } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Missing identity parameters" }, { status: 400 });

        const safeEmail = email.toLowerCase();

        // Wipe old WA rules only for this tenant
        const { error: deleteErr } = await supabase
            .from("automation_rules")
            .delete()
            .eq("email", safeEmail)
            .eq("platform", "whatsapp");
            
        if (deleteErr) {
            console.error("[AUTOMATION_DELETE_ERROR]", deleteErr);
            throw deleteErr;
        }

        const rowsToInsert: any[] = [];

        const wMsg = globalSettings.welcomeMsg ? 'true' : 'false';
        const aMsg = globalSettings.awayMsg ? 'true' : 'false';
        const bHrs = globalSettings.businessHours ? 'true' : 'false';

        // 🔥 GLOBAL RULES (Mapped to webhook expected schema)
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', trigger_keyword: 'welcomeMsg', response_text: wMsg, is_active: true });
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', trigger_keyword: 'awayMsg', response_text: aMsg, is_active: true });
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', trigger_keyword: 'businessHours', response_text: bHrs, is_active: true });

        // 🔥 KEYWORD ROUTING RULES
        if (Array.isArray(rules)) {
            rules.forEach((r: any) => {
                if (r.keyword && r.content) {
                    rowsToInsert.push({
                        email: safeEmail, 
                        platform: "whatsapp", 
                        trigger_keyword: r.keyword.toLowerCase(), // Maps to Webhook expectation
                        match_type: r.matchType || 'contains', 
                        action_type: r.actionType || 'text', 
                        response_text: r.content, // Maps to Webhook expectation
                        is_active: true
                    });
                }
            });
        }

        if (rowsToInsert.length > 0) {
            const { error: insertErr } = await supabase.from("automation_rules").insert(rowsToInsert);
            if (insertErr) {
                console.error("[AUTOMATION_INSERT_ERROR]", insertErr);
                throw insertErr;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[AUTOMATION_POST_FATAL]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}