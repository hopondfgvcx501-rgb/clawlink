import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, selectedModel, selectedChannel, telegramToken, plan } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required for deployment." });
    }

    // 🚀 CALCULATE 30 DAYS VALIDITY
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // 🚀 SET TOKENS BASED ON PLAN
    let allocatedTokens = 10000;
    let isUnlimited = false;

    if (plan === "starter") allocatedTokens = 50000;
    else if (plan === "pro") allocatedTokens = 500000; 
    else if (plan === "max") { isUnlimited = true; allocatedTokens = 9999999; }

    const { data, error } = await supabase
      .from("user_configs")
      .upsert({
        email: email,
        ai_model: selectedModel,
        ai_provider: selectedModel === "gpt-5.2" ? "openai" : selectedModel === "gemini" ? "google" : "anthropic",
        telegram_token: selectedChannel === "telegram" ? telegramToken : null,
        whatsapp_token: selectedChannel === "whatsapp" ? telegramToken : null,
        available_tokens: allocatedTokens,
        is_unlimited: isUnlimited,
        plan_status: 'Active',
        expires_at: expiryDate.toISOString() // 🔒 Locked expiration date
      }, { onConflict: "email" })
      .select();

    if (error) throw error;

    // 🚀 GENERATE LIVE BOT LINK
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) botLink = `https://t.me/${tData.result.username}`;
      } catch (err) {
        console.error("Telegram link fetch failed.");
      }
    } else if (selectedChannel === "whatsapp") {
      botLink = "https://business.facebook.com/wa/manage/";
    }

    return NextResponse.json({ success: true, botLink });
  } catch (error: any) {
    console.error("Config Deployment Error:", error.message);
    return NextResponse.json({ success: false, error: error.message });
  }
}