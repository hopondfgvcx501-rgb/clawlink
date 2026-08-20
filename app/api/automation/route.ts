import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: FETCH RULES & GLOBAL SETTINGS
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        // NOTE: In production, use next-auth getToken here. For now, grabbing from query/defaults.
        const email = searchParams.get("email") || "ugjay92@gmail.com"; 
        const channel = searchParams.get("channel") || "instagram";

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // 1. Fetch Global Settings 
        const { data: config } = await supabase
            .from("user_configs")
            .select("welcome_message_active, ai_fallback_active")
            .eq("email", safeEmail)
            .single();

        // 2. Fetch Automation Rules 
        const { data: rules } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", channel)
            .order("created_at", { ascending: true });

        const settings = {
            storyMention: config?.welcome_message_active ?? false,
            autoLike: config?.ai_fallback_active ?? false,
        };

        // 3. Map DB schema to New UI Interface
        const formattedRules = (rules || []).map(rule => ({
            id: rule.id,
            postType: "Any Post or Reel", // Default for UI
            keyword: rule.keyword,
            publicReply: rule.public_reply || "",
            dmContent: rule.content || rule.dm_content,
            isActive: true
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

// 🚀 POST: SAVE/SYNC RULES
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email || "ugjay92@gmail.com"; // Fallback for testing
        const channel = "instagram";
        const safeEmail = email.toLowerCase();

        // MODE 1: Syncing Toggles or Deleting (UI sends { rules, settings })
        if (body.rules && Array.isArray(body.rules)) {
            
            // A. Update Settings
            if (body.settings) {
                await supabase.from("user_configs").update({ 
                    welcome_message_active: body.settings.storyMention,
                    ai_fallback_active: body.settings.autoLike
                }).eq("email", safeEmail);
            }

            // B. Wipe old and insert new array to sync deletions
            await supabase.from("automation_rules").delete().eq("email", safeEmail).eq("platform", channel);

            if (body.rules.length > 0) {
                const rulesToInsert = body.rules.map((rule: any) => ({
                    email: safeEmail,
                    platform: channel,
                    keyword: rule.keyword,
                    match_type: "contains", // 🔥 THE MAGIC FIX
                    action_type: "dm",
                    content: rule.dmContent,
                    public_reply: rule.publicReply
                }));
                const { error } = await supabase.from("automation_rules").insert(rulesToInsert);
                if (error) throw error;
            }
            
            return NextResponse.json({ success: true });
        }
        
        // MODE 2: Adding a Single New Funnel (UI sends { keyword, dmContent, ... })
        if (body.keyword && body.dmContent) {
            const { error } = await supabase.from("automation_rules").insert([{
                email: safeEmail,
                platform: channel,
                keyword: body.keyword,
                match_type: "contains", // 🔥 THE MAGIC FIX
                action_type: "dm",
                content: body.dmContent,
                public_reply: body.publicReply
            }]);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Invalid Payload" }, { status: 400 });

    } catch (error: any) {
        console.error("[AUTOMATION_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}