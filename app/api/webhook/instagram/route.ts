/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE INSTAGRAM WEBHOOK (OMNI ENGINE + AUTO-DM)
 * ==============================================================================================
 * @file app/api/webhook/instagram/route.ts
 * @description Handles Meta Graph API webhooks for Instagram DMs and Comments.
 * Features the "ManyChat-Killer" Auto-DM trigger system and 2026 Omni-Routing engine.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 Using standard Node serverless to prevent background task termination.
export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ CORS HEADERS FOR META
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent operating on Instagram. 
1. Keep your responses concise, friendly, and formatted for social media (use emojis sparingly but effectively).
2. FACTUAL RAG: Base answers ONLY on the Company Knowledge provided.
3. If the user asks something outside the Knowledge Base, do NOT guess. Politely state: "I don't have that specific info right now, let me connect you with a human agent."
`;

// =========================================================================
// 🧠 DIRECT AI MODEL CALLERS & RAG
// =========================================================================

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
        return res.ok ? data.embedding.values : null;
    } catch (e) {
        return null;
    }
}

async function callGemini(model: string, systemPrompt: string, history: any[], userText: string) {
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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_instruction: { parts: { text: systemPrompt } }, contents: contents })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini API rejected the request.");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    const messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: userText }];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model, messages: messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI API rejected the request.");
    return data.choices[0].message.content;
}

async function callClaude(model: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    let mergedMessages: any[] = [];
    let lastRole = "";
    for (const msg of history) {
        if (msg.role === lastRole) mergedMessages[mergedMessages.length - 1].content += "\n" + msg.content;
        else { mergedMessages.push({ role: msg.role, content: msg.content }); lastRole = msg.role; }
    }
    if (lastRole === "user") mergedMessages[mergedMessages.length - 1].content += "\n" + userText;
    else mergedMessages.push({ role: "user", content: userText });
    if (mergedMessages.length > 0 && mergedMessages[0].role !== "user") mergedMessages.shift();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, system: systemPrompt, messages: mergedMessages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Anthropic API rejected the request.");
    return data.content[0].text;
}

// =========================================================================
// 1. 🌐 GET REQUEST: META WEBHOOK VERIFICATION
// =========================================================================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === "clawlinkmeta2026") {
        console.log("[IG_WEBHOOK_VERIFICATION] Validation successful.");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 2. 🤖 POST REQUEST: INCOMING MESSAGES
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.object !== "instagram" && body.object !== "page") {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const entry = body.entry?.[0];
        if (!entry) return NextResponse.json({ success: true }, { status: 200 });

        const accountId = entry.id; 

        if (entry.messaging && entry.messaging[0]) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message?.text;
            
            if (userText && !webhookEvent.message?.is_echo && senderId !== accountId) {
                await processDynamicAI(senderId, accountId, userText, "dm");
            }
        }

        if (entry.changes && entry.changes[0]) {
            const change = entry.changes[0];
            if (change.field === "comments") {
                const commentValue = change.value;
                const userText = commentValue?.text;
                const senderId = commentValue?.from?.id;
                const commentId = commentValue?.id;

                if (senderId && userText && senderId !== accountId) {
                    await processDynamicAI(senderId, accountId, userText, "comment", commentId);
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[IG_WEBHOOK_FATAL] Error in POST handler:", error);
        return NextResponse.json({ success: true }, { status: 200 }); // Always return 200 to Meta
    }
}

// =========================================================================
// 🧠 PROCESSOR: DYNAMIC AI ROUTING (OMNI-ENGINE + RAG + TRIGGERS)
// =========================================================================
async function processDynamicAI(senderId: string, accountId: string, text: string, type: "dm" | "comment", commentId?: string) {
    const { data: config, error: dbError } = await supabase
        .from("user_configs")
        .select("*")
        .eq("instagram_account_id", accountId)
        .single();

    if (dbError || !config || !config.instagram_token) {
        console.warn(`[IG_PROCESSOR_REJECTED] Unauthorized account or missing token for ID: ${accountId}.`);
        return;
    }

    const metaApiToken = config.instagram_token.trim();
    const promptText = sanitizeInput(text);

    // ==========================================
    // 🎯 AUTO-DM TRIGGER CHECK (For Comments Only)
    // ==========================================
    if (type === "comment") {
        const triggers = (config.ig_auto_dm_triggers || "link,demo,price,send").toLowerCase().split(",");
        const commentLower = promptText.toLowerCase();
        
        const matchedTrigger = triggers.find((t: string) => commentLower.includes(t.trim()));
        
        if (!matchedTrigger) {
            console.log(`[IG_COMMENT_IGNORED] No trigger word found in: "${promptText}"`);
            return; // Exit execution, don't waste AI tokens
        }
        console.log(`[IG_AUTO_DM_TRIGGERED] Word matched: ${matchedTrigger}`);
    }

    // ==========================================
    // 🛑 THE GATEKEEPER (Plan, Expiry & Limits Check) 
    // ==========================================
    const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();

    if (currentPlan === "free" || currentPlan === "starter" || config.plan_status !== "Active") {
        console.warn(`[IG_GATEKEEPER] Unpaid or inactive account for ${config.email}. Blocking AI.`);
        const sleepMsg = "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their plan in the dashboard to enable 24/7 autonomous replies.";

        if (type === "dm") {
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: sleepMsg } })
            });
        }
        return; 
    }

    const isUnlimited = config.is_unlimited || currentPlan === "adv_max" || currentPlan === "yearly" || currentPlan === "ultra";
    const tokensUsed = config.tokens_used || 0;
    const tokensAllocated = config.tokens_allocated || config.available_tokens || 10000;
    const expiryDate = new Date(config.plan_expiry_date || new Date());
    const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

    if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
        console.warn(`[IG_LIMITS] Account limits exhausted for ${config.email}. Dropping request.`);
        const maintenanceMsg = "System Note: The AI assistant for this account is currently offline due to account limits. Please contact the administrator.";
        
        if (type === "dm") {
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: maintenanceMsg } })
            });
        }
        return; 
    }

    // ==========================================
    // 📚 FETCH COMPANY KNOWLEDGE (RAG)
    // ==========================================
    let customKnowledge = "";
    try {
        const queryVector = await generateEmbedding(promptText);
        if (queryVector) {
            const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                query_embedding: queryVector, match_threshold: 0.65, match_count: 2, p_user_email: config.email
            });
            if (matchedDocs && matchedDocs.length > 0) {
                customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
            }
        }
    } catch (e) { console.error("[IG_RAG_ERROR]", e); }

    // ==========================================
    // 🚀 INITIATE OMNI-ENGINE AI RESPONSE
    // ==========================================
    let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
    let provider = "openai"; 
    
    if (rawProvider.includes("omni") || rawProvider.includes("nexus")) provider = "omni";
    else if (rawProvider.includes("claude") || rawProvider.includes("anthropic") || rawProvider.includes("opus")) provider = "anthropic";
    else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

    const systemPrompt = config.system_prompt_instagram || config.system_prompt || "You are a professional, helpful, and concise AI agent for Instagram.";
    const fullSystemContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "No specific company data found."}`;

    const { data: pastChats } = await supabase
        .from("chat_history")
        .select("sender_type, message")
        .eq("email", config.email)
        .eq("platform_chat_id", senderId)
        .order("created_at", { ascending: false })
        .limit(10);

    const historyArray = (pastChats || []).reverse().map(c => ({
        role: c.sender_type === "bot" ? "assistant" : "user",
        content: c.message ? c.message.trim() : " "
    }));

    await supabase.from("chat_history").insert({ 
        email: config.email, platform: "instagram", platform_chat_id: senderId, customer_name: "Instagram User", sender_type: "user", message: promptText 
    });

    let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
    let wasSuccessful = false;

    const words = promptText.split(/\s+/).length;
    const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
    
    const GEMINI_CHEAP = "gemini-3.1-flash-lite"; const GEMINI_MID = "gemini-3.1-flash"; const GEMINI_PREMIUM = "gemini-3.1-pro";    
    const GPT_CHEAP = "gpt-4.1-nano"; const GPT_MID = "gpt-5.2"; const GPT_PREMIUM = "gpt-5.4"; 
    const CLAUDE_CHEAP = "claude-3-haiku-20240307"; const CLAUDE_MID = "claude-sonnet-4.6"; const CLAUDE_PREMIUM = "claude-opus-4.6";

    let targetProvider = provider;
    let targetModel = "";

    if (provider === "omni") {
        if (usageRatio >= 80) { targetProvider = "google"; targetModel = GEMINI_CHEAP; } 
        else if (usageRatio >= 60) { targetProvider = "openai"; targetModel = words < 40 ? GPT_CHEAP : GPT_MID; } 
        else {
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
        if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullSystemContext, historyArray, promptText);
        else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullSystemContext, historyArray, promptText);
        else aiResponse = await callGemini(targetModel, fullSystemContext, historyArray, promptText);
        wasSuccessful = true;
    } catch (err1) {
        console.error(`[EXECUTION_FAILURE] Primary model ${targetModel} rejected request. Defaulting to fallback.`);
        try {
            aiResponse = await callGemini(GEMINI_CHEAP, fullSystemContext, historyArray, promptText);
            wasSuccessful = true;
        } catch (fallbackErr) { console.error("Total Fallback Exhaustion"); }
    }

    if (wasSuccessful) {
        const calculatedTokens = Math.ceil((promptText.length + aiResponse.length) / 3);
        const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
        if (!isUnlimited) updatePayload.tokens_used = tokensUsed + calculatedTokens;
        await supabase.from("user_configs").update(updatePayload).eq("id", config.id);
    }

    // ==========================================
    // 📤 DISPATCH RESPONSE TO META GRAPH API
    // ==========================================
    let finalDbMessage = aiResponse;

    if (type === "dm") {
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiResponse } })
        });
        const metaResponseData = await metaRes.json();
        if (metaResponseData.error) finalDbMessage = `[META_ERROR] ${metaResponseData.error.message}`;

    } else if (type === "comment") {
        // Reply to comment first, then send DM
        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "I've sent you a direct message with more details! 🚀" })
        });
        
        const dmRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiResponse } })
        });
        const dmResponseData = await dmRes.json();
        if (dmResponseData.error) finalDbMessage = `[META_ERROR] ${dmResponseData.error.message}`;
    }

    await supabase.from("chat_history").insert({ 
        email: config.email, platform: "instagram", platform_chat_id: senderId, customer_name: "Instagram User", sender_type: "bot", message: finalDbMessage 
    });
}