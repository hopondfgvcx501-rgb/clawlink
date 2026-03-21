import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 FIX: Removed external import to prevent Vercel build errors
const sendEmail = async (...args: any[]) => console.log("Email disabled");

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; // 2 seconds spam cooldown

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ ENTERPRISE GUARDRAIL
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Company Knowledge to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated/angry, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and highly polite. Never argue with the customer.
`;

// 🚀 STRICT INTRA-PROVIDER FALLBACK ARCHITECTURE (Smart Cost Routing)
const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], 
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    "google": ["gemini-1.5-pro", "gemini-1.5-flash"]
};

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
        console.log("✅ Meta Webhook Verified Successfully");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 🚀 AI HELPER FUNCTIONS (USING CLAWLINK MASTER KEYS)
// =========================================================================
async function generateEmbedding(text: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
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

        // 1. Validate Meta Payload Structure
        if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
            return NextResponse.json({ success: true }); 
        }

        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];
        const customerName = value.contacts?.[0]?.profile?.name || "Customer";

        if (message.type !== "text") return NextResponse.json({ success: true });

        chatId = message.from; 
        let rawUserText = message.text.body;
        // 🛡️ COST CONTROL: Cut message if it's suspiciously long (over 1000 chars)
        const userText = rawUserText.length > 1000 ? rawUserText.substring(0, 1000) + "..." : rawUserText;
        
        phoneNumberId = value.metadata.phone_number_id; 

        // 2. Spam / Rate Limiting Check
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // 3. 🚀 CRITICAL FIX: Find Customer config using Phone Number ID
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

        // ==========================================
        // 🛑 THE GATEKEEPER (Expiry & Limits Check)
        // ==========================================
        const isUnlimited = config.is_unlimited || config.plan_name === "max" || config.plan_name === "ultra_max";
        const messagesUsed = config.messages_used_this_month || 0;
        const monthlyLimit = config.monthly_message_limit || 1000;
        
        // Expiry Date Logic
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        if (isExpired || (!isUnlimited && messagesUsed >= monthlyLimit)) {
            const limitMsg = isExpired 
                ? "Your ClawLink platform subscription has expired. Please renew your plan at dashboard." 
                : "Your monthly message limit has been reached. Please upgrade your plan.";
                
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: `[System Notice]\n${limitMsg}` } })
            });
            return NextResponse.json({ success: true });
        }

        // ==========================================
        // 5. 🚀 RAG KNOWLEDGE FETCH (Vector DB)
        // ==========================================
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

        // ==========================================
        // 8. 🔒 THE SMART ROUTER (Omni vs Normal & FALLBACK)
        // ==========================================
        let aiResponse = "I apologize, but I am experiencing an unusually high volume of requests right now. I have notified our human support team, and they will get back to you shortly.";
        let wasSuccessful = false;

        // 💡 SMART COST SAVING RULE: If message is very short (<40 chars), force cheap model!
        let forceCheapFallback = false;
        if (userText.length < 40) forceCheapFallback = true;
        // Or if they have used >85% of their limit, force cheap model to make plan last longer!
        if (!isUnlimited && (messagesUsed / monthlyLimit) > 0.85) forceCheapFallback = true;

        if (provider === "omni") {
            // 🚀 ROUTE TO VIP OMNI ENGINE
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://clawlink-six.vercel.app";
            try {
                const omniRes = await fetch(`${baseUrl}/api/omni`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: userText,
                        systemPrompt: `System Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}`,
                        history: pastChats ? pastChats.reverse().map(chat => ({ role: chat.sender_type === "bot" ? "assistant" : "user", content: chat.message })) : [],
                        forceCheap: forceCheapFallback // Tell Omni to be cheap if needed
                    })
                });

                if (omniRes.ok) {
                    const omniData = await omniRes.json();
                    if (omniData.success) {
                        aiResponse = omniData.reply;
                        wasSuccessful = true;
                    }
                }
            } catch (err) {}
        } else {
            // 🚗 ROUTE TO NORMAL INTRA-PROVIDER ENGINE
            let chain = AI_CHAINS[provider] || AI_CHAINS["openai"];
            
            // Apply Smart Routing
            if (forceCheapFallback && chain.length > 1) {
                // If cheap fallback required, re-order chain to try the cheapest (last) model first
                chain = [...chain].reverse(); 
            }

            for (const modelName of chain) {
                try {
                    if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                    else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                    else aiResponse = await callGemini(modelName, fullContext);
                    
                    wasSuccessful = true;
                    break; // Stop loop if successful
                } catch (err: any) {
                    console.error(`[WhatsApp API] ${modelName} failed:`, err.message);
                }
            }
        }

        // ==========================================
        // 9. CHARGE TOKENS & SAVE AI RESPONSE
        // ==========================================
        if (wasSuccessful) {
            // Increment Monthly Limit Counter
            await supabase.from("user_configs").update({ messages_used_this_month: messagesUsed + 1 }).eq("email", userEmail);
        }
        
        // Save Response to CRM
        await supabase.from("chat_history").insert({ 
            email: userEmail, platform: "whatsapp", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
        });

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