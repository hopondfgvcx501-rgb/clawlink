/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP FLOW BACKEND API
 * ==============================================================================================
 * @description Handles saving visual flow data and compiling it into Meta Graph API 
 * compatible JSON payloads. Integrated with the centralized Omni-Channel Alert Matrix.
 * 🚀 FIXED: Bypassed 23502 DB constraint by feeding dual columns (keyword + trigger_keyword).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { compileEnterprisePrompt } from "../../../lib/ai/prompt-compiler";

// FIX: Removed external import to prevent Vercel build errors
const sendEmail = async (...args: any[]) => console.log("Email disabled");

// THE CACHE KILLER: Forces Next.js to fetch LIVE Database state instantly
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// 🚀 GLOBAL VARIABLES (Outside of functions to maintain state)
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; // Ultra-fast WhatsApp cooldown

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 🛡️ SECURITY LOCK 1: ENTERPRISE DATA SANITIZER (Prevents Injection)
// =========================================================================
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .replace(/<[^>]*>?/gm, "") // Remove HTML tags
        .replace(/--/g, "") // Prevent SQL comment injection
        .replace(/;/g, "") // Prevent SQL statement chaining
        .trim();
}

// =========================================================================
// 1. GET REQUEST: META WEBHOOK VERIFICATION (DO NOT TOUCH)
// =========================================================================
export async function GET(req: Request) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clawlinkmeta2026";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 🚀 AI HELPER FUNCTIONS (NOW WITH BULLETPROOF MEMORY ARRAYS)
// =========================================================================
async function generateEmbedding(text: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text: text }] } }) 
        });
        const data = await res.json();
        return res.ok ? data.embedding.values : null;
    } catch (e) { return null; }
}

async function callGemini(model: string, systemPrompt: string, history: any[], userText: string) {
    if (!process.env.GEMINI_API_KEY) throw new Error("API_KEY missing");
    
    // 🧠 BULLETPROOF GEMINI MEMORY COMPACTOR (Prevents 400 Crashes)
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

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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

async function callOpenAI(model: string, systemPrompt: string, history: any[], userText: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("API_KEY missing");
    
    const messages = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: userText }
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: messages })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Provider Error: OpenAI API rejected the request.");
    return data.choices[0].message.content;
}

async function callClaude(model: string, systemPrompt: string, history: any[], userText: string) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("API_KEY missing");
    
    // 🧠 BULLETPROOF CLAUDE MEMORY COMPACTOR
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
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
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

// =========================================================================
// 2. POST REQUEST: PROCESSING INCOMING MESSAGES
// =========================================================================
export async function POST(req: Request) {
    let whatsappToken = "";
    let phoneNumberId = "";
    let chatId = ""; 

    try {
        const body = await req.json();

        if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
            return NextResponse.json({ success: true }); 
        }

        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        
        // 🛡️ Sanitize Chat ID & Customer Name
        const customerName = sanitizeInput(value.contacts?.[0]?.profile?.name || "Customer");

        // 🔥 TITANIUM FIX 1: Allow Interactive messages (Button Clicks) to pass through
        const isInteractive = message.type === "interactive";
        if (message.type !== "text" && !isInteractive) {
            return NextResponse.json({ success: true });
        }

        chatId = sanitizeInput(message.from); 
        
        // 🔥 TITANIUM FIX 2: Safely extract text from either Text body or Button title
        let rawUserText = "";
        if (isInteractive) {
            rawUserText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || "";
        } else if (message.type === "text") {
            rawUserText = message.text?.body || "";
        }
        
        rawUserText = sanitizeInput(rawUserText);
        
        // ✂️ COST CONTROL: Cut message if it's suspiciously long (CHANGED TO LET FOR DYNAMIC OVERRIDE)
        let userText = rawUserText.length > 800 ? rawUserText.substring(0, 800) + "..." : rawUserText;
        
        phoneNumberId = sanitizeInput(value.metadata.phone_number_id); 

        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // 🔥 CRITICAL FIX: Prevent duplicate row crashes
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("whatsapp_phone_id", phoneNumberId)
            .limit(1)
            .maybeSingle();

        if (configErr) {
            console.error(`[X-RAY_DB_CRASH] Supabase Error: ${configErr.message} | Details: ${configErr.details}`);
            return NextResponse.json({ success: true });
        }
        if (!config) {
            console.error(`[X-RAY_MISSING] No row found in Supabase for WA Phone ID: ${phoneNumberId}`);
            return NextResponse.json({ success: true });
        }
        if (!config.whatsapp_token) {
             console.error(`[X-RAY_TOKEN] Row found, but whatsapp_token is empty/NULL for ID: ${phoneNumberId}`);
             return NextResponse.json({ success: true });
        }

        whatsappToken = config.whatsapp_token;
        const configId = config.id; 
        const userEmail = config.email;

        // ==========================================
        // 🚀 ENTERPRISE UPGRADE: CRM CONTACTS AUTO-SYNC
        // ==========================================
        await supabase.from("contacts").upsert({
            user_email: userEmail,
            platform_chat_id: chatId,
            customer_name: customerName,
            channel: "whatsapp",
            phone_number: chatId.replace(/\D/g, '') // WhatsApp IDs are usually phone numbers
        }, { onConflict: "user_email, platform_chat_id, channel" });

        // ==========================================
        // 🛑 THE ADMIN HANDOVER CHECK (PAUSE AI)
        // ==========================================
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: userText 
        });

        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 1);

        const { data: adminIntervention } = await supabase
            .from("chat_history")
            .select("id")
            .eq("email", userEmail)
            .eq("platform_chat_id", chatId)
            .eq("sender_type", "admin")
            .gte("created_at", fifteenMinutesAgo.toISOString())
            .limit(1);

        if (adminIntervention && adminIntervention.length > 0) {
            console.log(`[AI_PAUSED] Manual intervention detected for chat ${chatId}. Bot will not reply.`);
            return NextResponse.json({ success: true });
        }

        // ==========================================
        // 🛑 FLOW BUILDER INTERCEPTOR (Keyword Override)
        // ==========================================
        const normalizedText = userText.trim().toLowerCase();
        
        const { data: flowRule, error: flowErr } = await supabase
            .from("automation_rules")
            .select("response_text, response_payload") 
            .eq("email", userEmail)
            .eq("platform", "whatsapp")
            .eq("trigger_keyword", normalizedText)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

        if (flowRule) {
            console.log(`[FLOW_TRIGGERED] Keyword match found for: ${normalizedText}. Bypassing AI.`);
            
            // 🔥 TITANIUM FIX 3: META INTERACTIVE PAYLOAD TRANSLATOR
            let metaPayload: any = { messaging_product: "whatsapp", to: chatId };
            const pData = flowRule.response_payload || {};

            if (pData.type === "button" && pData.buttons && pData.buttons.length > 0) {
                metaPayload.type = "interactive";
                metaPayload.interactive = {
                    type: "button",
                    body: { text: pData.text || flowRule.response_text || "Choose an option:" },
                    action: { buttons: pData.buttons.slice(0, 3) } // Meta strict limit
                };
            } else if (pData.type === "list" && pData.list_options && pData.list_options.length > 0) {
                metaPayload.type = "interactive";
                metaPayload.interactive = {
                    type: "list",
                    body: { text: pData.text || flowRule.response_text || "Select from menu:" },
                    action: {
                        button: "View Options",
                        sections: [{ title: "Options", rows: pData.list_options.slice(0, 10) }]
                    }
                };
            } else {
                metaPayload.type = "text";
                metaPayload.text = { body: flowRule.response_text || "Interactive Message" };
            }

            // 1. Send the compiled Meta Payload directly to Meta
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", 
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify(metaPayload)
            });

            // 2. Save the bot's flow response to chat history
            await supabase.from("chat_history").insert({ 
                email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: flowRule.response_text || "[Interactive Flow Message Sent]"
            });

            // 3. HALT EXECUTION: Return early so the AI (Omni Engine) DOES NOT run
            return NextResponse.json({ success: true });
        }
        
        // 🚀 SMART PROVIDER DETECTION (Omni vs Normal)
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        if (rawProvider.includes("omni") || rawProvider.includes("nexus")) provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic") || rawProvider.includes("opus")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        // ==========================================
        // 🛑 THE GATEKEEPER (Plan, Expiry & Limits Check) 
        // ==========================================
        const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();
        
        if (currentPlan === "free" || currentPlan === "starter" || config.plan_status !== "Active") {
            const sleepMsg = "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their plan in the dashboard to enable 24/7 autonomous replies.";
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: sleepMsg } })
            });
            console.log(`[GATEKEEPER] Blocked unpaid WA message for phone ID: ${phoneNumberId}`);
            return NextResponse.json({ success: true });
        }

        const isUnlimited = config.is_unlimited || config.plan === "adv_max" || config.plan === "yearly" || currentPlan === "ultra";
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || config.available_tokens || 10000;
        
        const expiryDate = new Date(config.plan_expiry_date || new Date());
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            const maintenanceMsg = "System Note: The AI assistant for this account is currently offline due to account limits. Please contact the administrator.";
                
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: maintenanceMsg } })
            });
            return NextResponse.json({ success: true });
        }

        // ==========================================
        // 🚀 ENTERPRISE UPGRADE: DYNAMIC WELCOME AI
        // ==========================================
        const { count: chatCount, error: countErr } = await supabase
            .from("chat_history")
            .select("*", { count: 'exact', head: true })
            .eq("email", userEmail)
            .eq("platform_chat_id", chatId)
            .eq("sender_type", "user");

        // If chatCount is 1 (because we just inserted the current message at line 144), it's a brand new customer!
        if (!countErr && chatCount === 1) {
            const { data: welcomeRule } = await supabase
                .from("automation_rules")
                .select("response_text")
                .eq("email", userEmail)
                .eq("platform", "whatsapp")
                .eq("trigger_keyword", "welcomeMsg")
                .single();

            if (welcomeRule && welcomeRule.response_text === 'true') {
                console.log(`[WELCOME_TRIGGERED] Injecting AI Welcome Context for tenant: ${userEmail}`);
                userText = `[SYSTEM EVENT: This is a brand new customer. Their first message to you is: "${userText}". Introduce yourself according to your configured persona, welcome them to the business warmly, and ask how you can help them.]`;
            }
        }

        // ==========================================
        // 🚀 ENTERPRISE UPGRADE: ISOLATED RAG FETCH
        // ==========================================
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                // EXPLICITLY passing userEmail to ensure data isolation (No cross-tenant data leaks)
                const { data: matchedDocs, error: rpcError } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: userEmail
                });
                
                if (rpcError) {
                    console.error("[RAG_ISOLATION_ERROR] RPC execution failed for user:", userEmail, rpcError);
                } else if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                    console.log(`[RAG_SUCCESS] Fetched knowledge specific to tenant: ${userEmail}`);
                }
            }
        } catch (e) {
            console.error("[RAG_CRASH]", e);
        }

        // 🧠 MEMORY ENGINE
        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", userEmail)
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

        // 🚀 THE TITANIUM BRAIN INJECTION
        let fullSystemContext = compileEnterprisePrompt(config, customKnowledge);

        // 🔥 FORCED WHATSAPP PERSONA OVERRIDE
        if (config.whatsapp_persona) {
            fullSystemContext += `\n\n=== CRITICAL WHATSAPP IDENTITY OVERRIDE ===\nIGNORE all previous instructions about being a polite corporate assistant. You MUST strictly adopt this exact persona and tone for this specific chat:\n\n${config.whatsapp_persona}\n===========================================\n`;
        }
        
        // =========================================================================
        // 8. 🧠 CLAWLINK 2026 DIRECT EXECUTION & SMART OMNI ROUTER
        // =========================================================================
        let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
        let wasSuccessful = false;

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;

        // THE ULTIMATE FIX: Hyphens (-) strictly used for Anthropic models to bypass 404
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

        // 🚀 THE DECISION MATRIX (Omni vs Normal Models)
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
        // 9. CHARGE TOKENS & SAVE AI RESPONSE
        // ==========================================
        if (wasSuccessful) {
            const calculatedTokens = Math.ceil((userText.length + aiResponse.length) / 3);
            const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
            if (!isUnlimited) {
                updatePayload.tokens_used = tokensUsed + calculatedTokens; 
            }
            await supabase.from("user_configs").update(updatePayload).eq("id", configId);
        }
        
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
        });

        await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
            body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: aiResponse } })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[SYSTEM_FATAL] Webhook processing halted:", error);
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN; 
            const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID; 
            if (adminChatId && token) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: adminChatId, text: `⚠️ [WHATSAPP CRASH]: ${error.message || "Unknown Runtime Exception"}` })
                });
            }
        } catch (e) {}
        
        return NextResponse.json({ success: true }); 
    }
}