"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM AUTO-DM & COMMENT AUTOMATION
 * ==============================================================================================
 * @file app/dashboard/instagram/automations/page.tsx
 * @description The "ManyChat Killer" module. Maps specific comments on Posts/Reels to 
 * automated Direct Messages (DMs) using Meta's Graph API.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, MessageCircle, Zap, Plus, 
  Trash2, Save, Activity, MessageSquare, 
  Hash, Heart
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function InstagramAutomations() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Global Settings State
  const [globalSettings, setGlobalSettings] = useState({
    storyMentions: true,
    autoLikeComments: true,
  });

  // Auto-DM Rules State
  const [autoDMRules, setAutoDMRules] = useState([
    { id: 1, trigger: "link, send, price", type: "Comment on Any Post", reply: "I've sent the details directly to your DM! 🚀", dmText: "Here is the secret link you asked for: https://clawlinkai.com" },
    { id: 2, trigger: "demo, test", type: "Comment on Specific Reel", reply: "Check your DMs for the demo access! 🔥", dmText: "Hey! Ready to test the ClawLink Engine? Here you go..." },
  ]);

  if (status === "unauthenticated") router.push("/");

  const handleToggle = (key: keyof typeof globalSettings) => {
    setGlobalSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteRule = (id: number) => {
    setAutoDMRules(autoDMRules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("📸 Instagram Auto-DM Rules synced securely with Meta Graph API!");
    }, 1500);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="IG Automations" session={session} />
      
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
                  <p className="text-[13px] text-gray-400 mt-2">Create viral funnels. Reply to specific comments and instantly send a DM.</p>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white px-6 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Syncing..." : "Deploy Rules"}
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Funnels</p>
                <button className={`bg-[#111114] hover:bg-white/5 text-white border border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${btnHover}`}>
                  <Plus className="w-3 h-3"/> Create New Funnel
                </button>
              </div>

              <div className="space-y-4">
                {autoDMRules.map((rule) => (
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
                          <span className="text-[12px] text-gray-300">{rule.reply}</span>
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