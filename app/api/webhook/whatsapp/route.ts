import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email"; // Fixed path

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 PURE PLAN-BASED FALLBACK CHAINS
const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-5.4-turbo", "gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"]
};

// 🚀 META WEBHOOK VERIFICATION (Required by WhatsApp Cloud API)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // You can set a WHATSAPP_VERIFY_TOKEN in Vercel, or default to this fallback
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "clawlink_secure";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// 🚀 API CALL WRAPPERS
async function callGemini(model: string, prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Claude Error");
    return data.content[0].text;
}

export async function POST(req: Request) {
    let whatsappToken = "";
    let phoneNumberId = "";
    let chatId = ""; // Customer's phone number

    try {
        const body = await req.json();

        // Validate WhatsApp Payload Structure
        if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
            return NextResponse.json({ success: true, message: "Not a valid message payload" });
        }

        const value = body.entry[0].changes[0].value;
        const message = value.messages[0];

        if (message.type !== "text") {
            return NextResponse.json({ success: true, message: "Ignored non-text message" });
        }

        chatId = message.from; 
        const userText = message.text.body;
        phoneNumberId = value.metadata.phone_number_id;

        // DDoS Shield
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // Fetch User Config
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .not("whatsapp_token", "is", null)
            .limit(1)
            .single();

        if (configErr || !config || !config.whatsapp_token) return NextResponse.json({ success: true });

        whatsappToken = config.whatsapp_token;
        const systemPrompt = config.systemPrompt || "You are a helpful AI assistant on WhatsApp.";
        const userEmail = config.email;
        const provider = config.ai_provider || "google";

        // THE STEALTH SHIELD
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            // Polite reply to WhatsApp Customer
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
                body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: "I am currently undergoing routine maintenance and upgrades. Please leave your message and we will respond shortly." } })
            });

            // Secret Alert
            const alertHtml = `
              <div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ef4444;">
                <h2 style="color: #ef4444;">⚠️ ACTION REQUIRED: WHATSAPP BOT PAUSED</h2>
                <p>Your ClawLink AI Agent on WhatsApp Cloud has reached its resource limit.</p>
                <p><strong>Reason:</strong> Plan Expired / Monthly Message Limit Reached.</p>
                <br/><a href="https://clawlink.com/dashboard" style="background: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Recharge & Resume Bot</a>
              </div>
            `;
            await sendEmail(userEmail, "URGENT: Your WhatsApp Bot is Paused", alertHtml);
            return NextResponse.json({ success: true });
        }

        // MEMORY FETCH
        const { data: pastChats } = await supabase
            .from("bot_conversations")
            .select("role, content")
            .eq("bot_email", userEmail)
            .eq("chat_id", chatId) // Phone number
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.role.toUpperCase()}: ${chat.content}`).join("\n");
        }

        const fullContext = `System Instructions: ${systemPrompt}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${userText}`;
        await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "user", content: userText });

        // FALLBACK ENGINE
        let aiResponse = "I am currently processing high volumes of data. Please give me a moment and try again.";
        let wasSuccessful = false;
        const chain = AI_CHAINS[provider] || AI_CHAINS["google"];

        for (const modelName of chain) {
            try {
                if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                else aiResponse = await callGemini(modelName, fullContext);
                
                wasSuccessful = true;
                break;
            } catch (err: any) {
                console.log(`[WhatsApp AI Error] ${modelName} failed: ${err.message}. Trying next...`);
            }
        }

        // PLAN DEDUCTION & MEMORY SAVE
        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", userEmail);
            }
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "ai", content: aiResponse });
        }

        // Send Reply via Meta Graph API
        await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${whatsappToken}` },
            body: JSON.stringify({ messaging_product: "whatsapp", to: chatId, text: { body: aiResponse } })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("WhatsApp Critical Error:", error.message);
        return NextResponse.json({ success: true }); // Always 200 so Meta doesn't block the webhook
    }
}