import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚨 VERCEL BUILD FIX: Force dynamic execution
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 🚀 AI HELPER FUNCTIONS (FOR NORMAL MODELS)
// =========================================================================
async function callGemini(model: string, prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini API Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI API Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Claude API Error");
    return data.content[0].text;
}

// =========================================================================
// 🚀 MAIN DEVELOPER API ENDPOINT
// =========================================================================
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

    // Assemble Prompt
    const systemPrompt = config.system_prompt || "You are a helpful AI.";
    const fullContext = `System: ${systemPrompt}\nUser: ${message}`;

    // 🚦 THE TRAFFIC POLICEMAN (OMNIAGENT NEXUS ROUTING LOGIC)
    let reply = "AI Processing Error.";
    let wasSuccessful = false;
    
    let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
    let provider = "openai"; 

    if (rawProvider === "multi_model") provider = "omni";
    else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
    else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

    if (provider === "omni") {
        // 🚀 ROUTE TO VIP OMNI ENGINE
        console.log("🚦 [DEV API] Redirecting request to OmniAgent Nexus Engine...");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.clawlinkai.com";
        
        try {
            const omniRes = await fetch(`${baseUrl}/api/omni`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: message,
                    systemPrompt: systemPrompt,
                    history: [] 
                })
            });

            if (omniRes.ok) {
                const omniData = await omniRes.json();
                if (omniData.success) {
                    reply = omniData.reply;
                    wasSuccessful = true;
                }
            }
        } catch (err) {
            console.error("❌ [DEV API] Omni Engine call failed:", err);
        }
    } else {
        // 🚗 ROUTE TO NORMAL ENGINE
        console.log(`🚦 [DEV API] Processing request locally via Normal Engine: ${provider}...`);
        const modelToUse = config.selected_model || (provider === "openai" ? "gpt-4-turbo" : provider === "anthropic" ? "claude-3-opus-20240229" : "gemini-1.5-flash-latest");

        try {
            if (provider === "openai") reply = await callOpenAI(modelToUse, fullContext);
            else if (provider === "anthropic") reply = await callClaude(modelToUse, fullContext);
            else reply = await callGemini(modelToUse, fullContext);
            wasSuccessful = true;
        } catch (err: any) {
            console.error(`[DEV AI Error] ${modelToUse} failed:`, err.message);
        }
    }

    // Deduct Token & Log to CRM (Only on success)
    if (wasSuccessful) {
        if (!config.is_unlimited) {
            await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", config.email);
        }
        await supabase.from("bot_conversations").insert([
            { bot_email: config.email, chat_id: sessionId, role: "user", content: `[API] ${message}` },
            { bot_email: config.email, chat_id: sessionId, role: "ai", content: `[API] ${reply}` }
        ]);
    }

    return NextResponse.json({ success: true, reply, tokens_remaining: config.is_unlimited ? "Unlimited" : config.available_tokens - 1 });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error." }, { status: 500 });
  }
}