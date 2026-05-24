/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP AUTOMATION API
 * ==============================================================================================
 * @description Syncs UI Keyword Routing and Global Rules (Welcome/Away) with the Real DB.
 * 🚀 FIXED: Bypasses Postgres 23502 (NOT NULL) constraint by feeding both legacy and new columns.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 ISOLATED WHATSAPP GET API (Fetches real data for Dashboard UI)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        // 🛡️ Tenant Isolation: Only fetch rules for this specific user
        const { data: rules, error } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "whatsapp");

        if (error) {
            console.error("[AUTOMATION_GET_DB_ERROR]", error);
            throw error;
        }

        let formattedRules: any[] = [];
        let globalSettings = { 
            welcomeMsg: false, welcomeMsgText: "",
            awayMsg: false, awayMsgText: "",
            businessHours: false 
        };

        if (rules) {
            rules.forEach(row => {
                // Determine the correct keys based on what the DB returned (handling both legacy and new schema)
                const currentKeyword = row.trigger_keyword || row.keyword;
                const currentContent = row.response_text || row.content;

                if (row.match_type === 'global') {
                    if (currentKeyword === 'welcomeMsg') {
                        globalSettings.welcomeMsg = (row.is_active === true);
                        globalSettings.welcomeMsgText = currentContent !== 'true' && currentContent !== 'false' ? currentContent : "";
                    }
                    if (currentKeyword === 'awayMsg') {
                         globalSettings.awayMsg = (row.is_active === true);
                         globalSettings.awayMsgText = currentContent !== 'true' && currentContent !== 'false' ? currentContent : "";
                    }
                    if (currentKeyword === 'businessHours') {
                        globalSettings.businessHours = (row.is_active === true);
                    }
                } else {
                    // Map Custom Keyword Rules for the UI list
                    formattedRules.push({
                        id: row.id, 
                        keyword: currentKeyword, 
                        matchType: row.match_type, 
                        actionType: row.action_type, 
                        content: currentContent 
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

// 🚀 ISOLATED WHATSAPP POST API (Saves UI data directly to Webhook-ready DB without crashing)
export async function POST(req: Request) {
    try {
        const { email, rules = [], globalSettings = {} } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Missing identity parameters" }, { status: 400 });

        const safeEmail = email.toLowerCase();

        // 🗑️ Wipe old WA rules ONLY for this tenant to avoid duplicates on save/delete
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

        // 🔥 GLOBAL RULES (Mapped to Webhook)
        const wMsgContent = globalSettings.welcomeMsgText ? globalSettings.welcomeMsgText : 'true';
        const aMsgContent = globalSettings.awayMsgText ? globalSettings.awayMsgText : 'true';
        
        const wMsgActive = !!globalSettings.welcomeMsg;
        const aMsgActive = !!globalSettings.awayMsg;
        const bHrsActive = !!globalSettings.businessHours;

        // CRITICAL FIX: Feeding both 'keyword' and 'trigger_keyword' to bypass the 23502 NOT NULL constraint
        rowsToInsert.push({ 
            email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', is_active: wMsgActive,
            keyword: 'welcomeMsg', content: wMsgContent, 
            trigger_keyword: 'welcomeMsg', response_text: wMsgContent 
        });
        
        rowsToInsert.push({ 
            email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', is_active: aMsgActive,
            keyword: 'awayMsg', content: aMsgContent, 
            trigger_keyword: 'awayMsg', response_text: aMsgContent 
        });
        
        rowsToInsert.push({ 
            email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', is_active: bHrsActive,
            keyword: 'businessHours', content: 'true', 
            trigger_keyword: 'businessHours', response_text: 'true' 
        });

        // 🔥 KEYWORD ROUTING RULES (UI to DB Translation)
        if (Array.isArray(rules)) {
            rules.forEach((r: any) => {
                if (r.keyword && r.content) {
                    rowsToInsert.push({
                        email: safeEmail, 
                        platform: "whatsapp", 
                        match_type: r.matchType || 'contains', 
                        action_type: r.actionType || 'text', 
                        is_active: true,
                        // Feed both sets of columns to keep DB happy and Webhook functional
                        keyword: r.keyword.toLowerCase(), 
                        content: r.content,
                        trigger_keyword: r.keyword.toLowerCase(), 
                        response_text: r.content 
                    });
                }
            });
        }

        if (rowsToInsert.length > 0) {
            // Bulk insert all new/updated rules into the database
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