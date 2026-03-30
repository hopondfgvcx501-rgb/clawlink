import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIReply(
  provider: string,
  modelName: string,
  systemPrompt: string,
  history: any[],
  userInput: string
) {
  try { // 🚀 FIXED: Added the missing try block here!
    // 🚀 INTRA-PROVIDER FALLBACK MATRIX
    // Ordered from Premium -> Mid -> Cheap
    const fallbackMatrix: Record<string, string[]> = {
      "gemini": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"],
      "openai": ["gpt-4-turbo", "gpt-4o", "gpt-4o-mini"],
      "anthropic": ["claude-3-opus-20240229", "claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"]
    };

    // Ensure we start with the requested model, then gracefully degrade to cheaper ones
    let modelsToTry = [modelName];
    if (fallbackMatrix[provider]) {
      const defaultFallbacks = fallbackMatrix[provider];
      const startIndex = defaultFallbacks.indexOf(modelName);
      if (startIndex !== -1) {
          // Append cheaper models (those after the requested one in the array)
          modelsToTry = [...new Set([modelName, ...defaultFallbacks.slice(startIndex + 1)])];
      } else {
          // If an unknown specific model is requested, try it first, then append standard fallbacks
          modelsToTry = [...new Set([modelName, ...defaultFallbacks])];
      }
    }

    console.log(`[AI-ROUTER] Engaging Provider: ${provider} | Fallback Chain:`, modelsToTry);

    for (const currentModel of modelsToTry) {
        try {
          console.log(`[AI-ROUTER] Attempting model: ${currentModel}`);
          
          // =====================================
          // 🟢 GOOGLE GEMINI EXECUTION
          // =====================================
          if (provider === "gemini") {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
            const safeModel = currentModel === "gemini-1.5-pro" ? "gemini-1.5-pro-latest" : currentModel;
            const model = genAI.getGenerativeModel({ 
              model: safeModel, 
              systemInstruction: systemPrompt 
            });

            // Serialize history for Gemini SDK
            let finalInput = userInput;
            if (history && history.length > 0) {
               finalInput = "Conversation History:\n" + JSON.stringify(history) + "\n\nUser: " + userInput;
            }

            const result = await model.generateContent(finalInput);
            return result.response.text();
          }

          // =====================================
          // 🟡 OPENAI (GPT) EXECUTION
          // =====================================
          if (provider === "openai") {
            if (!process.env.OPENAI_API_KEY) throw new Error("Missing OpenAI API Key");

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: currentModel, 
                messages: [
                  { role: "system", content: systemPrompt },
                  ...history,
                  { role: "user", content: userInput }
                ]
              })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
          }

          // =====================================
          // 🔴 ANTHROPIC (CLAUDE) EXECUTION
          // =====================================
          if (provider === "anthropic") {
            if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing Anthropic API Key");

            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
              },
              body: JSON.stringify({
                model: currentModel,
                system: systemPrompt,
                max_tokens: 1024,
                messages: [
                  ...history,
                  { role: "user", content: userInput }
                ]
              })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.content[0].text;
          }

          throw new Error(`Unsupported AI Provider: ${provider}`);

        } catch (error: any) {
            console.warn(`[AI-ROUTER] Model ${currentModel} failed: ${error.message}. Routing to next fallback...`);
            // Loop gracefully continues to the next, cheaper model
        }
    }

    // If the code reaches here, ALL fallbacks failed
    throw new Error(`All fallback models exhausted and failed for provider: ${provider}`);

  } catch (error: any) {
    console.error("AI ROUTER CRITICAL ERROR:", error.message);
    return `🚨 SYSTEM ERROR: \n\n${error.message}\n\nPlease verify billing and API keys in your dashboard.`;
  }
}