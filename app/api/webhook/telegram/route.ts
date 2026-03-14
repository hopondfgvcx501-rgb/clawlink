import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 STRICT INTRA-PROVIDER FALLBACK ARCHITECTURE
const AI_CHAINS: Record<string, string[]> = {
    "openai": ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
    "google": ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]
};

// =========================================================================
// 🚀 AI & RAG HELPER FUNCTIONS
// =========================================================================
async function generateEmbedding(text: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(embedUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: text }] } })
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
    if (!res.ok) throw new Error("Gemini Error: " + JSON.stringify(data));
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI Error: " + JSON.stringify(data));
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Claude Error: " + JSON.stringify(data));
    return data.content[0].text;
}

// =========================================================================
// 🎤 OPENAI WHISPER: AUDIO TO TEXT FUNCTION
// =========================================================================
async function transcribeAudio(fileId: string, botToken: string) {
    if (!process.env.OPENAI_API_KEY) {
        console.error("Whisper Error: OPENAI_API_KEY missing");
        return null;
    }
    try {
        const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) throw new Error("Could not get file path");
        
        const filePath = fileData.result.file_path;
        const audioRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const audioBuffer = await audioRes.arrayBuffer();

        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: 'audio/ogg' }); 
        formData.append("file", blob, "voice.ogg");
        formData.append("model", "whisper-1");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
            body: formData
        });
        
        const whisperData = await whisperRes.json();
        return whisperData.text || null;
    } catch (e) {
        console.error("Whisper Audio Error:", e);
        return null;
    }
}

// =========================================================================
// 🚀 MAIN TELEGRAM WEBHOOK PROCESSOR
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Verify Telegram Payload
        if (!body.message || (!body.message.text && !body.message.voice)) {
            return NextResponse.json({ success: true }); 
        }

        const chatId = body.message.chat.id.toString();
        const customerName = body.message.from.first_name || "Customer";

        // 2. Identify Bot Owner
        const { searchParams } = new URL(req.url);
        const ownerEmail = searchParams.get("email");

        if (!ownerEmail) return NextResponse.json({ success: true });

        // 3. 🔒 GET STRICT AI PROVIDER FROM DB
        const { data: config } = await supabase
            .from("user_configs")
            .select("*")
            .eq("email", ownerEmail)
            .single();

        if (!config || !config.telegram_token) return NextResponse.json({ success: true });

        const telegramToken = config.telegram_token;
        const systemPrompt = config.system_prompt || "You are a helpful AI assistant.";
        
        // Ensure provider string matches exactly with our AI_CHAINS mapping
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; // default fallback
        if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        // 4. Token Check
        if (!config.is_unlimited && (config.tokens_used >= config.tokens_allocated)) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "⚠️ This AI Agent has exhausted its API limits." })
            });
            return NextResponse.json({ success: true });
        }

        // 5. 🎤 PROCESS VOICE OR TEXT
        let userText = "";
        let crmLogMessage = "";

        if (body.message.voice) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, action: "typing" })
            });

            const transcription = await transcribeAudio(body.message.voice.file_id, telegramToken);
            if (!transcription) {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: "Audio transcription failed. Ensure OPENAI_API_KEY is configured in Vercel." })
                });
                return NextResponse.json({ success: true });
            }
            userText = transcription;
            crmLogMessage = `🎤 [Voice Note]: "${userText}"`;
        } else {
            userText = body.message.text;
            crmLogMessage = userText;
        }

        // 6. RAG KNOWLEDGE FETCH (Vector DB)
        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector,
                    match_threshold: 0.65,
                    match_count: 3,
                    p_user_email: ownerEmail
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }
        } catch (e) {}

        // 7. FETCH MEMORY
        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", ownerEmail)
            .eq("platform_chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(4);

        let memoryHistory = pastChats && pastChats.length > 0 
            ? pastChats.reverse().map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n") 
            : "";

        const fullContext = `System Instructions: ${systemPrompt}\n\nCompany Knowledge:\n${customKnowledge ? customKnowledge : "None."}\n\nMemory:\n${memoryHistory}\n\nUser: ${userText}`;
        
        // Save User Message to CRM
        await supabase.from("chat_history").insert({ 
            email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "user", message: crmLogMessage 
        });

        // 8. 🔒 STRICT INTRA-PROVIDER AI WATERFALL
        let aiResponse = `API Error: Ensure the API keys for ${provider.toUpperCase()} are added in your Vercel Environment Variables.`;
        let wasSuccessful = false;
        const chain = AI_CHAINS[provider] || AI_CHAINS["openai"];

        for (const modelName of chain) {
            try {
                if (provider === "openai") aiResponse = await callOpenAI(modelName, fullContext);
                else if (provider === "anthropic") aiResponse = await callClaude(modelName, fullContext);
                else aiResponse = await callGemini(modelName, fullContext);
                
                wasSuccessful = true;
                break; // Stop loop on success
            } catch (err: any) {
                console.error(`[AI Error] ${modelName} failed:`, err.message);
                // Continue to fallback model within the same provider
            }
        }

        // 9. CHARGE TOKENS & SAVE RESPONSE
        if (wasSuccessful) {
            if (!config.is_unlimited) {
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + 1 }).eq("email", ownerEmail);
            }
            await supabase.from("chat_history").insert({ 
                email: ownerEmail, platform: "telegram", platform_chat_id: chatId, customer_name: customerName, sender_type: "bot", message: aiResponse 
            });
        }

        // 10. DISPATCH REPLY TO TELEGRAM
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: aiResponse })
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Telegram Webhook Master Error:", error.message);
        return NextResponse.json({ success: true }); 
    }
}