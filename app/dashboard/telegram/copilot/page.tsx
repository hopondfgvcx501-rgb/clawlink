"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM AI COPILOT
 * ==============================================================================================
 * @file app/dashboard/telegram/copilot/page.tsx
 * @description Advanced control center to train and configure the Telegram AI Agent's behavior.
 * 🚀 SECURED: Full real-time synchronization with Supabase configuration.
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
  Languages, UserCircle, Bot
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function TelegramCopilot() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [config, setConfig] = useState({
    agentName: "",
    agentTone: "professional",
    systemPrompt: "",
    aiModel: "gpt-4o",
    language: "multilingual"
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE FETCH AI CONFIGURATION
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
              agentName: data.data.bot_name_telegram || "ClawLink Telegram Agent",
              agentTone: data.data.agent_tone_telegram || "professional",
              systemPrompt: data.data.system_prompt_telegram || "",
              aiModel: data.data.ai_model || "gpt-4o",
              language: data.data.preferred_language || "multilingual"
            });
          }
        } catch (error) {
          console.error("Config sync failed", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchConfig();
  }, [session, status]);

  const handleSaveConfig = async () => {
    if (!session?.user?.email) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          channel: "telegram",
          botNameTelegram: config.agentName,
          agentToneTelegram: config.agentTone,
          systemPromptTelegram: config.systemPrompt,
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("✨ Telegram AI Persona securely updated in the database!");
      } else {
        alert("Update failed: " + data.error);
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
        INITIALIZING TELEGRAM BRAIN...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram AI Copilot" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* 🧠 LEFT: AI PERSONALITY SETTINGS */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                    <BrainCircuit className="w-6 h-6 text-[#2AABEE]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Bot Persona</h2>
                    <p className="text-[12px] text-gray-500">Train your Telegram AI's character.</p>
                  </div>
                </div>
                <button onClick={handleSaveConfig} disabled={isSaving}
                  className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}>
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Saving..." : "Deploy Persona"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 block">Internal Agent Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input 
                      type="text" 
                      value={config.agentName}
                      onChange={(e) => setConfig({...config, agentName: e.target.value})}
                      placeholder="e.g. TeleBot Expert"
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#2AABEE]/50 outline-none transition-all"
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
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#2AABEE]/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="professional">Professional & Direct</option>
                      <option value="community">Community Manager (Friendly)</option>
                      <option value="humorous">Funny & Witty</option>
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
                    placeholder="Describe exactly how the agent should behave in Telegram groups and direct messages..."
                    className="w-full bg-[#111114] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:border-[#2AABEE]/50 outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3"/> Instructions are securely encrypted on the server.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ⚡ RIGHT: ENGINE SPECS */}
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
                    <Zap className="w-4 h-4 text-[#2AABEE]" />
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{config.aiModel}</span>
                  </div>
                </div>

                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Language Strategy</p>
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <Languages className="w-4 h-4 text-[#2AABEE]" />
                    <span className="text-sm font-bold text-white capitalize">{config.language} Support</span>
                  </div>
                </div>

                <div className="bg-[#2AABEE]/5 border border-[#2AABEE]/10 p-5 rounded-2xl">
                  <h4 className="text-[12px] font-black text-[#2AABEE] uppercase mb-2 flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5" /> Markdown Tip
                  </h4>
                  <p className="text-[11px] text-blue-200/60 leading-relaxed">
                    Telegram natively supports MarkdownV2. Instruct your prompt to use bold (*text*) and italics (_text_) for better formatting.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}