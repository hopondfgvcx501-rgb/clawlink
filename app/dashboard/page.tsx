"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Database, Zap, Save, 
  Receipt, Download, Smartphone, BrainCircuit, 
  MessageSquare, Search, Bell, ChevronDown 
} from "lucide-react";
import { useRouter } from "next/navigation";

// 🚀 HELPER FUNCTION: AI Provider ka naam aur badge dynamically set karne ke liye
const formatAIProvider = (provider: string, model: string) => {
  if (!provider || !model) return { name: "Google", badge: "Gemini Flash" };
  const p = provider.toLowerCase();
  const m = model.toLowerCase();
  
  let pName = "Google";
  if (p === "openai") pName = "OpenAI";
  if (p === "anthropic") pName = "Anthropic";

  let mName = model;
  if (m.includes("gpt-4")) mName = "GPT-4 Turbo";
  if (m.includes("gpt-3.5")) mName = "GPT-3.5";
  if (m.includes("claude-3-opus")) mName = "Claude 3 Opus";
  if (m.includes("claude-3-sonnet")) mName = "Claude 3 Sonnet";
  if (m.includes("gemini-1.5-pro") || m.includes("gemini-pro")) mName = "Gemini Pro";
  if (m.includes("gemini-1.5-flash") || m.includes("gemini-3-flash") || m.includes("flash")) mName = "Gemini Flash";

  return { name: pName, badge: mName };
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 🚀 CORE STATES
  const [userData, setUserData] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
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
      // Fetch User Config
      fetch(`/api/user?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserData(data.data);
            setSystemPrompt(data.data.systemPrompt || "");
          }
        })
        .catch(console.error);

      // Fetch Billing
      fetch(`/api/billing?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBillingHistory(data.data);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));

      // Fetch Existing Knowledge Base
      fetchKnowledge();
    }
  }, [session, status, router]);

  const fetchKnowledge = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/knowledge?email=${session.user.email}`);
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
        fetchKnowledge(); // Refresh the list
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
      <div className="w-full h-screen bg-[#111111] flex items-center justify-center text-white">
        <Activity className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // 🚀 SMART UI LOGIC FOR TOKENS (DYNAMIC CHECK)
  const isUnlimitedPlan = userData?.is_unlimited || userData?.plan?.toLowerCase() === "max";
  const usagePercentage = Math.min(((userData?.tokensUsed || 0) / (userData?.tokensAllocated || 1)) * 100, 100);

  return (
    <div className="w-full min-h-screen bg-[#111111] text-[#EDEDED] font-sans relative selection:bg-orange-500/30 overflow-y-auto custom-scrollbar flex flex-col">
      
      {/* 🌇 CINEMATIC SUNSET GLOW EFFECT */}
      <div className="fixed top-[-10%] left-[20%] w-[600px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#111]/50 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-serif text-white tracking-tight">Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}</h1>
          <p className="text-sm text-gray-400 mt-1">Here is what's happening with your OpenClaw instance today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search chats, numbers..." className="bg-transparent border-none outline-none text-sm ml-2 text-white placeholder-gray-600 w-48 font-mono" />
          </div>
          <button className="relative p-2 bg-[#1A1A1A] border border-white/10 rounded-full hover:bg-white/10 transition-colors">
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

        {/* 🚀 STATS GRID (DYNAMIC LOGIC ADDED HERE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CARD 1: PLAN */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20"><MessageSquare className="w-5 h-5"/></div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Active</span>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Instance Plan</h3>
            <p className="text-3xl font-black text-white font-serif relative z-10 uppercase tracking-wide">{userData?.plan || "Starter"}</p>
          </motion.div>

          {/* CARD 2: API USAGE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><Zap className="w-5 h-5"/></div>
              <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded border border-orange-400/20 font-mono">
                {!isUnlimitedPlan ? `${usagePercentage.toFixed(1)}% Used` : "Premium"}
              </span>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">API Usage</h3>
            <p className="text-3xl font-black text-white font-serif relative z-10">
              {!isUnlimitedPlan ? (
                <>
                  {userData?.tokensUsed?.toLocaleString() || 0}
                  <span className="text-sm text-gray-500 font-sans font-medium"> / {userData?.tokensAllocated?.toLocaleString()} msg</span>
                </>
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-500">Unlimited</span>
              )}
            </p>
            {!isUnlimitedPlan && (
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-4 relative z-10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${usagePercentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-orange-500'}`}/>
              </div>
            )}
          </motion.div>

          {/* CARD 3: AI PROVIDER */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#1C1C1E] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20"><Activity className="w-5 h-5"/></div>
              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Live</span>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">AI Provider</h3>
            <p className="text-2xl font-bold text-white capitalize flex items-center gap-2 mt-1 relative z-10">
              {formatAIProvider(userData?.ai_provider || "", userData?.ai_model || "").name} 
              <span className="text-sm text-gray-500 font-medium font-sans truncate">
                ({formatAIProvider(userData?.ai_provider || "", userData?.ai_model || "").badge})
              </span>
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 🚀 AI PERSONA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#1C1C1E] border border-white/5 rounded-[1.5rem] p-8 shadow-2xl relative flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2 tracking-wide flex items-center gap-2">
              🤖 AI Persona Configuration
            </h3>
            <p className="text-sm text-gray-400 mb-6">Define exactly how your AI agent should behave, speak, and respond to users.</p>
            
            <textarea 
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="e.g., You are a friendly customer support agent for ClawLink. Always answer in Hinglish..."
              className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] focus:outline-none transition-all resize-none mb-6 font-mono custom-scrollbar"
            />
            
            <div className="flex justify-end mt-auto">
              <button 
                onClick={handleSavePrompt}
                disabled={isSavingPrompt}
                className="bg-white text-black px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100"
              >
                {isSavingPrompt ? "Saving..." : <><Save className="w-4 h-4"/> Save Persona</>}
              </button>
            </div>
          </motion.div>

          {/* 🚀 ENTERPRISE KNOWLEDGE BASE (RAG) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#1C1C1E] border border-green-500/20 rounded-[1.5rem] p-8 shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <BrainCircuit className="w-32 h-32 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-green-400 mb-2 tracking-wide flex items-center gap-2 relative z-10">
              🧠 Custom Knowledge Base (RAG)
            </h3>
            <p className="text-sm text-gray-400 mb-6 relative z-10">Train your AI with your specific business data. Paste product details, FAQs, or policies below to convert them into vectors.</p>
            
            <textarea 
              rows={4}
              value={knowledgeText}
              onChange={(e) => setKnowledgeText(e.target.value)}
              placeholder="Paste your business information here... e.g., 'Our standard delivery time is 3-5 business days...'"
              className="w-full bg-black/50 border border-green-500/30 rounded-xl p-4 text-sm text-green-100 focus:border-green-400 focus:shadow-[0_0_15px_rgba(34,197,94,0.2)] focus:outline-none transition-all resize-none mb-4 font-mono placeholder:text-green-900/50 relative z-10 custom-scrollbar"
            />
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Database className="w-3 h-3"/> Encrypted in Vector DB</p>
              <button 
                onClick={handleInjectKnowledge}
                disabled={isInjecting || !knowledgeText.trim()}
                className="bg-green-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:scale-100"
              >
                {isInjecting ? "Injecting..." : <><Zap className="w-4 h-4"/> Inject Knowledge</>}
              </button>
            </div>

            {/* Display Injected Knowledge */}
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#1C1C1E] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-white" />
              <h3 className="text-lg font-serif text-white tracking-wide">Billing & Invoices</h3>
            </div>
            <button className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
              View All <ChevronDown className="w-3 h-3 -rotate-90"/>
            </button>
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
                      <td className="p-5">
                        <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <button 
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-gray-500 group-hover:text-white flex items-center justify-end gap-2 ml-auto text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          <Download className="w-4 h-4"/> PDF
                        </button>
                      </td>
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