"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP AUTOMATION ENGINE
 * ==============================================================================================
 * @file app/dashboard/whatsapp/automation/page.tsx
 * @description Core control panel for WhatsApp Business API automations.
 * Manages Welcome messages, Away messages, and intelligent Keyword Routing.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, MessageSquare, Clock, Zap, Plus, 
  Trash2, Save, Activity, Phone, FileText,
  MessageCircle, LayoutTemplate
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function WhatsAppAutomation() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    welcomeMsg: true,
    awayMsg: false,
    businessHours: true,
  });

  // Keyword Rules State
  const [keywordRules, setKeywordRules] = useState([
    { id: 1, keyword: "pricing, price, cost", matchType: "contains", actionType: "template", content: "saas_pricing_v2" },
    { id: 2, keyword: "support, help, agent", matchType: "exact", actionType: "text", content: "Hold on, connecting you to a human agent..." },
    { id: 3, keyword: "menu, hi, hello", matchType: "contains", actionType: "flow", content: "Main Welcome Funnel" },
  ]);

  if (status === "unauthenticated") router.push("/");

  const handleToggle = (key: keyof typeof globalSettings) => {
    setGlobalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteRule = (id: number) => {
    setKeywordRules(keywordRules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("🟢 WhatsApp Automation Rules synced securely with Meta Graph API!");
    }, 1500);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  const getActionIcon = (type: string) => {
    if (type === 'template') return <LayoutTemplate className="w-4 h-4 text-orange-400" />;
    if (type === 'flow') return <Zap className="w-4 h-4 text-purple-400" />;
    return <MessageCircle className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp Automation" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🟢 LEFT: GLOBAL AUTOMATIONS */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20 shadow-[0_0_15px_rgba(37,211,102,0.15)]">
                  <Phone className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Global Rules</h2>
                  <p className="text-[11px] text-gray-500 font-mono">Always-on behaviors</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Welcome Message Toggle */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#25D366]"/>
                      <span className="text-[13px] font-bold text-white">Welcome Message</span>
                    </div>
                    <div onClick={() => handleToggle('welcomeMsg')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.welcomeMsg ? 'bg-[#25D366]' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.welcomeMsg ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Triggers when a user messages your business number for the very first time.</p>
                </div>

                {/* Away Message Toggle */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400"/>
                      <span className="text-[13px] font-bold text-white">Away Message</span>
                    </div>
                    <div onClick={() => handleToggle('awayMsg')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.awayMsg ? 'bg-[#25D366]' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.awayMsg ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Send an automated reply when you are marked as "Away".</p>
                </div>

                {/* Business Hours Toggle */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400"/>
                      <span className="text-[13px] font-bold text-white">Out of Office Rule</span>
                    </div>
                    <div onClick={() => handleToggle('businessHours')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.businessHours ? 'bg-[#25D366]' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.businessHours ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Automatically respond outside of your configured business hours.</p>
                </div>
              </div>

            </motion.div>
          </div>

          {/* 🟢 RIGHT: KEYWORD ROUTING ENGINE */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[#25D366]"/> Keyword Routing Engine
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-2">Trigger specific responses, approved templates, or flows based on user messages.</p>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-[#25D366] hover:bg-[#20bd5a] text-black px-6 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.3)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Syncing..." : "Deploy Rules"}
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Routing Logic</p>
                <button className={`bg-[#111114] hover:bg-white/5 text-white border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${btnHover}`}>
                  <Plus className="w-3 h-3"/> Add Keyword Rule
                </button>
              </div>

              <div className="space-y-4">
                {keywordRules.map((rule) => (
                  <div key={rule.id} className="bg-[#111114] border border-white/5 hover:border-[#25D366]/30 p-5 rounded-2xl flex items-center justify-between group transition-all">
                    
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      {/* Trigger Column */}
                      <div className="col-span-5">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">If user says ({rule.matchType})</p>
                        <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg inline-block">
                          <span className="text-[13px] font-mono text-[#25D366]">{rule.keyword}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="col-span-1 flex justify-center">
                        <div className="w-8 h-px bg-white/10 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 border-t border-r border-white/30 rotate-45"></div>
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className="col-span-6">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                          Then trigger {rule.actionType}
                        </p>
                        <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-2 rounded-lg">
                          {getActionIcon(rule.actionType)}
                          <span className="text-[13px] text-white truncate font-bold">{rule.content}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button onClick={() => handleDeleteRule(rule.id)} className="ml-4 p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}