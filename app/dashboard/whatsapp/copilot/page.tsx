"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP AI COPILOT (PERSONA ENGINE)
 * ==============================================================================================
 * @file app/dashboard/whatsapp/copilot/page.tsx
 * @description Advanced control center to train and configure the WhatsApp AI Agent's behavior.
 * 🚀 SECURED: Full real-time synchronization with Supabase User Configuration.
 * 🚀 FIXED: Upgraded to premium SpinnerCounter.
 * 🚀 FIXED: Corrected the AI Model payload parameter from 'configModel' to 'aiModel'.
 * 🚀 FIXED: Implemented strict backend error surfacing.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BrainCircuit, Save, Sparkles, MessageSquare, 
  Settings2, Activity, ShieldCheck, Zap,
  Languages, UserCircle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; // 🚀 Premium Loader Imported

export default function WhatsAppCopilot() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // AI Configuration State
  const [config, setConfig] = useState({
    agentName: "",
    agentTone: "professional",
    systemPrompt: "",
    autoReply: true,
    aiModel: "gpt-4o", // Default
    language: "multilingual"
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH REAL AI CONFIGURATION FROM DB
  useEffect(() => {
    const fetchConfig = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
             headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setConfig({
              agentName: data.data.bot_name || "ClawLink Assistant",
              agentTone: data.data.agent_tone || "professional",
              systemPrompt: data.data.system_prompt_whatsapp || "",
              autoReply: data.data.bot_status === "active",
              aiModel: data.data.ai_model || "gpt-4o",
              language: data.data.preferred_language || "multilingual"
            });
          }
        } catch (error) {
          console.error("Configuration sync failed", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchConfig();
  }, [session, status]);

  // 🚀 SAVE CONFIG TO DB WITH STRICT ERROR HANDLING
  const handleSaveConfig = async () => {
    if (!session?.user?.email) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          channel: "whatsapp",
          botName: config.agentName,
          agentTone: config.agentTone,
          systemPrompt: config.systemPrompt,
          aiModel: config.aiModel // 🚀 Fixed variable name to map correctly to state
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
        alert("✨ WhatsApp AI Persona updated successfully across all nodes!");
      } else {
        alert(`Update failed: ${data.error}`);
      }
    } catch (error: any) {
        console.error("Persona Save Error:", error);
        alert(`Backend Error: ${error.message || "Network error while saving AI persona."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  // 🚀 Premium Loader
  if (isLoading || status === "loading") {
    return <SpinnerCounter text="INITIALIZING AI BRAIN..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp AI Copilot" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* 🧠 LEFT: AI PERSONALITY SETTINGS */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20 shadow-[0_0_20px_rgba(37,211,102,0.15)]">
                    <BrainCircuit className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Agent Persona</h2>
                    <p className="text-[12px] text-gray-500">Train your WhatsApp agent's soul and behavior.</p>
                  </div>
                </div>
                <button onClick={handleSaveConfig} disabled={isSaving}
                  className={`bg-[#25D366] hover:bg-[#20bd5a] text-black px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] disabled:opacity-50 ${btnHover}`}>
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Saving..." : "Deploy Persona"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 block">Agent Display Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text" 
                      value={config.agentName}
                      onChange={(e) => setConfig({...config, agentName: e.target.value})}
                      placeholder="e.g. ClawLink Pro"
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#25D366]/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 block">Conversation Tone</label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <select 
                      value={config.agentTone}
                      onChange={(e) => setConfig({...config, agentTone: e.target.value})}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#25D366]/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="professional">Professional & Direct</option>
                      <option value="friendly">Friendly & Casual</option>
                      <option value="humorous">Funny & Witty</option>
                      <option value="luxury">Luxury & Elite</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 block">Master Instruction (System Prompt)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-600" />
                  <textarea 
                    rows={8}
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                    placeholder="Describe exactly how the agent should behave. E.g. 'You are an expert sales closer for ClawLink. Never mention competitors. Always be polite but push for a meeting...'"
                    className="w-full bg-[#111114] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#25D366]/50 outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3"/> Instructions are private and never visible to the customer.
                </p>
              </div>

            </motion.div>
          </div>

          {/* ⚡ RIGHT: ENGINE SPECS & CAPABILITIES */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4"/> Engine Configuration
              </h3>

              <div className="space-y-4">
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Model Core</p>
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{config.aiModel}</span>
                  </div>
                </div>

                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Language Strategy</p>
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <Languages className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-white capitalize">{config.language} Support</span>
                  </div>
                </div>

                <div className="bg-[#25D366]/5 border border-[#25D366]/10 p-5 rounded-2xl">
                  <h4 className="text-[12px] font-black text-[#25D366] uppercase mb-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Pro Tip
                  </h4>
                  <p className="text-[11px] text-[#25D366]/60 leading-relaxed">
                    Be specific about your business hours and contact info in the System Prompt. This helps the AI answer FAQs without human intervention.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* AI Usage Card */}
            <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 rounded-[24px] p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#25D366]">Agent Intelligence</p>
                <div className="px-2 py-1 bg-[#25D366]/20 rounded text-[9px] font-black text-emerald-300">ULTRA FAST</div>
              </div>
              <p className="text-[13px] text-white font-bold mb-4">Your agent is currently analyzing conversation patterns for better accuracy.</p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-gradient-to-r from-emerald-500 to-[#25D366]"></div>
              </div>
            </div>
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