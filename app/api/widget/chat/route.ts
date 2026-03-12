import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-5.4-turbo", "gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"]
};

// Embed function for RAG
async function generateEmbedding(text: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text }] } })
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data.embedding.values;
}

// API Wrappers
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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, message, sessionId } = body; // sessionId will act as chat_id for website users

        if (!email || !message || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("email", email)
            .single();

        if (configErr || !config) return NextResponse.json({ success: false, error: "Config not found" });

        const systemPrompt = config.systemPrompt || "You are a helpful AI assistant.";
        const provider = config.ai_provider || "google";

        // Plan Check
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            return NextResponse.json({ success: true, reply: "I am currently undergoing maintenance. Please contact support directly." });
        }

        // RAG Knowledge Fetch
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(message);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: email
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) { console.error("RAG Error:", e); }

        // Memory Fetch
        const { data: pastChats } = await supabase
            .from("bot_conversations")
            .select("role, content")
            .eq("bot_email", email)
            .eq("chat_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.role.toUpperCase()}: ${chat.content}`).join("\n");
        }

        const fullContext = `System Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "None."}\n\nRecent Conversation:\n${memoryHistory}\n\nUser: ${message}`;
        
        await supabase.from("bot_conversations").insert({ bot_email: email, chat_id: sessionId, role: "user", content: message });

        let aiResponse = "I am processing high volumes of data. Please try again later.";
        let wasSuccessful = false;
        const chain = AI_CHAINS[provider] || AI_CHAINS["google"];

        for (const modelName of chain) {
            try {
                if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                else aiResponse = await callGemini(modelName, fullContext);
                wasSuccessful = true;
                break;
            } catch (err: any) { console.log(`[Widget AI] ${modelName} failed.`); }
        }

        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", email);
            }
            await supabase.from("bot_conversations").insert({ bot_email: email, chat_id: sessionId, role: "ai", content: aiResponse });
        }

        return NextResponse.json({ success: true, reply: aiResponse });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}