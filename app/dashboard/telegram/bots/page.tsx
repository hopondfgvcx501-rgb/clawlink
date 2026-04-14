"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM BOT MANAGEMENT
 * ==============================================================================================
 * @file app/dashboard/telegram/bots/page.tsx
 * @description Central control panel for bot settings, webhook status, and command handling.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, Terminal, Plus, Trash2, Power, 
  ShieldCheck, RefreshCcw, Command, Activity
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function TelegramBots() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isBotActive, setIsBotActive] = useState(true);
  const [commands, setCommands] = useState([
    { id: 1, command: "/start", description: "Initialize the bot and show welcome menu", action: "Trigger Flow: Welcome" },
    { id: 2, command: "/help", description: "Get support information", action: "Reply: Support Text" },
    { id: 3, command: "/buy", description: "Show pricing and purchase links", action: "Reply: Pricing Menu" },
  ]);

  if (status === "unauthenticated") router.push("/");

  const handleDeleteCommand = (id: number) => {
    setCommands(commands.filter(c => c.id !== id));
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Bot Management" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: BOT IDENTITY & STATUS */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden">
              
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#2AABEE]/20 to-transparent"></div>
              
              <div className="relative mt-4 mb-4">
                <div className="w-24 h-24 rounded-3xl bg-[#111114] border border-[#2AABEE]/30 flex items-center justify-center shadow-[0_0_30px_rgba(42,171,238,0.2)]">
                  <Bot className="w-12 h-12 text-[#2AABEE]" />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-[#0A0A0D] flex items-center justify-center ${isBotActive ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isBotActive ? <ShieldCheck className="w-3 h-3 text-black"/> : <Power className="w-3 h-3 text-white"/>}
                </div>
              </div>

              <h2 className="text-xl font-black text-white tracking-wide">ClawLink Support</h2>
              <p className="text-[12px] font-mono text-[#2AABEE] mt-1">@ClawSupport_Bot</p>

              <div className="w-full mt-8 space-y-3">
                <button 
                  onClick={() => setIsBotActive(!isBotActive)}
                  className={`w-full py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isBotActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  } ${btnHover}`}
                >
                  <Power className="w-4 h-4"/> {isBotActive ? 'Pause Bot' : 'Activate Bot'}
                </button>
                <button className={`w-full bg-[#111114] hover:bg-white/5 border border-white/10 text-white py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${btnHover}`}>
                  <RefreshCcw className="w-4 h-4 text-gray-400"/> Sync Webhook
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: COMMAND MANAGER */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-[#2AABEE]"/> Command Router
                  </h3>
                  <p className="text-[12px] text-gray-500 mt-1">Define what happens when users type specific commands.</p>
                </div>
                <button className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(42,171,238,0.3)] ${btnHover}`}>
                  <Plus className="w-4 h-4"/> Add Command
                </button>
              </div>

              <div className="space-y-4">
                {commands.map((cmd) => (
                  <div key={cmd.id} className="bg-[#111114] border border-white/5 hover:border-white/10 p-5 rounded-2xl flex items-center justify-between group transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shrink-0">
                        <Command className="w-4 h-4 text-[#2AABEE]"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[14px] font-bold text-white">{cmd.command}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                            {cmd.action}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500">{cmd.description}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCommand(cmd.id)} className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
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