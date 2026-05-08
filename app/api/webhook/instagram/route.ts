/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE INSTAGRAM WEBHOOK (OMNI ENGINE + AUTO-DM)
 * ==============================================================================================
 * @file app/api/webhook/instagram/route.ts
 * @description Handles Meta Graph API webhooks for Instagram DMs and Comments.
 * Features the "ManyChat-Killer" Auto-DM trigger system.
 * FIXED: Upgraded Anthropic Claude logic to strictly alternate user/assistant roles.
 * FIXED: Replaced dots (.) with hyphens (-) in Anthropic 2026 API IDs to prevent 404 errors.
 * FIXED: Connected to the dynamic enterprise prompt compiler.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compileEnterprisePrompt } from "@/app/lib/ai/prompt-compiler";

// 🚀 Using standard Node serverless to prevent background task termination.
export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

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

// =========================================================================
// 🧠 DIRECT AI MODEL CALLERS (WITH ROLE ENFORCEMENTS)
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

// CRITICAL UPGRADE: Enforced strict alternating roles to prevent Anthropic 400 crashes
async function callClaude(modelId: string, systemPrompt: string, history: any[], userText: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    
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
            max_tokens: 1024, 
            system: systemPrompt,
            messages: claudeMessages 
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Provider Error: Anthropic API rejected the request. Details: ${JSON.stringify(data)}`);
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
        return NextResponse.json({ success: true }, { status: 200 }); 
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
            return; 
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

    // 🚀 THE TITANIUM BRAIN INJECTION: Dynamically compiled from DB settings
    const fullSystemContext = compileEnterprisePrompt(config, customKnowledge);

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
    
    // ==========================================
    // 🔥 2026 UPGRADED API IDENTIFIERS (COST SAVER MAPPINGS)
    // THE ULTIMATE FIX: Hyphens (-) strictly used for Anthropic models to bypass 404
    // ==========================================
    const GEMINI_NANO = "gemini-3.1-flash-lite"; const GEMINI_MID = "gemini-3.1-flash"; const GEMINI_PREMIUM = "gemini-3.1-pro";     
    const GEMINI_FALLBACKS = [GEMINI_PREMIUM, GEMINI_MID, GEMINI_NANO];
    
    const GPT_NANO = "gpt-4.1-nano";             const GPT_MID = "gpt-5.4-mini";              const GPT_PREMIUM = "gpt-5.5-pro";               
    const GPT_FALLBACKS = [GPT_PREMIUM, GPT_MID, GPT_NANO];
    
    const CLAUDE_NANO = "claude-haiku-4-5";      const CLAUDE_MID = "claude-sonnet-4-6";      const CLAUDE_PREMIUM = "claude-opus-4-7";    
    const CLAUDE_FALLBACKS = [CLAUDE_PREMIUM, CLAUDE_MID, CLAUDE_NANO];

    async function attemptFetch(modelName: string, prov: string): Promise<boolean> {
        try {
            if (prov === "anthropic") aiResponse = await callClaude(modelName, fullSystemContext, historyArray, promptText);
            else if (prov === "openai") aiResponse = await callOpenAI(modelName, fullSystemContext, historyArray, promptText);
            else aiResponse = await callGemini(modelName, fullSystemContext, historyArray, promptText);
            return true;
        } catch (e: any) {
            console.error(`[EXECUTION_FAILURE] Primary model ${modelName} rejected request:`, e.message);
            return false;
        }
    }

    // ==========================================
    // 🧠 THE SMART ROUTER ALGORITHM (MILLISECOND FALLBACK & COST SAVER)
    // ==========================================
    if (provider === "omni") {
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
        if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_NANO, "openai");

    } else if (provider === "google") {
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
        if (!wasSuccessful) wasSuccessful = await attemptFetch(GPT_NANO, "openai");

    } else {
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
        if (!wasSuccessful) wasSuccessful = await attemptFetch(CLAUDE_NANO, "anthropic");
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