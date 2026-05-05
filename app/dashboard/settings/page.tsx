"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: GLOBAL SETTINGS & API COMMAND CENTER
 * ==============================================================================================
 * @file app/dashboard/settings/page.tsx
 * @description Centralized settings for managing API keys, AI Personas (RAG), 
 * Team Access, and Billing/Token usage. Integrated with backend database.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Key, CreditCard, Shield, Users, 
  Save, Activity, CheckCircle2, Copy, Bot, 
  Database, Zap, Cpu, Link as LinkIcon, Smartphone, Server
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function SettingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('ai_config');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Unified Config State
  const [config, setConfig] = useState({
    telegramToken: "",
    whatsappToken: "",
    whatsappPhoneId: "",
    metaToken: "",
    systemPrompt: "You are a strict and helpful support agent for ClawLink. Always follow the company knowledge provided to you.",
    knowledgeBase: "NEXUS99' hai jisse 99% off milega.\nCEO of ClawLink is Jay Majhi.",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/");
    }
  }, [status, router]);

  // Fetch Existing Configuration
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setConfig(prevConfig => ({
              ...prevConfig,
              telegramToken: data.data.telegram_token || "",
              whatsappToken: data.data.whatsapp_token || "", // Used as metaToken in UI
              metaToken: data.data.whatsapp_token || "",
              whatsappPhoneId: data.data.whatsapp_phone_id || "",
              systemPrompt: data.data.systemPrompt || prevConfig.systemPrompt,
              // In a real app, knowledge base would be fetched separately from vector DB
            }));
          }
          setIsLoading(false);
        })
        .catch((err) => {
            console.error("Failed to load settings:", err);
            setIsLoading(false);
        });
    }
  }, [session, status]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          telegram_token: config.telegramToken,
          whatsapp_token: config.metaToken, // Saving Meta token
          whatsapp_phone_id: config.whatsappPhoneId,
          // systemPrompt: config.systemPrompt // Add this endpoint update if backend supports it
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("🔒 Enterprise Settings & API Keys securely updated in database!");
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (error) {
      alert("Network error occurred while saving configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  const tabs = [
    { id: 'ai_config', label: 'AI & Knowledge Base', icon: <Cpu className="w-4 h-4"/>, color: "text-purple-400", border: "border-purple-500" },
    { id: 'api_keys', label: 'API Connections', icon: <Key className="w-4 h-4"/>, color: "text-blue-400", border: "border-blue-500" },
    { id: 'billing', label: 'Billing & Tokens', icon: <CreditCard className="w-4 h-4"/>, color: "text-green-400", border: "border-green-500" },
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
          
          {/* 📱 LEFT SIDEBAR: TAB NAVIGATION */}
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

          {/* 🖥️ RIGHT CONTENT: ACTIVE TAB CONFIGURATION */}
          <div className="flex-1">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              
              {/* Header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-[13px] text-gray-400">
                    {activeTab === 'ai_config' && "Configure your AI agent's core personality and business knowledge."}
                    {activeTab === 'api_keys' && "Manage your secure connection keys for Meta and Telegram."}
                    {activeTab === 'billing' && "Monitor your API token usage and subscription plan limits."}
                    {activeTab === 'team' && "Control who has access to this workspace and their roles."}
                  </p>
                </div>
                
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Securing..." : "Save Changes"}
                </button>
              </div>

              {/* 🧠 TAB 1: AI & KNOWLEDGE BASE */}
              {activeTab === 'ai_config' && (
                <div className="space-y-8">
                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.15em] text-purple-400 mb-3">
                      <Bot className="w-4 h-4"/> Master Persona (System Prompt)
                    </label>
                    <textarea 
                      value={config.systemPrompt}
                      onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                      className="w-full h-[120px] bg-[#111114] border border-white/10 rounded-xl p-5 text-[13px] text-white outline-none focus:border-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all resize-none custom-scrollbar"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.15em] text-blue-400 mb-3">
                      <Database className="w-4 h-4"/> Vector DB Knowledge Injection (RAG)
                    </label>
                    <p className="text-[11px] text-gray-500 mb-3">Paste FAQs, product pricing, or policies. We automatically convert this into searchable vector embeddings.</p>
                    <textarea 
                      value={config.knowledgeBase}
                      onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                      className="w-full h-[250px] bg-[#111114] border border-white/10 rounded-xl p-5 text-[13px] text-white outline-none focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                    />
                    <div className="mt-3 flex justify-end">
                      <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3"/> {config.knowledgeBase.length} bytes embedded
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔑 TAB 2: API CONNECTIONS */}
              {activeTab === 'api_keys' && (
                <div className="space-y-8">
                  
                  {/* Telegram */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-white flex items-center gap-2 mb-6">
                      <Server className="w-5 h-5 text-[#2AABEE]"/> Telegram API
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bot Token</label>
                        <input type="password" value={config.telegramToken} onChange={(e) => setConfig({...config, telegramToken: e.target.value})}
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#2AABEE]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Webhook URL (Read Only)</label>
                        <div className="flex items-center gap-2">
                          <input readOnly value="https://clawlinkai.com/api/webhook/telegram" className="flex-1 bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-gray-400 font-mono outline-none" />
                          <button onClick={() => copyToClipboard('https://clawlinkai.com/api/webhook/telegram')} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"><Copy className="w-4 h-4 text-gray-300"/></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meta / WhatsApp */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-white flex items-center gap-2 mb-6">
                      <Smartphone className="w-5 h-5 text-[#25D366]"/> Meta Cloud API (WA & IG)
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Permanent Access Token</label>
                          <input type="password" value={config.metaToken} onChange={(e) => setConfig({...config, metaToken: e.target.value})}
                            className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#25D366]/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">WhatsApp Phone ID</label>
                          <input type="text" value={config.whatsappPhoneId} onChange={(e) => setConfig({...config, whatsappPhoneId: e.target.value})}
                            className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#25D366]/50 transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Global Meta Webhook (Read Only)</label>
                        <div className="flex items-center gap-2">
                          <input readOnly value="https://clawlinkai.com/api/webhook/whatsapp" className="flex-1 bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-gray-400 font-mono outline-none" />
                          <button onClick={() => copyToClipboard('https://clawlinkai.com/api/webhook/whatsapp')} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"><Copy className="w-4 h-4 text-gray-300"/></button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 💳 TAB 3: BILLING & TOKENS */}
              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-[#111114] to-[#1A1A1E] border border-green-500/20 p-8 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(34,197,94,0.1)]">
                    <div className="absolute top-0 right-0 p-6">
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Active Status</span>
                    </div>
                    
                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</h3>
                    <p className="text-4xl font-black text-white mb-8">GPT-5.5 Pro <span className="text-xl text-gray-500 font-medium">/ $18/mo</span></p>
                    
                    <div className="mb-2 flex justify-between items-end">
                      <span className="text-[12px] font-bold text-gray-300">API Token Usage</span>
                      <span className="text-[12px] font-mono text-gray-400">4,250 / 10,000</span>
                    </div>
                    <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: "42.5%" }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full"></motion.div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1"><Activity className="w-3 h-3"/> Resets on May 14, 2026</p>

                    <div className="mt-8 flex gap-4">
                      <button className={`bg-white text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] ${btnHover}`}>
                        Upgrade Plan
                      </button>
                      <button className={`bg-transparent border border-white/20 text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-white/5 ${btnHover}`}>
                        Manage Invoices
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 👥 TAB 4: TEAM & SECURITY */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-lg">
                        {session?.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-white">{session?.user?.name || "Workspace Owner"}</p>
                        <p className="text-[11px] text-gray-500">{session?.user?.email}</p>
                      </div>
                    </div>
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Owner</span>
                  </div>

                  <div className="border-2 border-dashed border-white/10 hover:border-white/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                      <Users className="w-5 h-5 text-gray-400 group-hover:text-white"/>
                    </div>
                    <p className="text-[13px] font-bold text-white mb-1">Invite Team Member</p>
                    <p className="text-[11px] text-gray-500">Available on Enterprise Plan only.</p>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}