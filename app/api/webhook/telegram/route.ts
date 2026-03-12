import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/email";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 2000; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-5.4-turbo", "gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"]
};

// 🚀 VOICE NOTE ENGINE (OpenAI Whisper)
async function transcribeTelegramVoice(fileId: string, botToken: string, openaiKey: string) {
    try {
        // 1. Get File Path from Telegram
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) return null;
        const filePath = fileData.result.file_path;

        // 2. Download Audio Blob
        const audioRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const audioBlob = await audioRes.blob();

        // 3. Send to OpenAI Whisper for Transcription
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.oga");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${openaiKey}` },
            body: formData as any
        });

        const whisperData = await whisperRes.json();
        return whisperData.text || null;
    } catch (e) {
        console.error("Whisper Transcription Error:", e);
        return null;
    }
}

// 🚀 GENERATE EMBEDDING FOR RAG
async function generateEmbedding(text: string) {
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(embedUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text }] } })
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data.embedding.values;
}

// 🚀 API CALL WRAPPERS
async function callGemini(model: string, prompt: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Gemini API Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "OpenAI API Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Claude API Error");
    return data.content[0].text;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Must have message object
        if (!body.message) return NextResponse.json({ success: true });

        const chatId = body.message.chat.id.toString();

        // DDoS Shield
        const now = Date.now();
        const lastMessageTime = rateLimitMap.get(chatId) || 0;
        if (now - lastMessageTime < COOLDOWN_MS) return NextResponse.json({ success: true });
        rateLimitMap.set(chatId, now);

        // Fetch User Config Early (We need token for Audio download)
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

        // 🚀 HANDLE TEXT OR VOICE
        let userText = "";
        
        if (body.message.text) {
            userText = body.message.text;
        } else if (body.message.voice) {
            // Send a "Listening..." indicator to user
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, action: "record_voice" }) // Gives a nice UI effect
            });

            const transcribedText = await transcribeTelegramVoice(
                body.message.voice.file_id, 
                telegramToken, 
                process.env.OPENAI_API_KEY || ""
            );
            
            if (!transcribedText) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: "Sorry, I couldn't clearly hear that. Could you please type it out?" })
                });
                return NextResponse.json({ success: true });
            }
            userText = transcribedText;
        } else {
            // Ignore Images, Videos, Stickers for now
            return NextResponse.json({ success: true });
        }

        // THE STEALTH SHIELD
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "I am currently undergoing routine maintenance and upgrades. Please leave your message and we will respond shortly." })
            });

            const alertHtml = `
              <div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ef4444;">
                <h2 style="color: #ef4444;">⚠️ ACTION REQUIRED: BOT PAUSED</h2>
                <p>Your ClawLink AI Agent on Telegram has reached its resource limit.</p>
                <a href="https://clawlink.com/dashboard" style="background: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Recharge & Resume Bot</a>
              </div>
            `;
            await sendEmail(userEmail, "URGENT: Your ClawLink Bot is Paused", alertHtml);
            return NextResponse.json({ success: true });
        }

        // 🚀 RAG KNOWLEDGE FETCH
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
        } catch (e) { console.error("RAG Error:", e); }

        // MEMORY FETCH
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

        const fullContext = `System Instructions: ${systemPrompt}

Company Knowledge Base:
${customKnowledge ? customKnowledge : "No specific company data found."}

Recent Conversation History:
${memoryHistory}

User's New Message: ${userText}`;
        
        // Indicate typing while AI generates
        fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action: "typing" })
        }).catch(()=>{});

        await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "user", content: body.message.voice ? `🎤 Voice Note: "${userText}"` : userText });

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
                console.log(`[AI Error] ${modelName} failed. Next...`);
            }
        }

        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", userEmail);
            }
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "ai", content: aiResponse });
        }

        // Send Reply
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