"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Key, Copy, CheckCircle, RefreshCw, Code, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeveloperHub() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session?.user?.email) {
      fetch(`/api/developer?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.apiKey) setApiKey(data.apiKey);
          setIsLoading(false);
        });
    }
  }, [session, status, router]);

  const generateKey = async () => {
    setIsLoading(true);
    const res = await fetch("/api/developer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email })
    });
    const data = await res.json();
    if (data.success) {
      setApiKey(data.apiKey);
      setShowKey(true);
    }
    setIsLoading(false);
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-yellow-500 font-mono animate-pulse">INITIALIZING DEVELOPER ENVIRONMENT...</div>;
  }

  const apiUrl = "https://clawlink-six.vercel.app/api/v1/chat";

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-yellow-500/30">
      
      <header className="max-w-5xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Terminal className="w-6 h-6 text-yellow-500" /> Developer API Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">Build custom apps and integrations using your Headless AI Brain.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        
        {/* API KEY SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-yellow-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-500"/> Authentication Keys
          </h2>

          {!apiKey ? (
            <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-6 text-sm">You haven't generated an API key yet. Generate one to authenticate your requests.</p>
              <button onClick={generateKey} className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors">
                <RefreshCw className="w-4 h-4"/> Generate Secret Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-red-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Keep this secret. Do not expose it in frontend code.
              </p>
              <div className="flex items-center gap-4 bg-[#0A0A0B] border border-white/10 p-4 rounded-xl">
                <div className="flex-1 font-mono text-sm tracking-wider overflow-hidden text-ellipsis whitespace-nowrap">
                  {showKey ? apiKey : "cl_live_" + "•".repeat(40)}
                </div>
                <button onClick={() => setShowKey(!showKey)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  {showKey ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
                <button onClick={copyKey} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4"/>}
                </button>
              </div>
              <button onClick={() => { if(confirm("This will invalidate your old key. Continue?")) generateKey() }} className="text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest font-bold transition-colors">
                Revoke & Roll Key
              </button>
            </div>
          )}
        </motion.div>

        {/* DOCUMENTATION SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative">
          <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Code className="w-5 h-5 text-gray-400"/> Integration Example (cURL)
          </h2>
          
          <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative group">
            <div className="flex justify-between items-center bg-[#1A1A1A] px-4 py-2 border-b border-white/5">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">POST {apiUrl}</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm text-yellow-100 font-mono custom-scrollbar leading-loose">
              <span className="text-pink-400">curl</span> -X POST {apiUrl} \<br/>
              &nbsp;&nbsp;-H <span className="text-green-400">"Authorization: Bearer YOUR_API_KEY"</span> \<br/>
              &nbsp;&nbsp;-H <span className="text-green-400">"Content-Type: application/json"</span> \<br/>
              &nbsp;&nbsp;-d <span className="text-yellow-400">'{JSON.stringify({ message: "Hello AI!", sessionId: "user_123" }, null, 2)}'</span>
            </pre>
          </div>
        </motion.div>

      </main>
    </div>
  );
}