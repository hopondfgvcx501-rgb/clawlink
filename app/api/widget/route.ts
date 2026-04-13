/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE WEBCHAT WIDGET API
 * ==============================================================================================
 * @file app/api/widget/route.ts
 * @description Generates the injectible JS widget and handles live chat routing for websites.
 * STRICTLY LOCKED: Prevents rendering or API access for unpaid/inactive accounts.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ CORS HEADERS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// =========================================================================
// 🛡️ SECURITY LOCK: ENTERPRISE DATA SANITIZER (XSS & Injection Blocker)
// =========================================================================
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") 
        .replace(/<[^>]*>?/gm, "") 
        .replace(/--/g, "") 
        .trim();
}

const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Company Knowledge to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated/angry, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and highly polite. Never argue with the customer.
`;

// =========================================================================
// 1. 🌐 GET REQUEST: INJECT WIDGET UI TO USER'S WEBSITE
// =========================================================================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = sanitizeInput(searchParams.get("id")); 

    if (!email) {
        return new NextResponse("console.error('[ClawLink Widget] Missing Account ID.');", {
            headers: { "Content-Type": "application/javascript" }
        });
    }

    // 🔒 THE ULTIMATE PLG GATEKEEPER (Prevents Free Users from Loading the Widget UI)
    const { data: config } = await supabase.from("user_configs").select("plan_status").eq("email", email.toLowerCase()).single();

    if (!config || config.plan_status !== "Active") {
        const deadJsCode = `console.warn("[ClawLink AI] Agent infrastructure is currently sleeping or payment is pending for this account.");`;
        return new NextResponse(deadJsCode, { headers: { "Content-Type": "application/javascript" } });
    }

    const jsCode = `
      (function() {
        const clawlinkEmail = "${email}";
        const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
        const baseUrl = "https://www.clawlinkai.com";

        const font = document.createElement('link');
        font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap';
        font.rel = 'stylesheet';
        document.head.appendChild(font);

        const style = document.createElement('style');
        style.innerHTML = \`
          #clawlink-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: 'Inter', sans-serif; }
          #clawlink-chat-window { display: none; width: 380px; height: 550px; background: #0A0A0B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; box-shadow: 0 15px 50px rgba(0,0,0,0.6); flex-direction: column; overflow: hidden; margin-bottom: 15px; opacity: 0; transform: translateY(20px); transition: all 0.3s ease; }
          #clawlink-chat-window.open { display: flex; opacity: 1; transform: translateY(0); }
          #clawlink-chat-header { background: linear-gradient(135deg, #0052D4, #00BFFF); color: white; padding: 18px 20px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px; }
          #clawlink-chat-header .title { display: flex; align-items: center; gap: 8px; font-size: 15px; }
          #clawlink-chat-header .status { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
          #clawlink-chat-body { flex: 1; padding: 20px; overflow-y: auto; background: #111; display: flex; flex-direction: column; gap: 12px; }
          .claw-msg { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
          .claw-msg.user { align-self: flex-end; background: #00BFFF; color: white; border-bottom-right-radius: 2px; }
          .claw-msg.bot { align-self: flex-start; background: #1A1A1A; color: #eee; border: 1px solid rgba(255,255,255,0.05); border-bottom-left-radius: 2px; }
          .claw-typing { font-size: 12px; color: #888; font-style: italic; }
          
          #clawlink-input-area { display: flex; padding: 15px; background: #0A0A0B; border-top: 1px solid rgba(255,255,255,0.05); align-items: center; gap: 8px; }
          #clawlink-input { flex: 1; background: #1A1A1A; border: 1px solid rgba(255,255,255,0.1); padding: 12px 15px; border-radius: 10px; color: white; outline: none; font-size: 14px; transition: border 0.2s; }
          #clawlink-input:focus { border-color: #00BFFF; }
          
          .claw-btn { width: 40px; height: 40px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
          #clawlink-mic-btn { background: #1A1A1A; color: #00BFFF; border: 1px solid rgba(255,255,255,0.1); }
          #clawlink-mic-btn:hover { background: #222; }
          #clawlink-mic-btn.recording { background: #ef4444; color: white; animation: pulse-red 1.5s infinite; border-color: #ef4444; }
          
          #clawlink-send-btn { background: #00BFFF; color: white; }
          #clawlink-send-btn:hover { background: #0052D4; }
          
          #clawlink-trigger { width: 65px; height: 65px; background: linear-gradient(135deg, #0052D4, #00BFFF); border-radius: 50%; cursor: pointer; box-shadow: 0 8px 25px rgba(0,191,255,0.4); display: flex; justify-content: center; align-items: center; transition: transform 0.2s, box-shadow 0.2s; float: right; position: relative; }
          #clawlink-trigger:hover { transform: scale(1.05); box-shadow: 0 10px 30px rgba(0,191,255,0.6); }
          #clawlink-trigger svg { width: 32px; height: 32px; fill: white; }
          
          #clawlink-chat-body::-webkit-scrollbar { width: 5px; }
          #clawlink-chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 5px; }
          @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
        \`;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'clawlink-widget-container';
        container.innerHTML = \`
          <div id="clawlink-chat-window">
            <div id="clawlink-chat-header">
              <div class="title"><div class="status"></div> AI Support</div>
              <span id="clawlink-close" style="cursor:pointer; opacity:0.8; font-size:18px;">✕</span>
            </div>
            <div id="clawlink-chat-body">
              <div class="claw-msg bot">Hi there! 👋 How can I assist you today? Type a message or send a voice note.</div>
            </div>
            <div id="clawlink-input-area">
              <button id="clawlink-mic-btn" class="claw-btn" title="Hold to Record Voice">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </button>
              <input type="text" id="clawlink-input" placeholder="Type a message..." autocomplete="off" />
              <button id="clawlink-send-btn" class="claw-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
          <div id="clawlink-trigger">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.7.44 3.29 1.2 4.67L2 22l5.48-1.12c1.33.68 2.87 1.08 4.52 1.08 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          </div>
        \`;
        document.body.appendChild(container);

        const trigger = document.getElementById('clawlink-trigger');
        const windowEl = document.getElementById('clawlink-chat-window');
        const closeBtn = document.getElementById('clawlink-close');
        const input = document.getElementById('clawlink-input');
        const sendBtn = document.getElementById('clawlink-send-btn');
        const micBtn = document.getElementById('clawlink-mic-btn');
        const chatBody = document.getElementById('clawlink-chat-body');

        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;

        trigger.addEventListener('click', () => {
          if (windowEl.classList.contains('open')) {
            windowEl.classList.remove('open');
            setTimeout(() => windowEl.style.display = 'none', 300);
          } else {
            windowEl.style.display = 'flex';
            setTimeout(() => windowEl.classList.add('open'), 10);
            input.focus();
          }
        });

        closeBtn.addEventListener('click', () => {
          windowEl.classList.remove('open');
          setTimeout(() => windowEl.style.display = 'none', 300);
        });

        const appendMsg = (text, sender) => {
          const msg = document.createElement('div');
          msg.className = 'claw-msg ' + sender;
          msg.innerText = text;
          chatBody.appendChild(msg);
          chatBody.scrollTop = chatBody.scrollHeight;
        };

        const executeChatCall = async (payload) => {
          const typingId = 'typing-' + Date.now();
          const typingMsg = document.createElement('div');
          typingMsg.className = 'claw-msg bot claw-typing';
          typingMsg.id = typingId;
          typingMsg.innerText = 'AI is thinking...';
          chatBody.appendChild(typingMsg);
          chatBody.scrollTop = chatBody.scrollHeight;

          try {
            const res = await fetch(baseUrl + '/api/widget', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            document.getElementById(typingId).remove();
            if (data.success) { appendMsg(data.reply, 'bot'); } 
            else { appendMsg(data.reply || 'Sorry, I encountered an error.', 'bot'); }
          } catch (e) {
            document.getElementById(typingId).remove();
            appendMsg('Network error. Please try again.', 'bot');
          }
        };

        const sendMessage = () => {
          const text = input.value.trim();
          if (!text) return;
          appendMsg(text, 'user');
          input.value = '';
          executeChatCall({ email: clawlinkEmail, message: text, sessionId: sessionId });
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

        micBtn.addEventListener('click', async () => {
          if (!isRecording) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaRecorder = new MediaRecorder(stream);
              audioChunks = [];
              
              mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
              mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                  const base64AudioMessage = reader.result.split(',')[1];
                  appendMsg("🎤 Voice Note Sent", 'user');
                  executeChatCall({ email: clawlinkEmail, message: "", audio: base64AudioMessage, sessionId: sessionId });
                };
              };
              
              mediaRecorder.start();
              isRecording = true;
              micBtn.classList.add('recording');
            } catch (err) {
              alert("Microphone access denied.");
            }
          } else {
            mediaRecorder.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
        });

      })();
    `;

    return new NextResponse(jsCode, {
        headers: {
            "Content-Type": "application/javascript",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        }
    });
}

// =========================================================================
// 🚀 AI HELPER FUNCTIONS
// =========================================================================
async function transcribeAudio(base64Audio: string) {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        const blob = new Blob([audioBuffer], { type: 'audio/webm' }); 

        const formData = new FormData();
        formData.append("file", blob, "voice.webm");
        formData.append("model", "whisper-1");

        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST", headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }, body: formData
        });
        const data = await res.json();
        return data.text || null;
    } catch (e) { return null; }
}

async function callGemini(model: string, prompt: string) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Gemini API Error");
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(model: string, prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("OpenAI API Error");
    return data.choices[0].message.content;
}

async function callClaude(model: string, prompt: string) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Claude API Error");
    return data.content[0].text;
}

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

// =========================================================================
// 2. 🤖 POST REQUEST: MAIN WIDGET CHAT & SMART ROUTING PROCESSOR
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 🛡️ SECURITY LOCK: Sanitize everything coming from the public internet
        const email = sanitizeInput(body.email);
        const rawMessage = body.message ? sanitizeInput(body.message) : "";
        const sessionId = sanitizeInput(body.sessionId);
        const audio = body.audio;

        let userText = rawMessage;
        let crmLogMessage = rawMessage;

        if (audio) {
            const transcription = await transcribeAudio(audio);
            if (transcription) {
                userText = sanitizeInput(transcription);
                crmLogMessage = `🎤 [Voice Note]: "${userText}"`;
            } else {
                return NextResponse.json({ success: true, reply: "Sorry, I couldn't process your voice clearly. Could you type it?" }, { headers: corsHeaders });
            }
        }

        if (!email || !userText || !sessionId) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
        }

        // 🚀 FETCH CONFIGURATION
        const { data: configList } = await supabase.from("user_configs").select("*").eq("email", email).order("created_at", { ascending: false }).limit(5);
        
        if (!configList || configList.length === 0) {
            return NextResponse.json({ success: false, error: "Configuration not found" }, { status: 404, headers: corsHeaders });
        }

        let config = configList.find(c => c.selected_channel === 'widget') || configList[0];

        // 🔒 THE ULTIMATE PLG GATEKEEPER: Stops API abuse if user plan is not active
        if (config.plan_status !== "Active") {
            const sleepMsg = "🤖 This AI Agent is currently in sleep mode. The owner needs to activate their plan to enable 24/7 autonomous responses.";
            return NextResponse.json({ success: true, reply: sleepMsg }, { headers: corsHeaders });
        }

        const isUnlimited = config.is_unlimited || config.plan_tier === "adv_max" || config.plan_tier === "yearly" || config.plan_tier === "ultra";
        const messagesUsed = config.messages_used_this_month || 0;
        const monthlyLimit = config.monthly_message_limit || 1000;
        const tokensUsed = config.tokens_used || 0;
        const tokensAllocated = config.tokens_allocated || 0;
        
        const expiryDate = new Date(config.plan_expiry_date);
        const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

        // 🔒 LIMITS ENFORCEMENT
        if (isExpired || (!isUnlimited && (messagesUsed >= monthlyLimit || tokensUsed >= tokensAllocated))) {
            const limitMsg = "System Note: The AI assistant for this account is currently offline due to resource limits. Please contact the administrator.";
            return NextResponse.json({ success: true, reply: limitMsg }, { headers: corsHeaders });
        }

        if (userText.length > 800) {
            userText = userText.substring(0, 800) + "...";
        }

        let customKnowledge = "";
        try {
            const queryVector = await generateEmbedding(userText);
            if (queryVector) {
                const { data: matchedDocs } = await supabase.rpc("match_knowledge", {
                    query_embedding: queryVector, match_threshold: 0.65, match_count: 3, p_user_email: email
                });
                if (matchedDocs && matchedDocs.length > 0) {
                    customKnowledge = matchedDocs.map((doc: any) => sanitizeInput(doc.content)).join("\n\n");
                }
            }
        } catch (e) {}

        const { data: pastChats } = await supabase
            .from("chat_history")
            .select("sender_type, message")
            .eq("email", email)
            .eq("platform_chat_id", sessionId)
            .order("created_at", { ascending: false })
            .limit(5);

        let memoryHistory = "";
        let historyArray: any[] = []; 
        if (pastChats && pastChats.length > 0) {
            const reversed = pastChats.reverse();
            memoryHistory = reversed.map(chat => `${chat.sender_type.toUpperCase()}: ${chat.message}`).join("\n");
            
            historyArray = reversed.map(chat => ({
                role: chat.sender_type === "bot" ? "assistant" : "user",
                content: chat.message
            }));
        }

        const systemPrompt = config.system_prompt_widget || config.system_prompt || "You are a helpful AI assistant.";
        const fullContext = `${ENTERPRISE_GUARDRAIL}\n\nSystem Instructions: ${systemPrompt}\n\nCompany Knowledge Base:\n${customKnowledge ? customKnowledge : "No specific company data found for this query."}\n\nRecent Conversation History:\n${memoryHistory}\n\nUser's New Message: ${userText}`;

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "user", 
            message: crmLogMessage 
        });

        let aiResponse = "I am having trouble connecting to my neural network. Please try again in a moment.";
        let wasSuccessful = false;
        
        let rawProvider = (config.ai_provider || config.selected_model || "openai").toLowerCase();
        let provider = "openai"; 

        if (rawProvider.includes("omni") || rawProvider.includes("nexus")) provider = "omni";
        else if (rawProvider.includes("claude") || rawProvider.includes("anthropic")) provider = "anthropic";
        else if (rawProvider.includes("gemini") || rawProvider.includes("google")) provider = "google";

        const words = userText.split(/\s+/).length;
        const usageRatio = isUnlimited ? 0 : (messagesUsed / (monthlyLimit || 1)) * 100;
        
        // 🚀 TIERED MODELS CONFIGURATION (2026 Latest)
        const GEMINI_CHEAP = "gemini-3.1-flash-lite";
        const GEMINI_MID = "gemini-3.1-flash";
        const GEMINI_PREMIUM = "gemini-3.1-pro";
        const GEMINI_FALLBACKS = [GEMINI_PREMIUM, GEMINI_MID, GEMINI_CHEAP];
        
        const GPT_CHEAP = "gpt-4.1-nano";
        const GPT_MID = "gpt-5.2";
        const GPT_PREMIUM = "gpt-5.4";
        const GPT_FALLBACKS = [GPT_PREMIUM, GPT_MID, GPT_CHEAP];
        
        const CLAUDE_CHEAP = "claude-3-haiku-20240307";
        const CLAUDE_MID = "claude-sonnet-4.6";
        const CLAUDE_PREMIUM = "claude-opus-4.6";
        const CLAUDE_FALLBACKS = [CLAUDE_PREMIUM, CLAUDE_MID, CLAUDE_CHEAP];

        let targetProvider = provider;
        let targetModel = "";

        // 🧠 COMPLEXITY & BUDGET ROUTER
        if (provider === "omni") {
            if (usageRatio >= 80) {
                wasSuccessful = await attemptFetch(GEMINI_CHEAP, "google");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(CLAUDE_CHEAP, "anthropic");
            } else if (usageRatio >= 60) {
                wasSuccessful = await attemptFetch(words < 40 ? GPT_CHEAP : GPT_MID, "openai");
                if(!wasSuccessful) wasSuccessful = await attemptFetch(GEMINI_MID, "google");
            } else {
                if (words < 40) wasSuccessful = await attemptFetch(GEMINI_MID, "google");
                else if (words < 150) wasSuccessful = await attemptFetch(GPT_MID, "openai");
                else wasSuccessful = await attemptFetch(CLAUDE_PREMIUM, "anthropic"); 
            }
            if(!wasSuccessful) wasSuccessful = await attemptFetch(GPT_CHEAP, "openai"); 
        } else {
            if (provider === "anthropic") {
                targetModel = (usageRatio >= 85 || words < 40) ? CLAUDE_CHEAP : (words > 150 ? CLAUDE_PREMIUM : CLAUDE_MID);
                wasSuccessful = await attemptFetch(targetModel, "anthropic");
                if(!wasSuccessful){
                    for(const fallback of CLAUDE_FALLBACKS){
                        if(fallback !== targetModel) { wasSuccessful = await attemptFetch(fallback, "anthropic"); if(wasSuccessful) break; }
                    }
                }
            } else if (provider === "google") {
                targetModel = (usageRatio >= 85 || words < 40) ? GEMINI_CHEAP : (words > 150 ? GEMINI_PREMIUM : GEMINI_MID);
                wasSuccessful = await attemptFetch(targetModel, "google");
                if(!wasSuccessful){
                    for(const fallback of GEMINI_FALLBACKS){
                        if(fallback !== targetModel) { wasSuccessful = await attemptFetch(fallback, "google"); if(wasSuccessful) break; }
                    }
                }
            } else {
                targetModel = (usageRatio >= 85 || words < 40) ? GPT_CHEAP : (words > 150 ? GPT_PREMIUM : GPT_MID);
                wasSuccessful = await attemptFetch(targetModel, "openai");
                if(!wasSuccessful){
                    for(const fallback of GPT_FALLBACKS){
                        if(fallback !== targetModel) { wasSuccessful = await attemptFetch(fallback, "openai"); if(wasSuccessful) break; }
                    }
                }
            }
        }

        if (wasSuccessful) {
            await supabase.from("user_configs").update({ messages_used_this_month: messagesUsed + 1 }).eq("email", email);
            if (!config.is_unlimited) {
                // Approximate 1 token per 3 chars
                const calculatedTokens = Math.ceil((userText.length + aiResponse.length) / 3);
                await supabase.from("user_configs").update({ tokens_used: config.tokens_used + calculatedTokens }).eq("email", email);
            }
        }

        await supabase.from("chat_history").insert({ 
            email: email, 
            platform: "web",
            platform_chat_id: sessionId, 
            customer_name: "Web Visitor",
            sender_type: "bot", 
            message: aiResponse 
        });

        return NextResponse.json({ success: true, reply: aiResponse }, { headers: corsHeaders });

        // ==========================================
        // ⚡ EXECUTION HELPERS
        // ==========================================
        async function attemptFetch(modelName: string, prov: string): Promise<boolean> {
            try {
                if (prov === "google") {
                    aiResponse = await callGemini(modelName, fullContext);
                    return true;
                } else if (prov === "anthropic") {
                    aiResponse = await callClaude(modelName, fullContext);
                    return true;
                } else {
                    aiResponse = await callOpenAI(modelName, fullContext);
                    return true;
                }
            } catch (e) {
                console.error(`[Widget AI Error] ${modelName} failed.`);
                return false;
            }
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}