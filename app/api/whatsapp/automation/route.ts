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
            .eq("platform", "whatsapp"); // Strictly WhatsApp

        if (error) throw error;

        let formattedRules: any[] = [];
        let globalSettings = { welcomeMsg: false, awayMsg: false, businessHours: false };

        if (rules) {
            rules.forEach(row => {
                if (row.match_type === 'global') {
                    if (row.keyword === 'welcomeMsg') globalSettings.welcomeMsg = (row.content === 'true');
                    if (row.keyword === 'awayMsg') globalSettings.awayMsg = (row.content === 'true');
                    if (row.keyword === 'businessHours') globalSettings.businessHours = (row.content === 'true');
                } else {
                    formattedRules.push({
                        id: row.id, keyword: row.keyword, matchType: row.match_type, actionType: row.action_type, content: row.content
                    });
                }
            });
        }

        return NextResponse.json({ success: true, rules: formattedRules, globalSettings });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 ISOLATED WHATSAPP POST API
export async function POST(req: Request) {
    try {
        const { email, rules = [], globalSettings = {} } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        const safeEmail = email.toLowerCase();

        // Wipe old WA rules only
        await supabase.from("automation_rules").delete().eq("email", safeEmail).eq("platform", "whatsapp");

        const rowsToInsert: any[] = [];

        const wMsg = globalSettings.welcomeMsg ? 'true' : 'false';
        const aMsg = globalSettings.awayMsg ? 'true' : 'false';
        const bHrs = globalSettings.businessHours ? 'true' : 'false';

        // 🔥 FIXED: Added action_type: 'system' to stop the DB constraint error!
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', keyword: 'welcomeMsg', content: wMsg });
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', keyword: 'awayMsg', content: aMsg });
        rowsToInsert.push({ email: safeEmail, platform: "whatsapp", match_type: 'global', action_type: 'system', keyword: 'businessHours', content: bHrs });

        if (Array.isArray(rules)) {
            rules.forEach((r: any) => {
                if (r.keyword && r.content) {
                    rowsToInsert.push({
                        email: safeEmail, platform: "whatsapp", keyword: r.keyword, match_type: r.matchType || 'contains', action_type: r.actionType || 'text', content: r.content
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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}