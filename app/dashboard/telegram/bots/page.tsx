"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM COMMAND ROUTER
 * ==============================================================================================
 * @file app/dashboard/telegram/bots/page.tsx
 * @description Advanced Action Director for Telegram Bot. Routes specific commands to AI flows.
 * 🚀 UPGRADE: Added "Clear All" bulk delete functionality (action: clear_all_commands).
 * 🚀 UPGRADE: Added "Active/Inactive" toggle for seasonal/paused rules (action: toggle_command_rule).
 * 🛡️ UI POLISH: Fixed overflowing "Deploy" button. Replaced grid with responsive Flexbox.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Terminal, Plus, Trash2, Command, Activity, Server, Zap, ChevronRight, Sparkles, AlertTriangle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface BotCommand {
  id: string;
  command: string;
  description: string;
  action: string;
  isActive?: boolean;
}

export default function TelegramCommandRouter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCommand, setIsSavingCommand] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
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
                          const parsedCommands = typeof userData.bot_commands === 'string' ? JSON.parse(userData.bot_commands) : userData.bot_commands;
                          const normalizedCommands = parsedCommands.map((c: any) => ({ ...c, isActive: c.isActive !== false }));
                          setCommands(normalizedCommands);
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
            commandData: { ...newCommand, command: formattedCommand, isActive: true } 
        };

        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if(data.success) {
            const tempId = `temp_cmd_${Date.now()}`;
            setCommands([...commands, { id: tempId, command: formattedCommand, description: newCommand.description, action: newCommand.action, isActive: true }]);
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

  // 🚀 DELETE SINGLE COMMAND
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

  // 🚀 TOGGLE ACTIVE/INACTIVE STATUS
  const handleToggleCommandStatus = async (id: string, currentStatus: boolean | undefined) => {
    const newStatus = currentStatus === false ? true : false;
    
    setCommands(commands.map(c => c.id === id ? { ...c, isActive: newStatus } : c));

    try {
        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: session?.user?.email, 
                action: 'toggle_command_rule',
                commandId: id,
                isActive: newStatus
            })
        });
        const data = await res.json();
        if (!data.success) {
            alert("❌ BACKEND ERROR: " + (data.error || "Failed to toggle rule."));
            setCommands(commands.map(c => c.id === id ? { ...c, isActive: !newStatus } : c));
        }
    } catch(err: any) {
        alert("❌ NETWORK ERROR: " + err.message);
        setCommands(commands.map(c => c.id === id ? { ...c, isActive: !newStatus } : c));
    }
  };

  // 🚀 CLEAR ALL COMMANDS
  const handleClearAll = async () => {
    if (commands.length === 0) return;
    
    const confirmDelete = window.confirm("⚠️ WARNING: This will permanently wipe out ALL command rules from the database. Are you absolutely sure?");
    if (!confirmDelete) return;

    const previousCommands = [...commands];
    setIsClearingAll(true);
    setCommands([]); 

    try {
        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: session?.user?.email, 
                action: 'clear_all_commands' 
            })
        });
        const data = await res.json();
        if (!data.success) {
            alert("❌ BACKEND ERROR: " + (data.error || "Failed to clear commands."));
            setCommands(previousCommands); 
        } else {
            alert("🗑️ All command rules cleared successfully.");
        }
    } catch(err: any) {
        alert("❌ NETWORK ERROR: " + err.message);
        setCommands(previousCommands);
    } finally {
        setIsClearingAll(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING COMMAND ROUTER..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Command Router" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto space-y-8">
          
          {/* HEADER SECTION */}
          <div className="px-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_20px_rgba(42,171,238,0.15)]">
                <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[#2AABEE]" aria-hidden="true"/>
              </div>
              Telegram Command Router
            </h2>
            <p className="text-xs sm:text-[14px] text-gray-400 mt-3 leading-relaxed max-w-2xl">
              Take full control of user interactions. Intercept specific Telegram commands (like <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">/start</code> or <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">/pricing</code>) and route them to your custom AI flows or specific agent personas instantly.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 sm:p-6 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            
            {/* 🚀 FIXED FOR OVERFLOW: Add New Command Form using Flexbox */}
            <div className="bg-[#111114] border border-[#2AABEE]/20 p-5 sm:p-6 rounded-2xl mb-10 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#2AABEE]"></div>
              
              <h4 className="text-[12px] font-black uppercase tracking-widest text-[#2AABEE] flex items-center gap-2">
                <Sparkles className="w-4 h-4" aria-hidden="true"/> Create Action Rule
              </h4>
              
              {/* Flex Container for Fields */}
              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 w-full">
                
                <div className="w-full lg:w-64 shrink-0">
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
                
                <div className="w-full lg:flex-1">
                  <label htmlFor="new-cmd-desc" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Menu Description</label>
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
                
                <div className="w-full lg:w-[45%] shrink-0">
                  <label htmlFor="new-cmd-action" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">AI Execution Route</label>
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <select 
                        id="new-cmd-action"
                        title="Select action routing" 
                        aria-label="Select action routing"
                        value={newCommand.action} 
                        onChange={(e)=> setNewCommand({...newCommand, action: e.target.value})} 
                        className="flex-1 min-w-0 bg-[#07070A] border border-[#2AABEE]/30 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#2AABEE]/80 cursor-pointer"
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
                        className={`w-full sm:w-auto shrink-0 bg-[#2AABEE] hover:bg-[#2298D6] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(42,171,238,0.25)] disabled:opacity-50 ${btnHover} flex items-center justify-center gap-2`}
                      >
                          {isSavingCommand ? <Activity className="w-4 h-4 animate-spin" aria-hidden="true"/> : <Plus className="w-4 h-4" aria-hidden="true"/>}
                          Deploy
                      </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Commands List Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Command className="w-4 h-4" aria-hidden="true"/> Active Routing Rules
              </h3>
              
              {commands.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  disabled={isClearingAll}
                  className={`text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${btnHover}`}
                >
                  {isClearingAll ? <Activity className="w-3 h-3 animate-spin"/> : <AlertTriangle className="w-3 h-3"/>}
                  Clear All Rules
                </button>
              )}
            </div>
              
            {/* Commands List Body */}
            <div className="space-y-4">
              {commands.length === 0 ? (
                <div className="text-center py-16 bg-[#111114] border border-white/5 rounded-3xl border-dashed">
                    <Server className="w-10 h-10 text-gray-600 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p className="text-sm text-gray-500 font-medium">No active commands routing in the database.</p>
                    <p className="text-[11px] text-gray-600 mt-2 max-w-sm mx-auto">When a user types a command, your bot will simply use the default AI fallback response.</p>
                </div>
              ) : commands.map((cmd) => (
                <div key={cmd.id} className={`bg-[#111114] border border-white/5 hover:border-[#2AABEE]/20 p-4 sm:p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all duration-300 ${cmd.isActive === false ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}>
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#2AABEE]/5 flex items-center justify-center border border-[#2AABEE]/10 shrink-0 shadow-inner">
                      <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-[#2AABEE] opacity-80" aria-hidden="true"/>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className={`text-[14px] sm:text-[16px] font-bold font-mono tracking-tight ${cmd.isActive === false ? 'text-gray-500 line-through' : 'text-white'}`}>{cmd.command}</span>
                        <ChevronRight className="hidden sm:block w-4 h-4 text-gray-600" aria-hidden="true"/>
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 sm:px-3 py-1 rounded-md flex items-center gap-1.5 ${cmd.isActive === false ? 'text-gray-500' : 'text-orange-400'}`}>
                          <Zap className="w-3 h-3" aria-hidden="true"/> {cmd.action}
                        </span>
                        
                        {cmd.isActive === false && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 border border-red-500/30 px-2 py-0.5 rounded bg-red-500/10">Paused</span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1">{cmd.description}</p>
                    </div>
                  </div>

                  {/* Right Side Actions: Toggle + Delete */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">
                            {cmd.isActive !== false ? 'Active' : 'Off'}
                        </span>
                        <div 
                          onClick={() => handleToggleCommandStatus(cmd.id, cmd.isActive)}
                          className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${cmd.isActive !== false ? 'bg-[#2AABEE]' : 'bg-white/10'}`}
                        >
                          <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${cmd.isActive !== false ? 'ml-5' : 'ml-0'}`} />
                        </div>
                    </div>

                    <button 
                      type="button"
                      title={`Delete command ${cmd.command}`} 
                      aria-label={`Delete command ${cmd.command}`}
                      onClick={() => handleDeleteCommand(cmd.id)} 
                      className="p-2 sm:p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors sm:opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest sm:text-transparent"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true"/> <span className="sm:hidden">Delete</span>
                    </button>
                  </div>

                </div>
              ))}
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