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

    // 🚀 READ EXACTLY FROM 'selected_model'
    const dbModel = data.selected_model || "gemini-flash";
    let dbProvider = "Google";
    
    // Auto-detect provider based on the model string
    if (dbModel.toLowerCase().includes("gpt")) dbProvider = "OpenAI";
    else if (dbModel.toLowerCase().includes("claude") || dbModel.toLowerCase().includes("anthropic")) dbProvider = "Anthropic";

    // Format data specifically for the Dashboard Frontend
    const dashboardData = {
      plan: data.plan || "Starter",
      provider: dbProvider,
      model: dbModel,
      selected_model: data.selected_model, 
      selected_channel: data.selected_channel,
      tokensAllocated: data.tokens_allocated || 0,
      tokensUsed: data.tokens_used || 0,
      isUnlimited: data.is_unlimited || false,
      systemPrompt: data.system_prompt || "",
      telegramActive: !!data.telegram_token,
      whatsappActive: !!data.whatsapp_token,
      liveBotLink: data.telegram_token ? "https://t.me/BotFather" : (data.whatsapp_token ? "https://business.facebook.com/wa/manage/" : null)
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error("User API Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PUT: Update AI Persona (System Prompt)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, systemPrompt } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("user_configs")
      .update({ system_prompt: systemPrompt })
      .eq("email", email.toLowerCase());

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Persona updated successfully" });
  } catch (error: any) {
    console.error("Persona Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}