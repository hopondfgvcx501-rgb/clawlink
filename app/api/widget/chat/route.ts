import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ CORS HEADERS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// 🛡️ ENTERPRISE GUARDRAIL: Adaptive Master Persona & RAG Enforcement
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Advanced AI Support Agent operating on the ClawLink Engine.
1. FACTUAL INTEGRITY (RAG): For any queries regarding the company's pricing, features, services, or policies, you MUST strictly rely ONLY on the provided "Company Knowledge Base". Never invent, guess, or hallucinate business data.
2. THE ESCALATION RULE: If the user asks for a company-specific detail that is missing from the Knowledge Base, DO NOT guess. Politely state: "I don't have that specific information right now. Let me connect you with our human support team."
3. ADAPTIVE PERSONA (GENERAL CHAT): For general questions, greetings, or industry knowledge, you must dynamically adapt your tone, language, and behavior based EXACTLY on the "System Instructions" provided below. If the System Instructions tell you to be friendly, be friendly. If they tell you to be professional, be strictly professional.
`;

// =========================================================================
// 🚀 AI, RAG & VOICE HELPER FUNCTIONS
// =========================================================================

async function transcribeAudio(base64Audio: string) {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        const blob = new Blob([audioBuffer], { type: 'audio/webm' }); 

        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        formData.append("model", "whisper-1");

        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
            body: formData
        });
        const data = await res.json();
        return data.text || null;
    } catch (e) {
        console.error("Whisper Web Widget Error:", e);
        return null;
    }
}

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

async function generateEmbedding(text: string) {
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text: text }] } })
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
        const { email, message, audio, sessionId } = await req.json();

        let userText = message;
        let crmLogMessage = message;

        if (audio) {
            const transcription = await transcribeAudio(audio);
            if (transcription) {
                userText = transcription;
                crmLogMessage = `🎤 [Voice Note]: "${userText}"`;
            } else {
                return NextResponse.json({ success: true, reply: "Sorry, I couldn't process your voice clearly. Could you type it?" }, { headers: corsHeaders });
            }
        }

        if (!email || !userText || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
        }

        // 🚀 SURGICAL FIX: Fetch ANY config associated with the user, prioritize the widget one if it exists
        const { data: configList } = await supabase.from("user_configs").select("*").eq("email", email).order("created_at", { ascending: false }).limit(5);
        
        if (!configList || configList.length === 0) {
            return NextResponse.json({ success: false, error: "Configuration not found" }, { status: 404, headers: corsHeaders });
        }

        // Try to find a widget specific config, if not just use their most recently created account config
        let config = configList.find(c => c.selected_channel === 'widget') || configList[0];

        const isUnlimited = config.is_unlimited || config.plan_name === "max" || config.plan_name === "ultra_max";
        const messagesUsed = config.messages_used_this_month || 0;
        const monthlyLimit = config.monthly_message_limit || 1000;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        if (isExpired || (!isUnlimited && messagesUsed >= monthlyLimit)) {
            const maintenanceMsg = "Hello! Our AI assistant is currently undergoing a brief scheduled maintenance to serve you better. Please leave your query and our human support team will get back to you shortly. Thank you for your patience!";
            return NextResponse.json({ success: true, reply: maintenanceMsg }, { headers: corsHeaders });
        }

        if (userText.length > 800) {
            userText = userText.substring(0, 800) + "...";
        }

        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: email
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {}

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

        const systemPrompt = config.system_prompt_widget || config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "No specific company data found for this query."}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${userText}`;

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "user", 
            message: crmLogMessage 
        });

        // =========================================================================
        // 8. 🧠 CLAWLINK PROFIT MAXIMIZER & SMART FALLBACK ENGINE
        // =========================================================================
        let aiResponse = "I am having trouble connecting to my neural network. Please try again in a moment.";
        let wasSuccessful = false;
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 

        if (rawProvider === "multi_model" || rawProvider === "omni" || rawProvider === "nexus") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (messagesUsed / (monthlyLimit || 1)) * 100;
        
        // 🚀 TIERED MODELS CONFIGURATION (Actual API Strings)
        const GEMINI_CHEAP = "gemini-1.5-flash-8b";
        const GEMINI_MID = "gemini-1.5-flash";
        const GEMINI_PREMIUM = "gemini-1.5-pro";
        
        const GPT_CHEAP = "gpt-4o-mini";
        const GPT_MID = "gpt-4o";
        const GPT_PREMIUM = "gpt-4-turbo";
        
        const CLAUDE_CHEAP = "claude-3-haiku-20240307";
        const CLAUDE_MID = "claude-3-5-sonnet-20240620";
        const CLAUDE_PREMIUM = "claude-3-opus-20240229";

        let targetProvider = provider;
        let targetModel = "";

        // 🧠 COMPLEXITY & BUDGET ROUTER
        if (provider === "omni") {
            // OMNI BUNDLE (Cross-Provider allowed)
            if (usageRatio >= 80) {
                targetProvider = "google"; targetModel = GEMINI_CHEAP; 
            } else if (usageRatio >= 60) {
                targetProvider = "openai"; targetModel = words < 40 ? GPT_CHEAP : GPT_MID;
            } else {
                if (words < 40) { targetProvider = "google"; targetModel = GEMINI_MID; }
                else if (words < 150) { targetProvider = "openai"; targetModel = GPT_MID; }
                else { targetProvider = "anthropic"; targetModel = CLAUDE_PREMIUM; } 
            }
        } else {
            // NORMAL PLAN (Single Provider Strict Logic)
            if (usageRatio >= 85) {
                // High Budget Danger: Force Cheapest Model of their chosen provider
                if (provider === "openai") targetModel = GPT_CHEAP;
                else if (provider === "anthropic") targetModel = CLAUDE_CHEAP;
                else targetModel = GEMINI_CHEAP;
            } else {
                // Adaptive by Complexity (Word Count)
                if (provider === "openai") targetModel = words < 40 ? GPT_CHEAP : (words > 150 ? GPT_PREMIUM : GPT_MID);
                else if (provider === "anthropic") targetModel = words < 40 ? CLAUDE_CHEAP : (words > 150 ? CLAUDE_PREMIUM : CLAUDE_MID);
                else targetModel = words < 40 ? GEMINI_CHEAP : (words > 150 ? GEMINI_PREMIUM : GEMINI_MID);
            }
        }

        // ⚡ EXECUTION & FALLBACK ENGINE
        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullContext);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullContext);
            else aiResponse = await callGemini(targetModel, fullContext);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[Widget AI Error] ${targetModel} failed.`);
            
            // 🛡️ FALLBACK LOGIC
            if (provider === "omni") {
                // CROSS-PROVIDER FALLBACK
                console.log("[Omni Fallback] Routing to GPT-4o-mini...");
                try {
                    aiResponse = await callOpenAI(GPT_CHEAP, fullContext);
                    wasSuccessful = true;
                } catch (err2) {
                    console.log("[Omni Fallback 2] Routing to Gemini Flash...");
                    try {
                        aiResponse = await callGemini(GEMINI_CHEAP, fullContext);
                        wasSuccessful = true;
                    } catch (err3) { console.error("[Omni] All cross-provider fallbacks failed."); }
                }
            } else {
                // INTRA-PROVIDER FALLBACK (Protecting tokens for single-provider users)
                console.log(`[Intra-Provider Fallback] ${provider} downgrading to cheaper model...`);
                try {
                    if (provider === "anthropic") aiResponse = await callClaude(CLAUDE_CHEAP, fullContext);
                    else if (provider === "openai") aiResponse = await callOpenAI(GPT_CHEAP, fullContext);
                    else aiResponse = await callGemini(GEMINI_CHEAP, fullContext);
                    wasSuccessful = true;
                } catch (err2) {
                    console.error(`[Intra-Provider] Fallback failed for ${provider}.`);
                }
            }
        }

        if (wasSuccessful) {
            await supabase.from("user_configs").update({ messages_used_this_month: messagesUsed + 1 }).eq("email", email);
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + 1 }).eq("email", email);
            }
        }

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "bot", 
            message: aiResponse 
        });

        return NextResponse.json({ success: true, reply: aiResponse }, { headers: corsHeaders });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}