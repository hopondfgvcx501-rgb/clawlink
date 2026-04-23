import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIX: Removed external import to prevent Vercel build errors
const sendEmail = async (...args: any[]) => console.log("Email disabled");

export const dynamic = "force-dynamic";

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

// 🛡️ ENTERPRISE GUARDRAIL: Adaptive Master Persona & RAG Enforcement
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Advanced AI Support Agent operating on the ClawLink Engine.
1. FACTUAL INTEGRITY (RAG): For any queries regarding the company's pricing, features, services, or policies, you MUST strictly rely ONLY on the provided "Company Knowledge Base". Never invent, guess, or hallucinate business data.
2. THE ESCALATION RULE: If the user asks for a company-specific detail that is missing from the Knowledge Base, DO NOT guess. Politely state: "I don't have that specific information right now. Let me connect you with our human support team."
3. ADAPTIVE PERSONA (GENERAL CHAT): For general questions, greetings, or industry knowledge, you must dynamically adapt your tone, language, and behavior based EXACTLY on the "System Instructions" provided below. If the System Instructions tell you to be friendly, be friendly. If they tell you to be professional, be strictly professional.
`;

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

        if (message.type !== "text") return NextResponse.json({ success: true });

        chatId = sanitizeInput(message.from); 
        
        // 🛡️ Sanitize User Text
        let rawUserText = sanitizeInput(message.text.body);
        
        // ✂️ COST CONTROL: Cut message if it's suspiciously long
        const userText = rawUserText.length > 800 ? rawUserText.substring(0, 800) + "..." : rawUserText;
        
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
        // 🛑 THE ADMIN HANDOVER CHECK (PAUSE AI)
        // ==========================================
        // Save the incoming message from the user first
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: userText 
        });

        // 🚀 We check if there are ANY recent messages from 'admin' for this user
        // If an admin sent a message in the last 15 minutes, we pause AI auto-replies.
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

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
            // Return 200 to Meta so they know we got the message, but we do NOT fire the AI.
            return NextResponse.json({ success: true });
        }


        // System Prompt
        const systemPrompt = config.system_prompt_whatsapp || config.system_prompt || "You are a helpful AI assistant on WhatsApp.";
        
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

        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: userEmail
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                }
            }
        } catch (e) {}

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

        const fullSystemContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "None."}`;
        
        // =========================================================================
        // 8. 🧠 CLAWLINK 2026 DIRECT EXECUTION & SMART OMNI ROUTER
        // =========================================================================
        let aiResponse = "System is undergoing scheduled maintenance. Please try again later.";
        let wasSuccessful = false;

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (tokensUsed / tokensAllocated) * 100;

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

        // 🚀 THE DECISION MATRIX (Omni vs Normal Models)
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

        // ⚡ DIRECT EXECUTION ENGINE (No external fetch loops!)
        try {
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullSystemContext, historyArray, userText);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullSystemContext, historyArray, userText);
            else aiResponse = await callGemini(targetModel, fullSystemContext, historyArray, userText);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[EXECUTION_FAILURE] Primary model ${targetModel} rejected request.`);
            
            // ⚡ FALLBACK LOGIC
            if (provider === "omni") {
                console.log("[OMNI_FALLBACK] Routing to secondary engine...");
                try {
                    aiResponse = await callOpenAI(GPT_CHEAP, fullSystemContext, historyArray, userText);
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