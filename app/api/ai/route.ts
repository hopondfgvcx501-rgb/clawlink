import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase Connection Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // SECURITY LOCK: Validate internal master secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`) {
      console.error("🚨 [SECURITY BREACH] Unauthorized access attempt to AI Route!");
      return NextResponse.json({ success: false, reply: "Access Denied." }, { status: 401 });
    }

    const { email, message, platform, userPhoneOrChatId } = await req.json();

    if (!email || !message) {
      return NextResponse.json({ success: false, reply: "System Error: Missing email or message." }, { status: 400 });
    }

    // FIX: Temporarily bypassed missing Redis rate-limiter logic for successful Vercel Build
    const forceCheapModel = false; 

    // 1. Fetch User's Knowledge Base
    const { data: kb } = await supabase
      .from("knowledge_base")
      .select("company_name, business_info")
      .eq("email", email)
      .single();

    const companyName = kb?.company_name || "Our Company";
    const businessInfo = kb?.business_info || "We are a helpful business. Please assist the customer politely.";

    // 2. Fetch User's Model Configuration
    const { data: config } = await supabase
      .from("user_configs")
      .select("ai_model, is_unlimited, available_tokens, tokens_used")
      .eq("email", email)
      .single();

    const rawSelectedModel = (config?.ai_model || "gpt-5.4 Pro").toLowerCase();
    
    let selectedModel = "openai";
    if (rawSelectedModel.includes("omni") || rawSelectedModel.includes("nexus")) selectedModel = "omni";
    else if (rawSelectedModel.includes("claude") || rawSelectedModel.includes("opus")) selectedModel = "anthropic";
    else if (rawSelectedModel.includes("gemini")) selectedModel = "gemini";
    else selectedModel = "openai";

    const isUnlimited = config?.is_unlimited || false;
    const tokensUsed = config?.tokens_used || 0;
    const tokensAllocated = config?.available_tokens || 10000;
    const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
    const words = message.split(/\s+/).length;

    // 3. FETCH LONG-TERM CONVERSATIONAL MEMORY
    const { data: pastChats } = await supabase
      .from("chat_history")
      .select("sender_type, message")
      .eq("email", email)
      .eq("platform_chat_id", userPhoneOrChatId || "anonymous")
      .order("created_at", { ascending: false })
      .limit(20);

    let historyArray: any[] = [];
    if (pastChats && pastChats.length > 0) {
      historyArray = pastChats.reverse().map(chat => ({
        role: chat.sender_type === "bot" ? "assistant" : "user",
        content: chat.message
      }));
    }

    const systemPrompt = `You are a professional, helpful, and concise AI customer support agent for ${companyName}.
    CORE BUSINESS KNOWLEDGE (Strictly follow this):
    ${businessInfo}
    RULES:
    1. Answer the customer's query strictly based on the core business knowledge provided above.
    2. If the user asks something outside this knowledge, politely inform them that you do not have that information and offer human support.
    3. Keep the response concise, formatted beautifully, and human-like.`;

    let finalReply = "Sorry, I am experiencing temporary cognitive lag. Please try again.";
    let wasSuccessful = false;

    // FIX: Updated Anthropic Claude API IDs to stable pointers to prevent 400 Bad Request crashes
    const GEMINI_CHEAP = "gemini-1.5-flash"; 
    const GEMINI_MID = "gemini-1.5-flash";
    const GEMINI_PREMIUM = "gemini-1.5-pro";
    const GEMINI_FALLBACKS = [GEMINI_PREMIUM, GEMINI_MID, GEMINI_CHEAP];
    
    const GPT_CHEAP = "gpt-3.5-turbo"; 
    const GPT_MID = "gpt-4o-mini";
    const GPT_PREMIUM = "gpt-4o";
    const GPT_FALLBACKS = [GPT_PREMIUM, GPT_MID, GPT_CHEAP];
    
    // Stable Anthropic identifiers mapped to your 2026 UI
    const CLAUDE_CHEAP = "claude-3-haiku-20240307"; 
    const CLAUDE_MID = "claude-3-5-sonnet-latest";
    const CLAUDE_PREMIUM = "claude-3-opus-20240229";
    const CLAUDE_FALLBACKS = [CLAUDE_PREMIUM, CLAUDE_MID, CLAUDE_CHEAP];

    // ==========================================
    // THE ROUTER ALGORITHM
    // ==========================================
    if (selectedModel === "omni") {
        console.log(`[ROUTER] Omni Engine Active. Complexity: ${words} words, Usage: ${usageRatio.toFixed(2)}%`);
        if (forceCheapModel || usageRatio >= 80) { 
            wasSuccessful = await attemptFetch(GEMINI_CHEAP, "gemini");
            if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai");
            if (!wasSuccessful) wasSuccessful = await attemptFetch(CLAUDE_CHEAP, "anthropic");
        } else if (usageRatio >= 60) {
            wasSuccessful = await attemptFetch(words < 40 ? GPT_CHEAP : GPT_MID, "openai");
            if (!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_MID, "gemini");
        } else {
            if (words < 40) wasSuccessful = await attemptFetch(GEMINI_MID, "gemini");
            else if (words < 150) wasSuccessful = await attemptFetch(GPT_MID, "openai");
            else wasSuccessful = await attemptFetch(CLAUDE_PREMIUM, "anthropic");
        }
        if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai");

    } else if (selectedModel === "anthropic") {
        console.log(`[ROUTER] Claude Only Active.`);
        let targetModel = CLAUDE_MID;
        if (forceCheapModel || usageRatio >= 85 || words < 40) targetModel = CLAUDE_CHEAP; 
        else if (words > 150) targetModel = CLAUDE_PREMIUM;

        wasSuccessful = await attemptFetch(targetModel, "anthropic");
        if (!wasSuccessful) {
            for (const fallback of CLAUDE_FALLBACKS) {
                if (fallback !== targetModel) {
                    wasSuccessful = await attemptFetch(fallback, "anthropic");
                    if (wasSuccessful) break;
                }
            }
        }
    } else if (selectedModel === "gemini") {
        console.log(`[ROUTER] Gemini Only Active.`);
        let targetModel = GEMINI_MID;
        if (forceCheapModel || usageRatio >= 85 || words < 40) targetModel = GEMINI_CHEAP; 
        else if (words > 150) targetModel = GEMINI_PREMIUM;

        wasSuccessful = await attemptFetch(targetModel, "gemini");
        if (!wasSuccessful) {
            for (const fallback of GEMINI_FALLBACKS) {
                if (fallback !== targetModel) {
                    wasSuccessful = await attemptFetch(fallback, "gemini");
                    if (wasSuccessful) break;
                }
            }
        }
    } else {
        console.log(`[ROUTER] OpenAI Only Active.`);
        let targetModel = GPT_MID;
        if (forceCheapModel || usageRatio >= 85 || words < 40) targetModel = GPT_CHEAP; 
        else if (words > 150) targetModel = GPT_PREMIUM;

        wasSuccessful = await attemptFetch(targetModel, "openai");
        if (!wasSuccessful) {
            for (const fallback of GPT_FALLBACKS) {
                if (fallback !== targetModel) {
                    wasSuccessful = await attemptFetch(fallback, "openai");
                    if (wasSuccessful) break;
                }
            }
        }
    }

    if (!wasSuccessful) {
        throw new Error("All provider fallbacks exhausted or API keys are invalid.");
    }

    // 6. Deduct Token if not Unlimited
    if (config && !config.is_unlimited && config.available_tokens > 0) {
      await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", email);
    }

    // 7. Save to Database
    await supabase.from("bot_conversations").insert({
      email: email, platform: platform || "unknown", chat_id: userPhoneOrChatId || "anonymous", user_message: message, bot_reply: finalReply
    });

    await supabase.from("chat_history").insert([
      { email: email, platform: platform || "web", platform_chat_id: userPhoneOrChatId || "anonymous", customer_name: "Customer", sender_type: "user", message: message },
      { email: email, platform: platform || "web", platform_chat_id: userPhoneOrChatId || "anonymous", customer_name: "Customer", sender_type: "bot", message: finalReply }
    ]);

    return NextResponse.json({ success: true, reply: finalReply });

    // ==========================================
    // EXECUTION HELPERS
    // ==========================================
    async function attemptFetch(modelName: string, provider: string): Promise<boolean> {
        try {
            if (provider === "gemini") {
                const geminiApiKey = process.env.GEMINI_API_KEY; 
                if (!geminiApiKey) return false;
                
                const contents = historyArray.map(msg => ({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.content }]
                }));
                contents.push({ role: "user", parts: [{ text: message }] });

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ system_instruction: { parts: { text: systemPrompt } }, contents: contents })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        finalReply = data.candidates[0].content.parts[0].text;
                        return true;
                    }
                }
            } else if (provider === "anthropic") {
                const claudeApiKey = process.env.ANTHROPIC_API_KEY;
                if (!claudeApiKey) return false;
                
                const res = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: { "x-api-key": claudeApiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
                    body: JSON.stringify({ model: modelName, max_tokens: 1024, system: systemPrompt, messages: [...historyArray, { role: "user", content: message }] })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.content?.[0]?.text) {
                        finalReply = data.content[0].text;
                        return true;
                    }
                }
            } else {
                const openaiApiKey = process.env.OPENAI_API_KEY;
                if (!openaiApiKey) return false;

                const messages = [ { role: "system", content: systemPrompt }, ...historyArray, { role: "user", content: message } ];
                const res = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST", headers: { "Authorization": `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ model: modelName, messages: messages })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.choices?.[0]?.message?.content) {
                        finalReply = data.choices[0].message.content;
                        return true;
                    }
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

  } catch (error: any) {
    console.error("Master AI Engine Error:", error);
    
    // CRITICAL ERROR LOGGING: Dispatch fatal errors directly to Admin Telegram Bot
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN; 
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID; 
        if (adminChatId && token) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: adminChatId, text: `⚠️ [API/AI CRASH] WhatsApp/IG Route: ${error.message || "Unknown Runtime Exception"}` })
            });
        }
    } catch (e) {
        console.error("Failed to alert Admin on Telegram", e);
    }

    return NextResponse.json({ success: false, reply: "Internal Cognitive Failure. System engineers have been notified." }, { status: 500 });
  }
}