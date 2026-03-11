import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, selectedModel, selectedChannel, telegramToken } = body;

    if (!telegramToken) {
      return NextResponse.json({ success: false, error: "Telegram token is missing" }, { status: 400 });
    }

    // 🚀 STEP 1: Telegram Webhook Set Karna
    // (Yeh Telegram ko batayega ki jab bhi koi message aaye, toh hamare Vercel URL par bhejo)
    
    // Note: Localhost pe webhook set nahi hota, Vercel ka live URL chahiye. 
    // Isliye hum hardcode nahi kar rahe, environment variable use kar rahe hain.
    const baseUrl = process.env.NEXTAUTH_URL || "https://clawlink-six.vercel.app"; 
    const WEBHOOK_URL = `${baseUrl}/api/webhook/telegram`;
    
    const telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${WEBHOOK_URL}`);
    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      // Exact error bhej rahe hain bina hide kiye
      return NextResponse.json({ 
        success: false, 
        error: `Telegram Webhook Failed: ${telegramData.description}` 
      }, { status: 500 });
    }

    // 🚀 STEP 2: Supabase mein Save Karna (Yeh hum agle step mein setup karenge)
    // console.log("Saving to database...", email, selectedModel);

    // 🚀 STEP 3: Bot ka Username nikalna taaki Success Button ban sake
    const meRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
    const meData = await meRes.json();
    const botUsername = meData.ok ? meData.result.username : "your_bot";

    // ✅ SUCCESS: Frontend ko bot ka link bhej do
    return NextResponse.json({ 
      success: true, 
      botLink: `https://t.me/${botUsername}` 
    });

  } catch (error: any) {
    console.error("🚨 Config API Error:", error);
    // Exact system error wapas frontend par bhej rahe hain debugging ke liye
    return NextResponse.json(
      { success: false, error: error.message || "Unknown Server Error" }, 
      { status: 500 }
    );
  }
}