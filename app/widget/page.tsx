"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Send, Bot, Activity, X } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

function WidgetChat() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate unique session ID for the web visitor
    let sid = localStorage.getItem("clawlink_web_session");
    if (!sid) {
      sid = "web_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("clawlink_web_session", sid);
    }
    setSessionId(sid);

    // Initial Greeting
    setMessages([{ role: "bot", content: "Hi there! 👋 I am the AI Support Agent. How can I help you today?" }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || !email) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // 🚀 Calling the exact API route from your screenshot
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: userMsg, sessionId })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ System error: " + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Network connection lost. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center p-4 rounded-[24px]">
        <div className="bg-[#111] border border-red-500/30 p-4 rounded-xl text-red-500 text-xs font-mono text-center shadow-2xl">
          Invalid Widget Configuration.<br/>Missing Bot ID.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-transparent flex flex-col font-sans overflow-hidden p-2">
      {/* Main Widget Card */}
      <div className="flex-1 flex flex-col bg-[#0A0A0B] border border-white/10 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between shadow-md z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">AI Assistant</h2>
              <p className="text-blue-100 text-[10px] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online & Ready
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-95 custom-scrollbar bg-fixed">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              key={idx} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3 text-[13px] shadow-xl leading-relaxed ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-sm" 
                  : "bg-[#1A1A1A] border border-white/10 text-gray-200 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl rounded-bl-sm p-4 shadow-lg flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#111] border-t border-white/10 relative z-10">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full bg-[#1A1A1A] border border-white/10 text-white text-xs rounded-full py-3.5 pl-4 pr-12 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all disabled:opacity-50"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg"
            >
              {isLoading ? <Activity className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
          <div className="text-center mt-2.5">
            <a href="https://clawlink.com" target="_blank" className="text-[9px] text-gray-600 hover:text-gray-400 uppercase tracking-widest font-mono transition-colors">⚡ Powered by ClawLink</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Next.js requirement for searchParams
export default function WebWidgetPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center text-blue-500 text-xs font-mono animate-pulse">INIT WIDGET...</div>}>
      <WidgetChat />
    </Suspense>
  );
}