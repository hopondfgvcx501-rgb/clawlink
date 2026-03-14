import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚨 CRITICAL FIX: Tell Vercel NOT to cache this API. Always fetch fresh data from Supabase!
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET: Fetch User Stats for Dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Lowercase email to prevent case-mismatch issues in DB
    const email = (searchParams.get("email") || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, data: null });
    }

    // 🚀 STRICT READ: Extract exactly what is in Database (No guesswork)
    const dbModel = data.selected_model || data.ai_model || "Not Set"; 
    let dbProvider = data.ai_provider || "openai";
    
    // Auto-detect provider based on the model string if missing
    if (dbModel.toLowerCase().includes("claude") || dbModel.toLowerCase().includes("anthropic")) dbProvider = "anthropic";
    else if (dbModel.toLowerCase().includes("gemini") || dbModel.toLowerCase().includes("google")) dbProvider = "google";

    // Format data specifically for the Dashboard Frontend
    const dashboardData = {
      plan: data.plan || "Starter",
      provider: dbProvider,
      model: dbModel,
      selected_model: dbModel, 
      selected_channel: data.selected_channel || "web",
      ai_provider: dbProvider,
      tokensAllocated: data.tokens_allocated || 0,
      tokensUsed: data.tokens_used || 0,
      isUnlimited: data.is_unlimited || false,
      systemPrompt: data.system_prompt || "",
      telegramActive: !!data.telegram_token,
      whatsappActive: !!data.whatsapp_token,
      telegram_token: data.telegram_token,
      whatsapp_token: data.whatsapp_token,
      whatsapp_phone_id: data.whatsapp_phone_id,
      liveBotLink: data.telegram_token ? "https://t.me/BotFather" : (data.whatsapp_token ? "https://business.facebook.com/wa/manage/" : null)
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("User API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Save User Onboarding Data (Model & Channel) 🚀 [NEW FIX]
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

        // Check if user exists in DB
        const { data: existingUser } = await supabase.from("user_configs").select("id").eq("email", email.toLowerCase()).single();

        if (existingUser) {
            await supabase.from("user_configs").update({
                selected_model: selectedModel,
                selected_channel: selectedChannel,
                ai_provider: aiProvider,
                plan: plan || "Starter"
            }).eq("email", email.toLowerCase());
        } else {
            await supabase.from("user_configs").insert({
                email: email.toLowerCase(),
                selected_model: selectedModel,
                selected_channel: selectedChannel,
                ai_provider: aiProvider,
                plan: plan || "Starter",
                tokens_allocated: 10000, // Default for free/new users
                tokens_used: 0
            });
        }

        return NextResponse.json({ success: true, message: "User config saved perfectly!" });
    } catch (error: any) {
        console.error("Config POST Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 3. PUT: Update AI Persona or Settings dynamically 🚀 [ENHANCED FIX]
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, systemPrompt, selectedModel, selectedChannel } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 🚨 Build update object dynamically based on what frontend sends
    const updateData: any = {};
    if (systemPrompt !== undefined) updateData.system_prompt = systemPrompt;
    if (selectedChannel !== undefined) updateData.selected_channel = selectedChannel;
    
    if (selectedModel !== undefined) {
        updateData.selected_model = selectedModel;
        const sm = selectedModel.toLowerCase();
        if (sm.includes("claude") || sm.includes("anthropic")) updateData.ai_provider = "anthropic";
        else if (sm.includes("gemini") || sm.includes("google")) updateData.ai_provider = "google";
        else updateData.ai_provider = "openai";
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: true, message: "Nothing to update" });
    }

    const { error } = await supabase
      .from("user_configs")
      .update(updateData)
      .eq("email", email.toLowerCase());

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Data updated successfully" });
  } catch (error: any) {
    console.error("User Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}