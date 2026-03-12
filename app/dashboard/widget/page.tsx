"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Code, Copy, CheckCircle2, ArrowLeft, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WidgetDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (status === "loading" || !session?.user?.email) return null;

  // The embed code for the user
  const embedCode = `
<div id="clawlink-widget-container" style="position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; z-index: 999999; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); display: none;">
  <iframe src="https://clawlink.com/widget?email=${session.user.email}" width="100%" height="100%" frameborder="0"></iframe>
</div>
<button id="clawlink-toggle-btn" onclick="const w = document.getElementById('clawlink-widget-container'); w.style.display = w.style.display === 'none' ? 'block' : 'none';" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999999; background: #3b82f6; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.4); font-size: 24px;">💬</button>
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" /> Website Chat Widget
          </h1>
          <p className="text-sm text-gray-400 mt-1">Embed your AI Agent directly into your WordPress, Shopify, or Custom website.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-blue-500/20 rounded-3xl p-8 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Code className="w-5 h-5 text-blue-400"/> Your Embed Code</h3>
          <p className="text-sm text-gray-400 mb-6">Copy and paste this HTML code exactly before the closing <code className="bg-black/50 px-2 py-1 rounded text-pink-400">&lt;/body&gt;</code> tag on your website.</p>
          
          <div className="relative">
            <pre className="bg-black/80 border border-white/10 p-6 rounded-xl text-sm font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap">
              {embedCode}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              {copied ? <><CheckCircle2 className="w-4 h-4"/> Copied</> : <><Copy className="w-4 h-4"/> Copy Code</>}
            </button>
          </div>

          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
            <p className="text-sm text-blue-200"><strong>Note:</strong> Messages sent through the website widget will also consume your API usage limit and will be visible in your CRM Dashboard.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}