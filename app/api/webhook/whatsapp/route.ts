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

// 🛡️ ENTERPRISE GUARDRAIL: Adaptive Master Persona & RAG Enforcement
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Advanced AI Support Agent operating on the ClawLink Engine.
1. FACTUAL INTEGRITY (RAG): For any queries regarding the company's pricing, features, services, or policies, you MUST strictly rely ONLY on the provided "Company Knowledge Base". Never invent, guess, or hallucinate business data.
2. THE ESCALATION RULE: If the user asks for a company-specific detail that is missing from the Knowledge Base, DO NOT guess. Politely state: "I don't have that specific information right now. Let me connect you with our human support team."
3. ADAPTIVE PERSONA (GENERAL CHAT): For general questions, greetings, or industry knowledge, you must dynamically adapt your tone, language, and behavior based EXACTLY on the "System Instructions" provided below. If the System Instructions tell you to be friendly, be friendly. If they tell you to be professional, be strictly professional.
`;

// =========================================================================
// 1. GET REQUEST: META WEBHOOK VERIFICATION
// =========================================================================
export async function GET(req: Request) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ClawLinkMeta2026";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 🚀 AI HELPER FUNCTIONS 
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

async function callGemini(model: string, prompt: string) {
    if (!process.env.GEMINI_API_KEY) throw new Error("API_KEY missing");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("API_KEY missing");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("API_KEY missing");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Claude Error");
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
        const customerName = value.contacts?.[0]?.profile?.name || "Customer";

        if (message.type !== "text") return NextResponse.json({ success: true });

        chatId = message.from; 
        let rawUserText = message.text.body;
        
        // ✂️ COST CONTROL: Cut message if it's suspiciously long
        const userText = rawUserText.length > 800 ? rawUserText.substring(0, 800) + "..." : rawUserText;
        
        phoneNumberId = value.metadata.phone_number_id; 

        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("whatsapp_phone_id", phoneNumberId)
            .single();

        if (configErr || !config || !config.whatsapp_token) {
            return NextResponse.json({ success: true });
        }

        whatsappToken = config.whatsapp_token;
        const configId = config.id; // 💎 UNIQUE ID FOR TRACKING
        const userEmail = config.email;

        // 🚀 FIXED: Isolated WhatsApp Persona to prevent multi-channel conflicts
        const systemPrompt = config.system_prompt_whatsapp || config.system_prompt || "You are a helpful AI assistant on WhatsApp.";
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        if (rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        // ==========================================
        // 🛑 THE GATEKEEPER (Expiry & Limits Check)
        // ==========================================
        const isUnlimited = config.is_unlimited || config.plan_name === "max" || config.plan_name === "ultra_max" || config.plan_name === "pro";
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || 10000;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        // 🚀 CUSTOMER-FACING MAINTENANCE MESSAGE
        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            const maintenanceMsg = "Hello! Our AI assistant is currently undergoing a brief scheduled maintenance to serve you better. Please leave your query and our human support team will get back to you shortly. Thank you for your patience!";
                
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
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {}

        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", userEmail)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = pastChats && pastChats.length > 0 
            ? pastChats.reverse().map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n") 
            : "";

        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "None."}\n\nMemory:\n${memoryHistory}\n\nUser: ${userText}`;
        
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: userText 
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
            if (targetProvider === "anthropic") aiResponse = await callClaude(targetModel, fullContext);
            else if (targetProvider === "openai") aiResponse = await callOpenAI(targetModel, fullContext);
            else aiResponse = await callGemini(targetModel, fullContext);
            wasSuccessful = true;
        } catch (err1) {
            console.error(`[AI Error] ${targetModel} failed. Routing to GPT Mini...`);
            try {
                aiResponse = await callOpenAI(MEDIUM_MODEL, fullContext);
                wasSuccessful = true;
            } catch (err2) {
                console.error(`[AI Error] GPT Mini failed. Routing to Gemini Flash...`);
                try {
                    aiResponse = await callGemini(CHEAP_MODEL, fullContext);
                    wasSuccessful = true;
                } catch (err3) {
                    console.error(`[AI Error] All providers failed.`);
                }
            }
        }

        // ==========================================
        // 9. CHARGE TOKENS & SAVE AI RESPONSE (ISOLATED TRACKING)
        // ==========================================
        if (wasSuccessful) {
            const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
            if (!isUnlimited) {
                updatePayload.tokens_used = tokensUsed + 1;
            }
            // 🚀 FIXED: Update EXACT bot by its unique ID, not by email!
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
        return NextResponse.json({ success: true }); 
    }
}