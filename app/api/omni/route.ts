import { NextResponse } from "next/server";

// 🚀 OMNIAGENT NEXUS: Deep Fallback Matrix Engine
// Architecture: Cross-Provider Fallback WITH Intra-Provider Version Fallback
// No external SDKs. 100% Native Fetch for Vercel Edge Speed.

// 🛡️ ENTERPRISE GUARDRAIL: Strict RAG Enforcement & Human Handoff Protocol
const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Knowledge Base (RAG) to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and helpful.
`;

// ==========================================
// 🥇 HELPER 1: ANTHROPIC (CLAUDE)
// ==========================================
async function callAnthropic(models: string[], history: any[], systemPrompt: string, prompt: string) {
  const finalSystemPrompt = `${ENTERPRISE_GUARDRAIL}\n\n${systemPrompt || "You are a highly advanced AI assistant."}`;
  for (const model of models) {
    try {
      console.log(`🟢 [OMNI-NEXUS] Trying Anthropic Model: ${model}`);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: finalSystemPrompt,
          messages: [...history, { role: "user", content: prompt }]
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "claude", model: model, reply: data.content[0].text };
      } else {
        console.warn(`⚠️ [OMNI-NEXUS] Anthropic ${model} failed with status: ${res.status}`);
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] Anthropic ${model} network error:`, e);
    }
  }
  return { success: false };
}

// ==========================================
// 🥈 HELPER 2: OPENAI (GPT)
// ==========================================
async function callOpenAI(models: string[], systemPrompt: string, history: any[], prompt: string) {
  const finalSystemPrompt = `${ENTERPRISE_GUARDRAIL}\n\n${systemPrompt || "You are a highly advanced AI assistant."}`;
  const formattedMessages = [
    { role: "system", content: finalSystemPrompt },
    ...history,
    { role: "user", content: prompt }
  ];

  for (const model of models) {
    try {
      console.log(`🟡 [OMNI-NEXUS] Trying OpenAI Model: ${model}`);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY || ""}`
        },
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "openai", model: model, reply: data.choices[0].message.content };
      } else {
        console.warn(`⚠️ [OMNI-NEXUS] OpenAI ${model} failed with status: ${res.status}`);
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] OpenAI ${model} network error:`, e);
    }
  }
  return { success: false };
}

// ==========================================
// 🥉 HELPER 3: GOOGLE (GEMINI)
// ==========================================
async function callGemini(models: string[], systemPrompt: string, prompt: string) {
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const finalSystemPrompt = `${ENTERPRISE_GUARDRAIL}\n\n${systemPrompt || ""}`;
  
  for (const model of models) {
    try {
      console.log(`🟠 [OMNI-NEXUS] Trying Gemini Model: ${model}`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${finalSystemPrompt ? `System Rules: ${finalSystemPrompt}\n\n` : ''}User Query: ${prompt}` }] }]
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
           return { success: true, provider: "gemini", model: model, reply: data.candidates[0].content.parts[0].text };
        }
      } else {
        console.warn(`⚠️ [OMNI-NEXUS] Gemini ${model} failed with status: ${res.status}`);
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] Gemini ${model} network error:`, e);
    }
  }
  return { success: false };
}

// ==========================================
// 🚀 MAIN ENGINE CONTROLLER
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, history = [] } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt payload is missing" }, { status: 400 });
    }

    console.log("⚡ [OMNI-NEXUS] Request intercepted. Engaging Deep Fallback Matrix...");

    // ----------------------------------------------------------------------
    // PRIORITY 1: CLAUDE (Deep Version Fallback)
    // ----------------------------------------------------------------------
    // 🔒 FIXED: Real Production Models added to prevent matrix exhaustion
    const claudeModels = ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"];
    const claudeResult = await callAnthropic(claudeModels, history, systemPrompt, prompt);
    if (claudeResult.success) {
      console.log(`✅ [OMNI-NEXUS] Success via ${claudeResult.provider} (${claudeResult.model})`);
      return NextResponse.json(claudeResult);
    }

    // ----------------------------------------------------------------------
    // PRIORITY 2: OPENAI (Deep Version Fallback)
    // ----------------------------------------------------------------------
    // 🔒 FIXED: Real Production Models added
    const openAIModels = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
    const openAIResult = await callOpenAI(openAIModels, systemPrompt, history, prompt);
    if (openAIResult.success) {
      console.log(`✅ [OMNI-NEXUS] Success via ${openAIResult.provider} (${openAIResult.model})`);
      return NextResponse.json(openAIResult);
    }

    // ----------------------------------------------------------------------
    // PRIORITY 3: GEMINI (Deep Version Fallback)
    // ----------------------------------------------------------------------
    // 🔒 FIXED: Real Production Models added
    const geminiModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    const geminiResult = await callGemini(geminiModels, systemPrompt, prompt);
    if (geminiResult.success) {
      console.log(`✅ [OMNI-NEXUS] Success via ${geminiResult.provider} (${geminiResult.model})`);
      return NextResponse.json(geminiResult);
    }

    // ----------------------------------------------------------------------
    // 🚨 ABSOLUTE FAILURE (All Tiers & Models Exhausted)
    // ----------------------------------------------------------------------
    console.error("❌ [OMNI-NEXUS] CRITICAL: Entire Fallback Matrix Exhausted. No providers available.");
    return NextResponse.json({ 
      success: false, 
      provider: "none", 
      reply: "System Overload: All neural links in the OmniAgent Matrix are currently engaged or undergoing maintenance. Please try your request again in a few moments." 
    }, { status: 503 });

  } catch (error) {
    console.error("❌ [OMNI-NEXUS] Fatal Engine Error:", error);
    return NextResponse.json({ error: "OmniAgent Engine Error" }, { status: 500 });
  }
}