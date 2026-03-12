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
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) return null;
        const filePath = fileData.result.file_path;

        const audioRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const audioBlob = await audioRes.blob();

        const formData = new FormData();
        formData.append("file", audioBlob, "voice.oga");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST", headers: { "Authorization": `Bearer ${openaiKey}` },
            body: formData as any
        });

        const whisperData = await whisperRes.json();
        return whisperData.text || null;
    } catch (e) {
        console.error("Whisper Error:", e);
        return null;
    }
}

// 🚀 RAG EMBEDDING
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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

// 🚀 CORE WEBHOOK HANDLER
export async function POST(req: Request) {
    let telegramToken = "";
    let chatId = "";

    try {
        const body = await req.json();

        if (!body.message) return NextResponse.json({ success: true });

        chatId = body.message.chat.id.toString();

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

        telegramToken = config.telegram_token;
        const systemPrompt = config.systemPrompt || "You are a helpful AI assistant.";
        const userEmail = config.email;
        const provider = config.ai_provider || "google";

        // VOICE OR TEXT
        let userText = "";
        if (body.message.text) {
            userText = body.message.text;
        } else if (body.message.voice) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, action: "record_voice" })
            });

            const transcribedText = await transcribeTelegramVoice(body.message.voice.file_id, telegramToken, process.env.OPENAI_API_KEY || "");
            if (!transcribedText) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: "Sorry, I couldn't clearly hear that. Could you please type it out?" })
                });
                return NextResponse.json({ success: true });
            }
            userText = transcribedText;
        } else {
            return NextResponse.json({ success: true });
        }

        // STEALTH SHIELD
        if (config.plan_status === "Expired" || (!config.is_unlimited && config.available_tokens <= 0)) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "I am currently undergoing routine maintenance and upgrades. Please leave your message and we will respond shortly." })
            });

            const alertHtml = `<div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #ef4444;"><h2 style="color: #ef4444;">⚠️ ACTION REQUIRED: BOT PAUSED</h2><p>Your ClawLink AI Agent on Telegram has reached its resource limit.</p><a href="https://clawlink.com/dashboard" style="background: #ef4444; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Recharge & Resume Bot</a></div>`;
            await sendEmail(userEmail, "URGENT: Your ClawLink Bot is Paused", alertHtml);
            return NextResponse.json({ success: true });
        }

        // RAG KNOWLEDGE FETCH
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

        // 🚀 THE MAGIC ACTION PROMPT
        const actionPrompt = `\n\n[CRITICAL TOOL INSTRUCTION]: 
If the user asks to check an order status, YOU MUST NOT REPLY WITH TEXT. Instead, you MUST reply with EXACTLY this JSON format and nothing else:
{"action": "check_order", "order_id": "<order_number_extracted_from_text>"}
If the user is NOT asking about an order, ignore this instruction and reply normally.`;

        let fullContext = `System Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "None."}\n\nRecent Conversation:\n${memoryHistory}\n\nUser's Message: ${userText}` + actionPrompt;

        fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action: "typing" })
        }).catch(()=>{});

        // 🚀 THE RUNNER FUNCTION FOR FALLBACK
        const runAI = async (context: string) => {
            const chain = AI_CHAINS[provider] || AI_CHAINS["google"];
            for (const modelName of chain) {
                try {
                    if (provider === "openai") return await callOpenAI(modelName, context);
                    if (provider === "anthropic") return await callClaude(modelName, context);
                    return await callGemini(modelName, context);
                } catch (err: any) { console.log(`[AI Error] ${modelName} failed.`); }
            }
            throw new Error("All models failed");
        };

        // 1st Pass: Get Initial AI Response
        let aiResponse = "";
        let wasSuccessful = false;

        try {
            aiResponse = await runAI(fullContext);
            wasSuccessful = true;
        } catch(e) {
            aiResponse = "I am currently processing high volumes of data. Please try again.";
        }

        // 🚀 THE UNIVERSAL TOOL INTERCEPTOR (Action Execution)
        if (aiResponse.includes('"action":') && aiResponse.includes('check_order')) {
            try {
                // Find and parse the JSON block the AI created
                const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    const actionData = JSON.parse(jsonMatch[0]);
                    
                    if (actionData.action === "check_order" && actionData.order_id) {
                        console.log(`[ACTION INTERCEPTED] Fetching status for order: ${actionData.order_id}`);
                        
                        // 🔥 DUMMY DATABASE LOOKUP (In future, connect to Shopify/WooCommerce API here)
                        const toolResult = `SYSTEM RESULT: Order ${actionData.order_id} is currently 'OUT FOR DELIVERY' and will reach the customer by 5 PM today.`;
                        
                        // Send the result back to the AI for a final, friendly answer
                        const followupContext = fullContext + `\n\nAI emitted: ${jsonMatch[0]}\n\n${toolResult}\nNow, write a friendly response to the user giving them this update.`;
                        
                        aiResponse = await runAI(followupContext);
                    }
                }
            } catch (e) {
                console.error("Action Parsing Error:", e);
                aiResponse = "I tried to check your order, but my system encountered a temporary glitch. Please hold on.";
            }
        }

        // SAVE AND SEND
        if (wasSuccessful) {
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "user", content: body.message.voice ? `🎤 Voice Note: "${userText}"` : userText });
            await supabase.from("bot_conversations").insert({ bot_email: userEmail, chat_id: chatId, role: "ai", content: aiResponse });
            
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ available_tokens: config.available_tokens - 1 }).eq("email", userEmail);
            }
        }

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Critical Webhook Error:", error.message);
        
        // Exact Error Reporting as requested by user originally
        if (telegramToken && chatId) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `🚨 *SYSTEM ERROR:*\n\`${error.message}\``, parse_mode: "Markdown" })
            });
        }
        return NextResponse.json({ success: true });
    }
}