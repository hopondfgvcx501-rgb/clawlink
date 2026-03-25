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

// 🛡️ ENTERPRISE GUARDRAIL: Strict RAG Enforcement & Human Handoff Protocol
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Company Knowledge to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated/angry, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and highly polite. Never argue with the customer.
`;

const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]
};

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

        const { data: config } = await supabase.from("user_configs").select("*").eq("email", email).single();
        if (!config) return NextResponse.json({ success: false, error: "Configuration not found" }, { status: 404, headers: corsHeaders });

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

        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "No specific company data found for this query."}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${userText}`;

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "user", 
            message: crmLogMessage 
        });

        let aiResponse = "I am having trouble connecting to my neural network. Please try again in a moment.";
        let wasSuccessful = false;
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 

        if (rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (messagesUsed / (monthlyLimit || 1)) * 100;
        
        const CHEAP_MODEL = "gemini-1.5-flash";
        const MEDIUM_MODEL = "gpt-4o-mini";
        const EXPENSIVE_MODEL = "claude-3-5-sonnet-20240620";

        let targetProvider = "google";
        let targetModel = CHEAP_MODEL;

        if (provider === "omni") {
            if (usageRatio >= 80) {
                targetProvider = "google"; targetModel = CHEAP_MODEL; 
            } else if (usageRatio >= 60) {
                if (words < 40) { targetProvider = "google"; targetModel = CHEAP_MODEL; }
                else { targetProvider = "openai"; targetModel = MEDIUM_MODEL; }
            } else {
                if (words < 40) { targetProvider = "google"; targetModel = CHEAP_MODEL; }
                else if (words < 150) { targetProvider = "openai"; targetModel = MEDIUM_MODEL; }
                else { targetProvider = "anthropic"; targetModel = EXPENSIVE_MODEL; } 
            }
        } else {
            if (usageRatio >= 80) {
                targetProvider = "google"; targetModel = CHEAP_MODEL;
            } else {
                targetProvider = provider;
                if (provider === "openai") targetModel = words < 40 ? "gpt-4o-mini" : "gpt-4o";
                else if (provider === "anthropic") targetModel = words < 40 ? "claude-3-haiku-20240307" : "claude-3-5-sonnet-20240620";
                else targetModel = "gemini-1.5-flash";
            }
        }

        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullContext);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullContext);
            else aiResponse = await callGemini(targetModel, fullContext);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[Widget AI Error] ${targetModel} failed. Routing to GPT Mini...`);
            try {
                aiResponse = await callOpenAI(MEDIUM_MODEL, fullContext);
                wasSuccessful = true;
            } catch (err2) {
                console.error(`[Widget AI Error] GPT Mini failed. Routing to Gemini Flash...`);
                try {
                    aiResponse = await callGemini(CHEAP_MODEL, fullContext);
                    wasSuccessful = true;
                } catch (err3) {
                    console.error(`[Widget AI Error] All providers failed.`);
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