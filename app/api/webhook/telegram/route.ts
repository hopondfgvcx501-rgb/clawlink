import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIX: Removed external import to prevent Vercel build errors
const sendEmail = async (...args: any[]) => console.log("Email disabled");

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 1500; // Ultra-fast Telegram cooldown

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ ENTERPRISE GUARDRAIL: Adaptive Master Persona & RAG Enforcement
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Advanced AI Support Agent operating on the ClawLink Engine.
1. FACTUAL INTEGRITY (RAG): For any queries regarding the company's pricing, features, services, or policies, you MUST strictly rely ONLY on the provided "Company Knowledge Base". Never invent, guess, or hallucinate business data.
2. THE ESCALATION RULE: If the user asks for a company-specific detail that is missing from the Knowledge Base, DO NOT guess. Politely state: "I don't have that specific information right now. Let me connect you with our human support team."
3. ADAPTIVE PERSONA (GENERAL CHAT): For general questions, greetings, or industry knowledge, you must dynamically adapt your tone, language, and behavior based EXACTLY on the "System Instructions" provided below. If the System Instructions tell you to be friendly, be friendly. If they tell you to be professional, be strictly professional.
`;

// =========================================================================
// 🚀 AI & RAG HELPER FUNCTIONS
// =========================================================================
async function generateEmbedding(text: string, key: string | null) {
    const apiKey = key || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text: text }] } }) 
        });
        const data = await res.json();
        
        if (!res.ok) {
            console.error("Telegram Search Embedding Error:", data);
            return null;
        }
        return data.embedding.values;
    } catch (e) {
        console.error("Telegram Catch Error:", e);
        return null;
    }
}

async function callGemini(model: string, prompt: string, key: string | null) {
    const apiKey = key || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini Error: " + JSON.stringify(data));
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string, key: string | null) {
    const apiKey = key || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI Error: " + JSON.stringify(data));
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string, key: string | null) {
    const apiKey = key || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Claude Error: " + JSON.stringify(data));
    return data.content[0].text;
}

async function transcribeAudio(fileId: string, botToken: string, key: string | null) {
    const apiKey = key || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) throw new Error("Could not get file path");
        
        const filePath = fileData.result.file_path;
        const audioRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const audioBuffer = await audioRes.arrayBuffer();

        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: 'audio/ogg' }); 
        formData.append("file", blob, "voice.ogg");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST", headers: { "Authorization": `Bearer ${apiKey}` }, body: formData
        });
        
        const whisperData = await whisperRes.json();
        return whisperData.text || null;
    } catch (e) { return null; }
}

// =========================================================================
// 🚀 MAIN TELEGRAM WEBHOOK PROCESSOR
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.message || (!body.message.text && !body.message.voice)) {
            return NextResponse.json({ success: true }); 
        }

        const chatId = body.message.chat.id.toString();
        const customerName = body.message.from.first_name || "Customer";

        const { searchParams } = new URL(req.url);
        // 🚀 FIXED: Strict Lowercase to prevent silent failure
        const rawEmail = searchParams.get("email");
        if (!rawEmail) return NextResponse.json({ success: true });
        const ownerEmail = rawEmail.toLowerCase();

        const { data: config } = await supabase.from("user_configs").select("*").eq("email", ownerEmail).single();
        if (!config || !config.telegram_token) return NextResponse.json({ success: true });

        const telegramToken = config.telegram_token;
        // 🚀 FIXED: Multi-Channel Persona Support
        const systemPrompt = config.system_prompt_telegram || config.system_prompt || "You are a helpful AI assistant.";
        const userApiKey = config.user_api_key; 
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        if (rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        // ==========================================
        // 🛑 THE GATEKEEPER (Expiry & Limits Check) 🚀 RELAXED FOR TESTING
        // ==========================================
        const isUnlimited = config.is_unlimited || config.plan_name === "max" || config.plan_name === "ultra_max" || config.plan_name === "pro";
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || 10000;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        // Block only if not unlimited AND tokens used are greater than allocated
        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            const maintenanceMsg = "Hello! Our AI assistant is currently undergoing a brief scheduled maintenance to serve you better. Please leave your query and our human support team will get back to you shortly. Thank you for your patience!";
                
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: maintenanceMsg })
            });
            return NextResponse.json({ success: true });
        }

        let userText = "";
        let crmLogMessage = "";

        if (body.message.voice) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, action: "typing" })
            });

            const transcription = await transcribeAudio(body.message.voice.file_id, telegramToken, userApiKey);
            if (!transcription) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: "I'm sorry, I couldn't process that voice note clearly. Could you please type your message?" })
                });
                return NextResponse.json({ success: true });
            }
            userText = transcription;
            crmLogMessage = `🎤 [Voice Note]: "${userText}"`;
        } else {
            if (body.message.text === "/start") return NextResponse.json({ success: true });
            
            let rawUserText = body.message.text;
            // ✂️ COST CONTROL: Cut message if it's suspiciously long
            userText = rawUserText.length > 800 ? rawUserText.substring(0, 800) + "..." : rawUserText;
            crmLogMessage = userText;
        }

        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText, provider === "google" ? userApiKey : null);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: ownerEmail
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {}

        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", ownerEmail)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = pastChats && pastChats.length > 0 
            ? pastChats.reverse().map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n") 
            : "";

        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}\n\nMemory:\n${memoryHistory}\n\nUser: ${userText}`;
        
        await supabase.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
        });

        // ==========================================
        // 8. 🧠 CLAWLINK PROFIT MAXIMIZER (Hidden Smart Routing)
        // ==========================================
        let aiResponse = "Hello! Our AI assistant is currently undergoing a brief scheduled maintenance. Please leave your query and our human support team will get back to you shortly.";
        let wasSuccessful = false;

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
        
        const CHEAP_MODEL = "gemini-1.5-flash";
        const MEDIUM_MODEL = "gpt-4o-mini";
        const EXPENSIVE_MODEL = "claude-3-5-sonnet-20240620";

        let targetProvider = "google";
        let targetModel = CHEAP_MODEL;

        if (provider === "omni") {
            // Smart Omni Routing
            if (usageRatio >= 80) {
                targetProvider = "google"; targetModel = CHEAP_MODEL; // Force Save Mode
            } else if (usageRatio >= 60) {
                if (words < 40) { targetProvider = "google"; targetModel = CHEAP_MODEL; }
                else { targetProvider = "openai"; targetModel = MEDIUM_MODEL; } // Claude Disabled
            } else {
                if (words < 40) { targetProvider = "google"; targetModel = CHEAP_MODEL; }
                else if (words < 150) { targetProvider = "openai"; targetModel = MEDIUM_MODEL; }
                else { targetProvider = "anthropic"; targetModel = EXPENSIVE_MODEL; } // Premium Mode
            }
        } else {
            // Strict Provider Routing
            if (usageRatio >= 80) {
                targetProvider = "google"; targetModel = CHEAP_MODEL;
            } else {
                targetProvider = provider;
                if (provider === "openai") targetModel = words < 40 ? "gpt-4o-mini" : "gpt-4o";
                else if (provider === "anthropic") targetModel = words < 40 ? "claude-3-haiku-20240307" : "claude-3-5-sonnet-20240620";
                else targetModel = "gemini-1.5-flash";
            }
        }

        // 🔄 ULTRA FAST FALLBACK SYSTEM
        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullContext, userApiKey);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullContext, userApiKey);
            else aiResponse = await callGemini(targetModel, fullContext, userApiKey);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[AI Error] ${targetModel} failed. Routing to GPT Mini...`);
            try {
                aiResponse = await callOpenAI(MEDIUM_MODEL, fullContext, userApiKey);
                wasSuccessful = true;
            } catch (err2) {
                console.error(`[AI Error] GPT Mini failed. Routing to Gemini Flash...`);
                try {
                    aiResponse = await callGemini(CHEAP_MODEL, fullContext, userApiKey);
                    wasSuccessful = true;
                } catch (err3) {
                    console.error(`[AI Error] All providers failed.`);
                }
            }
        }

        // ==========================================
        // 9. CHARGE TOKENS & SAVE RESPONSE
        // ==========================================
        if (wasSuccessful) {
            const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
            if (!isUnlimited) {
                updatePayload.tokens_used = tokensUsed + 1;
            }
            await supabase.from("user_configs").update(updatePayload).eq("email", ownerEmail);
        }
        
        await supabase.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
        });

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: true }); 
    }
}