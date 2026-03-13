import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Gemini AI Call
async function callGemini(prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini API Error");
    return data.candidates[0].content.parts[0].text;
}

export async function POST(req: Request) {
    try {
        // Twilio sends data as form-urlencoded
        const formData = await req.formData();
        const speechResult = formData.get("SpeechResult") as string || "";
        const callSid = formData.get("CallSid") as string;
        const calledNumber = formData.get("To") as string;

        // Base TwiML (Twilio XML) Response Generator
        let aiResponseText = "Hello! I am your AI voice assistant. How can I help you today?";

        if (speechResult) {
            // Customer ne kuch bola hai
            const prompt = `You are a helpful customer service voice agent. Keep your answers short, conversational, and exactly like a human talking on the phone. Do not use emojis or bullet points. Customer says: "${speechResult}"`;
            
            try {
                aiResponseText = await callGemini(prompt);
                // Save Voice log to CRM
                await supabase.from("bot_conversations").insert({ bot_email: "voice_bot", chat_id: callSid, role: "user", content: `[VOICE] ${speechResult}` });
                await supabase.from("bot_conversations").insert({ bot_email: "voice_bot", chat_id: callSid, role: "ai", content: `[VOICE] ${aiResponseText}` });
            } catch (e) {
                aiResponseText = "I am sorry, my network is a bit slow right now. Could you repeat that?";
            }
        }

        // Generate Twilio XML (TwiML) to speak back and listen again
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say voice="Polly.Matthew-Neural">${aiResponseText}</Say>
            <Gather input="speech" action="/api/webhook/voice" timeout="3" speechTimeout="auto">
                <Say voice="Polly.Matthew-Neural">I am listening.</Say>
            </Gather>
        </Response>`;

        return new NextResponse(twiml, {
            status: 200,
            headers: { "Content-Type": "text/xml" }
        });

    } catch (error: any) {
        console.error("Voice AI Error:", error.message);
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Goodbye.</Say><Hangup/></Response>`;
        return new NextResponse(errorTwiml, { status: 500, headers: { "Content-Type": "text/xml" } });
    }
}