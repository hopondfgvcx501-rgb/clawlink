"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Database, Zap, Save, 
  Receipt, Download, Smartphone, BrainCircuit, 
  MessageSquare, Search, Bell, ChevronDown, 
  ExternalLink, Bot, Users, ArrowUpRight, Crown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 🚀 CORE STATES
  const [userData, setUserData] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [showAppBanner, setShowAppBanner] = useState(true);
  
  // 🚀 PERSONA STATES
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // 🚀 RAG KNOWLEDGE BASE STATES
  const [knowledgeText, setKnowledgeText] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    if (session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setUserData(data.data);
            setSystemPrompt(data.data.systemPrompt || "");
          }
        })
        .catch(console.error);

      fetch(`/api/billing?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBillingHistory(data.data);
          }
        })
        .catch(console.error);

      fetch(`/api/analytics?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));

      fetchKnowledge();
    }
  }, [session, status, router]);

  const fetchKnowledge = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/knowledge?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setKnowledgeItems(data.data);
    } catch (e) {
      console.error("Failed to fetch knowledge");
    }
  };

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

  const handleInjectKnowledge = async () => {
    if (!knowledgeText.trim() || !session?.user?.email) return;
    setIsInjecting(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, text: knowledgeText })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Knowledge successfully embedded into AI Brain!");
        setKnowledgeText("");
        fetchKnowledge();
      } else {
        alert("Failed to inject knowledge: " + data.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsInjecting(false);
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    const receiptContent = `
=========================================
    CLAWLINK INC. - OFFICIAL RECEIPT
=========================================
Invoice ID    : ${invoice.razorpay_order_id || invoice.id}
Date          : ${new Date(invoice.created_at).toLocaleString()}
Customer      : ${invoice.email}

-----------------------------------------
Plan Subscribed: ${invoice.plan_name?.toUpperCase() || 'UNKNOWN'}
Total Amount   : ${invoice.amount} ${invoice.currency?.toUpperCase() || 'USD'}
Payment Status : ${invoice.status?.toUpperCase() || 'PAID'}
-----------------------------------------

Thank you for choosing ClawLink Enterprise AI.
=========================================
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ClawLink_Receipt_${invoice.razorpay_order_id || 'Latest'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#111111] flex flex-col items-center justify-center text-orange-500 font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        LOADING COMMAND CENTER...
      </div>
    );
  }

  // 🚀 UI LOGIC CALCULATIONS
  const currentPlan = userData?.plan?.toLowerCase() || "starter";
  const isPremium = currentPlan === "pro" || currentPlan === "max";
  const showTokens = !isPremium; 
  const usagePercentage = isPremium ? 100 : Math.min(((stats?.tokensUsed || 0) / (stats?.tokensAllocated || 1)) * 100, 100);
  const totalMsgs = (stats?.platformStats?.whatsapp || 0) + (stats?.platformStats?.telegram || 0) + (stats?.platformStats?.web || 0);

  // Model Display Logic
  const getModelDisplayName = (modelStr: string) => {
    if (!modelStr) return "NOT SET";
    if (modelStr.includes("gpt")) return "GPT-5.2 Turbo";
    if (modelStr.includes("claude")) return "Claude Opus 4.6";
    if (modelStr.includes("gemini")) return "Gemini 3 Flash";
    return modelStr.toUpperCase();
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans relative selection:bg-orange-500/30 overflow-y-auto custom-scrollbar flex flex-col">
      
      {/* 🌇 CINEMATIC SUNSET GLOW EFFECT */}
      <div className="fixed top-[-10%] right-[0%] w-[600px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[0%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#111]/50 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}. Your AI fleet is active.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/widget?email=${session?.user?.email}`)}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:scale-105"
          >
            <Bot className="w-4 h-4" /> Open Live Bot <ExternalLink className="w-3 h-3 ml-1" />
          </button>
          <div className="hidden md:flex items-center bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search chats..." className="bg-transparent border-none outline-none text-sm ml-2 text-white placeholder-gray-600 w-32 font-mono" />
          </div>
          <button className="relative p-2.5 bg-[#1A1A1A] border border-white/10 rounded-full hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#111]"></span>
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full relative z-10 flex-1">
        
        <AnimatePresence>
          {showAppBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
            >
              <div className="flex items-center gap-3 text-blue-200 text-sm font-medium">
                <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p>For the best experience, click <strong className="text-white">"Add to Home Screen"</strong> in your browser menu to install the ClawLink Web App.</p>
              </div>
              <button onClick={() => setShowAppBanner(false)} className="text-gray-400 hover:text-white flex-shrink-0 bg-white/5 p-2 rounded-full">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚀 OVERVIEW: PLAN & MODEL INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl flex justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</h3>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-black text-white font-serif uppercase tracking-wide">{currentPlan}</p>
                {isPremium && (
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                    <Crown className="w-3 h-3"/> Unlimited
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 relative z-10">
              <Receipt className="w-6 h-6"/>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl flex justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active AI Model</h3>
              <p className="text-2xl font-black text-white font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                {getModelDisplayName(stats?.activeModel || userData?.selectedModel)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 relative z-10">
              <BrainCircuit className="w-6 h-6"/>
            </div>
          </motion.div>
        </div>

        {/* 🚀 DATA ANALYTICS: METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><Zap className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">API Tokens</span>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">
              {showTokens ? (stats?.tokensUsed?.toLocaleString() || 0) : <span className="text-2xl text-orange-400">∞</span>}
            </h3>
            <p className="text-xs text-gray-400 mt-1 relative z-10">
              {showTokens ? `/ ${stats?.tokensAllocated} Used` : "Unlimited Requests Available"}
            </p>
            {showTokens && (
              <div className="w-full bg-[#1A1A1A] h-1.5 mt-4 rounded-full overflow-hidden relative z-10">
                <div className={`h-full bg-orange-500`} style={{ width: `${usagePercentage}%` }}></div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20"><Users className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Leads</span>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">{stats?.totalLeads?.toLocaleString() || 0}</h3>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1 relative z-10"><ArrowUpRight className="w-3 h-3"/> Captured Automatically</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><MessageSquare className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Traffic</span>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">{totalMsgs.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1 relative z-10">Messages Processed</p>
          </motion.div>
        </div>

        {/* 🚀 DATA ANALYTICS: CHARTS & ROUTING */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-[#1C1C1E] border border-white/5 p-6 md:p-8 rounded-[1.5rem] shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">AI Traffic (Last 7 Days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#f97316', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="messages" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bg-[#1C1C1E] border border-white/5 p-6 md:p-8 rounded-[1.5rem] shadow-xl flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Platform Routing</h3>
            <div className="flex-1 flex flex-col justify-center gap-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> WhatsApp</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.whatsapp || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${((stats?.platformStats?.whatsapp || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Telegram</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.telegram || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${((stats?.platformStats?.telegram || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Web Widget</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.web || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${((stats?.platformStats?.web || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 🚀 AI SETTINGS (PROMPT & RAG) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[#1C1C1E] border border-white/5 rounded-[1.5rem] p-8 shadow-2xl relative flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2 tracking-wide flex items-center gap-2">🤖 AI Persona Configuration</h3>
            <p className="text-sm text-gray-400 mb-6">Define exactly how your AI agent should behave, speak, and respond to users.</p>
            <textarea rows={6} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="e.g., You are a friendly customer support agent for ClawLink. Always answer in Hinglish..." className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] focus:outline-none transition-all resize-none mb-6 font-mono custom-scrollbar" />
            <div className="flex justify-end mt-auto">
              <button onClick={handleSavePrompt} disabled={isSavingPrompt} className="bg-white text-black px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100">
                {isSavingPrompt ? "Saving..." : <><Save className="w-4 h-4"/> Save Persona</>}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-[#1C1C1E] border border-green-500/20 rounded-[1.5rem] p-8 shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><BrainCircuit className="w-32 h-32 text-green-500" /></div>
            <h3 className="text-lg font-bold text-green-400 mb-2 tracking-wide flex items-center gap-2 relative z-10">🧠 Custom Knowledge Base (RAG)</h3>
            <p className="text-sm text-gray-400 mb-6 relative z-10">Train your AI with your specific business data. Paste product details, FAQs, or policies below to convert them into vectors.</p>
            <textarea rows={4} value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)} placeholder="Paste your business information here..." className="w-full bg-black/50 border border-green-500/30 rounded-xl p-4 text-sm text-green-100 focus:border-green-400 focus:shadow-[0_0_15px_rgba(34,197,94,0.2)] focus:outline-none transition-all resize-none mb-4 font-mono placeholder:text-green-900/50 relative z-10 custom-scrollbar" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Database className="w-3 h-3"/> Encrypted in Vector DB</p>
              <button onClick={handleInjectKnowledge} disabled={isInjecting || !knowledgeText.trim()} className="bg-green-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:scale-100">
                {isInjecting ? "Injecting..." : <><Zap className="w-4 h-4"/> Inject Knowledge</>}
              </button>
            </div>
            {knowledgeItems.length > 0 && (
              <div className="mt-auto border-t border-white/10 pt-6 relative z-10">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Active Memory Blocks</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                  {knowledgeItems.map((item, idx) => (
                    <div key={item.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-start gap-3 hover:border-green-500/30 transition-colors">
                      <span className="text-green-500 text-xs mt-0.5 font-mono">[{idx + 1}]</span>
                      <p className="text-xs text-gray-300 font-mono line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

        </div>

        {/* 🚀 BILLING & INVOICES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-[#1C1C1E] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-white" />
              <h3 className="text-lg font-serif text-white tracking-wide">Billing & Invoices</h3>
            </div>
          </div>
          {billingHistory.length === 0 ? (
            <div className="text-center p-12 bg-black/20">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"><Receipt className="w-5 h-5 text-gray-500"/></div>
              <p className="text-gray-400 text-sm font-medium">No past payments found. Deploy an agent to generate an invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#111] text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5">
                  <tr>
                    <th className="p-5 pl-8">Order Date</th>
                    <th className="p-5">Plan Name</th>
                    <th className="p-5">Amount</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 pr-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {billingHistory.map((invoice, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-8 font-mono text-gray-400">{new Date(invoice.created_at).toLocaleDateString()}</td>
                      <td className="p-5 font-bold text-white uppercase">{invoice.plan_name}</td>
                      <td className="p-5">{invoice.amount} {invoice.currency}</td>
                      <td className="p-5"><span className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{invoice.status}</span></td>
                      <td className="p-5 pr-8 text-right"><button onClick={() => handleDownloadInvoice(invoice)} className="text-gray-500 group-hover:text-white flex items-center justify-end gap-2 ml-auto text-xs font-bold uppercase tracking-widest transition-colors"><Download className="w-4 h-4"/> PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}