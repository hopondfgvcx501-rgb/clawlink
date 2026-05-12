"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM AI COPILOT
 * ==============================================================================================
 * @file app/dashboard/telegram/copilot/page.tsx
 * @description Advanced control center to train and configure the Telegram AI Agent's behavior.
 * 🚀 SECURED: Full real-time synchronization with Supabase configuration.
 * 🚀 UPGRADED: Added Quick-Select Persona Templates (Sales, Support, Lead Gen).
 * 🚀 UPGRADED: Added strict Anti-Hallucination settings UI.
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
  Languages, UserCircle, Bot, BookOpen, AlertTriangle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; 

// 🚀 Pre-built Master Prompts for easy onboarding
const PERSONA_TEMPLATES = {
    support: "You are a highly empathetic and helpful Customer Support Agent for ClawLink. Your primary goal is to resolve user issues quickly and politely. Always apologize for inconveniences. If a problem is too complex, inform the user that a human agent will contact them shortly. Use a professional but warm tone.",
    sales: "You are an aggressive, high-energy Sales Representative for ClawLink. Your goal is to convert inquiries into sales. Highlight the benefits of our Enterprise plan ($89/mo). Be persuasive, use emojis enthusiastically, and always try to push the user towards booking a demo or making a purchase. Never be rude, but be persistent.",
    leadgen: "You are a Lead Generation Specialist for ClawLink. Your only objective is to collect the user's Name, Email, and Phone Number. Ask these questions one by one in a conversational way. Do not answer complex technical queries; instead, promise that an expert will reach out once you have their contact details.",
    blank: ""
};

export default function TelegramCopilot() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");

  const [config, setConfig] = useState({
    agentName: "",
    agentTone: "professional",
    systemPrompt: "",
    aiModel: "gpt-4o",
    language: "multilingual",
    strictMode: true // Anti-hallucination toggle
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
              agentName: data.data.bot_name_telegram || "ClawLink AI Agent",
              agentTone: data.data.agent_tone_telegram || "professional",
              systemPrompt: data.data.system_prompt_telegram || "",
              aiModel: data.data.ai_provider || data.data.selected_model || "omni-fallback",
              language: data.data.preferred_language || "multilingual",
              strictMode: data.data.strict_ai_mode !== false 
            });
            
            // Auto-detect template if it exactly matches
            if (data.data.system_prompt_telegram === PERSONA_TEMPLATES.support) setSelectedTemplate("support");
            else if (data.data.system_prompt_telegram === PERSONA_TEMPLATES.sales) setSelectedTemplate("sales");
            else if (data.data.system_prompt_telegram === PERSONA_TEMPLATES.leadgen) setSelectedTemplate("leadgen");
            else setSelectedTemplate("custom");
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

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedTemplate(val);
      if (val !== "custom") {
          setConfig(prev => ({ ...prev, systemPrompt: PERSONA_TEMPLATES[val as keyof typeof PERSONA_TEMPLATES] }));
      }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setConfig({...config, systemPrompt: e.target.value});
      setSelectedTemplate("custom"); // Switch to custom if they manually edit
  };

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
          strictModeTelegram: config.strictMode // Requires backend to handle this in future
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

  // 🚀 Secure Premium Anti-Flicker Loading State
  if (isLoading || status === "loading") {
    return <SpinnerCounter text="INITIALIZING AI BRAIN..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram AI Copilot" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
          
          {/* 🧠 LEFT: AI PERSONALITY SETTINGS */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 sm:p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_15px_rgba(42,171,238,0.2)] shrink-0">
                    <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-[#2AABEE]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Bot Persona</h2>
                    <p className="text-[11px] sm:text-[12px] text-gray-500">Train your Telegram AI&apos;s character and identity.</p>
                  </div>
                </div>
                <button onClick={handleSaveConfig} disabled={isSaving}
                  className={`w-full sm:w-auto bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}>
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Compiling..." : "Deploy Persona"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-8">
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
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 block">Quick Start Template</label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <select title="Select a pre-built prompt template"
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#2AABEE]/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="custom">Custom (Write your own)</option>
                      <option value="support">Helpdesk / Support Agent</option>
                      <option value="sales">Aggressive Sales Closer</option>
                      <option value="leadgen">Lead Generation Specialist</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2AABEE] mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4"/> Master Instruction (System Prompt)
                </label>
                <div className="relative">
                  <textarea 
                    rows={8}
                    value={config.systemPrompt}
                    onChange={handlePromptChange}
                    placeholder="Describe exactly how the agent should behave, what questions it should ask, and what tone it should use. This is the Brain of your AI..."
                    className="w-full bg-[#111114] border border-[#2AABEE]/30 rounded-2xl p-4 text-sm text-white focus:border-[#2AABEE] outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed shadow-inner"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                    <p className="text-[10px] text-gray-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3"/> Instructions are securely encrypted on the server.
                    </p>
                    <span className="text-[10px] text-gray-500 font-mono">{config.systemPrompt.length} chars</span>
                </div>
              </div>

            </motion.div>
          </div>

          {/* ⚡ RIGHT: ENGINE SPECS & KNOWLEDGE */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col h-full">
              
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4"/> Runtime Configuration
              </h3>

              <div className="space-y-4 flex-1">
                {/* Current Model */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-[#2AABEE]/5 rounded-bl-full"></div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">Model Core (From Pricing Plan)</p>
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5 relative z-10">
                    <Zap className="w-4 h-4 text-[#2AABEE]" />
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{config.aiModel}</span>
                  </div>
                </div>

                {/* RAG Knowledge Base */}
                <div className="bg-[#111114] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                      <BookOpen className="w-3 h-3"/> RAG Knowledge Base
                  </p>
                  <div className="flex flex-col gap-2 bg-black/30 p-3 rounded-xl border border-white/5">
                    <span className="text-[11px] text-gray-400 leading-relaxed">
                        Your bot will automatically pull facts, PDFs, and links from your central Media Library to answer user queries accurately.
                    </span>
                    <button onClick={() => router.push('/dashboard/media')} className="text-[10px] font-bold text-[#2AABEE] uppercase tracking-widest text-left hover:underline mt-1 w-max">
                        Manage Knowledge &rarr;
                    </button>
                  </div>
                </div>

                {/* Anti-Hallucination */}
                <div className={`p-4 rounded-2xl border transition-colors ${config.strictMode ? 'bg-green-500/5 border-green-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-bold uppercase flex items-center gap-2 ${config.strictMode ? 'text-green-500' : 'text-orange-500'}`}>
                        <AlertTriangle className="w-3 h-3"/> Strict Mode (Anti-Hallucination)
                    </p>
                    <div 
                        onClick={() => setConfig({...config, strictMode: !config.strictMode})}
                        className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${config.strictMode ? 'bg-green-500' : 'bg-white/20'}`}
                    >
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${config.strictMode ? 'ml-4' : 'ml-0'}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                      {config.strictMode 
                          ? "ON: Bot will only answer using your provided knowledge base. If it doesn't know, it will refuse to answer." 
                          : "OFF: Bot will use its general internet knowledge to answer questions outside your business data."}
                  </p>
                </div>
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