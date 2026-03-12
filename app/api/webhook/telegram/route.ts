import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email"; // 🚀 FIXED PATH: Corrected for your folder structure

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 1. PURE PLAN-BASED FALLBACK CHAINS (No complex token costs)
const AI_CHAINS: Record<string, string[]> = {
    "openai": [
        "gpt-5.4-turbo", // Priority 1: Latest
        "gpt-4-turbo",   // Priority 2: Mid-Tier
        "gpt-3.5-turbo"  // Priority 3: Ultimate Fallback
    ],
    "anthropic": [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
    ],
    "google": [
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest",
        "gemini-pro"
    ]
};

// 🚀 2. API CALL WRAPPERS
async function callGemini(model: string, prompt: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini API Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI API Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Claude API Error");
    return data.content[0].text;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.message || !body.message.text) return NextResponse.json({ success: true });

        const chatId = body.message.chat.id.toString();
        const userText = body.message.text;

        // DDoS Shield
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // Fetch User Config
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("*")
            .not("telegram_token", "is", null)
            .limit(1)
            .single();

        if (configErr || !config || !config.telegram_token) return NextResponse.json({ success: true });

        const telegramToken = config.telegram_token;
        const systemPrompt = config.systemPrompt || "You are a helpful AI assistant.";
        const userEmail = config.email;
        const provider = config.ai_provider || "google";

        // 🚀 3. THE STEALTH SHIELD (Plan Expiry / Out of Monthly Limits)
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            // Polite message to Customer
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "I am currently undergoing routine maintenance and upgrades. Please leave your message and we will respond shortly." })
            });

            // Secret Email Alert to Bot Owner
            const alertHtml = `
              <div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ef4444;">
                <h2 style="color: #ef4444;">⚠️ ACTION REQUIRED: BOT PAUSED</h2>
                <p>Your ClawLink AI Agent on Telegram has reached its resource limit.</p>
                <p><strong>Reason:</strong> Plan Expired / Monthly Message Limit Reached.</p>
                <p>Your end-customers are currently receiving a polite maintenance message. To restore service immediately, please top-up your account.</p>
                <br/>
                <a href="https://clawlink.com/dashboard" style="background: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Recharge & Resume Bot</a>
              </div>
            `;
            await sendEmail(userEmail, "URGENT: Your ClawLink Bot is Paused", alertHtml);
            return NextResponse.json({ success: true });
        }

        // 🚀 4. MEMORY FETCH
        const { data: pastChats } = await supabase
            .from("bot_conversations")
            .select("role, content")
            .eq("bot_email", userEmail)
            .eq("chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = "";
        if (pastChats && pastChats.length > 0) {
            memoryHistory = pastChats.reverse().map(chat => `${chat.role.toUpperCase()}: ${chat.content}`).join("\n");
        }

        const fullContext = `System Instructions: ${systemPrompt}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${userText}`;
        
        // Save new user message to memory
        await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "user", content: userText });

        // 🚀 5. THE PURE FALLBACK ENGINE EXECUTION
        let aiResponse = "I am currently processing high volumes of data. Please give me a moment and try again.";
        let wasSuccessful = false;
        
        const chain = AI_CHAINS[provider] || AI_CHAINS["google"];

        for (const modelName of chain) {
            try {
                console.log(`[AI Engine] Attempting to wake up ${modelName}...`);
                if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                else aiResponse = await callGemini(modelName, fullContext);
                
                console.log(`[AI Engine] Success! ${modelName} responded.`);
                wasSuccessful = true;
                break; // Escape the loop if successful
            } catch (err: any) {
                console.log(`[AI Engine Error] ${modelName} failed: ${err.message}. Triggering next version...`);
            }
        }

        // 🚀 6. SIMPLE PLAN DEDUCTION & MEMORY SAVE
        if (wasSuccessful) {
            // Deduct exactly 1 message count from the user's plan limit (if not unlimited)
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", userEmail);
            }
            
            // Save AI response to memory
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "ai", content: aiResponse });
        }

        // Send Reply to Telegram
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Critical System Error:", error.message);
        return NextResponse.json({ success: true });
    }
}