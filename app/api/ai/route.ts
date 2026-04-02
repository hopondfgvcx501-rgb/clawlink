import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase Connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 🛑 SECURITY LOCK: Check API Secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`) {
      console.error("🚨 [SECURITY BREACH] Unauthorized access attempt to AI Route!");
      return NextResponse.json({ success: false, reply: "Access Denied." }, { status: 401 });
    }

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

    // 2. Fetch User's Model Configuration
    const { data: config } = await supabase
      .from("user_configs")
      .select("ai_model, is_unlimited, available_tokens")
      .eq("email", email)
      .single();

    const selectedModel = config?.ai_model || "gpt-5.2"; 

    // 🧠 3. FETCH LONG-TERM MEMORY (Sliding Window - Last 20 messages)
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

    // 4. Construct the Master System Prompt
    const systemPrompt = `You are a professional, helpful, and concise AI customer support agent for ${companyName}.
    
    CORE BUSINESS KNOWLEDGE (Strictly follow this):
    ${businessInfo}
    
    RULES:
    1. Answer the customer's query strictly based on the core business knowledge provided above.
    2. If the user asks something outside this knowledge, politely inform them that you do not have that information and offer human support.
    3. Keep the response concise, formatted beautifully, and human-like. Do not use overly robotic language.`;

    let finalReply = "Sorry, I am experiencing temporary cognitive lag. Please try again.";

    // 🚀 5. STRICT INTRA-PROVIDER FALLBACK SYSTEM
    const geminiModels = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
    const openaiModels = ["gpt-4-turbo", "gpt-4o", "gpt-4o-mini"];
    const claudeModels = ["claude-3-opus-20240229", "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"];

    if (selectedModel === "gemini") {
      const geminiApiKey = process.env.GEMINI_API_KEY; 
      if (!geminiApiKey) throw new Error("Gemini API Key missing");

      // 🧠 Proper Gemini Context Array
      const contents = historyArray.map(msg => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
      }));
      contents.push({ role: "user", parts: [{ text: message }] });

      let geminiSuccess = false;
      for (const model of geminiModels) {
        try {
            console.log(`[Intra-Provider] Trying Gemini: ${model}`);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: { text: systemPrompt } },
                    contents: contents
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalReply = data.candidates[0].content.parts[0].text;
                    geminiSuccess = true;
                    break;
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
                    messages: [...historyArray, { role: "user", content: message }]
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.content && data.content[0]?.text) {
                    finalReply = data.content[0].text;
                    claudeSuccess = true;
                    break;
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
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) throw new Error("OpenAI API Key missing");

      // 🧠 Proper OpenAI Context Array
      const messages = [
          { role: "system", content: systemPrompt },
          ...historyArray,
          { role: "user", content: message }
      ];

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
                    messages: messages
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.choices && data.choices[0]?.message?.content) {
                    finalReply = data.choices[0].message.content;
                    openaiSuccess = true;
                    break; 
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

    // 6. Deduct Token if not Unlimited
    if (config && !config.is_unlimited && config.available_tokens > 0) {
      await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", email);
    }

    // 7. Save to BOTH tables to ensure memory works perfectly!
    await supabase.from("bot_conversations").insert({
      email: email, platform: platform || "unknown", chat_id: userPhoneOrChatId || "anonymous", user_message: message, bot_reply: finalReply
    });

    await supabase.from("chat_history").insert([
      { email: email, platform: platform || "web", platform_chat_id: userPhoneOrChatId || "anonymous", customer_name: "Customer", sender_type: "user", message: message },
      { email: email, platform: platform || "web", platform_chat_id: userPhoneOrChatId || "anonymous", customer_name: "Customer", sender_type: "bot", message: finalReply }
    ]);

    return NextResponse.json({ success: true, reply: finalReply });

  } catch (error: any) {
    console.error("Master AI Engine Error:", error);
    return NextResponse.json({ success: false, reply: "Internal Cognitive Failure. Please check API Keys in .env" }, { status: 500 });
  }
}