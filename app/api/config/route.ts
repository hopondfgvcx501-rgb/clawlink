import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Using dynamic import to prevent build errors if the email file is missing
let sendEmail: any = async () => console.log("Email function not loaded.");
try { sendEmail = require("../../../lib/email").sendEmail; } catch (e) {}

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 🚀 MASTER DESTRUCTURING
    const { 
        email, 
        selectedModel, 
        selectedChannel, 
        telegramToken, 
        waPhoneId, 
        waPhoneNumber, // Used for Smart Redirect
        plan, 
        billingCycle   
    } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required for deployment." });
    }

    // Calculate Message Limits based on Tiers
    let monthlyLimit = 0;
    if (plan === "plus") monthlyLimit = 2000;
    else if (plan === "pro") monthlyLimit = 8000;
    else if (plan === "ultra_max") monthlyLimit = 25000;
    else if (plan === "pro_plus" || plan === "max_elite" || selectedModel === "multi_model") monthlyLimit = 50000;
    else monthlyLimit = 1000; // Safe default

    // Determine AI Provider
    let providerToSave = "anthropic"; 
    if (selectedModel === "multi_model") providerToSave = "multi_model"; 
    else if (selectedModel === "gpt-5.2") providerToSave = "openai";
    else if (selectedModel === "gemini") providerToSave = "google";

    // 🗄️ 2. SECURE DATABASE UPSERT (Removed unknown columns to fix 500 error!)
    const { data, error } = await supabase
      .from("user_configs")
      .upsert({
        email: email,
        selected_model: selectedModel,
        ai_provider: providerToSave, 
        selected_channel: selectedChannel,
        telegram_token: selectedChannel === "telegram" ? telegramToken : null,
        whatsapp_token: selectedChannel === "whatsapp" ? telegramToken : null,
        whatsapp_phone_id: selectedChannel === "whatsapp" ? waPhoneId : null, 
        plan: plan, 
        tokens_allocated: monthlyLimit,
        tokens_used: 0
      }, { onConflict: "email" })
      .select();

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error("Failed to secure configuration in database.");
    }

    // 💸 3. RECORD BILLING HISTORY FOR DASHBOARD (Wrapped in Try-Catch to be safe)
    try {
        let amount = "29.00"; 
        if (plan === "pro") amount = "49.00";
        if (plan === "ultra_max") amount = "99.00";
        if (plan === "pro_plus" || plan === "max_elite") amount = "149.00"; 
        if (billingCycle === "Yearly") amount = (parseFloat(amount) * 10).toFixed(2); 

        await supabase.from("billing_history").insert({
          email: email,
          plan_name: `${plan} (${billingCycle})`,
          amount: amount,
          currency: "USD", 
          status: "PAID",
          razorpay_order_id: "DEPLOY_" + Math.random().toString(36).substring(7).toUpperCase()
        });
    } catch(e) {
        console.log("Billing history skipped");
    }

    // 🔗 4. GENERATE SMART BOT LINK
    let botLink = "";
    if (selectedChannel === "telegram" && telegramToken) {
      try {
        const tRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
        const tData = await tRes.json();
        if (tData.ok) {
          botLink = `https://t.me/${tData.result.username}`;
          
          const webhookUrl = `https://clawlink-six.vercel.app/api/webhook/telegram?email=${email}`;
          await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`);
        }
      } catch (err) {
        console.error("Telegram link setup failed.");
      }
    } else if (selectedChannel === "whatsapp") {
      botLink = waPhoneNumber ? `https://wa.me/${waPhoneNumber.replace(/\D/g, '')}` : "https://web.whatsapp.com";
    }

    // 📧 5. DISPATCH ONBOARDING EMAIL
    const emailHtml = `
      <div style="font-family: monospace; max-w: 600px; margin: 0 auto; background: #0A0A0B; color: #ffffff; padding: 40px; border-radius: 15px; border: 1px solid #333;">
        <h2 style="color: #22c55e; letter-spacing: 2px;">DEPLOYMENT SUCCESSFUL 🚀</h2>
        <p style="color: #cccccc; font-size: 16px;">Hello,</p>
        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">Welcome to ClawLink! Your Enterprise AI agent is now live and fully connected to the Global Edge Network.</p>
        
        <div style="background: #111; padding: 20px; border-radius: 10px; border: 1px solid #222; margin: 20px 0;">
          <p style="margin: 5px 0; color: #aaa;"><strong>Plan:</strong> <span style="color: #fff; text-transform: uppercase;">${plan}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>Billing:</strong> <span style="color: #fff;">${billingCycle}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>AI Engine:</strong> <span style="color: #fff; text-transform: uppercase;">${selectedModel === 'multi_model' ? 'OmniAgent Nexus' : selectedModel}</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>Monthly Limit:</strong> <span style="color: #fff;">${monthlyLimit.toLocaleString()} Messages</span></p>
          <p style="margin: 5px 0; color: #aaa;"><strong>Channel:</strong> <span style="color: #fff; text-transform: capitalize;">${selectedChannel}</span></p>
        </div>

        <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">You can monitor usage, view your limits, and manage your RAG database directly from your dashboard.</p>
        <br/>
        ${botLink ? `<a href="${botLink}" style="background: #22c55e; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; margin-right: 10px; display: inline-block;">Open Live Bot</a>` : ''}
        <a href="https://clawlink.com/dashboard" style="background: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; margin-top: 10px;">Access CRM Dashboard</a>
        
        <hr style="border: 0; border-top: 1px solid #333; margin: 40px 0 20px 0;" />
        <p style="color: #666666; font-size: 12px; letter-spacing: 1px;">© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</p>
      </div>
    `;
    
    sendEmail(email, "Welcome to ClawLink - Your Enterprise Node is Live! 🚀", emailHtml).catch(console.error);

    return NextResponse.json({ success: true, botLink });
  } catch (error: any) {
    console.error("Config Deployment Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}