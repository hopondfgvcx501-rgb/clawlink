 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 1500;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
            console.error("[EMBEDDING_ERROR] Telegram Search Embedding Error:", data);
            return null;
        }
        return data.embedding.values;
    } catch (e) {
        console.error("[EMBEDDING_EXCEPTION] Telegram Catch Error:", e);
        return null;
    }
}

async function callGemini(model: string, systemPrompt: string, history: any[], userText: string, key: string | null) {
    const apiKey = key || process.env.GEMINI_API_KEY;
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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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

async function callOpenAI(model: string, systemPrompt: string, history: any[], userText: string, key: string | null) {
    const apiKey = key || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model, messages: messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: OpenAI API rejected the request.");
    return data.choices[0].message.content;
}

async function callClaude(model: string, systemPrompt: string, history: any[], userText: string, key: string | null) {
    const apiKey = key || process.env.ANTHROPIC_API_KEY;
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
            model: model, 
            max_tokens: 1024, 
            system: systemPrompt,
            messages: mergedMessages 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: Anthropic API rejected the request.");
    return data.content[0].text;
}

async function transcribeAudio(fileId: string, botToken: string, key: string | null) {
    const apiKey = key || process.env.OPENAI_API_KEY;
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

        let configQuery = supabase.from("user_configs").select("*");
        
        if (urlToken) {
            configQuery = configQuery.eq("telegram_token", urlToken);
        } else if (rawEmail) {
            configQuery = configQuery.eq("email", rawEmail.toLowerCase());
        } else {
            return NextResponse.json({ success: true });
        }

        const { data: config, error: configError } = await configQuery.limit(1).single();
        
        if (configError || !config || !config.telegram_token) {
            console.warn("[SECURITY_GUARD] Unauthorized webhook access attempt rejected.");
            return NextResponse.json({ success: true });
        }

        const ownerEmail = config.email;
        const configId = config.id; 
        const telegramToken = config.telegram_token;
        
        const systemPrompt = config.system_prompt_telegram || config.system_prompt || "You are a helpful AI assistant.";
        const userApiKey = config.user_api_key; 
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        if (rawProvider === "multi_model" || rawProvider === "omni") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();
        
        if (currentPlan === "free" || currentPlan === "starter" || config.plan_status !== "Active") {
            const sleepMsg = "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their plan in the dashboard to enable 24/7 autonomous replies.";
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: sleepMsg, parse_mode: "Markdown" })
            });
            console.log(`[GATEKEEPER] Blocked unpaid bot message for token: ${telegramToken}`);
            return NextResponse.json({ success: true });
        }

        const isUnlimited = config.is_unlimited || config.plan === "adv_max" || config.plan === "yearly";
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || 10000;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            const maintenanceMsg = "System Note: The AI assistant for this account is currently offline due to account limits. Please contact the administrator.";
                
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
                    body: JSON.stringify({ chat_id: chatId, text: "System could not process the audio format. Please type your message." })
                });
                return NextResponse.json({ success: true });
            }
            userText = sanitizeInput(transcription);
            crmLogMessage = `[Voice Input]: "${userText}"`;
        } else {
            if (body.message.text === "/start") return NextResponse.json({ success: true });
            
            let rawUserText = sanitizeInput(body.message.text);
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
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                }
            }
        } catch (e) {}

        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", ownerEmail)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(20);

        let historyArray: any[] = [];
        if (pastChats && pastChats.length > 0) {
            historyArray = pastChats.reverse().map(chat => ({
                role: chat.sender_type === "bot" ? "assistant" : "user",
                content: chat.message ? chat.message.trim() : " "
            }));
        }

        const fullSystemContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}`;
        
        await supabase.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
        });

        let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
        let wasSuccessful = false;

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
        
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

        if (provider === "omni") {
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
            if (usageRatio >= 85) {
                if (provider === "openai") targetModel = GPT_CHEAP;
                else if (provider === "anthropic") targetModel = CLAUDE_CHEAP;
                else targetModel = GEMINI_CHEAP;
            } else {
                if (provider === "openai") targetModel = words < 40 ? GPT_CHEAP : (words > 150 ? GPT_PREMIUM : GPT_MID);
                else if (provider === "anthropic") targetModel = words < 40 ? CLAUDE_CHEAP : (words > 150 ? CLAUDE_PREMIUM : CLAUDE_MID);
                else targetModel = words < 40 ? GEMINI_CHEAP : (words > 150 ? GEMINI_PREMIUM : GEMINI_MID);
            }
        }

        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullSystemContext, historyArray, userText, userApiKey);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullSystemContext, historyArray, userText, userApiKey);
            else aiResponse = await callGemini(targetModel, fullSystemContext, historyArray, userText, userApiKey);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[EXECUTION_FAILURE] Primary model ${targetModel} rejected request.`);
            
            if (provider === "omni") {
                console.log("[OMNI_FALLBACK] Routing to secondary engine...");
                try {
                    aiResponse = await callOpenAI(GPT_CHEAP, fullSystemContext, historyArray, userText, userApiKey);
                    wasSuccessful = true;
                } catch (err2) {
                    console.log("[OMNI_FALLBACK_2] Routing to tertiary engine...");
                    try {
                        aiResponse = await callGemini(GEMINI_CHEAP, fullSystemContext, historyArray, userText, userApiKey);
                        wasSuccessful = true;
                    } catch (err3) { console.error("[CRITICAL_FAILURE] Omni cross-provider fallback exhausted."); }
                }
            } else {
                console.log(`[INTRA_PROVIDER_FALLBACK] Downgrading to standard tier for ${provider}.`);
                try {
                    if (provider === "anthropic") aiResponse = await callClaude(CLAUDE_CHEAP, fullSystemContext, historyArray, userText, userApiKey);
                    else if (provider === "openai") aiResponse = await callOpenAI(GPT_CHEAP, fullSystemContext, historyArray, userText, userApiKey);
                    else aiResponse = await callGemini(GEMINI_CHEAP, fullSystemContext, historyArray, userText, userApiKey);
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
            await supabase.from("user_configs").update(updatePayload).eq("id", configId);
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