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
      return NextResponse.json({ success: false, error: "User email is missing from session data." }, { status: 400 });
    }

    // 1. Quota Allocation
    let allocatedTokens = 50000; 
    let isUnlimited = false;

    if (plan === "pro") allocatedTokens = 500000; 
    if (plan === "max") {
      allocatedTokens = 999999999; 
      isUnlimited = true;
    }

    // 2. Database Upsert
    const dbData = {
      email: email,
      ai_provider: selectedModel.includes("gpt") ? "openai" : selectedModel.includes("claude") ? "anthropic" : "gemini",
      ai_model: selectedModel,
      available_tokens: allocatedTokens,
      is_unlimited: isUnlimited,
      whatsapp_token: selectedChannel === "whatsapp" ? telegramToken : null,
      telegram_token: selectedChannel === "telegram" ? telegramToken : null
    };

    const { error: dbError } = await supabase
      .from("user_configs")
      .upsert(dbData, { onConflict: "email" }); 

    if (dbError) {
      throw new Error(`Database Error: ${dbError.message}`);
    }

    // 3. Webhook Deployment
    if (selectedChannel === "telegram") {
      const baseUrl = process.env.NEXTAUTH_URL || "https://clawlink-six.vercel.app"; 
      const WEBHOOK_URL = `${baseUrl}/api/webhook/telegram?token=${telegramToken}`;
      
      const telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${WEBHOOK_URL}`);
      const telegramData = await telegramRes.json();

      if (!telegramData.ok) {
         throw new Error(`Telegram Webhook Configuration Failed: ${telegramData.description}`);
      }

      const meRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
      const meData = await meRes.json();
      const botUsername = meData.ok ? meData.result.username : "your_bot";

      return NextResponse.json({ success: true, botLink: `https://t.me/${botUsername}` });
    } 
    
    else if (selectedChannel === "whatsapp") {
      return NextResponse.json({ success: true, botLink: `https://business.facebook.com/wa/manage/` }); 
    }

    return NextResponse.json({ success: false, error: "Invalid Channel Selected." });

  } catch (error: any) {
    console.error("Configuration API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during deployment." }, 
      { status: 500 }
    );
  }
}