import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET: Fetch User Stats for Dashboard (AGENCY AGGREGATOR)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 🚀 FIXED: Fetch ALL bots for this user. Removed .single() which caused the crash!
    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    // 🧠 AGENCY AGGREGATOR: Combine stats from all bots into one Master Dashboard
    const latestBot = data[0]; 
    
    let totalAllocated = 0;
    let totalUsed = 0;
    let isUnlimited = false;
    let hasTelegram = false;
    let hasWhatsapp = false;
    let highestPlan = "Starter";

    let tgPrompt = "";
    let waPrompt = "";
    let masterPrompt = "";

    // Loop through all purchased bots and sum up their power
    for (const bot of data) {
        totalAllocated += (bot.tokens_allocated || 0);
        totalUsed += (bot.tokens_used || 0);
        
        if (bot.is_unlimited || bot.plan === "max" || bot.plan === "pro" || bot.plan === "ultra-premium") {
            isUnlimited = true;
        }
        
        if (bot.telegram_token) { 
            hasTelegram = true; 
            tgPrompt = bot.system_prompt_telegram || bot.system_prompt || ""; 
        }
        if (bot.whatsapp_token || bot.whatsapp_phone_id) { 
            hasWhatsapp = true; 
            waPrompt = bot.system_prompt_whatsapp || bot.system_prompt || ""; 
        }
        
        // Find the highest tier plan they own
        const botPlan = (bot.plan || "").toLowerCase();
        if (botPlan === "max" || botPlan === "ultra-premium") highestPlan = bot.plan;
        else if (botPlan === "pro" && highestPlan !== "max" && highestPlan !== "ultra-premium") highestPlan = bot.plan;
        else if (highestPlan === "Starter") highestPlan = bot.plan;

        if (!masterPrompt && bot.system_prompt) masterPrompt = bot.system_prompt;
    }

    const dbModel = latestBot.selected_model || latestBot.ai_model || "Not Set"; 
    let dbProvider = latestBot.ai_provider || "openai";
    
    if (dbModel.toLowerCase().includes("claude") || dbModel.toLowerCase().includes("anthropic")) dbProvider = "anthropic";
    else if (dbModel.toLowerCase().includes("gemini") || dbModel.toLowerCase().includes("google")) dbProvider = "google";

    const dashboardData = {
      plan: highestPlan,
      provider: dbProvider,
      model: dbModel,
      selected_model: dbModel, 
      selected_channel: latestBot.selected_channel || "web",
      ai_provider: dbProvider,
      tokensAllocated: isUnlimited ? 9999999 : totalAllocated,
      tokensUsed: totalUsed,
      isUnlimited: isUnlimited,
      systemPrompt: masterPrompt || "",
      system_prompt_telegram: tgPrompt,
      system_prompt_whatsapp: waPrompt,
      system_prompt_widget: latestBot.system_prompt_widget || "",
      telegramActive: hasTelegram,
      whatsappActive: hasWhatsapp,
      telegram_token: data.find((b: any) => b.telegram_token)?.telegram_token,
      whatsapp_token: data.find((b: any) => b.whatsapp_token)?.whatsapp_token,
      whatsapp_phone_id: data.find((b: any) => b.whatsapp_phone_id)?.whatsapp_phone_id,
      liveBotLink: hasTelegram ? "https://t.me/BotFather" : (hasWhatsapp ? "https://business.facebook.com/wa/manage/" : null)
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

    // 🚀 FIXED: Only update the specific bot row that matches the channel!
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