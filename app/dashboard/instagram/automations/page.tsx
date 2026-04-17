"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM AUTO-DM & COMMENT AUTOMATION
 * ==============================================================================================
 * @file app/dashboard/instagram/automations/page.tsx
 * @description The "ManyChat Killer" module. Maps specific comments on Posts/Reels to 
 * automated Direct Messages (DMs) using Meta's Graph API.
 * 🚀 SECURED: Strict caching prevention and session verification.
 * 🚀 UPGRADED: Real-time DB sync for Viral Funnels (Comment-to-DM).
 * 🚀 FIXED: Enforced strict "Instagram" naming. No shorthand.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, MessageCircle, Zap, Plus, 
  Trash2, Save, Activity, MessageSquare, 
  Hash, Heart
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface AutoDMRule {
  id: string;
  trigger: string;
  type: string;
  reply: string;
  dmText: string;
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

  // New Funnel Form State
  const [newRule, setNewRule] = useState({
    trigger: "",
    type: "Comment on Any Post",
    reply: "",
    dmText: ""
  });

  if (status === "unauthenticated") router.replace("/");

  // 🚀 SECURE REAL-TIME FETCH LOGIC
  useEffect(() => {
    const fetchRules = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=instagram&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          if (!res.ok) throw new Error("Secure fetch failed");
          
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

  const handleAddRule = () => {
    if (!newRule.trigger || !newRule.dmText) {
      alert("Trigger Keyword and Secret DM Text are required to build a funnel.");
      return;
    }
    const tempId = `temp_insta_${Date.now()}`;
    setAutoDMRules([{ id: tempId, ...newRule }, ...autoDMRules]);
    setNewRule({ trigger: "", type: "Comment on Any Post", reply: "", dmText: "" }); // Reset
  };

  const handleDeleteRule = (id: string) => {
    setAutoDMRules(autoDMRules.filter(r => r.id !== id));
  };

  // 🚀 SECURE SAVE TO DATABASE
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

      const data = await res.json();
      
      if (data.success) {
        alert("📸 Instagram Viral Funnels and Automations synced securely with Meta Graph API!");
        const refreshRes = await fetch(`/api/automation?email=${encodeURIComponent(session.user.email)}&channel=instagram`);
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.rules) setAutoDMRules(refreshData.rules);
      } else {
        alert("Failed to save configuration: " + data.error);
      }
    } catch (error) {
      alert("Network error while syncing rules.");
    } finally {
      setIsSaving(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  // Secure Anti-Flicker Loading State
  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-pink-500 font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        CONNECTING INSTAGRAM GRAPH API...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="Instagram Automations" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: GLOBAL TRIGGERS */}
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
                  <p className="text-[10px] text-gray-500 leading-relaxed">Automatically send a 'Thank You' DM when someone tags your account in their story.</p>
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

          {/* RIGHT: COMMENT TO DM ENGINE */}
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

              {/* Add New Funnel Form */}
              <div className="bg-[#111114] border border-pink-500/20 p-5 rounded-2xl mb-8 flex flex-col gap-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-pink-400 flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Create New Viral Funnel
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Target Post Type</label>
                    <select value={newRule.type} onChange={(e)=> setNewRule({...newRule, type: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-pink-500/50">
                        <option value="Comment on Any Post">Any Post or Reel</option>
                        <option value="Comment on Specific Reel">Specific Reel (Select Later)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Trigger Keyword (comma separated)</label>
                    <input type="text" placeholder="e.g. link, send, price" value={newRule.trigger} onChange={(e)=> setNewRule({...newRule, trigger: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-pink-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Public Comment Reply (Optional)</label>
                    <input type="text" placeholder="e.g. Sent you a DM! 🚀" value={newRule.reply} onChange={(e)=> setNewRule({...newRule, reply: e.target.value})} className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-pink-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Secret DM Content</label>
                    <input type="text" placeholder="e.g. Here is the link you requested: https..." value={newRule.dmText} onChange={(e)=> setNewRule({...newRule, dmText: e.target.value})} className="w-full bg-[#0A0A0D] border border-pink-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:border-pink-500/80" />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={handleAddRule} className={`bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${btnHover}`}>
                    Add Funnel
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Funnels Database</p>
              </div>

              <div className="space-y-4">
                {autoDMRules.length === 0 ? (
                  <div className="text-center py-10">
                      <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No viral funnels configured yet.</p>
                  </div>
                ) : autoDMRules.map((rule) => (
                  <div key={rule.id} className="bg-[#111114] border border-white/5 hover:border-pink-500/30 p-5 rounded-2xl flex flex-col gap-4 group transition-all">
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-pink-500" />
                        <span className="text-[13px] font-bold text-gray-300">{rule.type}</span>
                      </div>
                      <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">If user comments:</p>
                        <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg mb-3">
                          <span className="text-[13px] font-mono text-pink-400">{rule.trigger}</span>
                        </div>
                        
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Public Reply:</p>
                        <div className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg">
                          <span className="text-[12px] text-gray-300">{rule.reply || "No public reply"}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Secretly Send DM:</p>
                        <div className="bg-black/30 border border-pink-500/20 px-4 py-3 rounded-lg h-full">
                          <MessageCircle className="w-4 h-4 text-pink-500 mb-2" />
                          <span className="text-[13px] text-white leading-relaxed">{rule.dmText}</span>
                        </div>
                      </div>
                    </div>

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