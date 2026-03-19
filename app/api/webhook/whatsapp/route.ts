import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Using a try-catch for the email import so the build doesn't fail if the file isn't ready
let sendEmail: any;
try { sendEmail = require("../../../lib/email").sendEmail; } catch (e) {}

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; 

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ ENTERPRISE GUARDRAIL: Strict RAG Enforcement & Human Handoff Protocol
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Company Knowledge to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated/angry, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and highly polite. Never argue with the customer.
`;

// 🚀 STRICT INTRA-PROVIDER FALLBACK ARCHITECTURE (Updated to Real Production Models)
const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"], 
    "anthropic": ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"],
    "google": ["gemini-1.5-flash", "gemini-1.5-pro"]
};

// =========================================================================
// 1. GET REQUEST: META WEBHOOK VERIFICATION
// =========================================================================
export async function GET(req: Request) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Strictly locked to match frontend guide
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ClawLinkMeta2026";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Meta Webhook Verified Successfully");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 🚀 AI & RAG HELPER FUNCTIONS
// =========================================================================
async function generateEmbedding(text: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: { parts: [{ text: text }] } }) // Strict Format
        });
        const data = await res.json();
        return res.ok ? data.embedding.values : null;
    } catch (e) {
        return null;
    }
}

async function callGemini(model: string, prompt: string) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
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

        // 1. Validate Meta Payload Structure
        if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
            return NextResponse.json({ success: true }); 
        }

        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const customerName = value.contacts?.[0]?.profile?.name || "Customer";

        if (message.type !== "text") return NextResponse.json({ success: true });

        chatId = message.from; 
        const userText = message.text.body;
        phoneNumberId = value.metadata.phone_number_id; 

        // 2. Spam / Rate Limiting Check
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // 3. 🚀 CRITICAL FIX: Find the EXACT Customer config using Phone Number ID
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .eq("whatsapp_phone_id", phoneNumberId)
            .single();

        if (configErr || !config || !config.whatsapp_token) {
            return NextResponse.json({ success: true });
        }

        whatsappToken = config.whatsapp_token;
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant on WhatsApp.";
        const userEmail = config.email;
        
        // 🔒 GET STRICT AI PROVIDER FROM DB
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 
        
        // 🚦 Routing Identity Logic
        if (rawProvider === "multi_model") provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        // 4. Token & Plan Verification
        if (!config.is_unlimited && (config.tokens_used >= config.tokens_allocated)) {
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: "⚠️ The owner of this bot has exhausted their API limits." } })
            });

            if (sendEmail) {
               const alertHtml = `
                 <div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ef4444;">
                   <h2 style="color: #ef4444;">⚠️ ACTION REQUIRED: WHATSAPP BOT PAUSED</h2>
                   <p>Your ClawLink AI Agent on WhatsApp Cloud has reached its resource limit.</p>
                   <br/><a href="https://clawlink.com/dashboard" style="background: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Recharge & Resume Bot</a>
                 </div>
               `;
               await sendEmail(userEmail, "URGENT: Your WhatsApp Bot is Paused", alertHtml);
            }
            return NextResponse.json({ success: true });
        }

        // 5. 🚀 RAG KNOWLEDGE FETCH (Vector DB)
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector,
                    match_threshold: 0.65,
                    match_count: 3,
                    p_user_email: userEmail
                });
                
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {}

        // 6. FETCH CONVERSATION HISTORY (Memory)
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

        // 7. 🛡️ INJECT ENTERPRISE GUARDRAIL DIRECTLY INTO CONTEXT
        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "None."}\n\nMemory:\n${memoryHistory}\n\nUser: ${userText}`;
        
        // Save User Message to CRM Database
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: userText 
        });

        // 8. 🔒 THE SMART ROUTER (Omni vs Normal)
        let aiResponse = "API Error: Model failed to process request.";
        let wasSuccessful = false;

        if (provider === "omni") {
            // 🚀 ROUTE TO VIP OMNI ENGINE
            console.log("🚦 Routing request to OmniAgent Nexus Engine...");
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://clawlink-six.vercel.app";
            
            try {
                const omniRes = await fetch(`${baseUrl}/api/omni`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: userText,
                        systemPrompt: `System Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}`,
                        history: pastChats ? pastChats.reverse().map(chat => ({ role: chat.sender_type === "bot" ? "assistant" : "user", content: chat.message })) : []
                    })
                });

                if (omniRes.ok) {
                    const omniData = await omniRes.json();
                    if (omniData.success) {
                        aiResponse = omniData.reply;
                        wasSuccessful = true;
                    }
                }
            } catch (err) {
                console.error("❌ Omni Engine call failed:", err);
            }
        } else {
            // 🚗 ROUTE TO NORMAL INTRA-PROVIDER ENGINE
            console.log(`🚦 Routing request to Normal Engine: ${provider}...`);
            const chain = AI_CHAINS[provider] || AI_CHAINS["openai"];
            for (const modelName of chain) {
                try {
                    if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                    else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                    else aiResponse = await callGemini(modelName, fullContext);
                    
                    wasSuccessful = true;
                    break; 
                } catch (err: any) {
                    console.error(`[WhatsApp AI Error] ${modelName} failed:`, err.message);
                }
            }
        }

        // 9. CHARGE TOKENS & SAVE AI RESPONSE
        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + 1 }).eq("email", userEmail);
            }
            await supabase.from("chat_history").insert({ 
                email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
            });
        }

        // 10. DISPATCH FINAL MESSAGE VIA WHATSAPP CLOUD API
        await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
            body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: aiResponse } })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("WhatsApp Critical Error:", error.message);
        return NextResponse.json({ success: true }); 
    }
}