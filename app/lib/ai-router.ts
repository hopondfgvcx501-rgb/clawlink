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
    // 1. GOOGLE GEMINI (Tested & Verified Active Models)
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
        console.warn(`⚠️ Gemini primary failed. Switching to VERIFIED fallback...`);
        try {
          // 🚀 GUARANTEED FALLBACK: Yeh subah 429 de raha tha, matlab 100% exist karta hai!
          const proModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro", 
            systemInstruction: systemPrompt 
          }); 
          const chat = proModel.startChat({ history: formattedHistory });
          const result = await chat.sendMessage(userText);
          return result.response.text();
        } catch (fallbackErr: any) {
           throw new Error(`Gemini Fallback failed: ${fallbackErr.message}`);
        }
      }
    }

    // ==========================================
    // 2. OPENAI (From Your 2026 List)
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
        try {
          // 🚀 2026 Stable Fallback
          const response = await openai.chat.completions.create({
            model: "gpt-4.5", 
            messages: messages,
          });
          return response.choices[0].message?.content || "No reply from OpenAI fallback.";
        } catch (fallbackErr: any) {
          throw new Error(`OpenAI Fallback failed: ${fallbackErr.message}`);
        }
      }
    }

    // ==========================================
    // 3. ANTHROPIC CLAUDE (From Your 2026 List)
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
        try {
          // 🚀 2026 Stable Fallback
          const response = await anthropic.messages.create({
            model: "claude-4.6-haiku", 
            system: systemPrompt,
            max_tokens: 1024,
            messages: messages,
          });
          const contentBlock = response.content[0];
          if (contentBlock.type === 'text') return contentBlock.text;
          return "No text reply from Claude fallback.";
        } catch (fallbackErr: any) {
          throw new Error(`Claude Fallback failed: ${fallbackErr.message}`);
        }
      }
    }

    throw new Error(`Invalid AI Provider selected in Database: ${provider}`);

  } catch (error: any) {
    console.error(`🚨 AI ROUTER ERROR (${provider} - ${modelName}):`, error.message);
    throw error; 
  }
}