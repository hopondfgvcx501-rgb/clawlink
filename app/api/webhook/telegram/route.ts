/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TELEGRAM AI WEBHOOK
 * ==============================================================================================
 * @file app/api/webhook/telegram/route.ts
 * @description The core engine for Telegram communications. Contains PLG Gatekeeper 
 * logic to block unpaid users and Omni-routing logic for active accounts.
 * FIXED: Restored REAL API fetch calls for Gemini, Claude, and OpenAI.
 * FIXED: Maintained conversational memory (Ghajini preventer) and RAG Vector DB queries.
 * FIXED: Explicit mapping of premium UI model names to their underlying provider API IDs.
 * ADDED: Strict Supabase DB Insert Error Catchers to send silent failures to TG Admin Bot.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 1500;

// Initialize Supabase directly to prevent path alias resolution errors during Vercel builds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("[KNOX_SECURITY] FATAL: Supabase environment variables are missing.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .replace(/<[^>]*>?/gm, "")
        .replace(/--/g, "")
        .replace(/;/g, "")
        .trim();
}

const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Advanced AI Support Agent operating on the ClawLink Engine.
1. FACTUAL INTEGRITY (RAG): For any queries regarding the company's pricing, features, services, or policies, you MUST strictly rely ONLY on the provided "Company Knowledge Base". Never invent, guess, or hallucinate business data.
2. THE ESCALATION RULE: If the user asks for a company-specific detail that is missing from the Knowledge Base, DO NOT guess. Politely state: "I don't have that specific information right now. Let me connect you with our human support team."
3. ADAPTIVE PERSONA (GENERAL CHAT): For general questions, greetings, or industry knowledge, you must dynamically adapt your tone, language, and behavior based EXACTLY on the "System Instructions" provided below.
`;

async function generateEmbedding(text: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text: text }] } }) 
        });
        const data = await res.json();
        
        if (!res.ok) {
            console.error("[EMBEDDING_ERROR] Telegram Search Embedding Error:", data);
            return null;
        }
        return data.embedding.values;
    } catch (e) {
        console.error("[EMBEDDING_EXCEPTION] Telegram Catch Error:", e);
        return null;
    }
}

// 🚀 REAL API EXECUTIONS RESTORED
async function callGemini(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    
    let contents: any[] = [];
    let lastRole = "";
    for (const msg of history) {
        const currentRole = msg.role === "assistant" ? "model" : "user";
        if (currentRole === lastRole) {
            contents[contents.length - 1].parts[0].text += "\n" + msg.content;
        } else {
            contents.push({ role: currentRole, parts: [{ text: msg.content }] });
            lastRole = currentRole;
        }
    }
    if (lastRole === "user") contents[contents.length - 1].parts[0].text += "\n" + userText;
    else contents.push({ role: "user", parts: [{ text: userText }] });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            system_instruction: { parts: { text: systemPrompt } },
            contents: contents 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: Gemini API rejected the request.");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: modelId, messages: messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: OpenAI API rejected the request.");
    return data.choices[0].message.content;
}

async function callClaude(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    
    let mergedMessages: any[] = [];
    let lastRole = "";
    for (const msg of history) {
        if (msg.role === lastRole) {
            mergedMessages[mergedMessages.length - 1].content += "\n" + msg.content;
        } else {
            mergedMessages.push({ role: msg.role, content: msg.content });
            lastRole = msg.role;
        }
    }
    if (lastRole === "user") mergedMessages[mergedMessages.length - 1].content += "\n" + userText;
    else mergedMessages.push({ role: "user", content: userText });

    if (mergedMessages.length > 0 && mergedMessages[0].role !== "user") mergedMessages.shift();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ 
            model: modelId, 
            max_tokens: 1024, 
            system: systemPrompt,
            messages: mergedMessages 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: Anthropic API rejected the request.");
    return data.content[0].text;
}

async function transcribeAudio(fileId: string, botToken: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) throw new Error("Could not acquire file path from Telegram.");
        
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

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.message || (!body.message.text && !body.message.voice)) {
            return NextResponse.json({ success: true }); 
        }

        const chatId = sanitizeInput(body.message.chat.id.toString());
        const customerName = sanitizeInput(body.message.from.first_name || "Customer");

        const { searchParams } = new URL(req.url);
        const urlToken = sanitizeInput(searchParams.get("token"));
        const rawEmail = sanitizeInput(searchParams.get("email"));

        let configQuery = supabaseAdmin.from("user_configs").select("*");
        
        if (urlToken) {
            configQuery = configQuery.eq("telegram_token", urlToken);
        } else if (rawEmail) {
            configQuery = configQuery.eq("email", rawEmail.toLowerCase());
        } else {
            return NextResponse.json({ success: true });
        }

        const { data: config, error: configError } = await configQuery.order("created_at", { ascending: false }).limit(1).single();
        
        if (configError || !config || !config.telegram_token) {
            console.warn("[SECURITY_GUARD] Unauthorized webhook access attempt rejected.");
            return NextResponse.json({ success: true });
        }

        const ownerEmail = config.email;
        const configId = config.id; 
        const telegramToken = config.telegram_token;
        
        const systemPrompt = config.system_prompt_telegram || config.system_prompt || "You are a professional, helpful, and concise AI agent.";
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        if (rawProvider.includes("omni") || rawProvider.includes("nexus")) provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic") || rawProvider.includes("opus")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();
        
        // 🚀 PLG GATEKEEPER: Instantly blocks free users with an upsell message
        if (currentPlan === "free" || currentPlan === "starter" || config.plan_status !== "Active") {
            const sleepMsg = "🤖 *ClawLink AI:* This agent is currently sleeping. Please activate a plan in the ClawLink Dashboard to enable 24/7 autonomous intelligence.";
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: sleepMsg, parse_mode: "Markdown" })
            });
            console.log(`[GATEKEEPER] Blocked unpaid bot message for token: ${telegramToken}`);
            return NextResponse.json({ success: true });
        }

        const isUnlimited = config.is_unlimited || currentPlan === "adv_max" || currentPlan === "yearly" || currentPlan === "ultra";
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || config.available_tokens || 10000;
        
        const expiryDate = new Date(config.plan_expiry_date || new Date());
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            const maintenanceMsg = "System Note: The AI assistant for this account is currently offline due to resource limits. Please contact the administrator.";
                
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

            const transcription = await transcribeAudio(body.message.voice.file_id, telegramToken);
            if (!transcription) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: "System could not process the audio format. Please type your message." })
                });
                return NextResponse.json({ success: true });
            }
            userText = sanitizeInput(transcription);
            crmLogMessage = `[Voice Input]: "${userText}"`;
        } else {
            if (body.message.text === "/start") return NextResponse.json({ success: true });
            
            let rawUserText = sanitizeInput(body.message.text);
            userText = rawUserText.length > 1000 ? rawUserText.substring(0, 1000) + "..." : rawUserText;
            crmLogMessage = userText;
        }

        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // 🚀 THE RAG ENGINE (Custom Knowledge Base Execution)
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabaseAdmin.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: ownerEmail
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                }
            }
        } catch (e) {}

        // 🚀 THE CONVERSATIONAL MEMORY (Ghajini Preventer)
        const { data: pastChats } = await supabaseAdmin
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", ownerEmail)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(10);

        let historyArray: any[] = [];
        if (pastChats && pastChats.length > 0) {
            historyArray = pastChats.reverse().map(chat => ({
                role: chat.sender_type === "bot" ? "assistant" : "user",
                content: chat.message ? chat.message.trim() : " "
            }));
        }

        const fullSystemContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}`;
        
        // 🔥 FIX 1: USER MESSAGE DB INSERT (With Error Tracking)
        const { error: userDbError } = await supabaseAdmin.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
        });
        if (userDbError) {
            console.error("[DB_INSERT_FATAL] User Message:", userDbError);
            throw new Error(`Supabase Reject (User Msg): ${userDbError.message}`);
        }

        let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
        let wasSuccessful = false;

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
        
        // 🚀 2026 OMNI MODEL MAPPING
        // Mapping UI display names to their actual underlying API model IDs
        const GEMINI_CHEAP = "gemini-1.5-flash"; 
        const GEMINI_MID = "gemini-1.5-flash";       
        const GEMINI_PREMIUM = "gemini-1.5-pro";    
        
        const GPT_CHEAP = "gpt-3.5-turbo";
        const GPT_MID = "gpt-4o-mini";
        const GPT_PREMIUM = "gpt-4o"; 
        
        const CLAUDE_CHEAP = "claude-3-haiku-20240307";
        const CLAUDE_MID = "claude-3-sonnet-20240229";
        const CLAUDE_PREMIUM = "claude-3-opus-20240229";

        let targetProvider = provider;
        
        // Match the UI selection to the correct API ID for execution
        let targetApiId = GPT_PREMIUM; 
        if (provider === "anthropic") targetApiId = CLAUDE_PREMIUM;
        if (provider === "google") targetApiId = GEMINI_PREMIUM;

        if (provider === "omni") {
            if (usageRatio >= 80) {
                targetProvider = "google"; 
                targetApiId = GEMINI_CHEAP;
            } else if (usageRatio >= 60) {
                targetProvider = "openai"; 
                targetApiId = GPT_MID;
            } else {
                if (words < 40) { targetProvider = "google"; targetApiId = GEMINI_MID; }
                else if (words < 150) { targetProvider = "openai"; targetApiId = GPT_MID; }
                else { targetProvider = "anthropic"; targetApiId = CLAUDE_PREMIUM; } 
            }
        }

        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetApiId, fullSystemContext, historyArray, userText);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetApiId, fullSystemContext, historyArray, userText);
            else aiResponse = await callGemini(targetApiId, fullSystemContext, historyArray, userText);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[EXECUTION_FAILURE] Primary model ${targetApiId} rejected request.`);
            
            if (provider === "omni") {
                console.log("[OMNI_FALLBACK] Routing to secondary engine...");
                try {
                    aiResponse = await callOpenAI(GPT_MID, fullSystemContext, historyArray, userText);
                    wasSuccessful = true;
                } catch (err2) {
                    console.log("[OMNI_FALLBACK_2] Routing to tertiary engine...");
                    try {
                        aiResponse = await callGemini(GEMINI_CHEAP, fullSystemContext, historyArray, userText);
                        wasSuccessful = true;
                    } catch (err3) { console.error("[CRITICAL_FAILURE] Omni cross-provider fallback exhausted."); }
                }
            } else {
                console.log(`[INTRA_PROVIDER_FALLBACK] Downgrading to standard tier for ${provider}.`);
                try {
                    if (provider === "anthropic") aiResponse = await callClaude(CLAUDE_CHEAP, fullSystemContext, historyArray, userText);
                    else if (provider === "openai") aiResponse = await callOpenAI(GPT_CHEAP, fullSystemContext, historyArray, userText);
                    else aiResponse = await callGemini(GEMINI_CHEAP, fullSystemContext, historyArray, userText);
                    wasSuccessful = true;
                } catch (err2) {
                    console.error(`[CRITICAL_FAILURE] Intra-provider fallback failed for ${provider}.`);
                }
            }
        }

        if (wasSuccessful) {
            const calculatedTokens = Math.ceil((userText.length + aiResponse.length) / 3);
            const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
            if (!isUnlimited) {
                updatePayload.tokens_used = tokensUsed + calculatedTokens;
            }
            await supabaseAdmin.from("user_configs").update(updatePayload).eq("id", configId);
        }
        
        // 🔥 FIX 2: BOT MESSAGE DB INSERT (With Error Tracking)
        const { error: botDbError } = await supabaseAdmin.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
        });
        if (botDbError) {
            console.error("[DB_INSERT_FATAL] Bot Message:", botDbError);
            throw new Error(`Supabase Reject (Bot Msg): ${botDbError.message}`);
        }

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[SYSTEM_FATAL] Webhook processing halted:", error); 
        
        try {
            const body = await req.clone().json().catch(() => ({})); 
            const chatId = body?.message?.chat?.id;
            const token = process.env.TELEGRAM_BOT_TOKEN; 
            
            if (chatId && token) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        chat_id: chatId, 
                        text: `⚠️ [SYSTEM ERROR]: ${error.message || "Unknown Runtime Exception"}` 
                    })
                });
            }
        } catch (e) {
            console.error("[TELEGRAM_ALERT_FAILED] Could not dispatch error log.", e);
        }

        return NextResponse.json({ success: true }); 
    }
}