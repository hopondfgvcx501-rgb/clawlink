"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Link as LinkIcon, Key, Zap, CheckCircle, ArrowLeft, Store } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EcommerceSync() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [shopUrl, setShopUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleSync = async () => {
    if (!shopUrl.trim() || !accessToken.trim()) {
      alert("Please enter both your Shopify Store URL and Storefront Access Token.");
      return;
    }

    setIsSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, shopUrl, accessToken })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.message);
        setShopUrl("");
        setAccessToken("");
      } else {
        alert("Sync Error: " + data.error);
      }
    } catch (error) {
      alert("Network Error during Shopify Sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-emerald-500" /> E-Commerce AI Sync
          </h1>
          <p className="text-sm text-gray-400 mt-1">Connect your Shopify store. Let the AI sell your products automatically.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-emerald-500/20 rounded-[2rem] p-8 md:p-12 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/30">
              <Store className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase text-center">Shopify Data Pipeline</h2>
            <p className="text-sm text-gray-400 mb-10 max-w-lg text-center leading-relaxed">
              Enter your Shopify details below. We will extract your product catalog, prices, and checkout links directly into the AI's neural network.
            </p>

            <div className="w-full max-w-xl space-y-4">
              <div className="relative flex items-center">
                <LinkIcon className="absolute left-4 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  placeholder="yourstore.myshopify.com"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-gray-600 font-mono"
                />
              </div>

              <div className="relative flex items-center">
                <Key className="absolute left-4 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Storefront Access Token"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-gray-600 font-mono"
                />
              </div>

              <button 
                onClick={handleSync}
                disabled={isSyncing || !shopUrl || !accessToken}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                {isSyncing ? <><Zap className="w-4 h-4 animate-bounce"/> Extracting Catalog...</> : "Sync Store to AI Brain"}
              </button>
            </div>

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-emerald-500/10 border border-emerald-500/30 px-6 py-4 rounded-xl flex items-center gap-3 w-full max-w-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-emerald-400 text-sm font-mono text-left">{result}</p>
              </motion.div>
            )}

            <div className="mt-10 pt-6 border-t border-white/5 w-full max-w-xl text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Need help finding your token? Go to Shopify Admin &gt; Settings &gt; Apps and sales channels &gt; Develop apps &gt; Storefront API.
              </p>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}