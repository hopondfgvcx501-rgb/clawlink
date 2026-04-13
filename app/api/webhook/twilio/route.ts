/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE TWILIO VOICE AI WEBHOOK (TITANIUM SECURED)
 * ==============================================================================================
 * @file app/api/webhook/twilio/route.ts
 * @description Real-time conversational Voice AI Engine. Handles Twilio TwiML loops.
 * STRICTLY SECURED: Validates Twilio Cryptographic Signatures to prevent Postman/cURL hacks.
 * Uses 2026 Nano/Lite models for ultra-low latency voice responses.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// 🚀 FIXED: Use wildcard import for twilio library to satisfy TypeScript
import * as twilio from "twilio"; 

export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// 🛡️ SECURITY & UTILS
// =========================================================================
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").trim();
}

const ENTERPRISE_VOICE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are a Voice AI Support Agent for ClawLink.
1. SPOKEN FORMAT: Your responses will be spoken aloud via Text-to-Speech. NEVER use emojis, bullet points, asterisks (*), markdown, or long URLs. Use natural, conversational English.
2. CONCISENESS: Keep your answers extremely short and to the point (under 2-3 sentences). People on phone calls lose patience quickly.
3. FACTUAL RAG: Base your answers ONLY on the Company Knowledge provided. If you don't know, say "I don't have that information, let me transfer you to a human."
`;

// =========================================================================
// 🚀 2026 LLM & RAG FUNCTIONS (Ultra-Low Latency)
// =========================================================================
async function generateEmbedding(text: string) {
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

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

async function callGemini(model: string, prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
}

// =========================================================================
// 🎙️ MAIN TWILIO POST WEBHOOK
// =========================================================================
export async function POST(req: Request) {
    try {
        const twilioSignature = req.headers.get("x-twilio-signature");
        const authToken = process.env.TWILIO_AUTH_TOKEN || "";
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/twilio`;

        // Twilio sends data as application/x-www-form-urlencoded
        const formData = await req.formData();
        const params: Record<string, string> = {};
        formData.forEach((value, key) => { params[key] = value.toString(); });

        // 🔒 LEVEL 1: CRYPTOGRAPHIC HACKER BLOCKER
        // Verify that the request actually came from Twilio and not a hacker using Postman
        // 🚀 FIXED: Using twilio.validateRequest (part of the wildcard import)
        if (!twilioSignature || !twilio.validateRequest(authToken, twilioSignature, webhookUrl, params)) {
            console.error("[TWILIO_SECURITY_BREACH] Invalid Twilio Signature. Blocking request.");
            return new NextResponse("Forbidden: Invalid Signature", { status: 403 });
        }
        
        const To = sanitizeInput(params.To); // ClawLink User's Twilio Number
        const From = sanitizeInput(params.From); // Caller's Number
        const CallSid = sanitizeInput(params.CallSid); // Unique Call ID
        const SpeechResult = sanitizeInput(params.SpeechResult); // What the caller just said

        // 🚀 FIXED: Using twilio.twiml.VoiceResponse properly with wildcard import
        const twiml = new twilio.twiml.VoiceResponse();

        if (!To) {
            twiml.say("System Error. Missing destination number.");
            twiml.hangup();
            return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } });
        }

        // 🔒 LEVEL 2: IDENTIFY CLAWLINK CUSTOMER VIA PHONE NUMBER
        const { data: voiceConfig } = await supabase.from("voice_configs").select("*").eq("phone_number", To).single();
        
        if (!voiceConfig) {
            twiml.say("This phone number is not configured in the ClawLink system. Goodbye.");
            twiml.hangup();
            return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } });
        }

        const email = voiceConfig.email;

        // 🔒 LEVEL 3: THE ULTIMATE PLG GATEKEEPER
        const { data: userConfig } = await supabase.from("user_configs").select("*").eq("email", email).single();
        
        if (!userConfig || userConfig.plan_status !== "Active") {
            twiml.say("The AI assistant for this business is currently sleeping due to an inactive subscription. Please try calling again later. Goodbye.");
            twiml.hangup(); // Instant disconnect saves Twilio cost
            return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } });
        }

        const isUnlimited = userConfig.is_unlimited || userConfig.plan_tier === "adv_max" || userConfig.plan_tier === "yearly";
        const tokensUsed = userConfig.tokens_used || 0;
        const tokensAllocated = userConfig.tokens_allocated || 0;
        const isExpired = userConfig.plan_expiry_date ? (new Date() > new Date(userConfig.plan_expiry_date)) : false;

        // 🔒 LEVEL 4: HARD QUOTA LIMITS
        if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
            twiml.say("The AI assistant for this business has reached its operational capacity. Please contact the administrator. Goodbye.");
            twiml.hangup();
            return new NextResponse(twiml.toString(), { headers: { "Content-Type": "text/xml" } });
        }

        // =====================================================================
        // 🎙️ CONVERSATION LOGIC
        // =====================================================================
        
        let aiSpokenResponse = "";

        // SCENARIO A: New Call (No speech recognized yet)
        if (!SpeechResult) {
            aiSpokenResponse = voiceConfig.system_prompt 
                ? "Hello! I am the AI assistant. How can I help you today?" 
                : "Welcome to ClawLink AI Support. How can I assist you?";
        } 
        // SCENARIO B: Caller Spoke (Process via RAG & 2026 Omni-Engine)
        else {
            // 1. Fetch Custom Knowledge (RAG)
            let customKnowledge = "";
            const queryVector = await generateEmbedding(SpeechResult);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 2, p_user_email: email
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => doc.content).join("\n\n");
                }
            }

            // 2. Fetch Chat History for this Call Session
            const { data: pastChats } = await supabase
                .from("chat_history")
                .select("sender_type, message")
                .eq("platform_chat_id", CallSid)
                .order("created_at", { ascending: false })
                .limit(4);

            let memoryHistory = "";
            if (pastChats && pastChats.length > 0) {
                memoryHistory = pastChats.reverse().map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n");
            }

            const systemPrompt = voiceConfig.system_prompt || userConfig.system_prompt || "You are a helpful phone assistant.";
            const fullContext = `${ENTERPRISE_VOICE_GUARDRAIL}\n\nPersona: ${systemPrompt}\n\nCompany Data:\n${customKnowledge || "None."}\n\nHistory:\n${memoryHistory}\n\nCaller: ${SpeechResult}`;

            // Save Caller's speech
            await supabase.from("chat_history").insert({ 
                email: email, platform: "voice", platform_chat_id: CallSid, customer_name: From, sender_type: "user", message: SpeechResult 
            });

            // 3. 2026 OMNI-ENGINE ROUTING (Optimized for Voice Speed)
            let provider = (userConfig.ai_provider || "openai").toLowerCase();
            
            try {
                if (provider.includes("google") || provider.includes("omni")) {
                    aiSpokenResponse = await callGemini("gemini-3.1-flash-lite", fullContext); 
                } else {
                    aiSpokenResponse = await callOpenAI("gpt-4.1-nano", fullContext); 
                }

                // Token deduction math (1 token ≈ 3 chars)
                if (!isUnlimited) {
                    const calculatedTokens = Math.ceil((SpeechResult.length + aiSpokenResponse.length) / 3);
                    await supabase.from("user_configs").update({ 
                        tokens_used: tokensUsed + calculatedTokens,
                        messages_used_this_month: (userConfig.messages_used_this_month || 0) + 1 
                    }).eq("email", email);
                }

                await supabase.from("chat_history").insert({ 
                    email: email, platform: "voice", platform_chat_id: CallSid, customer_name: From, sender_type: "bot", message: aiSpokenResponse 
                });

            } catch (error) {
                console.error("[VOICE_AI_ERROR]", error);
                aiSpokenResponse = "I'm sorry, I am having trouble connecting to my brain right now. Please try again.";
            }
        }

        // =====================================================================
        // 🔊 BUILD THE TWIML LOOP
        // =====================================================================
        
        // 1. Speak the AI's response (Using premium neural voices)
        twiml.say({ voice: "Polly.Matthew-Neural" }, aiSpokenResponse);

        // 2. Open the microphone to gather the caller's next reply
        const gather = twiml.gather({
            input: ["speech"],
            action: "/api/webhook/twilio", // Loop back to this exact file
            method: "POST",
            timeout: 3, 
            speechTimeout: "auto" 
        });

        // 3. Failsafe if they don't say anything
        twiml.say("Are you still there?");
        twiml.redirect("/api/webhook/twilio");

        return new NextResponse(twiml.toString(), {
            headers: { "Content-Type": "text/xml" }
        });

    } catch (error: any) {
        console.error("[TWILIO_WEBHOOK_FATAL]:", error);
        // 🚀 FIXED: Using twilio.twiml.VoiceResponse properly with wildcard import
        const errorTwiml = new twilio.twiml.VoiceResponse();
        errorTwiml.say("A critical system error has occurred. Goodbye.");
        errorTwiml.hangup();
        return new NextResponse(errorTwiml.toString(), { headers: { "Content-Type": "text/xml" } });
    }
}