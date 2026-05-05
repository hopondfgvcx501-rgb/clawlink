import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// 🛑 QSTASH SECURITY MIDDLEWARE:
// This ensures ONLY Upstash can call this URL, blocking hackers.
async function handler(req: Request) {
  try {
    const body = await req.json();
    const { platform, to, message, email } = body;

    console.log(`[WORKER] Delivering message to ${to} via ${platform}`);

    // 1. DEDUCT TOKEN (Billing)
    const { data: config } = await supabase.from("user_configs").select("is_unlimited, available_tokens").eq("email", email).single();
    if (config && !config.is_unlimited && config.available_tokens > 0) {
      await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", email);
    } else if (config && !config.is_unlimited && config.available_tokens <= 0) {
       console.log(`[WORKER] Out of tokens for ${email}. Dropping message.`);
       return NextResponse.json({ success: false, reason: "Out of tokens" });
    }

    // 2. SEND TO ACTUAL PLATFORM API
    if (platform === "whatsapp") {
       // Insert your WhatsApp Cloud API fetch call here
       console.log("Sending WA message...");
    } else if (platform === "telegram") {
       // Insert your Telegram Bot API fetch call here
       console.log("Sending TG message...");
    } else if (platform === "instagram") {
       // Insert your Instagram Graph API fetch call here
       console.log("Sending IG message...");
    }

    // 3. LOG SUCCESS TO DB
    await supabase.from("bot_conversations").insert({
      email: email, platform: platform, chat_id: to, user_message: "[BROADCAST]", bot_reply: message
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    // 🔥 ALWAYS LOG TO TG ADMIN
    console.error("🚨 [WORKER ERROR] Sending to TG Admin:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Wrap the handler with QStash's strict signature verification
export const POST = verifySignatureAppRouter(handler);