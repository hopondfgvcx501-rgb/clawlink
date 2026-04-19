import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 1. FETCH RULES & GLOBAL SETTINGS
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel") || "telegram";

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // Fetch Global Settings (Welcome Message & AI Fallback)
        const { data: config } = await supabase
            .from("user_configs")
            .select("welcome_message_active, ai_fallback_active")
            .eq("email", safeEmail)
            .single();

        // Fetch Automation Rules for this channel
        const { data: rules } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", channel)
            .order("created_at", { ascending: true });

        // Map DB flags to UI state (Default to true if null)
        const settings = {
            welcomeMessage: config?.welcome_message_active ?? true,
            defaultFallback: config?.ai_fallback_active ?? true,
        };

        // Transform DB schema to match UI interface
        const formattedRules = (rules || []).map(rule => ({
            id: rule.id,
            keyword: rule.keyword,
            matchType: rule.match_type,
            actionType: rule.action_type,
            content: rule.content
        }));

        return NextResponse.json({ 
            success: true, 
            rules: formattedRules, 
            settings: settings 
        });

    } catch (error: any) {
        console.error("[AUTOMATION_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 2. SAVE RULES & GLOBAL SETTINGS (Full Sync)
export async function POST(req: Request) {
    try {
        const { email, channel, rules, settings } = await req.json();

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // A. Update Global Settings in user_configs
        await supabase
            .from("user_configs")
            .update({ 
                welcome_message_active: settings.welcomeMessage,
                ai_fallback_active: settings.defaultFallback
            })
            .eq("email", safeEmail);

        // B. Wipe old rules for this channel to perform a clean sync
        await supabase
            .from("automation_rules")
            .delete()
            .eq("email", safeEmail)
            .eq("platform", channel);

        // C. Insert new/updated rules if any exist
        if (rules && rules.length > 0) {
            const rulesToInsert = rules.map((rule: any) => ({
                email: safeEmail,
                platform: channel,
                keyword: rule.keyword,
                match_type: rule.matchType,
                action_type: rule.actionType,
                content: rule.content
            }));

            const { error: insertError } = await supabase
                .from("automation_rules")
                .insert(rulesToInsert);

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[AUTOMATION_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}