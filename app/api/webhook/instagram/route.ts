/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE INSTAGRAM WEBHOOK (OMNI ENGINE + AUTO-DM + DDOS SHIELD)
 * ==============================================================================================
 * @file app/api/webhook/instagram/route.ts
 * @description Handles Meta Graph API webhooks for Instagram DMs and Comments.
 * Features the "ManyChat-Killer" Auto-DM trigger system.
 * FIXED: Maintained 100% Original Omni-Engine Logic. Added Handover Protocol & Error Tracing.
 * UPGRADED: Injected Upstash Redis Rate Limiting (DDoS Armor) to prevent API spam.
 * 🚀 ARMOR ADDED: Added Empty Payload Fallback to prevent silent kills.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compileEnterprisePrompt } from "@/app/lib/ai/prompt-compiler";

// 🔥 NAYA INJECTION: Upstash Redis & Rate Limiter (DDoS Armor)
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// 🚀 Using standard Node serverless to prevent background task termination.
export const dynamic = "force-dynamic";

// 🛡️ INITIALIZE REDIS BOUNCER (3 msgs per 10 seconds)
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(3, "10 s"),
    analytics: true,
});

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

// -------------------------------------------------------------------------
// TELEGRAM ERROR REPORTER (CRITICAL FOR DEBUGGING META REJECTIONS)
// -------------------------------------------------------------------------
async function sendTelegramAlert(context: string, errorMessage: string) {
    try {
        const tgToken = process.env.TG_ADMIN_TOKEN;
        const tgChatId = process.env.TG_ADMIN_ID;
        if (!tgToken || !tgChatId) return;

        const text = `🚨 *CLAWLINK SYSTEM ALERT*\n\n*Context:* ${context}\n*Error Details:* ${errorMessage}`;
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: tgChatId, text: text, parse_mode: "Markdown" })
        });
    } catch (e) {
        console.error("Failed to send Telegram alert.");
    }
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

    if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
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

        // 🔥 THE MASTER FIX: Support for Facebook Handover Protocol
        const messagingEvents = entry.messaging || entry.standby;

        if (messagingEvents && messagingEvents[0]) {
            const webhookEvent = messagingEvents[0];
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message?.text;
            
            if (userText && !webhookEvent.message?.is_echo && senderId !== accountId) {
                
                // 🛑 REDIS RATE LIMIT CHECK FOR DMs
                const { success, reset } = await ratelimit.limit(`ratelimit_ig_dm_${senderId}`);
                if (!success) {
                    console.error(`🚨 [RATE LIMIT EXCEEDED] DM Spammer Blocked! User: ${senderId}. Retry at: ${new Date(reset).toLocaleTimeString()}`);
                    return NextResponse.json({ success: true, message: "Rate limited" }, { status: 200 });
                }

                // Awaiting process prevents Vercel from killing the function early
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
                    
                    // 🛑 REDIS RATE LIMIT CHECK FOR COMMENTS
                    const { success, reset } = await ratelimit.limit(`ratelimit_ig_comment_${senderId}`);
                    if (!success) {
                        console.error(`🚨 [RATE LIMIT EXCEEDED] Comment Spammer Blocked! User: ${senderId}. Retry at: ${new Date(reset).toLocaleTimeString()}`);
                        return NextResponse.json({ success: true, message: "Rate limited" }, { status: 200 });
                    }

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
    // 🎯 SMART COMMENT-TO-DM FUNNEL (AUTOMATION_RULES TABLE)
    // ==========================================
    if (type === "comment") {
        // 1. Fetch rules from the CORRECT table (automation_rules)
        const { data: activeRules, error: rulesError } = await supabase
            .from("automation_rules")
            .select("*")
            .eq("email", config.email)
            .eq("platform", "instagram");

        if (rulesError) {
            console.error("[IG_FUNNEL_DB_ERROR] Failed to fetch automation rules:", rulesError.message);
        }

        if (activeRules && activeRules.length > 0) {
            const commentLower = promptText.toLowerCase();
            
            // 2. Match the keyword with the new table structure
            const matchedRule = activeRules.find((rule: any) => {
                if (!rule.keyword) return false;
                const keywords = rule.keyword.split(',').map((k: string) => k.trim().toLowerCase());
                return keywords.some((k: string) => commentLower.includes(k));
            });

            if (matchedRule) {
                // 🚀 ARMOR: Get text and verify it exists so we don't send a blank payload
                const funnelText = matchedRule.content || matchedRule.dm_content || matchedRule.dmContent;

                if (funnelText && funnelText.trim() !== "") {
                    console.log(`[IG_FUNNEL_MATCHED] Rule found in DB! Executing Custom Funnel...`);
                    
                    // 3. Send Custom Public Comment Reply
                    if (matchedRule.public_reply && commentId) {
                        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: matchedRule.public_reply })
                        }).catch(e => console.error("Public Reply Error:", e));
                    }
                    
                    // 4. Send Custom Secret DM
                    const dmRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ recipient: { id: senderId }, message: { text: funnelText } })
                    });

                    const dmResponseData = await dmRes.json();
                    
                    if (dmResponseData.error) {
                        console.error("🔥 META REJECTION (FUNNEL DM):", JSON.stringify(dmResponseData.error));
                    } else {
                        // 🚨 LOG TO HISTORY & STOP THE AI! 
                        await supabase.from("chat_history").insert({ 
                            email: config.email, platform: "instagram", platform_chat_id: senderId, customer_name: "IG Follower", sender_type: "bot", message: `[AUTO-FUNNEL] ${funnelText}` 
                        });
                    }
                    
                    // 🛑 EXIT FUNCTION: This stops the Omni-Engine AI from replying!
                    return; 
                } else {
                    console.warn(`[IG_FUNNEL_EMPTY] Match found, but payload is empty! Falling back to Omni-Engine AI...`);
                    // Will naturally fall down to AI below
                }
            }
        }
        
        console.log(`[IG_COMMENT_NO_FUNNEL] No funnel match for: "${promptText}". Passing to AI...`);
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

    // 🚨 DEBUG FIX: Capture DB Insert Errors
    const { error: insertUserError } = await supabase.from("chat_history").insert({ 
        email: config.email, platform: "instagram", platform_chat_id: senderId, customer_name: "Instagram User", sender_type: "user", message: promptText 
    });
    if (insertUserError) console.error("🚨 DB INSERT ERROR (USER MSG):", JSON.stringify(insertUserError));

    let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
    let wasSuccessful = false;

    const words = promptText.split(/\s+/).length;
    const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;
    
    // ==========================================
    // 🔥 2026 UPGRADED API IDENTIFIERS (COST SAVER MAPPINGS)
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
    // 🧠 THE SMART ROUTER ALGORITHM (MAINTAINED 100%)
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
        
        // 🚨 DEBUG FIX: Log Meta Errors to Vercel Console
        if (metaResponseData.error) {
            console.error("🔥 META REJECTION:", JSON.stringify(metaResponseData.error));
            finalDbMessage = `[META_ERROR] ${metaResponseData.error.message}`;
            await sendTelegramAlert("Meta Graph API Rejected DM", `Reason: ${metaResponseData.error.message}\nSender ID: ${senderId}`);
        }

    } else if (type === "comment") {
        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "I've sent you a direct message with more details! 🚀" })
        });
        
        const dmRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiResponse } })
        });
        
        const dmResponseData = await dmRes.json();
        
        if (dmResponseData.error) {
            console.error("🔥 META REJECTION (COMMENT DM):", JSON.stringify(dmResponseData.error));
            finalDbMessage = `[META_ERROR] ${dmResponseData.error.message}`;
            await sendTelegramAlert("Meta Graph API Rejected Comment DM", `Reason: ${dmResponseData.error.message}\nSender ID: ${senderId}`);
        }
    }

    // 🚨 DEBUG FIX: Capture DB Insert Errors for Bot Message
    const { error: insertBotError } = await supabase.from("chat_history").insert({ 
        email: config.email, platform: "instagram", platform_chat_id: senderId, customer_name: "Instagram User", sender_type: "bot", message: finalDbMessage 
    });
    if (insertBotError) console.error("🚨 DB INSERT ERROR (BOT MSG):", JSON.stringify(insertBotError));
}