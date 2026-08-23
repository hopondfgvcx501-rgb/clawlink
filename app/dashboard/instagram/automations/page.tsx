"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM AUTO-DM & COMMENT AUTOMATION
 * ==============================================================================================
 * @file app/dashboard/instagram/automations/page.tsx
 * @description The Ultimate God-Mode Module. 
 * 🚀 UPGRADE: Injected Advanced Control Panel (Comment, DM, AI Handover Toggles).
 * 🚀 FIXED: Variables strictly mapped (keyword, dmContent, trigger_flags) to match Supabase API.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, MessageCircle, Zap, Plus, 
  Trash2, Save, Activity, MessageSquare, 
  Hash, Heart, ShieldAlert, Inbox, CheckCircle2, XCircle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

// 🚀 STRICT TYPE MAPPING (Must match backend route.ts exactly)
interface AutoDMRule {
  id: string;
  keyword: string;       // Mapped from 'trigger'
  postType: string;      // Mapped from 'type'
  publicReply: string;   // Mapped from 'reply'
  dmContent: string;     // Mapped from 'dmText'
  trigger_on_comment?: boolean; // 🔥 GOD MODE FLAG
  trigger_on_dm?: boolean;      // 🔥 GOD MODE FLAG
  ai_handover?: boolean;        // 🔥 GOD MODE FLAG
  isActive?: boolean;
}

export default function InstagramAutomations() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    storyMentions: true,
    autoLikeComments: true,
  });

  // Auto-DM Rules State (Fetched from DB)
  const [autoDMRules, setAutoDMRules] = useState<AutoDMRule[]>([]);

  // New Funnel Form State (WITH GOD-MODE DEFAULTS)
  const [newRule, setNewRule] = useState({
    keyword: "",
    postType: "Comment on Any Post",
    publicReply: "",
    dmContent: "",
    trigger_on_comment: true,
    trigger_on_dm: false,
    ai_handover: true
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE REAL-TIME FETCH LOGIC
  useEffect(() => {
    const fetchRules = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=instagram&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          
          const data = await res.json();
          if (data.success && data.rules) {
              setAutoDMRules(data.rules);
          }
          if (data.success && data.settings) {
              setGlobalSettings(data.settings);
          }
        } catch (error) {
          console.error("[INSTAGRAM_AUTOMATION_ERROR] Failed to load rules safely", error);
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

  const handleRuleToggle = (key: keyof typeof newRule) => {
    setNewRule(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddRule = () => {
    if (!newRule.keyword.trim() || !newRule.dmContent.trim()) {
      alert("Trigger Keyword and Secret DM Text are required to build a funnel.");
      return;
    }
    const tempId = `temp_insta_${Date.now()}`;
    
    // Add to top of list with smooth animation
    setAutoDMRules([{ id: tempId, ...newRule, isActive: true }, ...autoDMRules]);
    
    // Reset Form to defaults
    setNewRule({ 
      keyword: "", 
      postType: "Comment on Any Post", 
      publicReply: "", 
      dmContent: "",
      trigger_on_comment: true,
      trigger_on_dm: false,
      ai_handover: true
    }); 
  };

  const handleDeleteRule = (id: string) => {
    setAutoDMRules(autoDMRules.filter(r => r.id !== id));
  };

  // 🚀 SECURE SAVE TO DATABASE (100% SYNCED)
  const handleSave = async () => {
    if (!session?.user?.email) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          channel: "instagram",
          rules: autoDMRules,
          settings: globalSettings
        })
      });

      if (!res.ok) {
         let errorDetail = `HTTP Error ${res.status}`;
         try {
            const errData = await res.json();
            errorDetail = errData.error || errorDetail;
         } catch(e) {
            errorDetail = await res.text();
         }
         throw new Error(errorDetail);
      }

      const data = await res.json();
      
      if (data.success) {
        alert("📸 Instagram Viral Funnels and God-Mode settings synced securely with Meta API!");
        const refreshRes = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=instagram&t=${Date.now()}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.rules) setAutoDMRules(refreshData.rules);
      } else {
        alert(`Failed to save configuration: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Automation Sync Error:", error);
      alert(`Backend Error: ${error.message || "Network error while syncing rules."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  // 🚀 Premium Loader
  if (isLoading || status === "loading") {
    return <SpinnerCounter text="CONNECTING INSTAGRAM GRAPH API..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="Instagram Automations" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= LEFT: GLOBAL TRIGGERS ================= */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Global Triggers</h2>
                  <p className="text-[11px] text-gray-500 font-mono">Always-on background actions</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Story Mentions */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-pink-400"/>
                      <span className="text-[13px] font-bold text-white">Story Mentions Auto-DM</span>
                    </div>
                    <div onClick={() => handleToggle('storyMentions')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.storyMentions ? 'bg-pink-500' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.storyMentions ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Automatically send a &apos;Thank You&apos; DM when someone tags your account in their story.</p>
                </div>

                {/* Auto Like Comments */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500"/>
                      <span className="text-[13px] font-bold text-white">Auto-Like Matched Comments</span>
                    </div>
                    <div onClick={() => handleToggle('autoLikeComments')} className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${globalSettings.autoLikeComments ? 'bg-pink-500' : 'bg-white/10'}`}>
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${globalSettings.autoLikeComments ? 'ml-5' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Instantly heart the comment before sending the automated DM response.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ================= RIGHT: COMMENT TO DM ENGINE ================= */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-pink-500"/> Comment-to-DM Engine
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-2">Create viral funnels. Reply to specific comments and instantly send a Direct Message.</p>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white px-6 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Syncing..." : "Deploy Funnels"}
                </button>
              </div>

              {/* 🚀 FORM: Add New Funnel */}
              <div className="bg-[#111114] border border-pink-500/20 p-5 md:p-7 rounded-2xl mb-8 flex flex-col gap-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500/50"></div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Create New Viral Funnel
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Target Post Type</label>
                    <select value={newRule.postType} onChange={(e)=> setNewRule({...newRule, postType: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-pink-500/50 transition-colors">
                        <option value="Comment on Any Post">Any Post or Reel</option>
                        <option value="Specific Post">Specific Post/Reel</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Trigger Keyword (comma separated)</label>
                    <input type="text" placeholder="e.g. link, send, price" value={newRule.keyword} onChange={(e)=> setNewRule({...newRule, keyword: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-pink-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Public Comment Reply (Optional)</label>
                    <input type="text" placeholder="e.g. Sent you a DM! 🚀" value={newRule.publicReply} onChange={(e)=> setNewRule({...newRule, publicReply: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-pink-500/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Secret DM Content</label>
                    <input type="text" placeholder="e.g. Here is the link you requested..." value={newRule.dmContent} onChange={(e)=> setNewRule({...newRule, dmContent: e.target.value})} className="w-full bg-[#0A0A0D] border border-pink-500/30 rounded-lg p-3 text-sm text-white outline-none focus:border-pink-500/80 transition-colors shadow-[0_0_10px_rgba(236,72,153,0.1)]" />
                  </div>
                </div>

                {/* 🔥 ADVANCED GOD-MODE CONTROLS */}
                <div className="mt-2 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> God-Mode Access Controls
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Toggle 1 */}
                    <div className="bg-[#0A0A0D] border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-pink-500/20 transition-colors">
                      <div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-0.5">Trigger on Comment</span>
                        <span className="text-[9px] text-gray-500">Fire funnel for post comments.</span>
                      </div>
                      <div onClick={() => handleRuleToggle('trigger_on_comment')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${newRule.trigger_on_comment ? 'bg-pink-500' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${newRule.trigger_on_comment ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                    {/* Toggle 2 */}
                    <div className="bg-[#0A0A0D] border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-pink-500/20 transition-colors">
                      <div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-0.5">Trigger in Inbox DM</span>
                        <span className="text-[9px] text-gray-500">Bypass AI if user sends DM directly.</span>
                      </div>
                      <div onClick={() => handleRuleToggle('trigger_on_dm')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${newRule.trigger_on_dm ? 'bg-pink-500' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${newRule.trigger_on_dm ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                    {/* Toggle 3 */}
                    <div className="bg-[#0A0A0D] border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-pink-500/20 transition-colors">
                      <div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block mb-0.5">AI Handover Fallback</span>
                        <span className="text-[9px] text-gray-500">Let Omni-Engine reply if funnel is empty.</span>
                      </div>
                      <div onClick={() => handleRuleToggle('ai_handover')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${newRule.ai_handover ? 'bg-pink-500' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${newRule.ai_handover ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button onClick={handleAddRule} className={`bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${btnHover}`}>
                    Add Funnel
                  </button>
                </div>
              </div>

              {/* 🚀 ACTIVE FUNNELS DATABASE */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Funnels Database</p>
              </div>

              <div className="space-y-4">
                {autoDMRules.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No viral funnels configured yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {autoDMRules.map((rule, idx) => (
                      <motion.div 
                        key={rule.id || idx} 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#111114] border border-white/5 hover:border-pink-500/30 p-5 rounded-2xl flex flex-col gap-4 group transition-colors"
                      >
                        
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-pink-500" />
                            <span className="text-[13px] font-bold text-gray-300">{rule.postType}</span>
                          </div>
                          <button title="Delete rule" onClick={() => handleDeleteRule(rule.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>

                        {/* 🔥 PREMIUM UI BADGES FOR GOD-MODE */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 border ${rule.trigger_on_comment !== false ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                            {rule.trigger_on_comment !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Comments
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 border ${rule.trigger_on_dm === true ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                             {rule.trigger_on_dm === true ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} Inbox DMs
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 border ${rule.ai_handover !== false ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                            <Bot className="w-3 h-3" /> AI Handover: {rule.ai_handover !== false ? 'ON' : 'OFF'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">If user says:</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {/* 🧠 ADVANCED FEATURE: Smart Keyword Tags */}
                              {rule.keyword ? rule.keyword.split(',').map((kw, i) => (
                                <span key={i} className="bg-white/5 border border-white/10 text-gray-300 text-[11px] font-mono px-2.5 py-1 rounded-md uppercase tracking-wide">
                                  {kw.trim()}
                                </span>
                              )) : <span className="text-gray-600 text-xs italic">No keyword</span>}
                            </div>
                            
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Public Reply:</p>
                            <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg">
                              <span className="text-[12px] text-gray-300">{rule.publicReply || "None (Silent DM)"}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Secretly Send DM:</p>
                            <div className="bg-black/30 border border-pink-500/20 px-4 py-4 rounded-xl h-[calc(100%-24px)] flex items-start gap-3 shadow-inner">
                              <MessageCircle className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                              <span className="text-[13px] text-white leading-relaxed">{rule.dmContent || "No DM content"}</span>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
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