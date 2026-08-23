import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch Rules & God-Mode Settings for the Dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const channel = searchParams.get("channel") || "instagram";

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // 1. Fetch User Settings (Story Mentions, Auto-Like)
    const { data: configData, error: configError } = await supabase
      .from("user_configs")
      .select("story_mention_enabled")
      .eq("email", email)
      .single();

    // 2. Fetch Automation Rules (Funnels + God Mode Toggles)
    const { data: rulesData, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("email", email)
      .eq("platform", channel)
      .order("created_at", { ascending: false });

    if (rulesError) {
      console.error("[API_GET_AUTOMATION] DB Error:", rulesError);
      return NextResponse.json({ success: false, error: rulesError.message }, { status: 500 });
    }

    // Map DB columns back to Frontend state variables
    const formattedRules = (rulesData || []).map((rule: any) => ({
      id: rule.id,
      keyword: rule.keyword || "",
      postType: rule.type || "Comment on Any Post",
      publicReply: rule.public_reply || "",
      dmContent: rule.content || "",
      trigger_on_comment: rule.trigger_on_comment !== false, // Default true
      trigger_on_dm: rule.trigger_on_dm === true,            // Default false
      ai_handover: rule.ai_handover !== false,               // Default true
      isActive: rule.is_active !== false
    }));

    return NextResponse.json({
      success: true,
      rules: formattedRules,
      settings: {
        storyMentions: configData?.story_mention_enabled || false,
        autoLikeComments: true, // Placeholder for future DB integration
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("[API_GET_AUTOMATION] Catch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🚀 POST: Save New Rules & God-Mode Settings from Dashboard to Database
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, channel, rules, settings } = body;

    if (!email || !channel || !rules) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Save Global Settings to user_configs (e.g., Story Mention)
    if (settings) {
      await supabase
        .from("user_configs")
        .update({ 
          story_mention_enabled: settings.storyMentions === true 
        })
        .eq("email", email);
    }

    // 2. Prepare Rules for Database Injection (Mapping Frontend to DB Columns)
    const formattedRulesForDB = rules.map((r: any) => ({
      email: email,
      platform: channel,
      keyword: r.keyword,
      type: r.postType,
      public_reply: r.publicReply,
      content: r.dmContent, // This is the secret DM
      trigger_on_comment: r.trigger_on_comment !== false,
      trigger_on_dm: r.trigger_on_dm === true,
      ai_handover: r.ai_handover !== false,
      is_active: r.isActive !== false,
      updated_at: new Date().toISOString()
    }));

    // 3. Clear old rules for this channel to ensure a clean sync
    const { error: deleteError } = await supabase
      .from("automation_rules")
      .delete()
      .eq("email", email)
      .eq("platform", channel);

    if (deleteError) {
      throw new Error(`Failed to clear old rules: ${deleteError.message}`);
    }

    // 4. Insert the new God-Mode rules
    if (formattedRulesForDB.length > 0) {
      const { error: insertError } = await supabase
        .from("automation_rules")
        .insert(formattedRulesForDB);

      if (insertError) {
        throw new Error(`Failed to save new rules: ${insertError.message}`);
      }
    }

    return NextResponse.json({ success: true, message: "God-Mode Funnels synced successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("[API_POST_AUTOMATION] Catch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}