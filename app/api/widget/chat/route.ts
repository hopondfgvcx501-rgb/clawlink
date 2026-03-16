import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 STRICT INTRA-PROVIDER FALLBACK ARCHITECTURE (For Normal Models)
const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]
};

// =========================================================================
// 🚀 AI & RAG HELPER FUNCTIONS
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

// =========================================================================
// 🚀 MAIN WIDGET CHAT PROCESSOR
// =========================================================================
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
            return NextResponse.json({ success: true, reply: "⚠️ The owner of this website has exhausted their API quota." });
        }

        // 2. Fetch RAG Knowledge (Vector DB)
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
            console.error("RAG Extraction Error:", e);
        }

        // 3. Fetch Conversation History (From `chat_history` to sync with CRM)
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

        // 4. Assemble the System Prompt & Full Context
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `System Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "No specific company data found for this query."}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${message}`;

        // 5. 🔒 CRITICAL: Save User Message to CRM using `chat_history`
        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "user", 
            message: message 
        });

        // 6. 🚦 THE TRAFFIC POLICEMAN (OMNIAGENT NEXUS ROUTING LOGIC)
        let aiResponse = "I am having trouble connecting to my neural network. Please try again in a moment.";
        let wasSuccessful = false;
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 

        if (rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        if (provider === "omni") {
            // 🚀 ROUTE TO VIP OMNI ENGINE
            console.log("🚦 [WIDGET ROUTER] Redirecting request to OmniAgent Nexus Engine...");
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://clawlink-six.vercel.app";
            
            try {
                const omniRes = await fetch(`${baseUrl}/api/omni`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: message,
                        systemPrompt: `System Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}`,
                        history: pastChats ? pastChats.reverse().map(chat => ({ role: chat.sender_type === "bot" ? "assistant" : "user", content: chat.message })) : []
                    })
                });

                if (omniRes.ok) {
                    const omniData = await omniRes.json();
                    if (omniData.success) {
                        aiResponse = omniData.reply;
                        wasSuccessful = true;
                    }
                }
            } catch (err) {
                console.error("❌ [WIDGET ROUTER] Omni Engine call failed:", err);
            }
        } else {
            // 🚗 ROUTE TO NORMAL INTRA-PROVIDER ENGINE
            console.log(`🚦 [WIDGET ROUTER] Processing request locally via Normal Engine: ${provider}...`);
            const chain = AI_CHAINS[provider] || AI_CHAINS["openai"];
            
            for (const modelName of chain) {
                try {
                    if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                    else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                    else aiResponse = await callGemini(modelName, fullContext);
                    
                    wasSuccessful = true;
                    break; // Stop waterfall loop on successful response
                } catch (error: any) {
                    console.error(`[Widget AI Error] ${modelName} failed:`, error.message);
                    // Continues to fallback model within the same provider chain
                }
            }
        }

        // 7. 🔒 CRITICAL: Charge Tokens & Save AI Response to Live CRM
        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + 1 }).eq("email", email);
            }
            await supabase.from("chat_history").insert({ 
                email: email, 
                platform: "web",
                platform_chat_id: sessionId, 
                customer_name: "Web Visitor",
                sender_type: "bot", 
                message: aiResponse 
            });
        }

        return NextResponse.json({ success: true, reply: aiResponse });

    } catch (error: any) {
        console.error("Widget API Fatal Error:", error.message);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}