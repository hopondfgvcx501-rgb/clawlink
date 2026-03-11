import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch User Data, Quota & Live Bot Links
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: config, error: configError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: "User configuration not found" }, { status: 404 });
    }

    const { data: usageData } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

    // Dynamically generate the live bot link for the dashboard
    let activeBotLink = null;
    if (config.telegram_token) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${config.telegram_token}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) activeBotLink = `https://t.me/${tData.result.username}`;
      } catch (e) {
        console.error("Failed to fetch Telegram username");
      }
    } else if (config.whatsapp_token) {
      activeBotLink = "https://business.facebook.com/wa/manage/";
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: config.is_unlimited ? "Omni Max" : config.available_tokens > 50000 ? "Pro" : "Starter",
        model: config.ai_model,
        provider: config.ai_provider,
        tokensAllocated: config.available_tokens,
        tokensUsed: tokensUsed,
        isUnlimited: config.is_unlimited,
        telegramActive: !!config.telegram_token,
        whatsappActive: !!config.whatsapp_token,
        systemPrompt: config.system_prompt || "You are an advanced enterprise AI assistant.",
        liveBotLink: activeBotLink // Sending the link to the dashboard
      }
    });

  } catch (error: any) {
    console.error("User API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update Bot System Prompt
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, systemPrompt } = body;

    if (!email || !systemPrompt) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_configs")
      .update({ system_prompt: systemPrompt })
      .eq("email", email);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: "Persona updated successfully" });
  } catch (error: any) {
    console.error("User API PUT Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update persona" }, { status: 500 });
  }
}