import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚨 CRITICAL FIX: No Caching! Always fetch fresh data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET: Fetch User Stats for Dashboard (SMART FILTERING)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all records for the email
    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // 🚀 FILTER THE BUG: Ignore blank/auto-generated onboarding rows. Only check real bots.
    let validBots = data.filter(bot => 
        (bot.ai_model && bot.ai_model !== "Not Set") || 
        bot.telegram_token || 
        bot.whatsapp_phone_id || 
        bot.plan === "max" || bot.plan === "pro" || bot.plan === "monthly" || bot.plan === "yearly"
    );

    // If somehow all are blank, fallback to data[0]
    if (validBots.length === 0) validBots = [data[0]];

    let highestPlan = "Starter";
    let bestModel = "Not Set";
    let bestProvider = "openai";
    let isUnlimited = false;
    let totalAllocated = 0;
    let totalUsed = 0;
    let activeTelegram = false;
    let activeWhatsapp = false;
    let tgToken = null;
    let waToken = null;
    let waPhoneId = null;

    // Scan through valid bots to find the true power of this user
    for (const bot of validBots) {
        totalAllocated += (bot.tokens_allocated || 0);
        totalUsed += (bot.tokens_used || 0);

        const bPlan = (bot.plan || "").toLowerCase();
        if (bPlan === "max" || bPlan === "yearly" || bPlan === "monthly" || bPlan === "ultra-premium" || bot.is_unlimited) {
            isUnlimited = true;
            highestPlan = bot.plan;
        } else if (bPlan === "pro" && highestPlan !== "max" && highestPlan !== "yearly" && highestPlan !== "monthly") {
            highestPlan = bot.plan;
        }

        if (bot.ai_model && bot.ai_model !== "Not Set") {
            if (bestModel === "Not Set" || bot.ai_model === "multi_model") {
                bestModel = bot.ai_model;
                bestProvider = bot.ai_provider || "openai";
            }
        }

        if (bot.telegram_token) { activeTelegram = true; tgToken = bot.telegram_token; }
        if (bot.whatsapp_phone_id || bot.whatsapp_token) { activeWhatsapp = true; waToken = bot.whatsapp_token; waPhoneId = bot.whatsapp_phone_id; }
    }

    if (bestModel.toLowerCase().includes("claude") || bestModel.toLowerCase().includes("anthropic")) bestProvider = "anthropic";
    else if (bestModel.toLowerCase().includes("gemini") || bestModel.toLowerCase().includes("google")) bestProvider = "google";

    const dashboardData = {
      plan: highestPlan,
      provider: bestProvider,
      model: bestModel,
      selected_model: bestModel, 
      selected_channel: activeTelegram ? "telegram" : (activeWhatsapp ? "whatsapp" : "web"),
      ai_provider: bestProvider,
      tokensAllocated: isUnlimited ? 9999999 : totalAllocated,
      tokensUsed: totalUsed,
      isUnlimited: isUnlimited,
      systemPrompt: validBots[0].system_prompt || "",
      system_prompt_telegram: validBots[0].system_prompt_telegram || "",
      system_prompt_whatsapp: validBots[0].system_prompt_whatsapp || "",
      system_prompt_widget: validBots[0].system_prompt_widget || "",
      telegramActive: activeTelegram,
      whatsappActive: activeWhatsapp,
      telegram_token: tgToken,
      whatsapp_token: waToken,
      whatsapp_phone_id: waPhoneId,
      liveBotLink: activeTelegram ? "https://t.me/BotFather" : (activeWhatsapp ? "https://business.facebook.com/wa/manage/" : null)
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("User API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Save User Onboarding Data (PREVENT BLANK ROW BUG)
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

        // 🚀 FIXED: Check if user already exists to prevent blank spam rows!
        const { data: existingUser } = await supabase
            .from("user_configs")
            .select("id")
            .eq("email", email.toLowerCase())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (existingUser) {
            // Update the existing latest record instead of creating a useless blank row
            await supabase.from("user_configs").update({
                selected_model: selectedModel || undefined,
                selected_channel: selectedChannel || undefined,
                ai_provider: selectedModel ? aiProvider : undefined,
                plan: plan || undefined
            }).eq("id", existingUser.id);
        } else {
            // Only insert if it's a completely brand new user
            await supabase.from("user_configs").insert({
                email: email.toLowerCase(),
                selected_model: selectedModel,
                selected_channel: selectedChannel,
                ai_provider: aiProvider,
                plan: plan || "Starter",
                tokens_allocated: 10000, 
                tokens_used: 0
            });
        }

        return NextResponse.json({ success: true, message: "User config saved perfectly!" });
    } catch (error: any) {
        console.error("Config POST Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 3. PUT: Update AI Persona dynamically
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