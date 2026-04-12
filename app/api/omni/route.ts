import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 🚀 OMNIAGENT NEXUS: Deep Fallback Matrix Engine (2026 Edition)
// Architecture: Cross-Provider Fallback WITH Intra-Provider Version Fallback & Smart Cost Routing

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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: model, messages: formattedMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "openai", model: model, reply: data.choices[0].message.content };
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] OpenAI ${model} error:`, e);
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
  
  let contents: any[] = [];
  let lastRole = "";
  for (const msg of history) {
      const currentRole = msg.role === "assistant" ? "model" : "user";
      if (currentRole === lastRole) {
          contents[contents.length - 1].parts[0].text += "\n" + msg.content;
      } else {
          contents.push({ role: currentRole, parts: [{ text: msg.content }] });
          lastRole = currentRole;
      }
  }
  if (lastRole === "user") contents[contents.length - 1].parts[0].text += "\n" + prompt;
  else contents.push({ role: "user", parts: [{ text: prompt }] });

  for (const model of models) {
    try {
      console.log(`🟢 [OMNI-NEXUS] Trying Gemini Model: ${model}`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_instruction: { parts: { text: finalSystemPrompt } }, contents: contents }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
           return { success: true, provider: "gemini", model: model, reply: data.candidates[0].content.parts[0].text };
        }
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] Gemini ${model} error:`, e);
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
  
  let mergedMessages: any[] = [];
  let lastRole = "";
  for (const msg of history) {
      if (msg.role === lastRole) {
          mergedMessages[mergedMessages.length - 1].content += "\n" + msg.content;
      } else {
          mergedMessages.push({ role: msg.role, content: msg.content });
          lastRole = msg.role;
      }
  }
  if (lastRole === "user") mergedMessages[mergedMessages.length - 1].content += "\n" + prompt;
  else mergedMessages.push({ role: "user", content: prompt });

  if (mergedMessages.length > 0 && mergedMessages[0].role !== "user") mergedMessages.shift();

  for (const model of models) {
    try {
      console.log(`🔴 [OMNI-NEXUS] Trying Anthropic Model: ${model}`);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: model, max_tokens: 1024, system: finalSystemPrompt, messages: mergedMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, provider: "claude", model: model, reply: data.content[0].text };
      }
    } catch (e) {
      console.warn(`⚠️ [OMNI-NEXUS] Anthropic ${model} error:`, e);
    }
  }
  return { success: false };
}

// ==========================================
// 🚀 MAIN ENGINE CONTROLLER
// ==========================================
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`) {
      return NextResponse.json({ error: "Access Denied." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, systemPrompt, history = [], apiKey = null, forceCheap = false, userWords = 0 } = body;

    if (!prompt) return NextResponse.json({ error: "Prompt payload is missing" }, { status: 400 });

    // 2026 LATEST MODELS CONSTANTS
    const geminiModelsCheap = ["gemini-3.1-flash-lite"];
    const geminiModelsPremium = ["gemini-3.1-pro", "gemini-3.1-flash"];
    
    const openAIModelsCheap = ["gpt-4.1-nano"];
    const openAIModelsPremium = ["gpt-5.4", "gpt-5.2"];
    
    const claudeModelsCheap = ["claude-3-haiku"];
    const claudeModelsPremium = ["claude-opus-4.6", "claude-sonnet-4.6"];

    const isComplexQuery = userWords > 150;

    // 🧠 SMART COST-SAVING ROUTE
    if (forceCheap || (!isComplexQuery && !forceCheap)) {
      const geminiResult = await callGemini(geminiModelsCheap, systemPrompt, history, prompt, apiKey);
      if (geminiResult.success) return NextResponse.json(geminiResult);

      const gptResult = await callOpenAI(openAIModelsCheap, systemPrompt, history, prompt, apiKey);
      if (gptResult.success) return NextResponse.json(gptResult);
      
      const claudeResult = await callAnthropic(claudeModelsCheap, history, systemPrompt, prompt, apiKey);
      if (claudeResult.success) return NextResponse.json(claudeResult);
    } 
    // 💎 PREMIUM ROUTE
    else {
      const openAIResult = await callOpenAI(openAIModelsPremium, systemPrompt, history, prompt, apiKey);
      if (openAIResult.success) return NextResponse.json(openAIResult);

      const claudeResult = await callAnthropic(claudeModelsPremium, history, systemPrompt, prompt, apiKey);
      if (claudeResult.success) return NextResponse.json(claudeResult);

      const geminiResult = await callGemini(geminiModelsPremium, systemPrompt, history, prompt, apiKey);
      if (geminiResult.success) return NextResponse.json(geminiResult);
    }

    return NextResponse.json({ 
      success: false, provider: "none", 
      reply: "System is undergoing scheduled maintenance. Please try again." 
    }, { status: 503 });

  } catch (error) {
    return NextResponse.json({ error: "OmniAgent Engine Error" }, { status: 500 });
  } 
}