"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM GROUPS & CHANNELS MANAGER
 * ==============================================================================================
 * @file app/dashboard/telegram/groups/page.tsx
 * @description Manages connected Telegram communities. Controls auto-moderation, 
 * anti-spam filters, and automated welcome sequences.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  UsersRound, ShieldAlert, Link, Bot as BotIcon, 
  MessageSquarePlus, Save, Activity, Megaphone,
  UserPlus, Trash2, Settings2, CheckCircle2
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function TelegramGroupsManager() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [activeEntity, setActiveEntity] = useState(1);

  // Mock Connected Entities
  const [entities] = useState([
    { id: 1, name: "ClawLink VIPs", type: "group", members: "1,240", today: "+12", spam: "34 blocked" },
    { id: 2, name: "ClawLink Updates", type: "channel", members: "8,900", today: "+45", spam: "N/A" },
    { id: 3, name: "Beta Testers", type: "group", members: "340", today: "+2", spam: "5 blocked" },
  ]);

  // Mock Settings Form
  const [settings, setSettings] = useState({
    welcomeEnabled: true,
    welcomeText: "Welcome to the group, {{first_name}}! 🎉\nPlease read the pinned rules before posting. Type /help to interact with our AI.",
    blockLinks: true,
    blockProfanity: true,
    restrictBots: true,
    autoDeleteJoins: true, // "User joined the group" messages
  });

  if (status === "unauthenticated") router.push("/");

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("🛡️ Auto-Moderation rules successfully deployed to Telegram!");
    }, 1200);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Groups & Channels" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: ENTITY LIST */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <UsersRound className="w-5 h-5 text-[#2AABEE]"/> Connected Communities
              </h2>
              <p className="text-[12px] text-gray-500">Select a group or channel to manage rules.</p>
            </div>

            <div className="space-y-3">
              {entities.map((entity) => (
                <motion.div 
                  key={entity.id}
                  onClick={() => setActiveEntity(entity.id)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all duration-200 ${
                    activeEntity === entity.id 
                    ? "bg-[#2AABEE]/10 border-[#2AABEE]/50 shadow-[0_0_20px_rgba(42,171,238,0.15)]" 
                    : "bg-[#0A0A0D] border-white/5 hover:border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${entity.type === 'group' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                        {entity.type === 'group' ? <UsersRound className="w-5 h-5"/> : <Megaphone className="w-5 h-5"/>}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-white">{entity.name}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{entity.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 bg-[#111114] p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Members</p>
                      <p className="text-[13px] font-black text-white">{entity.members} <span className="text-[10px] text-green-400 font-mono">({entity.today})</span></p>
                    </div>
                    {entity.type === 'group' && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Spam Blocked</p>
                        <p className="text-[13px] font-black text-red-400">{entity.spam}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <button className={`w-full bg-[#111114] border border-white/10 hover:bg-white/5 text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${btnHover}`}>
              <MessageSquarePlus className="w-4 h-4"/> Connect New Group
            </button>
          </div>

          {/* RIGHT: AUTO-MODERATION ENGINE */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-[#2AABEE]"/> Auto-Moderation Engine
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-2">Configure AI-driven security and engagement for {entities.find(e=>e.id === activeEntity)?.name}.</p>
                </div>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {isSaving ? "Deploying..." : "Save Rules"}
                </button>
              </div>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { key: 'blockLinks', title: 'Anti-Link Spam', desc: 'Automatically delete unapproved links', icon: <Link className="w-4 h-4 text-orange-400"/> },
                  { key: 'restrictBots', title: 'Restrict Fake Bots', desc: 'Kick unauthorized bots instantly', icon: <BotIcon className="w-4 h-4 text-red-400"/> },
                  { key: 'blockProfanity', title: 'Profanity Filter', desc: 'AI detects and deletes abusive words', icon: <ShieldAlert className="w-4 h-4 text-purple-400"/> },
                  { key: 'autoDeleteJoins', title: 'Clean Join Messages', desc: 'Delete "User joined the group" logs', icon: <Trash2 className="w-4 h-4 text-gray-400"/> },
                ].map((item) => (
                  <div key={item.key} className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">{item.icon}</div>
                      <div>
                        <p className="text-[13px] font-bold text-white">{item.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    {/* iOS style toggle */}
                    <div 
                      onClick={() => handleToggle(item.key as any)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-[#2AABEE]' : 'bg-white/10'}`}
                    >
                      <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${settings[item.key as keyof typeof settings] ? 'ml-6' : 'ml-0'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Welcome Message Builder */}
              <div className="border-t border-white/5 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[14px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-green-400"/> Automated Welcome sequence
                  </h4>
                  <div 
                    onClick={() => handleToggle('welcomeEnabled')}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${settings.welcomeEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                  >
                    <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${settings.welcomeEnabled ? 'ml-5' : 'ml-0'}`} />
                  </div>
                </div>
                
                <div className={`transition-opacity ${settings.welcomeEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#2AABEE]/50 focus-within:shadow-[0_0_20px_rgba(42,171,238,0.1)] transition-all">
                    <textarea 
                      value={settings.welcomeText}
                      onChange={(e) => setSettings({...settings, welcomeText: e.target.value})}
                      className="w-full h-[120px] bg-transparent text-[13px] text-gray-200 p-5 outline-none resize-none custom-scrollbar leading-relaxed"
                    />
                    <div className="bg-[#1A1A1E] border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mr-2">Variables:</span>
                      {['{{first_name}}', '{{username}}', '{{group_name}}'].map(v => (
                        <button key={v} onClick={() => setSettings({...settings, welcomeText: settings.welcomeText + v})} 
                          className="text-[9px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-gray-300 transition-colors">
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
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