import { NextResponse } from "next/server";

// 🚀 OMNIAGENT NEXUS: Deep Fallback Matrix Engine
// Architecture: Cross-Provider Fallback WITH Intra-Provider Version Fallback & Smart Cost Routing
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
// 🥇 HELPER 1: OPENAI (GPT)
// ==========================================
async function callOpenAI(models: string[], systemPrompt: string, history: any[], prompt: string, key: string | null) {
  const apiKey = key || process.env.OPENAI_API_KEY || "";
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
          "Authorization": `Bearer ${apiKey}`
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
// 🥈 HELPER 2: GOOGLE (GEMINI)
// ==========================================
async function callGemini(models: string[], systemPrompt: string, history: any[], prompt: string, key: string | null) {
  const geminiKey = key || process.env.GEMINI_API_KEY || "";
  const finalSystemPrompt = `${ENTERPRISE_GUARDRAIL}\n\n${systemPrompt || ""}`;
  
  // 🧠 Added Memory Array Logic to Gemini Omni
  const contents = history.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
  }));
  contents.push({ role: "user", parts: [{ text: prompt }] });

  for (const model of models) {
    try {
      console.log(`🟢 [OMNI-NEXUS] Trying Gemini Model: ${model}`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: { text: finalSystemPrompt } },
          contents: contents
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
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
// 🥉 HELPER 3: ANTHROPIC (CLAUDE)
// ==========================================
async function callAnthropic(models: string[], history: any[], systemPrompt: string, prompt: string, key: string | null) {
  const apiKey = key || process.env.ANTHROPIC_API_KEY || "";
  const finalSystemPrompt = `${ENTERPRISE_GUARDRAIL}\n\n${systemPrompt || "You are a highly advanced AI assistant."}`;
  for (const model of models) {
    try {
      console.log(`🔴 [OMNI-NEXUS] Trying Anthropic Model: ${model}`);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
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
// 🚀 MAIN ENGINE CONTROLLER
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, history = [], apiKey = null, forceCheap = false, userWords = 0 } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt payload is missing" }, { status: 400 });
    }

    console.log(`⚡ [OMNI-NEXUS] Request intercepted. Engaging Deep Fallback Matrix... (ForceCheap: ${forceCheap})`);

    const geminiModelsCheap = ["gemini-1.5-flash-8b", "gemini-1.5-flash"];
    const geminiModelsPremium = ["gemini-1.5-pro", "gemini-1.5-flash"];
    
    const openAIModelsCheap = ["gpt-4o-mini"];
    const openAIModelsPremium = ["gpt-4-turbo", "gpt-4o", "gpt-4o-mini"];
    
    const claudeModelsCheap = ["claude-3-haiku-20240307"];
    const claudeModelsPremium = ["claude-3-opus-20240229", "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"];

    const isComplexQuery = userWords > 150;

    // ======================================================================
    // 🧠 SMART COST-SAVING ROUTE
    // ======================================================================
    if (forceCheap || (!isComplexQuery && !forceCheap)) {
      console.log(`💰 [OMNI-NEXUS] Optimal Routing Active. (ForceCheap: ${forceCheap}, Complex: ${isComplexQuery})`);
      
      const geminiResult = await callGemini(geminiModelsCheap, systemPrompt, history, prompt, apiKey);
      if (geminiResult.success) {
        console.log(`✅ [OMNI-NEXUS] Success via ${geminiResult.provider} (${geminiResult.model})`);
        return NextResponse.json(geminiResult);
      }

      const gptResult = await callOpenAI(openAIModelsCheap, systemPrompt, history, prompt, apiKey);
      if (gptResult.success) {
        console.log(`✅ [OMNI-NEXUS] Backup Success via ${gptResult.provider} (${gptResult.model})`);
        return NextResponse.json(gptResult);
      }
      
      const claudeResult = await callAnthropic(claudeModelsCheap, history, systemPrompt, prompt, apiKey);
      if (claudeResult.success) {
         console.log(`✅ [OMNI-NEXUS] Backup Success via ${claudeResult.provider} (${claudeResult.model})`);
         return NextResponse.json(claudeResult);
      }
    } 
    // ======================================================================
    // 💎 PREMIUM ROUTE (Complex Queries)
    // ======================================================================
    else {
      console.log("💎 [OMNI-NEXUS] Complex Query Detected. Engaging Premium Tier Models.");
      
      const claudeResult = await callAnthropic(claudeModelsPremium, history, systemPrompt, prompt, apiKey);
      if (claudeResult.success) {
        console.log(`✅ [OMNI-NEXUS] Success via ${claudeResult.provider} (${claudeResult.model})`);
        return NextResponse.json(claudeResult);
      }

      const openAIResult = await callOpenAI(openAIModelsPremium, systemPrompt, history, prompt, apiKey);
      if (openAIResult.success) {
        console.log(`✅ [OMNI-NEXUS] Success via ${openAIResult.provider} (${openAIResult.model})`);
        return NextResponse.json(openAIResult);
      }

      const geminiResult = await callGemini(geminiModelsPremium, systemPrompt, history, prompt, apiKey);
      if (geminiResult.success) {
        console.log(`✅ [OMNI-NEXUS] Success via ${geminiResult.provider} (${geminiResult.model})`);
        return NextResponse.json(geminiResult);
      }
    }

    console.error("❌ [OMNI-NEXUS] CRITICAL: Entire Fallback Matrix Exhausted. No providers available.");
    return NextResponse.json({ 
      success: false, 
      provider: "none", 
      reply: "Hello! Our AI assistant is currently undergoing a brief scheduled maintenance to serve you better. Please leave your query and our human support team will get back to you shortly." 
    }, { status: 503 });

  } catch (error) {
    console.error("❌ [OMNI-NEXUS] Fatal Engine Error:", error);
    return NextResponse.json({ error: "OmniAgent Engine Error" }, { status: 500 });
  }
}