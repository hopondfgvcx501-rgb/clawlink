"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM COMMAND ROUTER
 * ==============================================================================================
 * @file app/dashboard/telegram/bots/page.tsx
 * @description Advanced Action Director for Telegram Bot. Routes specific commands to AI flows.
 * 🚀 FIXED: Removed redundant bot activation UI. Token is pre-verified in Master DB.
 * 🚀 SECURED: Full CRUD operation connected with /api/telegram/bot-config route.
 * 🛡️ UI POLISH: Expanded Command Router to full width for an enterprise feel.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Terminal, Plus, Trash2, Command, Activity, Server, Zap, ChevronRight, Sparkles
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface BotCommand {
  id: string;
  command: string;
  description: string;
  action: string;
}

export default function TelegramCommandRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCommand, setIsSavingCommand] = useState(false);
  
  const isMounted = useRef(false);

  // Real DB State
  const [commands, setCommands] = useState<BotCommand[]>([]);

  // New Command Form
  const [newCommand, setNewCommand] = useState({ command: "", description: "", action: "Trigger Flow: Welcome" });

  useEffect(() => {
    isMounted.current = true;
    if (status === "unauthenticated") {
      router.replace("/");
    }
    return () => { isMounted.current = false; };
  }, [status, router]);

  // 🚀 FETCH COMMANDS FROM DB
  useEffect(() => {
    const fetchCommandsData = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const email = encodeURIComponent(session.user.email);
          const t = Date.now();
          
          const res = await fetch(`/api/user?email=${email}&t=${t}`, { headers: { 'Cache-Control': 'no-store' } });
          const data = await res.json();
          
          if (data.success && data.data) {
              const userData = data.data;
              if (isMounted.current) {
                  try {
                      if (userData.bot_commands) {
                          setCommands(typeof userData.bot_commands === 'string' ? JSON.parse(userData.bot_commands) : userData.bot_commands);
                      }
                  } catch(e) {
                      console.error("Failed parsing bot commands");
                  }
              }
          }
        } catch (error) {
          console.error("[TELEGRAM_CMD_ERROR] Failed to load commands", error);
        } finally {
          if (isMounted.current) setIsLoading(false);
        }
      }
    };
    fetchCommandsData();
  }, [session, status]);

  // 🚀 ADD NEW COMMAND
  const handleAddCommand = async () => {
      if (!newCommand.command || !newCommand.description) {
          alert("Command and Description are required.");
          return;
      }
      
      const formattedCommand = newCommand.command.startsWith('/') ? newCommand.command : `/${newCommand.command}`;
      
      setIsSavingCommand(true);
      try {
        const payload = {
            email: session?.user?.email,
            action: 'add_command', 
            commandData: { ...newCommand, command: formattedCommand }
        };

        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if(data.success) {
            // Local update to avoid 500 error loop of refetching
            const tempId = `temp_cmd_${Date.now()}`;
            setCommands([...commands, { id: tempId, command: formattedCommand, description: newCommand.description, action: newCommand.action }]);
            setNewCommand({ command: "", description: "", action: "Trigger Flow: Welcome" });
        } else {
            alert("❌ BACKEND ERROR: " + (data.error || "Failed to save command."));
        }
      } catch(err: any) {
          alert("❌ NETWORK ERROR: " + err.message);
      } finally {
          if (isMounted.current) setIsSavingCommand(false);
      }
  };

  const handleDeleteCommand = async (id: string) => {
    const previousCommands = [...commands];
    setCommands(commands.filter(c => c.id !== id));
    
    try {
        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: session?.user?.email, 
                action: 'delete_command',
                commandId: id 
            })
        });
        const data = await res.json();
        if (!data.success) {
            alert("❌ BACKEND ERROR: " + (data.error || "Failed to delete command."));
            setCommands(previousCommands); 
        }
    } catch(err: any) {
        alert("❌ NETWORK ERROR: " + err.message);
        setCommands(previousCommands);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING COMMAND ROUTER..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Command Router" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto space-y-8">
          
          {/* HEADER SECTION */}
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_20px_rgba(42,171,238,0.15)]">
                <Terminal className="w-6 h-6 text-[#2AABEE]"/>
              </div>
              Telegram Command Router
            </h2>
            <p className="text-[14px] text-gray-400 mt-3 leading-relaxed max-w-2xl">
              Take full control of user interactions. Intercept specific Telegram commands (like <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">/start</code> or <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">/pricing</code>) and route them to your custom AI flows or specific agent personas instantly.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            
            {/* Add New Command Form */}
            <div className="bg-[#111114] border border-[#2AABEE]/20 p-6 rounded-2xl mb-10 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#2AABEE]"></div>
              
              <h4 className="text-[12px] font-black uppercase tracking-widest text-[#2AABEE] flex items-center gap-2">
                <Sparkles className="w-4 h-4"/> Create Action Rule
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-3">
                  <label htmlFor="new-cmd-name" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Command Listener</label>
                  <input 
                    id="new-cmd-name"
                    type="text" 
                    title="New Command Name"
                    aria-label="New Command Name"
                    placeholder="e.g. /support" 
                    value={newCommand.command} 
                    onChange={(e)=> setNewCommand({...newCommand, command: e.target.value})} 
                    className="w-full bg-[#07070A] border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono outline-none focus:border-[#2AABEE]/50 transition-colors" 
                  />
                </div>
                <div className="md:col-span-4">
                  <label htmlFor="new-cmd-desc" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Menu Description (Visible to User)</label>
                  <input 
                    id="new-cmd-desc"
                    type="text" 
                    title="New Command Description"
                    aria-label="New Command Description"
                    placeholder="Talk to a human agent" 
                    value={newCommand.description} 
                    onChange={(e)=> setNewCommand({...newCommand, description: e.target.value})} 
                    className="w-full bg-[#07070A] border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#2AABEE]/50 transition-colors" 
                  />
                </div>
                <div className="md:col-span-5">
                  <label htmlFor="new-cmd-action" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">AI Execution Route</label>
                  <div className="flex gap-3">
                      <select 
                        id="new-cmd-action"
                        title="Select action routing" 
                        aria-label="Select action routing"
                        value={newCommand.action} 
                        onChange={(e)=> setNewCommand({...newCommand, action: e.target.value})} 
                        className="flex-1 bg-[#07070A] border border-[#2AABEE]/30 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#2AABEE]/80 cursor-pointer"
                      >
                          <option value="Trigger Flow: Welcome">Trigger Flow: Welcome</option>
                          <option value="Trigger Flow: Sales">Trigger Flow: Sales</option>
                          <option value="Trigger Flow: Support">Trigger Flow: Support</option>
                          <option value="Action: Handover to Human">Action: Handover to Human</option>
                          <option value="Reply: AI Fallback">Reply: Let AI Handle</option>
                      </select>
                      <button 
                        onClick={handleAddCommand} 
                        disabled={isSavingCommand} 
                        title="Deploy Command"
                        aria-label="Deploy Command"
                        className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(42,171,238,0.25)] disabled:opacity-50 ${btnHover} flex items-center gap-2`}
                      >
                          {isSavingCommand ? <Activity className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                          Deploy
                      </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Commands List */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Command className="w-4 h-4"/> Active Routing Rules
              </h3>
              
              <div className="space-y-4">
                {commands.length === 0 ? (
                  <div className="text-center py-16 bg-[#111114] border border-white/5 rounded-3xl border-dashed">
                      <Server className="w-10 h-10 text-gray-600 mx-auto mb-4 opacity-50" />
                      <p className="text-sm text-gray-500 font-medium">No active commands routing in the database.</p>
                      <p className="text-[11px] text-gray-600 mt-2 max-w-sm mx-auto">When a user types a command, your bot will simply use the default AI fallback response.</p>
                  </div>
                ) : commands.map((cmd) => (
                  <div key={cmd.id} className="bg-[#111114] border border-white/5 hover:border-[#2AABEE]/20 p-5 md:p-6 rounded-2xl flex items-center justify-between group transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-[#2AABEE]/5 flex items-center justify-center border border-[#2AABEE]/10 shrink-0 shadow-inner">
                        <Terminal className="w-5 h-5 text-[#2AABEE] opacity-80"/>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                          <span className="text-[16px] font-bold text-white font-mono tracking-tight">{cmd.command}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600"/>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-md text-orange-400 flex items-center gap-1.5">
                            <Zap className="w-3 h-3"/> {cmd.action}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500 mt-1">{cmd.description}</p>
                      </div>
                    </div>
                    <button 
                      title="Delete command" 
                      aria-label="Delete Command"
                      onClick={() => handleDeleteCommand(cmd.id)} 
                      className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
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