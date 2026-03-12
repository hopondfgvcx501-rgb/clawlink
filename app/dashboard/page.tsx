"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Database, LogOut, ArrowUpRight, Zap, Save, Users, Receipt, Download, ExternalLink, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAppBanner, setShowAppBanner] = useState(true);
  
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
        })
        .catch(console.error);

      fetch(`/api/billing?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBillingHistory(data.data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch billing data:", err);
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
      
      {/* 🚀 WEB APP INSTALLATION BANNER */}
      <AnimatePresence>
        {showAppBanner && (
          <motion.div 
            key="app-banner" 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="max-w-6xl mx-auto mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-blue-200 text-sm font-medium">
              <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p>For the best experience, click <strong className="text-white">"Add to Home Screen"</strong> in your browser menu to install the ClawLink Web App.</p>
            </div>
            <button onClick={() => setShowAppBanner(false)} className="text-gray-400 hover:text-white flex-shrink-0">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="text-2xl font-bold tracking-wider font-mono">clawlink<span className="text-blue-500">.</span>dashboard</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={session?.user?.image || ""} alt="Profile" className="w-10 h-10 rounded-full border border-white/20" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-8">
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
                      {userData?.isUnlimited ? "Unlimited" : userData?.tokensUsed?.toLocaleString() || 0} 
                      <span className="text-sm text-gray-500 font-normal"> / {userData?.isUnlimited ? "∞" : userData?.tokensAllocated?.toLocaleString()} words</span>
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">Active Instances</h3>
            </div>

            <div className="space-y-4 mb-8">
              {userData?.telegramActive ? (
                <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✈️</span>
                    <div>
                      <p className="text-sm font-bold text-white">Telegram Bot</p>
                      <p className="text-xs text-blue-400">Online & Processing</p>
                    </div>
                  </div>
                  {userData?.liveBotLink && (
                    <a href={userData.liveBotLink} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      Open Telegram Bot <ExternalLink className="w-4 h-4"/>
                    </a>
                  )}
                </div>
              ) : null}

              {userData?.whatsappActive ? (
                <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-sm font-bold text-white">WhatsApp Cloud</p>
                      <p className="text-xs text-green-400">Online & Processing</p>
                    </div>
                  </div>
                  {userData?.liveBotLink && (
                    <a href={userData.liveBotLink} target="_blank" rel="noopener noreferrer" className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      Manage Meta App <ExternalLink className="w-4 h-4"/>
                    </a>
                  )}
                </div>
              ) : null}

              {!userData?.telegramActive && !userData?.whatsappActive && (
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3 opacity-50">
                  <p className="text-sm font-medium text-gray-500">No active instances found.</p>
                </div>
              )}
            </div>

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
        </div>

        {/* BILLING & INVOICES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">Billing & Invoices</h3>
          </div>

          {billingHistory.length === 0 ? (
            <div className="text-center p-8 bg-black/40 border border-white/5 rounded-2xl">
              <p className="text-gray-400 text-sm">No past payments found. Deploy a bot to generate an invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-black/50 text-xs uppercase font-bold text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="p-4 rounded-tl-xl">Order Date</th>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {billingHistory.map((invoice, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono">{new Date(invoice.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-white uppercase">{invoice.plan_name}</td>
                      <td className="p-4">{invoice.amount} {invoice.currency}</td>
                      <td className="p-4">
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-blue-400 hover:text-white flex items-center justify-end gap-2 ml-auto text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          <Download className="w-4 h-4"/> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </main>
    </div>
  );
}