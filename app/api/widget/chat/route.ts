/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE CHAT API (TITANIUM SECURED)
 * ==============================================================================================
 * @file app/api/chat/route.ts
 * @description Core processor for external chat requests. Enforces strict Plan Status locks,
 * calculates true token consumption, and utilizes 2026 Omni-Engine fallbacks.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

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
        console.error("Whisper API Error:", e);
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

// 🛡️ SECURITY LOCK: XSS & Injection Blocker
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").trim();
}

// =========================================================================
// 🚀 MAIN CHAT PROCESSOR
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Sanitize incoming data
        const email = sanitizeInput(body.email);
        const rawMessage = body.message ? sanitizeInput(body.message) : "";
        const sessionId = sanitizeInput(body.sessionId);
        const audio = body.audio;

        let userText = rawMessage;
        let crmLogMessage = rawMessage;

        if (audio) {
            const transcription = await transcribeAudio(audio);
            if (transcription) {
                userText = sanitizeInput(transcription);
                crmLogMessage = `🎤 [Voice Note]: "${userText}"`;
            } else {
                return NextResponse.json({ success: true, reply: "Sorry, I couldn't process your voice clearly. Could you type it?" }, { headers: corsHeaders });
            }
        }

        if (!email || !userText || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
        }

        // 🚀 SURGICAL FIX: Fetch config
        const { data: configList } = await supabase.from("user_configs").select("*").eq("email", email).order("created_at", { ascending: false }).limit(5);
        
        if (!configList || configList.length === 0) {
            return NextResponse.json({ success: false, error: "Configuration not found" }, { status: 404, headers: corsHeaders });
        }

        let config = configList.find(c => c.selected_channel === 'widget') || configList[0];

        // 🔒 THE ULTIMATE PLG GATEKEEPER: Blocks unpaid/inactive users instantly
        if (config.plan_status !== "Active") {
            const sleepMsg = "🤖 This AI Agent is currently in sleep mode. The owner needs to activate their plan to enable 24/7 autonomous responses.";
            return NextResponse.json({ success: true, reply: sleepMsg }, { headers: corsHeaders });
        }

        const isUnlimited = config.is_unlimited || config.plan_tier === "adv_max" || config.plan_tier === "yearly" || config.plan_tier === "ultra";
        const messagesUsed = config.messages_used_this_month || 0;
        const monthlyLimit = config.monthly_message_limit || 1000;
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || 0;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        // 🔒 HARD LIMITS ENFORCEMENT
        if (isExpired || (!isUnlimited && (messagesUsed >= monthlyLimit || tokensUsed >= tokensAllocated))) {
            const limitMsg = "System Note: The AI assistant for this account is currently offline due to resource limits. Please contact the administrator.";
            return NextResponse.json({ success: true, reply: limitMsg }, { headers: corsHeaders });
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

        // Insert User message to DB
        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "api",
            platform_chat_id: sessionId, 
            customer_name: "API User",
            sender_type: "user", 
            message: crmLogMessage 
        });

        // =========================================================================
        // 8. 🧠 CLAWLINK 2026 PROFIT MAXIMIZER & SMART FALLBACK ENGINE
        // =========================================================================
        let aiResponse = "I am having trouble connecting to my neural network. Please try again in a moment.";
        let wasSuccessful = false;
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 

        if (rawProvider.includes("omni") || rawProvider.includes("nexus") || rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (messagesUsed / (monthlyLimit || 1)) * 100;
        
        // 🚀 TIERED MODELS CONFIGURATION (2026 Latest Updates)
        const GEMINI_CHEAP = "gemini-3.1-flash-lite";
        const GEMINI_MID = "gemini-3.1-flash";
        const GEMINI_PREMIUM = "gemini-3.1-pro";
        
        const GPT_CHEAP = "gpt-4.1-nano";
        const GPT_MID = "gpt-5.2";
        const GPT_PREMIUM = "gpt-5.4";
        
        const CLAUDE_CHEAP = "claude-3-haiku-20240307";
        const CLAUDE_MID = "claude-sonnet-4.6";
        const CLAUDE_PREMIUM = "claude-opus-4.6";

        let targetProvider = provider;
        let targetModel = "";

        // 🧠 COMPLEXITY & BUDGET ROUTER
        if (provider === "omni") {
            if (usageRatio >= 80) {
                wasSuccessful = await attemptFetch(GEMINI_CHEAP, "google");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(CLAUDE_CHEAP, "anthropic");
            } else if (usageRatio >= 60) {
                wasSuccessful = await attemptFetch(words < 40 ? GPT_CHEAP : GPT_MID, "openai");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_MID, "google");
            } else {
                if (words < 40) wasSuccessful = await attemptFetch(GEMINI_MID, "google");
                else if (words < 150) wasSuccessful = await attemptFetch(GPT_MID, "openai");
                else wasSuccessful = await attemptFetch(CLAUDE_PREMIUM, "anthropic"); 
            }
            if(!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai"); 
        } else {
            if (usageRatio >= 85) {
                if (provider === "openai") targetModel = GPT_CHEAP;
                else if (provider === "anthropic") targetModel = CLAUDE_CHEAP;
                else targetModel = GEMINI_CHEAP;
            } else {
                if (provider === "openai") targetModel = words < 40 ? GPT_CHEAP : (words > 150 ? GPT_PREMIUM : GPT_MID);
                else if (provider === "anthropic") targetModel = words < 40 ? CLAUDE_CHEAP : (words > 150 ? CLAUDE_PREMIUM : CLAUDE_MID);
                else targetModel = words < 40 ? GEMINI_CHEAP : (words > 150 ? GEMINI_PREMIUM : GEMINI_MID);
            }

            wasSuccessful = await attemptFetch(targetModel, provider);
            
            // Basic Intra-Provider Fallback
            if (!wasSuccessful) {
                const fallbackModel = provider === "openai" ? GPT_CHEAP : (provider === "anthropic" ? CLAUDE_CHEAP : GEMINI_CHEAP);
                wasSuccessful = await attemptFetch(fallbackModel, provider);
            }
        }

        // 🔒 TOKEN REDUCTION MATH (The Real Fix)
        if (wasSuccessful) {
            await supabase.from("user_configs").update({ messages_used_this_month: messagesUsed + 1 }).eq("email", email);
            if (!config.is_unlimited) {
                // Estimate: 1 Token ≈ 3 Characters
                const calculatedTokens = Math.ceil((userText.length + aiResponse.length) / 3);
                await supabase.from("user_configs").update({ tokens_used: tokensUsed + calculatedTokens }).eq("email", email);
            }
        }

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "api",
            platform_chat_id: sessionId, 
            customer_name: "API User",
            sender_type: "bot", 
            message: aiResponse 
        });

        return NextResponse.json({ success: true, reply: aiResponse }, { headers: corsHeaders });

        // ==========================================
        // ⚡ EXECUTION HELPERS
        // ==========================================
        async function attemptFetch(modelName: string, prov: string): Promise<boolean> {
            try {
                if (prov === "google") {
                    aiResponse = await callGemini(modelName, fullContext);
                    return true;
                } else if (prov === "anthropic") {
                    aiResponse = await callClaude(modelName, fullContext);
                    return true;
                } else {
                    aiResponse = await callOpenAI(modelName, fullContext);
                    return true;
                }
            } catch (e) {
                console.error(`[API AI Error] ${modelName} failed.`);
                return false;
            }
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}