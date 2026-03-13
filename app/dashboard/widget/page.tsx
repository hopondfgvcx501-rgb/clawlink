"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Code, Copy, CheckCircle, Globe, ArrowLeft, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WidgetSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-blue-500 font-mono animate-pulse">LOADING WIDGET SETTINGS...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  // Generate the embed iframe code for the customer
  const userEmail = session?.user?.email || "your-email@example.com";
  // Assuming your deployed URL will be clawlink.com, using window.location.origin dynamically
  const widgetUrl = `https://clawlink-six.vercel.app/widget?email=${encodeURIComponent(userEmail)}`;
  
  const embedCode = `
<iframe 
  src="${widgetUrl}" 
  width="380" 
  height="600" 
  style="border:none; position:fixed; bottom:20px; right:20px; z-index:99999; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
  allow="microphone"
></iframe>
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      
      <header className="max-w-5xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" /> Web Chat Widget
          </h1>
          <p className="text-sm text-gray-400 mt-1">Embed your AI Agent directly into your website in 1 minute.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Side: Instructions & Code */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-blue-500"/> Integration Code
            </h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Copy the snippet below and paste it just above the closing <code className="bg-black/50 text-pink-400 px-2 py-0.5 rounded font-mono text-xs">&lt;/body&gt;</code> tag of your website (WordPress, Shopify, Webflow, or custom HTML).
            </p>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#050505] border border-white/10 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center bg-[#1A1A1A] px-4 py-2 border-b border-white/5">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest font-mono">HTML Snippet</span>
                  <button 
                    onClick={handleCopy}
                    className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copied ? <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Copied</span> : <><Copy className="w-3 h-3"/> Copy Code</>}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-blue-200 font-mono custom-scrollbar">
                  <code>{embedCode}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">How it works</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3"><span className="text-blue-500 font-black">1.</span> The widget connects directly to your ClawLink AI Brain (RAG).</li>
              <li className="flex gap-3"><span className="text-blue-500 font-black">2.</span> Every message uses your allocated API tokens.</li>
              <li className="flex gap-3"><span className="text-blue-500 font-black">3.</span> Chats will appear in your "Live CRM" just like WhatsApp/Telegram.</li>
            </ul>
          </div>
        </motion.div>

        {/* Right Side: Live Preview */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 w-full text-center">Live Preview</h3>
          
          {/* Mock Widget Preview UI */}
          <div className="w-[320px] h-[500px] bg-[#0A0A0B] rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative z-10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white"/>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">AI Support Assistant</h2>
                <p className="text-[10px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <div className="flex-1 p-4 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-80 flex flex-col gap-4">
              <div className="bg-blue-600/20 border border-blue-500/30 text-blue-50 p-3 rounded-2xl rounded-tl-sm text-xs max-w-[85%]">
                Hi there! How can I help you today?
              </div>
              <div className="bg-[#1A1A1A] border border-white/10 text-white p-3 rounded-2xl rounded-tr-sm text-xs max-w-[85%] self-end">
                I have a question about my pricing plan.
              </div>
            </div>
            <div className="p-3 bg-[#111] border-t border-white/10">
              <div className="bg-[#1A1A1A] border border-white/10 rounded-full py-2.5 px-4 text-xs text-gray-500">
                Type your message...
              </div>
            </div>
          </div>

        </motion.div>

      </main>
    </div>
  );
}