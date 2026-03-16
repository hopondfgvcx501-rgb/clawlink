import { NextResponse } from "next/server";

// 🚀 OMNIAGENT NEXUS: Deep Fallback Matrix Engine
// Architecture: Cross-Provider Fallback WITH Intra-Provider Version Fallback
// No external SDKs. 100% Native Fetch for Vercel Edge Speed.

// ==========================================
// 🥇 HELPER 1: ANTHROPIC (CLAUDE)
// ==========================================
async function callAnthropic(models: string[], history: any[], systemPrompt: string, prompt: string) {
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
          system: systemPrompt || "You are a highly advanced AI assistant.",
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
async function callOpenAI(models: string[], formattedMessages: any[]) {
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
  for (const model of models) {
    try {
      console.log(`🟠 [OMNI-NEXUS] Trying Gemini Model: ${model}`);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt ? `System Rules: ${systemPrompt}\n\n` : ''}User Query: ${prompt}` }] }]
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

    // Prepare OpenAI standardized history format
    const formattedMessagesOpenAI = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...history,
      { role: "user", content: prompt }
    ];

    console.log("⚡ [OMNI-NEXUS] Request intercepted. Engaging Deep Fallback Matrix...");

    // ----------------------------------------------------------------------
    // PRIORITY 1: CLAUDE (Deep Version Fallback)
    // ----------------------------------------------------------------------
    const claudeModels = ["claude-3-opus-20240229", "claude-4.6-opus", "claude-4.5-sonnet", "claude-4.5-haiku"];
    const claudeResult = await callAnthropic(claudeModels, history, systemPrompt, prompt);
    if (claudeResult.success) {
      console.log(`✅ [OMNI-NEXUS] Success via ${claudeResult.provider} (${claudeResult.model})`);
      return NextResponse.json(claudeResult);
    }

    // ----------------------------------------------------------------------
    // PRIORITY 2: OPENAI (Deep Version Fallback)
    // ----------------------------------------------------------------------
    const openAIModels = ["gpt-5.2", "gpt-4o"];
    const openAIResult = await callOpenAI(openAIModels, formattedMessagesOpenAI);
    if (openAIResult.success) {
      console.log(`✅ [OMNI-NEXUS] Success via ${openAIResult.provider} (${openAIResult.model})`);
      return NextResponse.json(openAIResult);
    }

    // ----------------------------------------------------------------------
    // PRIORITY 3: GEMINI (Deep Version Fallback)
    // ----------------------------------------------------------------------
    const geminiModels = ["gemini-3", "gemini-1.5-flash"];
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