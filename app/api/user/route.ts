import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. GET: Fetch User Stats for Dashboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      // If user hasn't deployed a bot yet, return empty defaults gracefully
      return NextResponse.json({ success: true, data: null });
    }

    // Format data specifically for the Dashboard Frontend
    const dashboardData = {
      plan: data.plan || "Starter",
      provider: data.ai_provider || "google",
      model: data.ai_model || "gemini-3-flash",
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
      .eq("email", email);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Persona updated successfully" });
  } catch (error: any) {
    console.error("Persona Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}