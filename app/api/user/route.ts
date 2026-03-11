import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fetch user configuration and plan limits
    const { data: config, error: configError } = await supabase
      .from("user_configs")
      .select("*")
      .eq("email", email)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: "User configuration not found" }, { status: 404 });
    }

    // Fetch total usage to calculate remaining tokens
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("estimated_tokens")
      .eq("email", email);

    const tokensUsed = usageData?.reduce((sum: number, record: any) => sum + (record.estimated_tokens || 0), 0) || 0;

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
      }
    });

  } catch (error: any) {
    console.error("User API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}