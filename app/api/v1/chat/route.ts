import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

export async function POST(req: Request) {
  try {
    // Authenticate via Bearer Token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized. Missing or invalid API Key." }, { status: 401 });
    }
    const apiKey = authHeader.split(" ")[1];

    // Find User by API Key
    const { data: config } = await supabase.from("user_configs").select("*").eq("developer_api_key", apiKey).single();
    if (!config) return NextResponse.json({ error: "Invalid API Key." }, { status: 403 });

    // Check Tokens
    if (!config.is_unlimited && config.available_tokens <= 0) {
      return NextResponse.json({ error: "Insufficient tokens." }, { status: 402 });
    }

    const { message, sessionId = "api_default_session" } = await req.json();
    if (!message) return NextResponse.json({ error: "Message payload is required." }, { status: 400 });

    // Deduct Token
    if (!config.is_unlimited) {
      await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", config.email);
    }

    // Call AI (Using Gemini as default for this example, you can expand to your RAG later)
    const prompt = `System: ${config.system_prompt || "You are a helpful AI."}\nUser: ${message}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.ai_model || "gemini-1.5-flash-latest"}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const aiData = await res.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "AI Processing Error.";

    // Log to CRM
    await supabase.from("bot_conversations").insert([
      { bot_email: config.email, chat_id: sessionId, role: "user", content: `[API] ${message}` },
      { bot_email: config.email, chat_id: sessionId, role: "ai", content: `[API] ${reply}` }
    ]);

    return NextResponse.json({ success: true, reply, tokens_remaining: config.is_unlimited ? "Unlimited" : config.available_tokens - 1 });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
  }
}