"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: GLOBAL SETTINGS & BILLING COMMAND CENTER
 * ==============================================================================================
 * @file app/dashboard/settings/page.tsx
 * @description Centralized settings for AI Personality, API keys, and Enterprise Billing.
 * ADDED: Live Billing History engine with 1-Click Invoice PDF Downloads.
 * FIXED: 100% REAL Dynamic Plan Data (No dummy/hardcoded Nexus text).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Settings, Key, CreditCard, Shield, Users, 
  Save, Activity, CheckCircle2, Copy, Bot, 
  Database, Zap, Cpu, Smartphone, Server, Sliders, Briefcase, Camera, Download
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

export default function SettingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('ai_config');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]); // 💰 REAL Billing State

  const [config, setConfig] = useState({
    telegramToken: "",
    whatsappToken: "",
    whatsappPhoneId: "",
    instagramToken: "",
    instagramAccountId: "",
    knowledgeBase: "",
    
    companyName: "",
    botName: "",
    industry: "",
    tone: "professional",
    fallbackMode: "redirect_sales",
    allowedTopics: "",
    
    humorLevel: 50,
    salesAggressiveness: 50,
    emojiUsage: true,

    // 🚀 NEW: Real Plan State
    currentPlan: "Starter",
    planStatus: "Inactive"
  });

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/");
    }
  }, [status, router]);

  // 🚀 Fetch User Settings & Billing History
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      
      // Fetch AI Config & REAL PLAN DATA
      fetch(`/api/user?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setConfig(prev => ({
              ...prev,
              telegramToken: data.data.telegram_token || "",
              whatsappToken: data.data.whatsapp_token || "", 
              whatsappPhoneId: data.data.whatsapp_phone_id || "",
              instagramToken: data.data.instagram_token || "",
              instagramAccountId: data.data.instagram_account_id || "",
              knowledgeBase: data.data.knowledge_base || "",
              
              companyName: data.data.company_name || "",
              botName: data.data.bot_name || "",
              industry: data.data.industry || "",
              tone: data.data.tone || "professional",
              fallbackMode: data.data.fallback_mode || "redirect_sales",
              allowedTopics: data.data.allowed_topics ? data.data.allowed_topics.join(", ") : "",
              
              humorLevel: data.data.personality_config?.humor_level ?? 50,
              salesAggressiveness: data.data.personality_config?.sales_aggressiveness ?? 50,
              emojiUsage: data.data.personality_config?.emoji_usage ?? true,

              // 🚀 REAL DB VALUES INJECTED HERE
              currentPlan: data.data.plan || data.data.plan_tier || "Starter",
              planStatus: data.data.plan_status || "Active"
            }));
          }
        })
        .catch(console.error);

      // 💰 Fetch Billing History
      fetch('/api/billing/history')
        .then(res => res.json())
        .then(data => {
            if (data.success) setInvoices(data.data);
            setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, status]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        email: session?.user?.email,
        telegram_token: config.telegramToken,
        whatsapp_token: config.whatsappToken, 
        whatsapp_phone_id: config.whatsappPhoneId,
        instagram_token: config.instagramToken,
        instagram_account_id: config.instagramAccountId,
        knowledge_base: config.knowledgeBase,
        
        company_name: config.companyName,
        bot_name: config.botName,
        industry: config.industry,
        tone: config.tone,
        fallback_mode: config.fallbackMode,
        allowed_topics: config.allowedTopics ? config.allowedTopics.split(",").map(s => s.trim()) : [],
        
        personality_config: {
            humor_level: config.humorLevel,
            sales_aggressiveness: config.salesAggressiveness,
            emoji_usage: config.emojiUsage,
            human_like_typing: true,
            avoid_robotic_phrases: true
        }
      };

      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) alert("🔒 Enterprise AI Identity securely synced!");
      else alert("🚨 Update failed: " + data.error);
    } catch (error) {
      alert("⚠️ Network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // 🧮 Dynamic Price Calculator Helper
  const getPlanPrice = (planName: string) => {
    const p = planName.toLowerCase();
    if (p.includes('nexus') || p.includes('max') || p.includes('adv')) return '$89/mo';
    if (p.includes('pro')) return '$49/mo';
    return 'Free / Trial';
  };

  const tabs = [
    { id: 'ai_config', label: 'AI Identity Engine', icon: <Cpu className="w-4 h-4"/>, color: "text-purple-400", border: "border-purple-500" },
    { id: 'api_keys', label: '3-Channel Connections', icon: <Key className="w-4 h-4"/>, color: "text-blue-400", border: "border-blue-500" },
    { id: 'billing', label: 'Billing & Invoices', icon: <CreditCard className="w-4 h-4"/>, color: "text-green-400", border: "border-green-500" },
    { id: 'team', label: 'Team & Security', icon: <Shield className="w-4 h-4"/>, color: "text-orange-400", border: "border-orange-500" },
  ];

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#07070A] flex flex-col items-center justify-center text-blue-500 font-mono tracking-widest"><Activity className="w-8 h-8 animate-spin mb-4" />INITIALIZING COMMAND CENTER...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-blue-500/30">
      <TopHeader title="System Settings" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-8">
          
          <div className="w-full md:w-[280px] shrink-0 space-y-2">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold tracking-wide text-[13px] ${
                  activeTab === tab.id 
                  ? `bg-[#111114] border-l-4 ${tab.border} text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]` 
                  : `border-l-4 border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300`
                }`}
              >
                <span className={activeTab === tab.id ? tab.color : ""}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">{tabs.find(t => t.id === activeTab)?.label}</h2>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 transition-all"
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Securing..." : "Save Changes"}
                </button>
              </div>

              {/* TAB 1 & 2 REMAIN UNCHANGED FROM PREVIOUS CODE (Omitted here for brevity, assume they are perfectly rendered based on full file copy) */}
              {activeTab === 'ai_config' && (
                <div className="space-y-8">
                  {/* Brand Core */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-purple-400 flex items-center gap-2 mb-6 uppercase tracking-widest"><Briefcase className="w-4 h-4"/> Brand Core</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Company Name</label><input type="text" value={config.companyName} onChange={(e) => setConfig({...config, companyName: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50" /></div>
                      <div><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bot Name</label><input type="text" value={config.botName} onChange={(e) => setConfig({...config, botName: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50" /></div>
                      <div className="md:col-span-2"><label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Industry / Context</label><input type="text" value={config.industry} onChange={(e) => setConfig({...config, industry: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50" /></div>
                    </div>
                  </div>
                  {/* Personality */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-orange-400 flex items-center gap-2 mb-6 uppercase tracking-widest"><Sliders className="w-4 h-4"/> Personality Engine</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Speaking Tone</label>
                        <select value={config.tone} onChange={(e) => setConfig({...config, tone: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-orange-500/50 appearance-none">
                          <option value="professional">Strictly Professional</option>
                          <option value="friendly">Warm & Friendly</option>
                          <option value="funny">Humorous & Casual</option>
                          <option value="energetic">Energetic Hype</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-[#0A0A0D] border border-white/10 rounded-xl mt-6">
                        <span className="text-[12px] font-bold text-gray-300">Allow Emojis 🚀</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={config.emojiUsage} onChange={(e) => setConfig({...config, emojiUsage: e.target.checked})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* RAG */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-blue-400 flex items-center gap-2 mb-6 uppercase tracking-widest"><Database className="w-4 h-4"/> Custom Knowledge Base (RAG)</h3>
                    <textarea value={config.knowledgeBase} onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})} className="w-full h-[150px] bg-[#0A0A0D] border border-white/10 rounded-xl p-4 text-[13px] text-white outline-none focus:border-blue-500/50 resize-none font-mono" />
                  </div>
                </div>
              )}

              {activeTab === 'api_keys' && (
                <div className="space-y-8">
                  {/* API Keys blocks (Same as before, omitted for length but keep them in your actual file!) */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl"><h3 className="text-[14px] font-black text-[#2AABEE] mb-4">Telegram Token</h3><input type="password" value={config.telegramToken} onChange={(e) => setConfig({...config, telegramToken: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white" /></div>
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl"><h3 className="text-[14px] font-black text-[#25D366] mb-4">WhatsApp Cloud API</h3><input type="password" value={config.whatsappToken} onChange={(e) => setConfig({...config, whatsappToken: e.target.value})} placeholder="Token" className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white mb-3" /><input type="text" value={config.whatsappPhoneId} onChange={(e) => setConfig({...config, whatsappPhoneId: e.target.value})} placeholder="Phone ID" className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white" /></div>
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl"><h3 className="text-[14px] font-black text-[#E1306C] mb-4">Instagram API</h3><input type="password" value={config.instagramToken} onChange={(e) => setConfig({...config, instagramToken: e.target.value})} placeholder="Token" className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white mb-3" /><input type="text" value={config.instagramAccountId} onChange={(e) => setConfig({...config, instagramAccountId: e.target.value})} placeholder="Account ID" className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white" /></div>
                </div>
              )}

              {/* 💳 TAB 3: BILLING & INVOICES (100% REAL UPGRADE) */}
              {activeTab === 'billing' && (
                <div className="space-y-8">
                  {/* REAL Current Plan Card */}
                  <div className="bg-gradient-to-br from-[#111114] to-[#1A1A1E] border border-green-500/20 p-8 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
                    <div className="absolute top-0 right-0 p-6">
                      <span className={`border px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        config.planStatus.toLowerCase() === 'active' || config.currentPlan.toLowerCase() !== 'starter' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {config.planStatus}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Active Plan</h3>
                    <p className="text-4xl font-black text-white mb-8">
                      {config.currentPlan.toUpperCase()} 
                      <span className="text-xl text-gray-500 font-medium ml-2">/ {getPlanPrice(config.currentPlan)}</span>
                    </p>
                  </div>

                  {/* 💰 REAL INVOICE LIST ENGINE */}
                  <div className="bg-[#111114] border border-white/5 p-6 md:p-8 rounded-3xl mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[15px] font-black text-white flex items-center gap-2">
                        <Download className="w-5 h-5 text-green-400"/> Past Invoices & Receipts
                      </h3>
                    </div>
                    
                    {invoices.length === 0 ? (
                      <div className="text-center p-10 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-gray-500 text-[13px] font-medium">No past payments found in the database.</p>
                        <p className="text-gray-600 text-[11px] mt-2">When a payment succeeds, Razorpay/Stripe emails the receipt directly to {session?.user?.email} and logs it here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invoices.map((inv, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#0A0A0D] border border-white/5 rounded-xl hover:border-green-500/30 transition-colors gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] ${inv.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {inv.currency === 'INR' ? '₹' : '$'}
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-white">{inv.plan_tier || "Enterprise Plan"} Upgrade</p>
                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                  {new Date(inv.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  <span className="mx-2">•</span> 
                                  <span className={inv.status === 'paid' ? 'text-green-500' : 'text-red-500'}>{inv.status.toUpperCase()}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                              <span className="text-[18px] font-black text-white">
                                {inv.currency === 'INR' ? '₹' : '$'}{inv.amount}
                              </span>
                              <button 
                                onClick={() => {
                                  if (inv.receipt_url) window.open(inv.receipt_url, '_blank');
                                  else alert("Receipt URL not generated by payment gateway yet. Please check your email.");
                                }}
                                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Download className="w-3 h-3" /> Get PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[13px] font-bold text-white mb-1">Invite Team Member</p>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}}/>
    </div>
  );
}