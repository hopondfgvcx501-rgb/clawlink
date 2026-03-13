import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]
};

// =========================================================================
// 🚀 AI & RAG HELPER FUNCTIONS
// =========================================================================
async function generateEmbedding(text: string) {
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text }] } })
        });
        const data = await res.json();
        return res.ok ? data.embedding.values : null;
    } catch (e) {
        return null;
    }
}

async function callGemini(model: string, prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Claude Error");
    return data.content[0].text;
}

// =========================================================================
// 🚀 MAIN TELEGRAM WEBHOOK PROCESSOR
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Verify Telegram Payload
        if (!body.message || !body.message.text) {
            return NextResponse.json({ success: true }); // Ignore non-text messages safely
        }

        const chatId = body.message.chat.id.toString();
        const userText = body.message.text;

        // 2. Fetch Active Bot Config (For multi-tenant SaaS)
        // Note: For advanced multi-tenant, we assume the active config is the one with telegram enabled.
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .not("telegram_token", "is", null)
            .limit(1)
            .single();

        if (configErr || !config || !config.telegram_token) {
            return NextResponse.json({ success: true });
        }

        const telegramToken = config.telegram_token;
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        const userEmail = config.email;
        const provider = config.ai_provider || "google";

        // 3. Token & Plan Verification
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "This AI Agent is currently undergoing routine maintenance. We will be back online shortly." })
            });
            return NextResponse.json({ success: true });
        }

        // 4. RAG KNOWLEDGE FETCH (Vector DB)
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector,
                    match_threshold: 0.65,
                    match_count: 3,
                    p_user_email: userEmail
                });
                
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {
            console.error("RAG Fetch Error:", e);
        }

        // 5. FETCH CONVERSATION HISTORY (Memory)
        const { data: pastChats } = await supabase
            .from("bot_conversations")
            .select("role, content")
            .eq("bot_email", userEmail)
            .eq("chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.role.toUpperCase()}: ${chat.content}`).join("\n");
        }

        // 6. ASSEMBLE FULL AI PROMPT
        const fullContext = `System Instructions: ${systemPrompt}

Company Knowledge Base:
${customKnowledge ? customKnowledge : "No specific company data found for this query."}

Recent Conversation History:
${memoryHistory}

User's New Message: ${userText}`;
        
        // Save User Message to Live CRM Database
        await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "user", content: userText });

        // 7. THE AI WATERFALL SYSTEM
        let aiResponse = "Processing... Please wait.";
        let wasSuccessful = false;
        const chain = AI_CHAINS[provider] || AI_CHAINS["google"];

        for (const modelName of chain) {
            try {
                if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                else aiResponse = await callGemini(modelName, fullContext);
                
                wasSuccessful = true;
                break; // Model success!
            } catch (err: any) {
                console.log(`[Telegram AI Error] ${modelName} failed. Trying next...`);
            }
        }

        // 8. CHARGE TOKENS & SAVE AI RESPONSE
        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", userEmail);
            }
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "ai", content: aiResponse });
        }

        // 9. DISPATCH FINAL MESSAGE TO TELEGRAM
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Telegram Webhook Error:", error.message);
        // Always return 200 so Telegram doesn't retry infinitely
        return NextResponse.json({ success: true }); 
    }
}