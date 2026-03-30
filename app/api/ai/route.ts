import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase Connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email, message, platform, userPhoneOrChatId } = await req.json();

    if (!email || !message) {
      return NextResponse.json({ success: false, reply: "System Error: Missing email or message." }, { status: 400 });
    }

    // 1. Fetch User's Knowledge Base (RAG Memory)
    const { data: kb } = await supabase
      .from("knowledge_base")
      .select("company_name, business_info")
      .eq("email", email)
      .single();

    const companyName = kb?.company_name || "Our Company";
    const businessInfo = kb?.business_info || "We are a helpful business. Please assist the customer politely.";

    // 2. Fetch User's Model Configuration (This decides which API to hit)
    const { data: config } = await supabase
      .from("user_configs")
      .select("ai_model, is_unlimited, available_tokens")
      .eq("email", email)
      .single();

    // Default to gpt-5.2 if nothing is set
    const selectedModel = config?.ai_model || "gpt-5.2"; 

    // 3. Construct the Master System Prompt
    const systemPrompt = `You are a professional, helpful, and concise AI customer support agent for ${companyName}.
    
    CORE BUSINESS KNOWLEDGE (Strictly follow this):
    ${businessInfo}
    
    RULES:
    1. Answer the customer's query strictly based on the core business knowledge provided above.
    2. If the user asks something outside this knowledge, politely inform them that you do not have that information and offer human support.
    3. Keep the response concise, formatted beautifully, and human-like. Do not use overly robotic language.`;

    let finalReply = "Sorry, I am experiencing temporary cognitive lag. Please try again.";

    // 🚀 4. STRICT INTRA-PROVIDER FALLBACK SYSTEM
    // Configuration of Fallback Models (Premium -> Mid -> Cheap)
    const geminiModels = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
    const openaiModels = ["gpt-4-turbo", "gpt-4o", "gpt-4o-mini"];
    const claudeModels = ["claude-3-opus-20240229", "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"];

    if (selectedModel === "gemini") {
      // --- GEMINI ENGINE ---
      const geminiApiKey = process.env.GEMINI_API_KEY; 
      if (!geminiApiKey) throw new Error("Gemini API Key missing");

      let geminiSuccess = false;
      for (const model of geminiModels) {
        try {
            console.log(`[Intra-Provider] Trying Gemini: ${model}`);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: { text: systemPrompt } },
                    contents: [{ parts: [{ text: message }] }]
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalReply = data.candidates[0].content.parts[0].text;
                    geminiSuccess = true;
                    break; // Exit loop on success
                }
            } else {
                 console.warn(`[Intra-Provider] Gemini ${model} failed with status: ${res.status}`);
            }
        } catch (e) {
            console.warn(`[Intra-Provider] Gemini ${model} network error:`, e);
        }
      }
      
      if(!geminiSuccess) throw new Error("All Gemini fallbacks failed.");

    } else if (selectedModel === "claude") {
      // --- CLAUDE (ANTHROPIC) ENGINE ---
      const claudeApiKey = process.env.ANTHROPIC_API_KEY;
      if (!claudeApiKey) throw new Error("Claude API Key missing");

      let claudeSuccess = false;
      for (const model of claudeModels) {
        try {
            console.log(`[Intra-Provider] Trying Claude: ${model}`);
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": claudeApiKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: model, 
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: [{ role: "user", content: message }]
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.content && data.content[0]?.text) {
                    finalReply = data.content[0].text;
                    claudeSuccess = true;
                    break; // Exit loop on success
                }
            } else {
                 console.warn(`[Intra-Provider] Claude ${model} failed with status: ${res.status}`);
            }
        } catch (e) {
             console.warn(`[Intra-Provider] Claude ${model} network error:`, e);
        }
      }

      if(!claudeSuccess) throw new Error("All Claude fallbacks failed.");

    } else {
      // --- OPENAI (GPT) ENGINE (Default for gpt-5.2) ---
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) throw new Error("OpenAI API Key missing");

      let openaiSuccess = false;
      for (const model of openaiModels) {
        try {
            console.log(`[Intra-Provider] Trying OpenAI: ${model}`);
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                    ]
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    finalReply = data.choices[0].message.content;
                    openaiSuccess = true;
                    break; // Exit loop on success
                }
            } else {
                 console.warn(`[Intra-Provider] OpenAI ${model} failed with status: ${res.status}`);
            }
        } catch (e) {
             console.warn(`[Intra-Provider] OpenAI ${model} network error:`, e);
        }
      }

      if(!openaiSuccess) throw new Error("All OpenAI fallbacks failed.");
    }

    // 5. Deduct Token if not Unlimited
    if (config && !config.is_unlimited && config.available_tokens > 0) {
      await supabase
        .from("user_configs")
        .update({ available_tokens: config.available_tokens - 1 })
        .eq("email", email);
    }

    // 6. Log Conversation into Live CRM Inbox
    await supabase.from("bot_conversations").insert({
      email: email,
      platform: platform || "unknown",
      chat_id: userPhoneOrChatId || "anonymous",
      user_message: message,
      bot_reply: finalReply
    });

    return NextResponse.json({ success: true, reply: finalReply });

  } catch (error: any) {
    console.error("Master AI Engine Error:", error);
    return NextResponse.json({ success: false, reply: "Internal Cognitive Failure. Please check API Keys in .env" }, { status: 500 });
  }
}