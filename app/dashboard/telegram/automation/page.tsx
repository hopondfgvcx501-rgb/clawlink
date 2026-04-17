"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM AUTOMATION ENGINE
 * ==============================================================================================
 * @file app/dashboard/telegram/automation/page.tsx
 * @description Core control panel for Telegram Bot automations and Keyword routing.
 * 🚀 SECURED: Real-time PostgreSQL database sync. Removed mock arrays.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MessageSquare, Zap, Plus, Trash2, 
  Save, Activity, MessageCircle, Bot, Sparkles
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface KeywordRule {
  id: string;
  keyword: string;
  matchType: string;
  actionType: string;
  content: string;
}

export default function TelegramAutomations() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [globalSettings, setGlobalSettings] = useState({
    welcomeMessage: true,
    defaultFallback: true,
  });

  const [keywordRules, setKeywordRules] = useState<KeywordRule[]>([]);
  const [newRule, setNewRule] = useState({ keyword: "", matchType: "contains", actionType: "text", content: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE REAL-TIME FETCH
  useEffect(() => {
    const fetchRules = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=telegram&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          if (!res.ok) throw new Error("Fetch failed");
          const data = await res.json();
          if (data.success && data.rules) setKeywordRules(data.rules);
          if (data.success && data.settings) setGlobalSettings(data.settings);
        } catch (error) {
          console.error("Failed to load Telegram rules", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRules();
  }, [session, status]);

  const handleToggle = (key: keyof typeof globalSettings) => {
    setGlobalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddRule = () => {
      if (!newRule.keyword || !newRule.content) {
          alert("Keyword and Content are required.");
          return;
      }
      const tempId = `temp_tele_${Date.now()}`;
      setKeywordRules([...keywordRules, { id: tempId, ...newRule }]);
      setNewRule({ keyword: "", matchType: "contains", actionType: "text", content: "" });
  };

  const handleDeleteRule = (id: string) => {
    setKeywordRules(keywordRules.filter(r => r.id !== id));
  };

  // 🚀 SECURE SAVE TO DB
  const handleSave = async () => {
    if (!session?.user?.email) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              email: session.user.email,
              channel: "telegram",
              rules: keywordRules,
              settings: globalSettings
          })
      });

      const data = await res.json();
      if (data.success) {
          alert("✨ Telegram Automations Synced Live!");
          const refreshRes = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=telegram`);
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.rules) setKeywordRules(refreshData.rules);
      } else {
          alert("Failed to save rules: " + data.error);
      }
    } catch (error) {
        alert("Network error.");
    } finally {
        setIsSaving(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-[#2AABEE] font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        CONNECTING TELEGRAM ENGINE...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Automations" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: GLOBAL AUTOMATIONS */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                  <Bot className="w-6 h-6 text-[#2AABEE]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Global Rules</h2>
                  <p className="text-[11px] text-gray-500 font-mono">Always-on bot behaviors</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#2AABEE]"/>
                      <span className="text-[13px] font-bold text-white">Welcome Message</span>
                    </div>
                    <div onClick={() => handleToggle('welcomeMessage')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.welcomeMessage ? 'bg-[#2AABEE]' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.welcomeMessage ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Send a greeting when a user starts the bot for the first time.</p>
                </div>

                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400"/>
                      <span className="text-[13px] font-bold text-white">AI Fallback</span>
                    </div>
                    <div onClick={() => handleToggle('defaultFallback')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.defaultFallback ? 'bg-[#2AABEE]' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.defaultFallback ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Let AI Copilot handle unknown messages and queries dynamically.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: KEYWORD ROUTING ENGINE */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col min-h-[600px]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[#2AABEE]"/> Keyword Routing Engine
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-2">Trigger specific flows or text replies based on user messages.</p>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Syncing..." : "Deploy Rules"}
                </button>
              </div>

              <div className="bg-[#111114] border border-white/10 p-5 rounded-2xl mb-6 flex flex-wrap gap-4 items-end shadow-inner">
                  <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">If message</label>
                      <select title="Select match type" value={newRule.matchType} onChange={(e)=> setNewRule({...newRule, matchType: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/50">
                          <option value="contains">Contains</option>
                          <option value="exact">Is Exactly</option>
                      </select>
                  </div>
                  <div className="flex-[2] min-w-[200px]">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Keyword(s) - comma separated</label>
                      <input type="text" placeholder="e.g. pricing, support" value={newRule.keyword} onChange={(e)=> setNewRule({...newRule, keyword: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/50" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Then trigger</label>
                      <select title="Select action type" value={newRule.actionType} onChange={(e)=> setNewRule({...newRule, actionType: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/50">
                          <option value="text">Text Reply</option>
                          <option value="flow">Trigger Flow</option>
                      </select>
                  </div>
                  <div className="flex-[2] min-w-[200px]">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Content / Flow Name</label>
                      <input type="text" placeholder="Content to send..." value={newRule.content} onChange={(e)=> setNewRule({...newRule, content: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/50" />
                  </div>
                  <button title="Add rule" onClick={handleAddRule} className={`bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-lg text-sm font-bold transition-all ${btnHover}`}>
                      <Plus className="w-5 h-5" />
                  </button>
              </div>

              <div className="space-y-4 flex-1">
                {keywordRules.length === 0 ? (
                    <div className="text-center py-10">
                        <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No automation rules configured yet.</p>
                    </div>
                ) : keywordRules.map((rule) => (
                  <div key={rule.id} className="bg-[#111114] border border-white/5 hover:border-[#2AABEE]/30 p-5 rounded-2xl flex items-center justify-between group transition-all">
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">If user says ({rule.matchType})</p>
                        <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg inline-block">
                          <span className="text-[13px] font-mono text-[#2AABEE]">{rule.keyword}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <div className="w-8 h-px bg-white/10 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 border-t border-r border-white/30 rotate-45"></div>
                        </div>
                      </div>
                      <div className="col-span-6">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">Then trigger {rule.actionType}</p>
                        <div className="flex items-center gap-2 bg-black/30 border border-white/5 px-3 py-2 rounded-lg">
                          {rule.actionType === 'flow' ? <Zap className="w-4 h-4 text-purple-400" /> : <MessageCircle className="w-4 h-4 text-[#2AABEE]" />}
                          <span className="text-[13px] text-white truncate font-bold">{rule.content}</span>
                        </div>
                      </div>
                    </div>
                    <button title="Delete rule" onClick={() => handleDeleteRule(rule.id)} className="ml-4 p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}