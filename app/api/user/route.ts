import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; // MASTER SECURITY LOCK

// CRITICAL FIX: Disable caching to ensure the dashboard always receives real-time data
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 1. GET: Fetch User Stats for Dashboard (ENTERPRISE FILTERING ARCHITECTURE)
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    // SECURITY LOCK: Validate cryptographic browser session (Prevents unauthorized queries)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      console.error("[SECURITY BREACH] Unauthenticated GET attempt intercepted.");
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    // Override any frontend parameter with the cryptographically secure email payload
    const email = token.email.toLowerCase();

    // Retrieve comprehensive configuration array for the designated user
    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // FILTER LOGIC: Exclude placeholder or incomplete rows. Retain strictly operational instances.
    let validBots = data.filter(bot => 
        (bot.selected_model && bot.selected_model !== "Not Set") || 
        bot.ai_model ||
        bot.telegram_token || 
        bot.whatsapp_phone_id || 
        bot.instagram_account_id || // 🚀 FIXED: Added Instagram check
        bot.plan === "max" || bot.plan === "pro" || bot.plan === "monthly" || bot.plan === "yearly" || bot.plan === "adv_max" || bot.plan === "ultra" || bot.plan === "plus"
    );

    if (validBots.length === 0) validBots = [data[0]];

    // ROOT CAUSE FIX: Strict chronological descending sort. The most recent record commands index [0].
    validBots.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeB - timeA; 
    });

    // PRIMARY BOT DESIGNATION: Dictates the core dashboard UI state
    const primaryBot = validBots[0];

    let totalAllocated = 0;
    let totalUsed = 0;
    let activeTelegram = false;
    let activeWhatsapp = false;
    let activeInstagram = false; // 🚀 FIXED: Added Instagram state

    // Aggregate token throughput and assess active transmission channels
    for (const bot of validBots) {
        totalAllocated += (bot.tokens_allocated || 0);
        totalUsed += (bot.tokens_used || 0);

        if (bot.telegram_token) { activeTelegram = true; }
        if (bot.whatsapp_phone_id || bot.whatsapp_token) { activeWhatsapp = true; }
        if (bot.instagram_account_id || bot.instagram_token) { activeInstagram = true; } // 🚀 FIXED
    }

    // STRICT PLAN IDENTITY ALLOCATION
    let highestPlan = primaryBot.plan || "Starter";
    let isUnlimited = primaryBot.is_unlimited || highestPlan.toLowerCase() === "max" || highestPlan.toLowerCase() === "yearly" || highestPlan.toLowerCase() === "monthly" || highestPlan.toLowerCase() === "adv_max" || highestPlan.toLowerCase() === "ultra" || highestPlan.toLowerCase() === "pro";
    
    // EXACT MODEL FIX: Strictly sanitize and normalize database strings to match exactly with Dashboard UI Arrays
    const rawModel = String(primaryBot.ai_model || primaryBot.current_model_version || primaryBot.selected_model || "gpt-5.4 Pro").toLowerCase();
    
    let bestModel = "gpt-5.4 Pro";
    let bestProvider = "openai";
    
    // Engine Normalization Protocol (2026 Strings)
    if (rawModel.includes("claude") || rawModel.includes("anthropic") || rawModel.includes("opus")) {
        bestProvider = "anthropic";
        bestModel = "Claude Opus 4.6";
    }
    else if (rawModel.includes("gemini") || rawModel.includes("google")) {
        bestProvider = "google";
        bestModel = "gemini 3.1 Pro";
    }
    else if (rawModel.includes("omni") || rawModel.includes("multi") || rawModel.includes("nexus")) {
        bestProvider = "omni";
        bestModel = "omni 3 nexus";
    } else {
        bestProvider = "openai";
        bestModel = "gpt-5.4 Pro";
    }

    // EXACT CHANNEL FIX: Assign priority channel based on existing token infrastructure
    let currentChannel = primaryBot.selected_channel;
    if (!currentChannel) {
        if (primaryBot.telegram_token) currentChannel = "telegram";
        else if (primaryBot.whatsapp_phone_id) currentChannel = "whatsapp";
        else if (primaryBot.instagram_account_id) currentChannel = "instagram"; // 🚀 FIXED
        else currentChannel = "widget";
    }

    // Compile secure telemetry payload for frontend rendering
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
      system_prompt_instagram: primaryBot.system_prompt_instagram || "", // 🚀 FIXED
      system_prompt_widget: primaryBot.system_prompt_widget || "",
      telegramActive: activeTelegram,
      whatsappActive: activeWhatsapp,
      instagramActive: activeInstagram, // 🚀 FIXED
      telegram_token: primaryBot.telegram_token || null,
      whatsapp_token: primaryBot.whatsapp_token || null,
      whatsapp_phone_id: primaryBot.whatsapp_phone_id || null,
      whatsapp_number: primaryBot.whatsapp_number || "",
      instagram_token: primaryBot.instagram_token || null, // 🚀 FIXED
      instagram_account_id: primaryBot.instagram_account_id || null, // 🚀 FIXED
      liveBotLink: currentChannel === "telegram" && primaryBot.telegram_token ? "https://t.me/BotFather" : (currentChannel === "whatsapp" ? "https://business.facebook.com/wa/manage/" : (currentChannel === "instagram" ? "https://business.facebook.com/latest/inbox/instagram" : null)),
      bots: validBots
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("[USER_API_ERROR] Core retrieval failure:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ============================================================================
// 2. POST: Save User Onboarding Data (ROW ISOLATION PROTOCOL)
// ============================================================================
export async function POST(req: NextRequest) {
    try {
        // SECURITY LOCK: Validate Session Payload
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.email) {
            return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
        }

        const body = await req.json();
        // 🚀 FIXED: Extract instagram fields
        const { selectedModel, selectedChannel, plan, telegram_token, whatsapp_phone_id, instagram_token, instagram_account_id } = body;

        // Force secure cryptographic email string
        const email = token.email.toLowerCase();

        // Determine master AI Provider based on requested model
        let aiProvider = "openai";
        if (selectedModel) {
            const sm = selectedModel.toLowerCase();
            if (sm.includes("claude") || sm.includes("anthropic") || sm.includes("opus")) aiProvider = "anthropic";
            else if (sm.includes("gemini") || sm.includes("google")) aiProvider = "google";
            else if (sm.includes("omni") || sm.includes("multi_model") || sm.includes("nexus")) aiProvider = "omni";
        }

        // MULTI-BOT ISOLATION PROTOCOL: Execute precise overrides based on unique application tokens
        let query = supabase.from("user_configs").select("id").eq("email", email);
        
        if (telegram_token) {
            query = query.eq("telegram_token", telegram_token);
        } else if (whatsapp_phone_id) {
            query = query.eq("whatsapp_phone_id", whatsapp_phone_id);
        } else if (instagram_account_id) { // 🚀 FIXED
            query = query.eq("instagram_account_id", instagram_account_id);
        } else {
            query = query.eq("selected_channel", selectedChannel || "widget").order("created_at", { ascending: false });
        }

        const { data } = await query.limit(1);
        const existingUser = data?.[0];

        if (existingUser) {
            await supabase.from("user_configs").update({
                selected_model: selectedModel || undefined,
                ai_provider: selectedModel ? aiProvider : undefined,
                plan: plan || undefined,
                instagram_token: instagram_token || undefined, // 🚀 FIXED
                instagram_account_id: instagram_account_id || undefined // 🚀 FIXED
            }).eq("id", existingUser.id);
        } else {
            await supabase.from("user_configs").insert({
                email: email,
                selected_model: selectedModel,
                selected_channel: selectedChannel || "widget",
                ai_provider: aiProvider,
                telegram_token: telegram_token || undefined,
                whatsapp_phone_id: whatsapp_phone_id || undefined,
                instagram_token: instagram_token || undefined, // 🚀 FIXED
                instagram_account_id: instagram_account_id || undefined, // 🚀 FIXED
                plan: plan || "Starter",
                tokens_allocated: 10000, 
                tokens_used: 0
            });
        }

        return NextResponse.json({ success: true, message: "User configuration verified and secured via token isolation." });
    } catch (error: any) {
        console.error("[CONFIG_POST_ERROR] Data synchronization failed:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// ============================================================================
// 3. PUT: Update AI Persona dynamically
// ============================================================================
export async function PUT(req: NextRequest) {
  try {
    // SECURITY LOCK: Validate Session Payload
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
        return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    const body = await req.json();
    // 🚀 FIXED: Added instagram_account_id
    const { systemPrompt, selectedModel, selectedChannel, channel, telegram_token, whatsapp_phone_id, instagram_account_id } = body;

    // Force secure cryptographic email string
    const email = token.email.toLowerCase();

    const updateData: any = {};
    let targetColumn = "";
    
    // Dynamic column targeting for specific channel personalities
    if (systemPrompt !== undefined) {
      if (channel === 'telegram') { updateData.system_prompt_telegram = systemPrompt; targetColumn = "telegram_token"; }
      else if (channel === 'whatsapp') { updateData.system_prompt_whatsapp = systemPrompt; targetColumn = "whatsapp_phone_id"; }
      else if (channel === 'instagram') { updateData.system_prompt_instagram = systemPrompt; targetColumn = "instagram_account_id"; } // 🚀 FIXED
      else if (channel === 'widget') { updateData.system_prompt_widget = systemPrompt; targetColumn = "widget"; }
      else { updateData.system_prompt = systemPrompt; }
    }

    if (selectedChannel !== undefined) updateData.selected_channel = selectedChannel;
    
    if (selectedModel !== undefined) {
        updateData.selected_model = selectedModel;
        const sm = selectedModel.toLowerCase();
        if (sm.includes("claude") || sm.includes("anthropic") || sm.includes("opus")) updateData.ai_provider = "anthropic";
        else if (sm.includes("gemini") || sm.includes("google")) updateData.ai_provider = "google";
        else if (sm.includes("omni") || sm.includes("multi_model") || sm.includes("nexus")) updateData.ai_provider = "omni";
        else updateData.ai_provider = "openai";
    }

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: true, message: "No execution required." });

    let query = supabase.from("user_configs").update(updateData).eq("email", email);
    
    // EXACT OVERRIDE RULE: Only manipulate the requested bot profile to prevent cross-contamination
    if (telegram_token) query = query.eq("telegram_token", telegram_token);
    else if (whatsapp_phone_id) query = query.eq("whatsapp_phone_id", whatsapp_phone_id);
    else if (instagram_account_id) query = query.eq("instagram_account_id", instagram_account_id); // 🚀 FIXED
    else if (targetColumn === "telegram_token") query = query.not("telegram_token", "is", null);
    else if (targetColumn === "whatsapp_phone_id") query = query.not("whatsapp_phone_id", "is", null);
    else if (targetColumn === "instagram_account_id") query = query.not("instagram_account_id", "is", null); // 🚀 FIXED
    else if (targetColumn === "widget") query = query.eq("selected_channel", "widget");

    const { error } = await query;

    if (error) {
      console.error("[SUPABASE_UPDATE_ERROR] Persona modification failed:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: `System persona integrated securely.` });
  } catch (error: any) {
    console.error("[USER_PUT_ERROR] Execution error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}