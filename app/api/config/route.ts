import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 Initialize Supabase (Strictly using process.env, no hardcoding)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Using Service Role Key is best for backend, fallback to Anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, selectedModel, selectedChannel, telegramToken, plan } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "User email is missing from session!" }, { status: 400 });
    }

    // 🧠 1. QUOTA LOGIC: Plan ke hisaab se token allocate karo
    let allocatedTokens = 50000; // Starter (Garib Plan)
    let isUnlimited = false;

    if (plan === "pro") allocatedTokens = 500000; // Pro (Amir Plan)
    if (plan === "max") {
      allocatedTokens = 999999999; // Omni Max Plan
      isUnlimited = true;
    }

    // 💾 2. SAVE TO SUPABASE: Payment ke turant baad user ka record save karo
    const dbData = {
      email: email,
      ai_provider: selectedModel.includes("gpt") ? "openai" : selectedModel.includes("claude") ? "anthropic" : "gemini",
      ai_model: selectedModel,
      available_tokens: allocatedTokens,
      is_unlimited: isUnlimited,
      // Agar channel WhatsApp hai toh token whatsapp_token column mein jayega
      whatsapp_token: selectedChannel === "whatsapp" ? telegramToken : null,
      telegram_token: selectedChannel === "telegram" ? telegramToken : null
    };

    // 'upsert' ka matlab: Agar email pehle se hai toh update karo, warna naya dalo
    const { error: dbError } = await supabase
      .from("user_configs")
      .upsert(dbData, { onConflict: "email" }); 

    if (dbError) {
      throw new Error(`Supabase Database Error: ${dbError.message}`);
    }

    // ✈️ 3. CHANNEL DEPLOYMENT LOGIC
    if (selectedChannel === "telegram") {
      // TELEGRAM WEBHOOK SETUP
      const baseUrl = process.env.NEXTAUTH_URL || "https://clawlink-six.vercel.app"; 
      
      // 🚀 THE FIX: Yahan webhook URL mein ?token= attach karna zaroori hai
      const WEBHOOK_URL = `${baseUrl}/api/webhook/telegram?token=${telegramToken}`;
      
      const telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${WEBHOOK_URL}`);
      const telegramData = await telegramRes.json();

      if (!telegramData.ok) {
         throw new Error(`Telegram Webhook Failed: ${telegramData.description}`);
      }

      // Success screen ke liye bot ka username nikalo
      const meRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
      const meData = await meRes.json();
      const botUsername = meData.ok ? meData.result.username : "your_bot";

      return NextResponse.json({ success: true, botLink: `https://t.me/${botUsername}` });
    } 
    
    else if (selectedChannel === "whatsapp") {
      // WHATSAPP SETUP
      // WhatsApp webhook Meta Dashboard se manually lagta hai. 
      return NextResponse.json({ success: true, botLink: `https://business.facebook.com/wa/manage/` }); 
    }

    return NextResponse.json({ success: false, error: "Invalid Channel Selected" });

  } catch (error: any) {
    console.error("🚨 Master Config API Error:", error);
    // Strict requirement: Error chupana nahi hai
    return NextResponse.json(
      { success: false, error: error.message || "Unknown Server Error during Deployment" }, 
      { status: 500 }
    );
  }
}