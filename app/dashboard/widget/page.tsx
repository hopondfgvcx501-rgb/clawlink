"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Send, Bot, Activity, Copy, Globe, MessageSquare, CheckCircle, Terminal } from "lucide-react";
import TopHeader from "@/components/TopHeader";

// --- 🤖 THE LIVE WIDGET PREVIEW COMPONENT (Your exact logic) ---
function WidgetChatPreview() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // Smart Email Detector
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
    setMessages([{ role: "bot", content: "Hi there! 👋 I am your AI Support Agent. How can I help you today?" }]);
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
      <div className="h-[500px] w-full max-w-[340px] bg-[#0A0A0B] flex items-center justify-center p-4 rounded-[24px] border border-white/10 shadow-2xl">
        <div className="bg-[#111] border border-indigo-500/30 p-4 rounded-xl text-indigo-500 text-xs font-mono text-center shadow-2xl animate-pulse">
          Initializing AI Engine...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[550px] w-full max-w-[360px] mx-auto flex flex-col font-sans overflow-hidden bg-[#0A0A0B] border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shadow-md z-10 relative">
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
  );
}

// --- 🚀 THE MAIN DASHBOARD PAGE ---
export default function WebWidgetDashboard() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const affiliateId = session?.user?.email ? Buffer.from(session.user.email).toString('base64').substring(0, 10) : "USER_ID";
  
  const snippet = `<script 
  src="https://clawlink-six.vercel.app/widget.js" 
  data-client-id="${affiliateId}"
  data-color="#3B82F6"
  defer>
</script>
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-indigo-500/30">
      <TopHeader title="Web Chat Widget" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
        <div className="fixed top-[10%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-10 flex flex-col items-start">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <Globe className="w-8 h-8 text-indigo-500" /> Web Widget Deployment
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">Copy the installation script and paste it into your website. Test your live agent in the preview window.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT: INSTALLATION SNIPPET */}
            <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Terminal className="w-4 h-4 text-indigo-500" /> HTML Embed Code
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 transition-colors border border-white/10"
                >
                  {copied ? <><CheckCircle className="w-3 h-3 text-green-500"/> Copied!</> : <><Copy className="w-3 h-3"/> Copy Code</>}
                </button>
              </div>
              
              <div className="bg-[#0A0A0B] p-6 rounded-xl border border-white/5 shadow-inner overflow-x-auto custom-scrollbar">
                <pre className="text-sm font-mono text-indigo-300">
                  <code>{snippet}</code>
                </pre>
              </div>

              <div className="mt-8 flex items-start gap-4 p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm font-bold mb-1">Installation Instructions</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Paste this code directly before the closing <code className="bg-black px-1 py-0.5 rounded text-gray-300">&lt;/body&gt;</code> tag of your website. It works seamlessly with WordPress, Shopify, Webflow, and custom HTML sites.</p>
                </div>
              </div>
            </div>

            {/* RIGHT: LIVE WIDGET PREVIEW */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Preview
              </div>
              <Suspense fallback={<div className="h-[500px] w-[340px] bg-[#111] animate-pulse rounded-[24px] border border-white/10"></div>}>
                <WidgetChatPreview />
              </Suspense>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}