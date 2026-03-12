"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Bot, User, Loader2 } from "lucide-react";

export default function Widget() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "ai", content: "Hi there! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a unique session ID for this website visitor
    let sid = localStorage.getItem("clawlink_session_id");
    if (!sid) {
      sid = "web_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("clawlink_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !email || !sessionId) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/widget/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: userMsg, sessionId })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: "Sorry, I am offline right now." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-mono text-xs">Invalid Widget Config</div>;
  }

  return (
    <div className="h-screen w-full bg-[#0A0A0B] text-white flex flex-col font-sans">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Bot className="w-5 h-5 text-white"/></div>
        <div>
          <h2 className="text-sm font-bold">AI Support Assistant</h2>
          <p className="text-[10px] text-blue-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === "user" ? "bg-[#1A1A1A] text-white rounded-tr-sm border border-white/10" : "bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-tl-sm"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin"/> Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-[#111] border-t border-white/10">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-500 text-white"
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-1 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4 text-white ml-0.5"/>
          </button>
        </div>
        <div className="text-center mt-2">
          <a href="https://clawlink.com" target="_blank" className="text-[9px] text-gray-500 uppercase tracking-widest font-bold hover:text-white transition-colors">Powered by ClawLink Engine</a>
        </div>
      </div>
    </div>
  );
}