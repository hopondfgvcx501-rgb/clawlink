import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.tokens_used >= config.tokens_allocated)) {
            return NextResponse.json({ success: true, reply: "⚠️ The owner of this website has exhausted their AI API quota." });
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

        // 3. Fetch Conversation History (From `chat_history` to sync with CRM!)
        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", email)
            .eq("platform_chat_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(5);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n");
        }

        // 4. Assemble the Prompt
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `System Instructions: ${systemPrompt}

Company Knowledge Base:
${customKnowledge ? customKnowledge : "No specific company data found for this query."}

Recent Conversation History:
${memoryHistory}

User's New Message: ${message}`;

        // 5. 🔒 CRITICAL: Save User Message to CRM using `chat_history`
        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "user", 
            message: message 
        });

        // 6. Call the specific AI Provider
        let aiResponse = "I'm having trouble connecting to my brain. Please try again in a moment.";
        const provider = config.ai_provider || "google";
        // Default to the models from the previous webhook arrays
        const model = config.selected_model || (provider === "openai" ? "gpt-4-turbo" : provider === "anthropic" ? "claude-3-opus-20240229" : "gemini-1.5-flash-latest");

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
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + 1 }).eq("email", email);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            // Fallback response handled
        }

        // 7. 🔒 CRITICAL: Save AI Response to Live CRM
        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "bot", 
            message: aiResponse 
        });

        return NextResponse.json({ success: true, reply: aiResponse });

    } catch (error: any) {
        console.error("Widget API Error:", error.message);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}