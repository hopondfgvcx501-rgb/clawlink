import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIReply(
  provider: string,
  modelName: string,
  systemPrompt: string,
  history: any[],
  userInput: string
) {
  try {
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
      
      const safeModel = modelName === "gemini-1.5-pro" ? "gemini-1.5-pro-latest" : modelName;
      const model = genAI.getGenerativeModel({ 
        model: safeModel, 
        systemInstruction: systemPrompt 
      });

      const result = await model.generateContent(userInput);
      return result.response.text();
    }

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API Key configuration.");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: modelName, 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    }

    if (provider === "anthropic") {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("Missing Anthropic API Key configuration.");
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: modelName,
          system: systemPrompt,
          max_tokens: 1024,
          messages: [
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
    console.error("AI ROUTER ERROR:", error.message);
    return `🚨 SYSTEM ERROR: \n\n${error.message}\n\nPlease verify billing and API keys in your dashboard.`;
  }
}