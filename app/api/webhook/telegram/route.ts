import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 🚀 1. IN-MEMORY DDOS SHIELD (Blocks rapid spam bursts)
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 3000; // 3 Seconds Lock per user

// 🚀 2. AI FALLBACK ENGINE (Try Flash -> Fallback to Pro)
async function generateAIResponse(prompt: string, systemPrompt: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables.");

    try {
        // First Priority: Gemini 1.5 Flash (Fastest)
        return await callGeminiAPI("gemini-1.5-flash", prompt, systemPrompt, apiKey);
    } catch (error: any) {
        console.log(`[Auto-Fallback] 1.5-Flash failed: ${error.message}. Routing to Gemini Pro...`);
        // Fallback: Gemini Pro
        return await callGeminiAPI("gemini-pro", prompt, systemPrompt, apiKey);
    }
}

async function callGeminiAPI(model: string, prompt: string, systemPrompt: string, apiKey: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [
            { role: "user", parts: [{ text: `System Instructions: ${systemPrompt}\n\nUser Message: ${prompt}` }] }
        ]
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Unknown Gemini API Error");

    return data.candidates[0].content.parts[0].text;
}

export async function POST(req: Request) {
    let telegramToken = "";
    let chatId = "";

    try {
        const body = await req.json();

        // Validate Telegram Payload
        if (!body.message || !body.message.text) {
            return NextResponse.json({ success: true, message: "Ignored non-text message." });
        }

        chatId = body.message.chat.id.toString();
        const userText = body.message.text;

        // 🚀 3. SPAM RATE LIMITER EXECUTION
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) {
            console.warn(`[DDoS Shield] Blocked spam from ChatID: ${chatId}`);
            // Return 200 immediately so Telegram stops retrying the webhook
            return NextResponse.json({ success: true, message: "Spam blocked" });
        }
        rateLimitMap.set(chatId, now);

        // 4. Init Supabase & Fetch Bot Config
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .not("telegram_token", "is", null)
            .eq("plan_status", "Active")
            .limit(1)
            .single();

        if (configErr || !config || !config.telegram_token) {
            throw new Error("Bot configuration not found in database or plan expired.");
        }

        telegramToken = config.telegram_token;
        const systemPrompt = config.systemPrompt || "You are a helpful AI assistant.";

        // 5. Deduct Token
        if (!config.is_unlimited) {
            if (config.available_tokens <= 0) {
                throw new Error("AI Token quota exhausted. Please upgrade your plan in ClawLink Dashboard.");
            }
            await supabase
                .from("user_configs")
                .update({ available_tokens: config.available_tokens - 1 })
                .eq("email", config.email);
        }

        // 6. Generate Response
        const aiResponse = await generateAIResponse(userText, systemPrompt);

        // 7. Send Reply to Telegram
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Webhook Error:", error.message);
        
        // 🚀 8. EXACT SYSTEM ERROR REPORTING (Never hide errors)
        if (telegramToken && chatId) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    chat_id: chatId, 
                    text: `🚨 *SYSTEM ERROR:*\n\`${error.message}\``,
                    parse_mode: "Markdown"
                })
            });
        }

        // ALWAYS return 200 to Telegram so it doesn't infinitely retry and cause a DDoS loop
        return NextResponse.json({ success: true, error: error.message });
    }
}