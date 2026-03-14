"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { Send, Bot, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

function WidgetChat() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // 🚀 SMART EMAIL DETECTOR (Takes from session if in dashboard, or URL if public website)
  const email = session?.user?.email || searchParams.get("email");
  
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem("clawlink_web_session");
    if (!sid) {
      sid = "web_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("clawlink_web_session", sid);
    }
    setSessionId(sid);
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
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ Network connection lost." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-red-500/30 p-4 rounded-xl text-red-500 text-xs font-mono text-center shadow-2xl animate-pulse">
          Loading AI Agent...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-transparent flex flex-col font-sans overflow-hidden p-2 md:p-6 lg:px-32">
      <div className="flex-1 flex flex-col bg-[#0A0A0B] border border-white/10 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between shadow-md z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">AI Assistant</h2>
              <p className="text-blue-100 text-[10px] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0B] opacity-95 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-[13px] shadow-xl leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#1A1A1A] border border-white/10 text-gray-200 rounded-bl-sm"}`}>
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

        <div className="p-3 bg-[#111] border-t border-white/10 relative z-10">
          <div className="relative flex items-center">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your message..." disabled={isLoading}
              className="w-full bg-[#1A1A1A] border border-white/10 text-white text-xs rounded-full py-3.5 pl-4 pr-12 focus:outline-none focus:border-blue-500"
            />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="absolute right-1.5 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 disabled:opacity-50">
              {isLoading ? <Activity className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebWidgetPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#0A0A0B] flex items-center justify-center text-blue-500 font-mono animate-pulse">INIT WIDGET...</div>}>
      <WidgetChat />
    </Suspense>
  );
}