import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 1. GET: FETCH REAL RULES FROM DATABASE (Supports Telegram & WA)
// =========================================================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel") || "telegram"; // Default to telegram if missing

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        // 🚀 1. Fetch Global Settings from user_configs
        const { data: config } = await supabase
            .from("user_configs")
            .select("welcome_message_active, ai_fallback_active")
            .eq("email", safeEmail)
            .single();

        // 🚀 2. Fetch Automation Rules for this channel
        const { data: rules } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", channel);

        let formattedRules: any[] = [];
        
        // Match UI State format
        let globalSettings = { 
            welcomeMsg: config?.welcome_message_active ?? true, 
            awayMsg: false, 
            businessHours: false,
            aiFallback: config?.ai_fallback_active ?? true
        };

        // 🧠 SMART PARSER: Channel-specific settings
        if (rules) {
            rules.forEach(row => {
                if (row.match_type === 'global') {
                    if (row.keyword === 'awayMsg') globalSettings.awayMsg = (row.content === 'true');
                    if (row.keyword === 'businessHours') globalSettings.businessHours = (row.content === 'true');
                } else {
                    formattedRules.push({
                        id: row.id,
                        keyword: row.keyword,
                        matchType: row.match_type,
                        actionType: row.action_type,
                        content: row.content
                    });
                }
            });
        }

        return NextResponse.json({ success: true, rules: formattedRules, globalSettings });

    } catch (error: any) {
        console.error("[AUTOMATION_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// =========================================================================
// 2. POST: SYNC & SAVE REAL RULES (Prevents DB Constraint Crashes)
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const { email, channel, rules = [], globalSettings = {}, settings = {} } = body;

        if (!email || !channel) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        const safeEmail = email.toLowerCase();

        // 🧠 UI MISMATCH HANDLER
        const welcomeActive = globalSettings.welcomeMsg ?? settings.welcomeMessage ?? false;
        const aiFallbackActive = globalSettings.aiFallback ?? settings.defaultFallback ?? true;

        // A. Update Global Settings in user_configs (Real DB)
        await supabase
            .from("user_configs")
            .update({ 
                welcome_message_active: welcomeActive,
                ai_fallback_active: aiFallbackActive
            })
            .eq("email", safeEmail);

        // B. Wipe old rules for THIS channel ONLY
        await supabase.from("automation_rules").delete().eq("email", safeEmail).eq("platform", channel);

        const rowsToInsert: any[] = [];

        // C. Save Channel Specific Toggles (Away, Business Hours)
        const aMsg = globalSettings.awayMsg ? 'true' : 'false';
        const bHrs = globalSettings.businessHours ? 'true' : 'false';

        // 🔥 CRITICAL FIX: Added 'action_type' to satisfy the NOT NULL database constraint!
        rowsToInsert.push({ email: safeEmail, platform: channel, match_type: 'global', action_type: 'system', keyword: 'awayMsg', content: aMsg });
        rowsToInsert.push({ email: safeEmail, platform: channel, match_type: 'global', action_type: 'system', keyword: 'businessHours', content: bHrs });

        // D. Save Keyword Rules to Real DB
        if (Array.isArray(rules)) {
            rules.forEach((r: any) => {
                if (r.keyword && r.content) {
                    rowsToInsert.push({
                        email: safeEmail,
                        platform: channel,
                        keyword: r.keyword,
                        match_type: r.matchType || 'contains',
                        action_type: r.actionType || 'text', // Ensuring this is never null
                        content: r.content
                    });
                }
            });
        }

        if (rowsToInsert.length > 0) {
            const { error: insertErr } = await supabase.from("automation_rules").insert(rowsToInsert);
            if (insertErr) throw insertErr;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[AUTOMATION_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}