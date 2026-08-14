"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ArrowRight, AlertTriangle } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "bot" | "error";
  text: string;
};

export default function LivePlayground() {
  const [chat, setChat] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      text: "Hi! I am ClawLink's Omni-Fallback AI. I am running LIVE on our production servers. Send me a message to test my latency! ⚡",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setChat((prev) => [...prev, { id: Date.now().toString(), role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      // 🚀 REAL API FETCH: Hitting the actual Omni-Fallback Engine
      const res = await fetch("/api/omni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userMsg,
            source: "landing_playground" 
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setChat((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "bot", text: data.reply },
        ]);
      } else {
        throw new Error(data.error || "Omni-Engine failed to respond.");
      }
    } catch (error: any) {
      // 🚨 NEVER HIDE BACKEND ERRORS: Log to UI and send to TG Admin
      const errorMsg = error.message || "Network Error in Playground";
      
      setChat((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "error", text: `Backend Alert: ${errorMsg}` },
      ]);

      // Fire error to Telegram Admin invisibly
      fetch("/api/tg-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🚨 [Landing Page Playground Error]\nUser tried to test the bot but it failed.\nError: ${errorMsg}`,
        }),
      }).catch(console.error); // Catch silently so it doesn't break the UI
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div 
      className="anim-card hidden lg:flex flex-col w-full h-[600px] rounded-[24px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative transition-colors duration-300 border"
      style={{ backgroundColor: "#000", borderColor: "var(--border-color)" }}
    >
      {/* 📱 iPhone Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
        <div className="w-32 h-full bg-[#111] rounded-b-xl border-b border-x border-white/10 shadow-sm flex items-center justify-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-black/80"></div>
          <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
        </div>
      </div>

      {/* 🟢 Header Area */}
      <div className="h-16 pt-5 px-5 flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#111] to-[#000] z-10 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center p-[1px]">
          <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-white text-[13px] font-bold">ClawLink Live API</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
            System Operational
          </div>
        </div>
      </div>

      {/* 💬 Live Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
        <AnimatePresence>
          {chat.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-[85%] text-[12px] leading-relaxed shadow-lg ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : msg.role === "error"
                    ? "bg-red-950/50 border border-red-500/50 text-red-200 rounded-bl-sm flex flex-col gap-1"
                    : "bg-[#1A1A1A] text-gray-200 border border-white/10 rounded-bl-sm"
                }`}
              >
                {msg.role === "error" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="p-3 bg-[#1A1A1A] border border-white/10 rounded-2xl rounded-bl-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ⌨️ Real Input Area */}
      <div className="p-4 border-t border-white/10 bg-[#0A0A0A] shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Type a real question..."
            className="w-full bg-[#1A1A1A] border border-white/10 text-white text-[13px] rounded-full pl-4 pr-12 py-3 outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}