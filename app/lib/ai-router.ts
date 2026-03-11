import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIReply(
  provider: string,
  modelName: string,
  systemPrompt: string,
  history: any[],
  userInput: string
) {
  try {
    // 🚀 MASTER ROUTER LOGIC: Choosing the Engine
    
    // Case 1: Google Gemini (Starter & Pro Plans)
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      
      // Auto-Fallback: 1.5-flash is fast, 1.5-pro is smart
      const modelId = modelName === "gemini-1.5-flash" ? "gemini-1.5-flash" : "gemini-1.5-pro";
      
      const model = genAI.getGenerativeModel({ 
        model: modelId,
        systemInstruction: systemPrompt 
      });

      const result = await model.generateContent(userInput);
      return result.response.text();
    }

    // Case 2: OpenAI GPT (Max Plan)
    if (provider === "openai") {
      // Yahan hum OpenAI ka SDK use karenge (Step 2 mein install karenge)
      // Abhi ke liye Gemini-Pro as a high-quality fallback use kar rahe hain
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: systemPrompt });
      const result = await model.generateContent(`[MODE: GPT-IMITATION] ${userInput}`);
      return result.response.text();
    }

    // Case 3: Anthropic Claude (Max Plan)
    if (provider === "anthropic") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: systemPrompt });
      const result = await model.generateContent(`[MODE: CLAUDE-IMITATION] ${userInput}`);
      return result.response.text();
    }

    throw new Error("Invalid Provider Selected");

  } catch (error: any) {
    // 🚨 🚨 STRICT DEBUGGING: Error seedha return karo
    console.error("AI ROUTER ERROR:", error.message);
    return `🚨 *ClawLink Engine Error:* \n\n\`${error.message}\` \n\nPlease check your API keys or Quota.`;
  }
}