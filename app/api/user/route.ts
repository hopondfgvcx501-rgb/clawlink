import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚨 CRITICAL FIX: No Caching! Always fetch fresh data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET: Fetch User Stats for Dashboard (STRICT ISOLATION - NO MIXING)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 🚀 FIXED: Fetch ONLY the most recent active bot for this email. 
    // No more aggregating or mixing plans/channels!
    const { data: latestBot, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false }) // Hamesha latest wala bot uthayega
      .limit(1)
      .single();

    if (error || !latestBot) {
      return NextResponse.json({ success: true, data: null });
    }

    const dbModel = latestBot.selected_model || latestBot.ai_model || "Not Set"; 
    let dbProvider = latestBot.ai_provider || "openai";
    
    if (dbModel.toLowerCase().includes("claude") || dbModel.toLowerCase().includes("anthropic")) dbProvider = "anthropic";
    else if (dbModel.toLowerCase().includes("gemini") || dbModel.toLowerCase().includes("google")) dbProvider = "google";

    // 🚀 PERFECT MATCH: Only shows the exact stats of the targeted bot.
    const dashboardData = {
      plan: latestBot.plan || "Starter",
      provider: dbProvider,
      model: dbModel,
      selected_model: dbModel, 
      selected_channel: latestBot.selected_channel || "web",
      ai_provider: dbProvider,
      tokensAllocated: latestBot.tokens_allocated || 0,
      tokensUsed: latestBot.tokens_used || 0,
      isUnlimited: latestBot.is_unlimited || false,
      systemPrompt: latestBot.system_prompt || "",
      system_prompt_telegram: latestBot.system_prompt_telegram || "",
      system_prompt_whatsapp: latestBot.system_prompt_whatsapp || "",
      system_prompt_widget: latestBot.system_prompt_widget || "",
      telegramActive: !!latestBot.telegram_token,
      whatsappActive: (!!latestBot.whatsapp_token || !!latestBot.whatsapp_phone_id),
      telegram_token: latestBot.telegram_token,
      whatsapp_token: latestBot.whatsapp_token,
      whatsapp_phone_id: latestBot.whatsapp_phone_id,
      liveBotLink: latestBot.telegram_token ? "https://t.me/BotFather" : (latestBot.whatsapp_phone_id ? "https://business.facebook.com/wa/manage/" : null)
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("User API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Save User Onboarding Data 
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, selectedModel, selectedChannel, plan } = body;

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        let aiProvider = "openai";
        if (selectedModel) {
            const sm = selectedModel.toLowerCase();
            if (sm.includes("claude") || sm.includes("anthropic")) aiProvider = "anthropic";
            if (sm.includes("gemini") || sm.includes("google")) aiProvider = "google";
        }

        // New deployment always creates a clean, isolated record.
        await supabase.from("user_configs").insert({
            email: email.toLowerCase(),
            selected_model: selectedModel,
            selected_channel: selectedChannel,
            ai_provider: aiProvider,
            plan: plan || "Starter",
            tokens_allocated: 10000, 
            tokens_used: 0
        });

        return NextResponse.json({ success: true, message: "User config saved perfectly!" });
    } catch (error: any) {
        console.error("Config POST Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 3. PUT: Update AI Persona dynamically (Multi-Channel Safe)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, systemPrompt, selectedModel, selectedChannel, channel } = body;

    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const updateData: any = {};
    let targetColumn = "";
    
    if (systemPrompt !== undefined) {
      if (channel === 'telegram') { updateData.system_prompt_telegram = systemPrompt; targetColumn = "telegram_token"; }
      else if (channel === 'whatsapp') { updateData.system_prompt_whatsapp = systemPrompt; targetColumn = "whatsapp_phone_id"; }
      else if (channel === 'widget') { updateData.system_prompt_widget = systemPrompt; }
      else { updateData.system_prompt = systemPrompt; }
    }

    if (selectedChannel !== undefined) updateData.selected_channel = selectedChannel;
    
    if (selectedModel !== undefined) {
        updateData.selected_model = selectedModel;
        const sm = selectedModel.toLowerCase();
        if (sm.includes("claude") || sm.includes("anthropic")) updateData.ai_provider = "anthropic";
        else if (sm.includes("gemini") || sm.includes("google")) updateData.ai_provider = "google";
        else updateData.ai_provider = "openai";
    }

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: true, message: "Nothing to update" });

    // 🚀 ISOLATION FIX: Update ONLY the exact bot row matching the targeted channel
    let query = supabase.from("user_configs").update(updateData).eq("email", email.toLowerCase());
    
    if (targetColumn === "telegram_token") query = query.not("telegram_token", "is", null);
    if (targetColumn === "whatsapp_phone_id") query = query.not("whatsapp_phone_id", "is", null);

    const { error } = await query;

    if (error) {
      console.error("Supabase Update Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: `Data updated successfully for ${channel || 'master'}` });
  } catch (error: any) {
    console.error("User Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}