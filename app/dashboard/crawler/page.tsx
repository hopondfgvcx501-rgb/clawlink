"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Search, Zap, CheckCircle, Database, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AutoCrawler() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [url, setUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleCrawl = async () => {
    if (!url.trim() || !url.startsWith("http")) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsCrawling(true);
    setResult(null);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, url })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.message);
        setUrl("");
      } else {
        alert("Crawler Error: " + data.error);
      }
    } catch (error) {
      alert("Network Error during Deep Scan.");
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-500" /> Auto-Website Crawler
          </h1>
          <p className="text-sm text-gray-400 mt-1">Zero-setup RAG. Paste a URL and let our AI scrape and memorize it instantly.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-purple-500/20 rounded-[2rem] p-8 md:p-12 shadow-[0_0_40px_rgba(168,85,247,0.1)] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 mb-6 border border-purple-500/30">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">Target URL Specification</h2>
            <p className="text-sm text-gray-400 mb-8 max-w-lg">
              Enter the exact link of the website, FAQ page, or product catalog you want the AI to learn. We will bypass standard walls and extract text data.
            </p>

            <div className="w-full max-w-2xl relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-500" />
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.yourcompany.com/about-us"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-4 pl-12 pr-40 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-gray-600 font-mono"
              />
              <button 
                onClick={handleCrawl}
                disabled={isCrawling || !url}
                className="absolute right-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isCrawling ? <><Zap className="w-4 h-4 animate-bounce"/> Scanning</> : "Inject URL"}
              </button>
            </div>

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-green-500/10 border border-green-500/30 px-6 py-4 rounded-xl flex items-center gap-3 w-full max-w-2xl">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm font-mono text-left">{result}</p>
              </motion.div>
            )}
          </div>

        </motion.div>
      </main>
    </div>
  );
}