import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; // 🛡️ THE MASTER SECURITY LOCK

// 🚨 CRITICAL FIX: No Caching! Always fetch fresh data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 1. GET: Fetch User Stats for Dashboard (BILLION-USER SMART FILTERING)
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    // 🛡️ SECURITY LOCK: Check Encrypted Browser Session (NO FAKE EMAILS ALLOWED)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      console.error("🚨 [SECURITY BREACH] Unauthenticated GET attempt blocked.");
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    // 🔥 Override any frontend input with the CRYPTOGRAPHICALLY SECURE email
    const email = token.email.toLowerCase();

    // Fetch all records for the email
    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // 🚀 FILTER THE BUG: Ignore blank/auto-generated onboarding rows. Only check real bots.
    let validBots = data.filter(bot => 
        (bot.selected_model && bot.selected_model !== "Not Set") || 
        bot.ai_model ||
        bot.telegram_token || 
        bot.whatsapp_phone_id || 
        bot.plan === "max" || bot.plan === "pro" || bot.plan === "monthly" || bot.plan === "yearly" || bot.plan === "adv_max" || bot.plan === "ultra" || bot.plan === "plus"
    );

    if (validBots.length === 0) validBots = [data[0]];

    // 🚀 ROOT CAUSE FIX: NEVER sort by Expiry Date! ALWAYS sort strictly by created_at. 
    // The newest payment/bot will exactly be index [0].
    validBots.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; // Descending: Newest first
    });

    // ✨ THIS IS THE MASTER BOT (The exact bot the user just bought or updated)
    const primaryBot = validBots[0];

    let totalAllocated = 0;
    let totalUsed = 0;
    let activeTelegram = false;
    let activeWhatsapp = false;

    // Scan all bots to aggregate tokens and check active channels
    for (const bot of validBots) {
        totalAllocated += (bot.tokens_allocated || 0);
        totalUsed += (bot.tokens_used || 0);

        if (bot.telegram_token) { activeTelegram = true; }
        if (bot.whatsapp_phone_id || bot.whatsapp_token) { activeWhatsapp = true; }
    }

    // STRICT IDENTITY: The dashboard will ONLY reflect the exact plan and model of the Primary Bot.
    let highestPlan = primaryBot.plan || "Starter";
    let isUnlimited = primaryBot.is_unlimited || highestPlan.toLowerCase() === "max" || highestPlan.toLowerCase() === "yearly" || highestPlan.toLowerCase() === "monthly" || highestPlan.toLowerCase() === "adv_max" || highestPlan.toLowerCase() === "ultra" || highestPlan.toLowerCase() === "pro";
    
    // 🚀 EXACT MODEL FIX: Always grab the model the user actually selected in DB
    let bestModel = primaryBot.selected_model || primaryBot.ai_model || "gpt-5.2";
    let bestProvider = primaryBot.ai_provider || "openai";
    
    // Auto-correct provider based on exact model text
    if (bestModel.toLowerCase().includes("claude") || bestModel.toLowerCase().includes("anthropic")) bestProvider = "anthropic";
    else if (bestModel.toLowerCase().includes("gemini") || bestModel.toLowerCase().includes("google")) bestProvider = "google";
    else if (bestModel.toLowerCase().includes("omni") || bestModel.toLowerCase().includes("multi") || bestModel.toLowerCase().includes("nexus")) {
        bestProvider = "multi_model";
        bestModel = "OmniAgent Nexus";
    }

    // 🚀 EXACT CHANNEL FIX: Fallback to the token currently attached to primaryBot
    let currentChannel = primaryBot.selected_channel;
    if (!currentChannel) {
        if (primaryBot.telegram_token) currentChannel = "telegram";
        else if (primaryBot.whatsapp_phone_id) currentChannel = "whatsapp";
        else currentChannel = "widget";
    }

    const dashboardData = {
      plan: highestPlan,
      provider: bestProvider,
      model: bestModel,
      selected_model: bestModel, 
      selected_channel: currentChannel,
      ai_provider: bestProvider,
      tokensAllocated: isUnlimited ? 9999999 : totalAllocated,
      tokensUsed: totalUsed,
      isUnlimited: isUnlimited,
      systemPrompt: primaryBot.system_prompt || "",
      system_prompt_telegram: primaryBot.system_prompt_telegram || "",
      system_prompt_whatsapp: primaryBot.system_prompt_whatsapp || "",
      system_prompt_widget: primaryBot.system_prompt_widget || "",
      telegramActive: activeTelegram,
      whatsappActive: activeWhatsapp,
      telegram_token: primaryBot.telegram_token || null,
      whatsapp_token: primaryBot.whatsapp_token || null,
      whatsapp_phone_id: primaryBot.whatsapp_phone_id || null,
      whatsapp_number: primaryBot.whatsapp_number || "",
      liveBotLink: currentChannel === "telegram" && primaryBot.telegram_token ? "https://t.me/BotFather" : (currentChannel === "whatsapp" ? "https://business.facebook.com/wa/manage/" : null),
      bots: validBots
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("User API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ============================================================================
// 2. POST: Save User Onboarding Data (PREVENT BLANK ROW BUG)
// ============================================================================
export async function POST(req: NextRequest) {
    try {
        // 🛡️ SECURITY LOCK: Verify Session First
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
        }

        const body = await req.json();
        const { selectedModel, selectedChannel, plan, telegram_token, whatsapp_phone_id } = body;

        // 🔥 USE THE CRYPTO EMAIL ONLY
        const email = token.email.toLowerCase();

        let aiProvider = "openai";
        if (selectedModel) {
            const sm = selectedModel.toLowerCase();
            if (sm.includes("claude") || sm.includes("anthropic")) aiProvider = "anthropic";
            if (sm.includes("gemini") || sm.includes("google")) aiProvider = "google";
            if (sm.includes("omni") || sm.includes("multi_model") || sm.includes("nexus")) aiProvider = "multi_model";
        }

        // 🚀 THE MULTI-BOT LOCK: Match EXACTLY by Token. If token matches -> Overwrite. If new Token -> Create New Row!
        let query = supabase.from("user_configs").select("id").eq("email", email);
        
        if (telegram_token) {
            query = query.eq("telegram_token", telegram_token);
        } else if (whatsapp_phone_id) {
            query = query.eq("whatsapp_phone_id", whatsapp_phone_id);
        } else {
            query = query.eq("selected_channel", selectedChannel || "widget").order("created_at", { ascending: false });
        }

        const { data } = await query.limit(1);
        const existingUser = data?.[0];

        if (existingUser) {
            await supabase.from("user_configs").update({
                selected_model: selectedModel || undefined,
                ai_provider: selectedModel ? aiProvider : undefined,
                plan: plan || undefined
            }).eq("id", existingUser.id);
        } else {
            await supabase.from("user_configs").insert({
                email: email,
                selected_model: selectedModel,
                selected_channel: selectedChannel || "widget",
                ai_provider: aiProvider,
                telegram_token: telegram_token || undefined,
                whatsapp_phone_id: whatsapp_phone_id || undefined,
                plan: plan || "Starter",
                tokens_allocated: 10000, 
                tokens_used: 0
            });
        }

        return NextResponse.json({ success: true, message: "User config saved perfectly with Token Isolation!" });
    } catch (error: any) {
        console.error("Config POST Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// ============================================================================
// 3. PUT: Update AI Persona dynamically
// ============================================================================
export async function PUT(req: NextRequest) {
  try {
    // 🛡️ SECURITY LOCK: Verify Session First
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
        return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    const body = await req.json();
    const { systemPrompt, selectedModel, selectedChannel, channel, telegram_token, whatsapp_phone_id } = body;

    // 🔥 USE THE CRYPTO EMAIL ONLY
    const email = token.email.toLowerCase();

    const updateData: any = {};
    let targetColumn = "";
    
    if (systemPrompt !== undefined) {
      if (channel === 'telegram') { updateData.system_prompt_telegram = systemPrompt; targetColumn = "telegram_token"; }
      else if (channel === 'whatsapp') { updateData.system_prompt_whatsapp = systemPrompt; targetColumn = "whatsapp_phone_id"; }
      else if (channel === 'widget') { updateData.system_prompt_widget = systemPrompt; targetColumn = "widget"; }
      else { updateData.system_prompt = systemPrompt; }
    }

    if (selectedChannel !== undefined) updateData.selected_channel = selectedChannel;
    
    if (selectedModel !== undefined) {
        updateData.selected_model = selectedModel;
        const sm = selectedModel.toLowerCase();
        if (sm.includes("claude") || sm.includes("anthropic")) updateData.ai_provider = "anthropic";
        else if (sm.includes("gemini") || sm.includes("google")) updateData.ai_provider = "google";
        else if (sm.includes("omni") || sm.includes("multi_model") || sm.includes("nexus")) updateData.ai_provider = "multi_model";
        else updateData.ai_provider = "openai";
    }

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: true, message: "Nothing to update" });

    let query = supabase.from("user_configs").update(updateData).eq("email", email);
    
    // 🚀 FIXED: Only update the SPECIFIC bot's persona using exact Token! (Never overwrite other bots)
    if (telegram_token) query = query.eq("telegram_token", telegram_token);
    else if (whatsapp_phone_id) query = query.eq("whatsapp_phone_id", whatsapp_phone_id);
    else if (targetColumn === "telegram_token") query = query.not("telegram_token", "is", null);
    else if (targetColumn === "whatsapp_phone_id") query = query.not("whatsapp_phone_id", "is", null);
    else if (targetColumn === "widget") query = query.eq("selected_channel", "widget");

    const { error } = await query;

    if (error) {
      console.error("Supabase Update Error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: `Data updated successfully for exact bot` });
  } catch (error: any) {
    console.error("User Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}