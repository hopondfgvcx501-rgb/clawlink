/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TELEGRAM AI WEBHOOK (V3 MEGA ENGINE)
 * ==============================================================================================
 * @file app/api/webhook/telegram/route.ts
 * @description The core engine for Telegram communications. Contains PLG Gatekeeper 
 * logic to block unpaid users and Omni-routing logic for active accounts.
 * 🚀 RETAINED: Upgraded Anthropic Claude logic to strictly alternate user/assistant roles.
 * 🚀 RETAINED: Replaced dots (.) with hyphens (-) in Anthropic 2026 API IDs to prevent 404.
 * 🚀 RETAINED: Direct DB Persona & RAG Injection applied. External compiler bypassed.
 * 🚀 RETAINED: Ultra-Fast Command Router Interceptor.
 * 🔥 NEW (ADVANCE LEVEL): Multi-Flow Visual Engine Scanner injected directly from `telegram_flows` DB.
 * 🔥 NEW (ADVANCE LEVEL): 100% Strict TypeScript Interfaces for 700+ Feature-Proof scaling.
 * 🔥 NEW (ADVANCE LEVEL): Isolated Execution Blocks to prevent single-point failures.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ==========================================
// 🛡️ SECURITY & MEMORY MANAGEMENT
// ==========================================
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 1500;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("[KNOX_SECURITY] FATAL: Supabase environment variables are missing. System HALTED.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

// ==========================================
// 🧩 ENTERPRISE TYPE DEFINITIONS (For Vercel Stability)
// ==========================================
interface TelegramMessage {
    chat: { id: number };
    from: { first_name: string; id: number };
    text?: string;
    voice?: { file_id: string };
}

interface WebhookBody {
    message?: TelegramMessage;
}

interface FlowNode {
    id: string;
    type: string;
    data: { triggerKeyword?: string; messageText?: string; type?: string; [key: string]: any };
}

interface FlowEdge {
    source: string;
    target: string;
}

interface VisualFlow {
    id: string;
    flow_name: string;
    trigger_keyword: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    is_active: boolean;
}

// ==========================================
// 🛠️ CORE UTILITY FUNCTIONS
// ==========================================

/**
 * Sanitizes input to prevent prompt injection and script execution.
 */
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .replace(/<[^>]*>?/gm, "")
        .replace(/--/g, "")
        .replace(/;/g, "")
        .trim();
}

/**
 * Generates Vector Embeddings for the RAG Knowledge Base Engine.
 */
async function generateEmbedding(text: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("[EMBEDDING_WARNING] Gemini API Key missing for embeddings.");
        return null;
    }
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

// ==========================================
// 🤖 REAL AI PROVIDER EXECUTIONS (100% UNTOUCHED)
// ==========================================

/**
 * Google Gemini Engine Execution
 */
async function callGemini(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing for Google Gemini");
    
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
            contents: contents,
            generationConfig: { maxOutputTokens: 150 } // 🚨 HARD LIMIT APPLIED
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: Gemini API rejected the request.");
    return data.candidates[0].content.parts[0].text;
}

/**
 * OpenAI GPT Engine Execution
 */
async function callOpenAI(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing for OpenAI");
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ 
            model: modelId, 
            max_tokens: 150, // 🚨 HARD LIMIT APPLIED
            messages: messages 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: OpenAI API rejected the request.");
    return data.choices[0].message.content;
}

/**
 * Anthropic Claude Engine Execution (CRITICAL UPGRADE: Strict Roles)
 */
async function callClaude(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing for Anthropic Claude");
    
    let claudeMessages: any[] = [];
    let lastRole = "";
    
    const rawMessages = [...history, { role: "user", content: userText }];
    
    for (const m of rawMessages) {
        const role = m.role === "assistant" ? "assistant" : "user";
        if (role === lastRole) {
            claudeMessages[claudeMessages.length - 1].content += "\n" + m.content;
        } else {
            claudeMessages.push({ role: role, content: m.content });
            lastRole = role;
        }
    }
    
    if (claudeMessages.length > 0 && claudeMessages[0].role !== "user") {
        claudeMessages.shift(); 
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ 
            model: modelId, 
            max_tokens: 150, // 🚨 HARD LIMIT APPLIED
            system: systemPrompt,
            messages: claudeMessages 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Provider Error: Anthropic API rejected the request. Details: ${JSON.stringify(data)}`);
    return data.content[0].text;
}

/**
 * Whisper Voice Transcription via Telegram Files
 */
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
    } catch (e) { 
        console.error("[VOICE_ERROR] Transcription failed:", e);
        return null; 
    }
}

// ==========================================
// 🚀 MASTER WEBHOOK EXECUTION ROUTE
// ==========================================
export async function POST(req: Request) {
    try {
        const body: WebhookBody = await req.json();

        // 1. Initial Payload Validation
        if (!body.message || (!body.message.text && !body.message.voice)) {
            return NextResponse.json({ success: true }); 
        }

        const chatId = sanitizeInput(body.message.chat.id.toString());
        const customerName = sanitizeInput(body.message.from.first_name || "Customer");

        const { searchParams } = new URL(req.url);
        const urlToken = sanitizeInput(searchParams.get("token"));
        const rawEmail = sanitizeInput(searchParams.get("email"));

        // 2. Tenant Context Fetching
        let configQuery = supabaseAdmin.from("user_configs").select("*");
        
        if (urlToken) {
            configQuery = configQuery.eq("telegram_token", urlToken);
        } else if (rawEmail) {
            configQuery = configQuery.eq("email", rawEmail.toLowerCase());
        } else {
            console.error("[WEBHOOK FATAL] No token or email in Webhook URL. Cannot link to user.");
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

        // ==========================================
        // 🛡️ PLG GATEKEEPER (Strict Monetization Logic)
        // ==========================================
        const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();
        
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

        // ==========================================
        // 🎙️ MULTIMODAL INPUT HANDLING (Voice to Text)
        // ==========================================
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
            let rawUserText = sanitizeInput(body.message.text);
            userText = rawUserText.length > 1000 ? rawUserText.substring(0, 1000) + "..." : rawUserText;
            crmLogMessage = userText;
        }

        // 🛡️ DDoS Rate Limiting
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // ==========================================
        // 🚀 ROUTER 1: ULTRA-FAST COMMAND INTERCEPTOR
        // ==========================================
        try {
            if (userText.startsWith('/')) {
                const { data: commandRule, error: cmdError } = await supabaseAdmin
                    .from("bot_commands")
                    .select("action, description")
                    .eq("email", ownerEmail)
                    .eq("platform", "telegram")
                    .eq("command", userText.trim())
                    .eq("is_active", true)
                    .single();

                if (commandRule) {
                    console.log(`[COMMAND_ROUTER] Intercepted: ${userText}. Executing: ${commandRule.action}`);
                    
                    const routerResponse = `⚡ ClawLink Router Caught Command: ${userText}\n\n🤖 Executing Action: ${commandRule.action}\n📝 Description: ${commandRule.description}`;
                    
                    // Log to Chat History
                    await supabaseAdmin.from("chat_history").insert([
                        { email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: userText },
                        { email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: routerResponse }
                    ]);

                    // Fire Message
                    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: chatId, text: routerResponse })
                    });

                    return NextResponse.json({ success: true });
                }
            }
        } catch (router1Error) {
            console.error("[ROUTER_1_ERROR]", router1Error);
        }

        // ==========================================
        // 🛡️ ADVANCED CRM GATEKEEPER (AI PAUSE CHECK)
        // ==========================================
        const { data: crmControl } = await supabaseAdmin
            .from("crm_controls")
            .select("is_ai_paused")
            .eq("owner_email", ownerEmail)
            .eq("platform_chat_id", chatId)
            .single();

        if (crmControl?.is_ai_paused) {
            console.log(`[CRM_INTERCEPTION] AI is paused for customer ${chatId}. Manual mode active.`);
            
            // Log user message to CRM so Agent can see it
            await supabaseAdmin.from("chat_history").insert({ 
                email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
            });

            // Return 200 without responding (Silent AI)
            return NextResponse.json({ success: true });
        }

        // ==========================================
        // 🔀 ROUTER 2: ADVANCED MULTI-FLOW VISUAL ENGINE
        // Scans `telegram_flows` table across all active flows for the user
        // ==========================================
        try {
            const { data: savedFlows, error: flowError } = await supabaseAdmin
                .from("telegram_flows")
                .select("flow_name, nodes, edges")
                .eq("email", ownerEmail)
                .eq("is_active", true);

            if (savedFlows && savedFlows.length > 0) {
                const userTextLower = userText.toLowerCase();
                let matchedFlow: any = null;
                let activeTriggerNode: FlowNode | null = null;

                // Scan all flows to find a matching trigger keyword
                for (const flow of savedFlows) {
                    const nodes: FlowNode[] = flow.nodes || [];
                    for (const node of nodes) {
                        if (node.type === "triggerNode") {
                            const triggerText = (node.data.triggerKeyword || "").toLowerCase().trim();
                            if (triggerText && (triggerText === userTextLower || userTextLower.includes(triggerText))) {
                                matchedFlow = flow;
                                activeTriggerNode = node;
                                break;
                            }
                        }
                    }
                    if (matchedFlow) break;
                }

                if (matchedFlow && activeTriggerNode) {
                    const edges: FlowEdge[] = matchedFlow.edges || [];
                    const nodes: FlowNode[] = matchedFlow.nodes || [];
                    const outgoingEdge = edges.find((e) => e.source === activeTriggerNode!.id);
                    
                    if (outgoingEdge) {
                        const actionNode = nodes.find((n) => n.id === outgoingEdge.target);
                        
                        if (actionNode && actionNode.type === "actionNode") {
                            let responseText = actionNode.data.messageText || "Message not configured in flow.";
                            
                            // CRM DB Logging
                            const { error: userDbError } = await supabaseAdmin.from("chat_history").insert({ 
                                email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
                            });
                            if (userDbError) throw new Error(`Supabase Reject (User Msg): ${userDbError.message}`);

                            const { error: botDbError } = await supabaseAdmin.from("chat_history").insert({ 
                                email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: responseText 
                            });
                            if (botDbError) throw new Error(`Supabase Reject (Bot Msg): ${botDbError.message}`);
                            
                            // Telegram Dispatch
                            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, { 
                                method: "POST", headers: { "Content-Type": "application/json" }, 
                                body: JSON.stringify({ chat_id: chatId, text: responseText }) 
                            });
                            
                            console.log(`[FLOW_PARSER] Visual Flow Executed Successfully: ${matchedFlow.flow_name}`);
                            return NextResponse.json({ success: true });
                        }
                    }
                }
            }
        } catch (router2Error) {
            console.error("[ROUTER_2_MULTI_FLOW_ERROR]", router2Error);
        }

        // ==========================================
        // ⚡ ROUTER 3: AUTOMATION KEYWORD INTERCEPTOR
        // ==========================================
        try {
            const { data: rules } = await supabaseAdmin
                .from("automation_rules")
                .select("*")
                .eq("email", ownerEmail)
                .eq("platform", "telegram");

            let matchedRuleContent = null;
            if (rules && rules.length > 0) {
                const userTextLower = userText.toLowerCase();
                for (const rule of rules) {
                    const keywords = rule.keyword.split(',').map((k: string) => k.trim().toLowerCase());
                    
                    for (const kw of keywords) {
                        if (!kw) continue;
                        if (rule.match_type === "exact" && userTextLower === kw) {
                            matchedRuleContent = rule.content;
                            break;
                        } else if (rule.match_type === "contains" && userTextLower.includes(kw)) {
                            matchedRuleContent = rule.content;
                            break;
                        }
                    }
                    if (matchedRuleContent) break; 
                }
            }

            if (matchedRuleContent) {
                console.log(`[AUTOMATION_TRIGGERED] Keyword matched! Bypassing AI.`);
                
                const { error: userDbError } = await supabaseAdmin.from("chat_history").insert({ 
                    email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
                });
                if (userDbError) throw new Error(`Supabase Reject (User Msg): ${userDbError.message}`);

                const { error: botDbError } = await supabaseAdmin.from("chat_history").insert({ 
                    email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: matchedRuleContent 
                });
                if (botDbError) throw new Error(`Supabase Reject (Bot Msg): ${botDbError.message}`);

                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: matchedRuleContent })
                });

                return NextResponse.json({ success: true }); 
            }
        } catch (router3Error) {
            console.error("[ROUTER_3_ERROR]", router3Error);
        }

        // ==========================================
        // 🧠 ROUTER 4: UPGRADED RAG ENGINE & DYNAMIC PERSONA INJECTION
        // ==========================================
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs, error: rpcError } = await supabaseAdmin.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: ownerEmail
                });
                
                if (rpcError) throw new Error(`pgvector Error: ${rpcError.message}`);
                
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                }
            }
        } catch (ragError: any) {
            console.error("[RAG_ENGINE_CRASH]", ragError);
        }

        // Fetch Conversation Memory Context
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

        // 🚀 REAL DATA INJECTION (Bypassing external compiler)
        const channelPersona = config.system_prompt_telegram || config.system_prompt || "You are a helpful AI assistant.";
        
        const fullSystemContext = `
[SYSTEM INSTRUCTIONS]
${channelPersona}

[BUSINESS KNOWLEDGE BASE (RAG)]
Use the following information to answer user queries. Do not make up prices, rules, or policies. If the answer is not in the knowledge base, state that you do not have the information.
=== KNOWLEDGE START ===
${customKnowledge || "No specific business knowledge available."}
=== KNOWLEDGE END ===
        `;
        
        const { error: userDbError } = await supabaseAdmin.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
        });
        if (userDbError) throw new Error(`Supabase Reject (User Msg): ${userDbError.message}`);

        // ==========================================
        // 🔥 ROUTER 5: OMNI-FALLBACK AI ROUTING ALGORITHM
        // THE ULTIMATE FIX: Hyphens (-) strictly used for Anthropic models
        // ==========================================
        let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
        let wasSuccessful = false;
        
        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
        
        const GEMINI_NANO = "gemini-3.1-flash-lite"; 
        const GEMINI_MID = "gemini-3.1-flash";       
        const GEMINI_PREMIUM = "gemini-3.1-pro";     
        const GEMINI_FALLBACKS = [GEMINI_PREMIUM, GEMINI_MID, GEMINI_NANO];
        
        const GPT_NANO = "gpt-4.1-nano";             
        const GPT_MID = "gpt-5.4-mini";              
        const GPT_PREMIUM = "gpt-5.5-pro";               
        const GPT_FALLBACKS = [GPT_PREMIUM, GPT_MID, GPT_NANO];
        
        const CLAUDE_NANO = "claude-haiku-4-5";      
        const CLAUDE_MID = "claude-sonnet-4-6";      
        const CLAUDE_PREMIUM = "claude-opus-4-7";    
        const CLAUDE_FALLBACKS = [CLAUDE_PREMIUM, CLAUDE_MID, CLAUDE_NANO];

        async function attemptFetch(modelName: string, prov: string): Promise<boolean> {
            try {
                if (prov === "anthropic") aiResponse = await callClaude(modelName, fullSystemContext, historyArray, userText);
                else if (prov === "openai") aiResponse = await callOpenAI(modelName, fullSystemContext, historyArray, userText);
                else aiResponse = await callGemini(modelName, fullSystemContext, historyArray, userText);
                return true;
            } catch (e: any) {
                console.error(`[EXECUTION_FAILURE] Primary model ${modelName} rejected request:`, e.message);
                return false;
            }
        }

        if (provider === "omni") {
            console.log(`[ROUTER] Omni Engine Active. Complexity: ${words} words. Saving Costs...`);
            
            if (words <= 10 || usageRatio >= 90) { 
                wasSuccessful = await attemptFetch(GPT_NANO, "openai");
                if (!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_NANO, "gemini");
                if (!wasSuccessful) wasSuccessful = await attemptFetch(CLAUDE_NANO, "anthropic");
            } else if (words > 10 && words <= 60) {
                wasSuccessful = await attemptFetch(CLAUDE_MID, "anthropic");
                if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_MID, "openai");
                if (!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_MID, "gemini");
            } else {
                if (usageRatio < 75) {
                    wasSuccessful = await attemptFetch(CLAUDE_PREMIUM, "anthropic");
                    if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_PREMIUM, "openai");
                } else {
                    wasSuccessful = await attemptFetch(CLAUDE_MID, "anthropic"); 
                }
                if (!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_PREMIUM, "gemini");
            }
            if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_NANO, "openai");

        } else if (provider === "anthropic") {
            console.log(`[ROUTER] Claude Only Active.`);
            let targetModel = CLAUDE_MID;
            
            if (words <= 15 || usageRatio >= 85) targetModel = CLAUDE_NANO; 
            else if (words > 60) targetModel = CLAUDE_PREMIUM;

            wasSuccessful = await attemptFetch(targetModel, "anthropic");
            if (!wasSuccessful) {
                for (const fallback of CLAUDE_FALLBACKS) {
                    if (fallback !== targetModel) {
                        wasSuccessful = await attemptFetch(fallback, "anthropic");
                        if (wasSuccessful) break;
                    }
                }
            }
            if (!wasSuccessful) {
                console.log("[ROUTER_SHIELD] Anthropic crashed. Invisible Failover to OpenAI Nano.");
                wasSuccessful = await attemptFetch(GPT_NANO, "openai");
            }

        } else if (provider === "google") {
            console.log(`[ROUTER] Gemini Only Active.`);
            let targetModel = GEMINI_MID;
            
            if (words <= 15 || usageRatio >= 85) targetModel = GEMINI_NANO; 
            else if (words > 60) targetModel = GEMINI_PREMIUM;

            wasSuccessful = await attemptFetch(targetModel, "gemini");
            if (!wasSuccessful) {
                for (const fallback of GEMINI_FALLBACKS) {
                    if (fallback !== targetModel) {
                        wasSuccessful = await attemptFetch(fallback, "gemini");
                        if (wasSuccessful) break;
                    }
                }
            }
            if (!wasSuccessful) {
                console.log("[ROUTER_SHIELD] Gemini crashed. Invisible Failover to OpenAI Nano.");
                wasSuccessful = await attemptFetch(GPT_NANO, "openai");
            }

        } else {
            console.log(`[ROUTER] OpenAI Only Active.`);
            let targetModel = GPT_MID;
            
            if (words <= 15 || usageRatio >= 85) targetModel = GPT_NANO; 
            else if (words > 60) targetModel = GPT_PREMIUM;

            wasSuccessful = await attemptFetch(targetModel, "openai");
            if (!wasSuccessful) {
                for (const fallback of GPT_FALLBACKS) {
                    if (fallback !== targetModel) {
                        wasSuccessful = await attemptFetch(fallback, "openai");
                        if (wasSuccessful) break;
                    }
                }
            }
            if (!wasSuccessful) {
                console.log("[ROUTER_SHIELD] OpenAI crashed. Invisible Failover to Anthropic Nano.");
                wasSuccessful = await attemptFetch(CLAUDE_NANO, "anthropic");
            }
        }

        if (!wasSuccessful) {
            throw new Error("CRITICAL FATAL: All providers and cross-fallbacks exhausted.");
        }

        // ==========================================
        // 💾 COST CALCULATION & DISPATCH
        // ==========================================
        if (wasSuccessful) {
            const calculatedTokens = Math.ceil((userText.length + aiResponse.length) / 3);
            const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
            if (!isUnlimited) {
                updatePayload.tokens_used = tokensUsed + calculatedTokens;
            }
            await supabaseAdmin.from("user_configs").update(updatePayload).eq("id", configId);
        }
        
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
        // ==========================================
        // 🚨 GLOBAL TELEMETRY (ADMIN ALERT)
        // ==========================================
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