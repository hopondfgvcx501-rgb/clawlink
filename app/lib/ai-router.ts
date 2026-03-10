import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type ChatMessage = { role: string; message: string };

export async function generateAIReply(
  provider: string,       
  modelName: string,      
  systemPrompt: string,
  history: ChatMessage[],
  userText: string
): Promise<string> {
  
  try {
    // ==========================================
    // 1. GOOGLE GEMINI (With Auto-Fallback)
    // ==========================================
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      
      const formattedHistory = history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.message }]
      }));

      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(userText);
        return result.response.text();
      } catch (primaryErr: any) {
        console.warn(`⚠️ Gemini [${modelName}] failed. Fallback to gemini-pro...`);
        try {
          // 🚀 FIX: Corrected model name to standard 'gemini-pro'
          const proModel = genAI.getGenerativeModel({ model: "gemini-pro" }); 
          // Note: Older gemini-pro sometimes rejects systemInstructions, so we keep it simple for pure fallback
          const chat = proModel.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(userText);
          return result.response.text();
        } catch (fallbackErr: any) {
           throw new Error(`Gemini Fallback also failed: ${fallbackErr.message}`);
        }
      }
    }

    // ==========================================
    // 2. OPENAI (With Auto-Fallback)
    // ==========================================
    else if (provider === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
      
      const messages: any[] = [{ role: "system", content: systemPrompt }];
      history.forEach((msg) => {
        messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.message });
      });
      messages.push({ role: "user", content: userText });

      try {
        const response = await openai.chat.completions.create({
          model: modelName, 
          messages: messages,
        });
        return response.choices[0].message?.content || "No reply from OpenAI.";
      } catch (primaryErr: any) {
        console.warn(`⚠️ OpenAI [${modelName}] failed. Fallback to gpt-4-turbo...`);
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", 
            messages: messages,
          });
          return response.choices[0].message?.content || "No reply from OpenAI fallback.";
        } catch (fallbackErr: any) {
          throw new Error(`OpenAI Fallback also failed: ${fallbackErr.message}`);
        }
      }
    }

    // ==========================================
    // 3. ANTHROPIC (With Auto-Fallback)
    // ==========================================
    else if (provider === "anthropic") {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
      
      const messages: any[] = [];
      history.forEach((msg) => {
        messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.message });
      });
      messages.push({ role: "user", content: userText });

      try {
        const response = await anthropic.messages.create({
          model: modelName, 
          system: systemPrompt,
          max_tokens: 1024,
          messages: messages,
        });
        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') return contentBlock.text;
        return "No text reply from Claude.";
      } catch (primaryErr: any) {
        console.warn(`⚠️ Claude [${modelName}] failed. Fallback to claude-3-haiku...`);
        try {
          const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", 
            system: systemPrompt,
            max_tokens: 1024,
            messages: messages,
          });
          const contentBlock = response.content[0];
          if (contentBlock.type === 'text') return contentBlock.text;
          return "No text reply from Claude fallback.";
        } catch (fallbackErr: any) {
          throw new Error(`Claude Fallback also failed: ${fallbackErr.message}`);
        }
      }
    }

    throw new Error(`Invalid AI Provider selected in Database: ${provider}`);

  } catch (error: any) {
    console.error(`🚨 AI ROUTER ERROR (${provider} - ${modelName}):`, error.message);
    throw error; 
  }
}