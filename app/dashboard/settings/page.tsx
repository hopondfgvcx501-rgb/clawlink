"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: GLOBAL SETTINGS & AI IDENTITY COMMAND CENTER
 * ==============================================================================================
 * @file app/dashboard/settings/page.tsx
 * @description Centralized settings for AI Personality, JSONB Database mapping, API keys 
 * for 3 Channels (Telegram, WhatsApp, Instagram), Team Access, and Billing.
 * FIXED: Removed all invisible formatting errors and added real DB synchronization.
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
  Database, Zap, Cpu, Smartphone, Server, Sliders, Briefcase, Camera
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function SettingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('ai_config');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 🔥 UPGRADED: 100% Real Global State (No fake data)
  const [config, setConfig] = useState({
    telegramToken: "",
    whatsappToken: "",
    whatsappPhoneId: "",
    instagramToken: "",
    instagramAccountId: "",
    knowledgeBase: "",
    
    // 🧠 AI IDENTITY ENGINE (Mapped to DB)
    companyName: "",
    botName: "",
    industry: "",
    tone: "professional",
    fallbackMode: "redirect_sales",
    allowedTopics: "",
    
    // 🎛️ PERSONALITY JSONB CONFIG
    humorLevel: 50,
    salesAggressiveness: 50,
    emojiUsage: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
        router.push("/");
    }
  }, [status, router]);

  // 🚀 Fetch Existing Real Configuration from DB
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
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
            }));
          }
          setIsLoading(false);
        })
        .catch((err) => {
            console.error("🚨 Failed to load settings:", err);
            setIsLoading(false);
        });
    }
  }, [session, status]);

  // 🚀 Save Real Configuration to DB
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
      if (data.success) {
        alert("🔒 Enterprise AI Identity & APIs securely synced to Real DB!");
      } else {
        alert("🚨 Update failed: " + data.error);
      }
    } catch (error) {
      alert("⚠️ Network error occurred while saving configuration.");
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
    { id: 'ai_config', label: 'AI Identity Engine', icon: <Cpu className="w-4 h-4"/>, color: "text-purple-400", border: "border-purple-500" },
    { id: 'api_keys', label: '3-Channel Connections', icon: <Key className="w-4 h-4"/>, color: "text-blue-400", border: "border-blue-500" },
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
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Securing..." : "Save Changes"}
                </button>
              </div>

              {/* 🧠 TAB 1: AI IDENTITY ENGINE */}
              {activeTab === 'ai_config' && (
                <div className="space-y-8">
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-purple-400 flex items-center gap-2 mb-6 uppercase tracking-widest">
                      <Briefcase className="w-4 h-4"/> Brand Core
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Company Name</label>
                        <input type="text" value={config.companyName} onChange={(e) => setConfig({...config, companyName: e.target.value})} placeholder="e.g., Pizza Hut"
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bot Name</label>
                        <input type="text" value={config.botName} onChange={(e) => setConfig({...config, botName: e.target.value})} placeholder="e.g., Luigi"
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Industry / Context</label>
                        <input type="text" value={config.industry} onChange={(e) => setConfig({...config, industry: e.target.value})} placeholder="e.g., Food Delivery Service"
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-orange-400 flex items-center gap-2 mb-6 uppercase tracking-widest">
                      <Sliders className="w-4 h-4"/> Personality Engine
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Speaking Tone</label>
                        <select value={config.tone} onChange={(e) => setConfig({...config, tone: e.target.value})}
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-orange-500/50 transition-colors appearance-none">
                          <option value="professional">Strictly Professional</option>
                          <option value="friendly">Warm & Friendly</option>
                          <option value="funny">Humorous & Casual</option>
                          <option value="empathetic">Empathetic Support</option>
                          <option value="energetic">Energetic Hype</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-[#0A0A0D] border border-white/10 rounded-xl mt-6">
                        <span className="text-[12px] font-bold text-gray-300">Allow Emojis 🚀</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={config.emojiUsage} onChange={(e) => setConfig({...config, emojiUsage: e.target.checked})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-blue-400 flex items-center gap-2 mb-6 uppercase tracking-widest">
                      <Shield className="w-4 h-4"/> Guardrails & Fallbacks
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Out-of-Scope Behavior</label>
                        <select value={config.fallbackMode} onChange={(e) => setConfig({...config, fallbackMode: e.target.value})}
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white outline-none focus:border-blue-500/50 transition-colors appearance-none">
                          <option value="redirect_sales">Smoothly Redirect to Sales (Recommended)</option>
                          <option value="hard_reject">Polite Hard Rejection</option>
                        </select>
                      </div>
                      <div className="pt-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">
                          <Database className="w-4 h-4"/> Custom Knowledge Base (RAG)
                        </label>
                        <textarea 
                          value={config.knowledgeBase}
                          onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                          placeholder="Paste your business details, menu, or FAQs here..."
                          className="w-full h-[150px] bg-[#0A0A0D] border border-white/10 rounded-xl p-4 text-[13px] text-white outline-none focus:border-blue-500/50 transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔑 TAB 2: API CONNECTIONS (3 CHANNELS) */}
              {activeTab === 'api_keys' && (
                <div className="space-y-8">
                  {/* Telegram */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-white flex items-center gap-2 mb-6">
                      <Server className="w-5 h-5 text-[#2AABEE]"/> 1. Telegram Platform
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Bot Token</label>
                        <input type="password" value={config.telegramToken} onChange={(e) => setConfig({...config, telegramToken: e.target.value})} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
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

                  {/* WhatsApp */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-white flex items-center gap-2 mb-6">
                      <Smartphone className="w-5 h-5 text-[#25D366]"/> 2. WhatsApp Cloud API
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Permanent Access Token</label>
                        <input type="password" value={config.whatsappToken} onChange={(e) => setConfig({...config, whatsappToken: e.target.value})} placeholder="EAAGm0..."
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#25D366]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">WhatsApp Phone ID</label>
                        <input type="text" value={config.whatsappPhoneId} onChange={(e) => setConfig({...config, whatsappPhoneId: e.target.value})} placeholder="104XXXXXXX"
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#25D366]/50 transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Webhook URL (Read Only)</label>
                        <div className="flex items-center gap-2">
                          <input readOnly value="https://clawlinkai.com/api/webhook/whatsapp" className="flex-1 bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-gray-400 font-mono outline-none" />
                          <button onClick={() => copyToClipboard('https://clawlinkai.com/api/webhook/whatsapp')} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"><Copy className="w-4 h-4 text-gray-300"/></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="bg-[#111114] border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-[14px] font-black text-white flex items-center gap-2 mb-6">
                      <Camera className="w-5 h-5 text-[#E1306C]"/> 3. Instagram Graph API
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">IG Access Token</label>
                        <input type="password" value={config.instagramToken} onChange={(e) => setConfig({...config, instagramToken: e.target.value})} placeholder="IGQ..."
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#E1306C]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">IG Account ID</label>
                        <input type="text" value={config.instagramAccountId} onChange={(e) => setConfig({...config, instagramAccountId: e.target.value})} placeholder="178414XXXXXXX"
                          className="w-full bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-white font-mono outline-none focus:border-[#E1306C]/50 transition-colors" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Webhook URL (Read Only)</label>
                        <div className="flex items-center gap-2">
                          <input readOnly value="https://clawlinkai.com/api/webhook/instagram" className="flex-1 bg-[#0A0A0D] border border-white/10 p-3.5 rounded-xl text-[13px] text-gray-400 font-mono outline-none" />
                          <button onClick={() => copyToClipboard('https://clawlinkai.com/api/webhook/instagram')} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"><Copy className="w-4 h-4 text-gray-300"/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 💳 TAB 3 & 4 (Unchanged) */}
              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-[#111114] to-[#1A1A1E] border border-green-500/20 p-8 rounded-3xl relative overflow-hidden">
                    <p className="text-4xl font-black text-white mb-8">NEXUS <span className="text-xl text-gray-500 font-medium">/ $89/mo</span></p>
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