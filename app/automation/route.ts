import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 1. GET: FETCH REAL RULES FROM DATABASE
// =========================================================================
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel");

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();
        const safeChannel = channel.toLowerCase();

        const { data, error } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", safeChannel);

        if (error) throw error;

        let rules: any[] = [];
        let globalSettings = { welcomeMsg: false, awayMsg: false, businessHours: false };

        // 🧠 Smart Parser: Alag-alag karo ki kaunsa Global rule hai aur kaunsa Keyword rule
        data?.forEach(row => {
            if (row.match_type === 'global') {
                if (row.keyword === 'welcomeMsg') globalSettings.welcomeMsg = row.content === 'true';
                if (row.keyword === 'awayMsg') globalSettings.awayMsg = row.content === 'true';
                if (row.keyword === 'businessHours') globalSettings.businessHours = row.content === 'true';
            } else {
                rules.push({
                    id: row.id,
                    keyword: row.keyword,
                    matchType: row.match_type,
                    actionType: row.action_type,
                    content: row.content
                });
            }
        });

        return NextResponse.json({ success: true, rules, globalSettings });

    } catch (error: any) {
        console.error("[AUTOMATION_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// =========================================================================
// 2. POST: SYNC & SAVE RULES TO DATABASE
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 🚀 FIX: Catch exact variables from frontend!
        const { email, channel, rules, globalSettings } = body;

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();
        const safeChannel = channel.toLowerCase();

        // 🧹 STEP 1: Pehle is email + channel ke saare purane rules delete karo (Clean slate)
        const { error: deleteErr } = await supabase
            .from("automation_rules")
            .delete()
            .eq("email", safeEmail)
            .eq("platform", safeChannel);

        if (deleteErr) throw deleteErr;

        // 📦 STEP 2: Naye rules prepare karo (Bulk Insert format)
        const rowsToInsert: any[] = [];

        // A. Save Global Settings
        if (globalSettings) {
            rowsToInsert.push({ email: safeEmail, platform: safeChannel, match_type: 'global', keyword: 'welcomeMsg', content: String(globalSettings.welcomeMsg) });
            rowsToInsert.push({ email: safeEmail, platform: safeChannel, match_type: 'global', keyword: 'awayMsg', content: String(globalSettings.awayMsg) });
            rowsToInsert.push({ email: safeEmail, platform: safeChannel, match_type: 'global', keyword: 'businessHours', content: String(globalSettings.businessHours) });
        }

        // B. Save Keyword Rules
        if (rules && Array.isArray(rules)) {
            rules.forEach((r: any) => {
                rowsToInsert.push({
                    email: safeEmail,
                    platform: safeChannel,
                    keyword: r.keyword,
                    match_type: r.matchType,
                    action_type: r.actionType,
                    content: r.content
                });
            });
        }

        // 💥 STEP 3: Push to Supabase Real Database
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