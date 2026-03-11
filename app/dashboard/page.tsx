"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Database, LogOut, ArrowUpRight, Zap, Save, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Bot Persona
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    if (session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserData(data.data);
            setSystemPrompt(data.data.systemPrompt);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch dashboard data:", err);
          setIsLoading(false);
        });
    }
  }, [session, status, router]);

  const handleSavePrompt = async () => {
    if (!session?.user?.email) return;
    setIsSavingPrompt(true);
    
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, systemPrompt })
      });
      const data = await res.json();
      if (data.success) {
        alert("Bot persona updated successfully! The AI will now follow these instructions.");
      } else {
        alert("Failed to update persona.");
      }
    } catch (error) {
      alert("Network error while saving persona.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    );
  }

  const usagePercentage = userData?.isUnlimited 
    ? 0 
    : Math.min(((userData?.tokensUsed || 0) / (userData?.tokensAllocated || 1)) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-16 border-b border-white/10 pb-6">
        <div className="text-2xl font-bold tracking-wider font-mono">clawlink<span className="text-blue-500">.</span>dashboard</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={session?.user?.image || ""} alt="Profile" className="w-10 h-10 rounded-full border border-white/20" />
            <div className="hidden md:block">
              <p className="text-sm font-bold">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Plan & Persona */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Plan Overview Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Current Plan</p>
                <h2 className="text-4xl font-black tracking-tight text-white mb-2">{userData?.plan || "No Active Plan"}</h2>
                <p className="text-gray-400 text-sm">Powered by <span className="text-white font-medium capitalize">{userData?.provider || "ClawLink Engine"}</span> ({userData?.model})</p>
              </div>
              {userData?.plan !== "Omni Max" && (
                <button onClick={() => router.push('/')} className="bg-white/10 hover:bg-white hover:text-black transition-all text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 border border-white/20">
                  <Zap className="w-4 h-4" /> Upgrade
                </button>
              )}
            </div>

            <div className="bg-black/50 rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">API Usage</p>
                  <p className="text-2xl font-bold text-white">
                    {userData?.isUnlimited ? "Unlimited" : userData?.tokensUsed.toLocaleString() || 0} 
                    <span className="text-sm text-gray-500 font-normal"> / {userData?.isUnlimited ? "∞" : userData?.tokensAllocated.toLocaleString()} words</span>
                  </p>
                </div>
                <p className="text-sm font-mono text-blue-400">{userData?.isUnlimited ? "∞" : `${usagePercentage.toFixed(1)}%`}</p>
              </div>
              
              {!userData?.isUnlimited && (
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${usagePercentage}%` }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* 🚀 NEW: Bot Persona Editor */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 tracking-wide flex items-center gap-2">
              🧠 AI Persona Configuration
            </h3>
            <p className="text-sm text-gray-400 mb-6">Define exactly how your AI agent should behave, speak, and respond to users.</p>
            
            <textarea 
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g., You are a friendly customer support agent for ClawLink. Always answer in Hinglish..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition-all resize-none mb-4 font-mono"
            />
            
            <div className="flex justify-end">
              <button 
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className="bg-white text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50"
              >
                {isSavingPrompt ? "Saving..." : <><Save className="w-4 h-4"/> Save Persona</>}
              </button>
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Instances & CRM */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Active Instances</h3>
          </div>

          <div className="space-y-4 mb-8">
            {userData?.telegramActive ? (
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-blue-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <p className="text-sm font-bold text-white">Telegram Bot</p>
                    <p className="text-xs text-blue-400">Online & Routing</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </div>
            ) : (
              <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3 opacity-50">
                <span className="text-2xl grayscale">✈️</span>
                <p className="text-sm font-medium text-gray-500">Telegram Not Configured</p>
              </div>
            )}

            {userData?.whatsappActive ? (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-green-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="text-sm font-bold text-white">WhatsApp Cloud</p>
                    <p className="text-xs text-green-400">Online & Routing</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </div>
            ) : (
              <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3 opacity-50">
                <span className="text-2xl grayscale">💬</span>
                <p className="text-sm font-medium text-gray-500">WhatsApp Not Configured</p>
              </div>
            )}
          </div>

          {/* 🚀 NEW: CRM Quick Link */}
          <div className="border-t border-white/10 pt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Enterprise Tools</h3>
            <button 
              onClick={() => router.push('/dashboard/crm')}
              className="w-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 hover:border-orange-500/60 p-4 rounded-xl flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Users className="w-5 h-5"/></div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">CRM Workflow Editor</p>
                  <p className="text-[10px] text-gray-400">Manage Customer Context</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-orange-400/50 group-hover:text-orange-400 transition-colors" />
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Database className="w-4 h-4" /> Connected to Global Edge Network
          </div>
        </motion.div>

      </main>
    </div>
  );
}