import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 AI PROVIDER FUNCTIONS
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

// 🚀 RAG EMBEDDING GENERATOR
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

export async function POST(req: Request) {
    try {
        const { email, message, sessionId } = await req.json();

        if (!email || !message || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch User Config & Plan Details
        const { data: config } = await supabase.from("user_configs").select("*").eq("email", email).single();
        if (!config) return NextResponse.json({ success: false, error: "Configuration not found" }, { status: 404 });

        // Check if out of tokens
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            return NextResponse.json({ success: true, reply: "This AI Agent is currently undergoing maintenance. Please try again later." });
        }

        // 2. Fetch RAG Knowledge
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(message);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector,
                    match_threshold: 0.65,
                    match_count: 3,
                    p_user_email: email
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {
            console.error("RAG Error:", e);
        }

        // 3. Fetch Conversation History
        const { data: pastChats } = await supabase
            .from("bot_conversations")
            .select("role, content")
            .eq("bot_email", email)
            .eq("chat_id", sessionId) // Using sessionId as the unique identifier for web chats
            .order("created_at", { ascending: false })
            .limit(5);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.role.toUpperCase()}: ${chat.content}`).join("\n");
        }

        // 4. Assemble the Prompt
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `System Instructions: ${systemPrompt}

Company Knowledge Base:
${customKnowledge ? customKnowledge : "No specific company data found for this query."}

Recent Conversation History:
${memoryHistory}

User's New Message: ${message}`;

        // Save User Message to Live CRM (Dashboard users can now see Web Widget chats too!)
        await supabase.from("bot_conversations").insert({ bot_email: email, chat_id: sessionId, role: "user", content: message });

        // 5. Call the specific AI Provider
        let aiResponse = "I'm having trouble connecting to my brain. Please try again in a moment.";
        const provider = config.ai_provider || "google";
        const model = config.ai_model || "gemini-1.5-flash-latest";

        try {
            if (provider === "openai") {
                aiResponse = await callOpenAI(model, fullContext);
            } else if (provider === "anthropic") {
                aiResponse = await callClaude(model, fullContext);
            } else {
                aiResponse = await callGemini(model, fullContext);
            }
            
            // Deduct token
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", email);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
        }

        // 6. Save AI Response to Live CRM
        await supabase.from("bot_conversations").insert({ bot_email: email, chat_id: sessionId, role: "ai", content: aiResponse });

        return NextResponse.json({ success: true, reply: aiResponse });

    } catch (error: any) {
        console.error("Widget API Error:", error.message);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}