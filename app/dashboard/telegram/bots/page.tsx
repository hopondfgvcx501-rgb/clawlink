"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM BOT MANAGEMENT
 * ==============================================================================================
 * @file app/dashboard/telegram/bots/page.tsx
 * @description Central control panel for bot settings, webhook status, and command handling.
 * 🚀 SECURED: Directly fetches telegram_token from Master DB (/api/user) to kill the 500 Server Error.
 * 🚀 STRICT: Removed GET request to bot-config to prevent "Invalid Action" crashes on load.
 * 🛡️ UI POLISH: No dummy UI. Backend errors are directly alerted to the CEO.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Bot, Terminal, Plus, Trash2, Power, 
  ShieldCheck, RefreshCcw, Command, Activity, Server, Save
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface BotCommand {
  id: string;
  command: string;
  description: string;
  action: string;
}

export default function TelegramBots() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingCommand, setIsSavingCommand] = useState(false);
  
  const isMounted = useRef(false);

  // Real DB State
  const [botInfo, setBotInfo] = useState({
    username: "ClawLink Node",
    isActive: false,
    hasToken: false
  });
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

  // 🚀 MASTER DB FETCH: Strictly load from validated /api/user source.
  useEffect(() => {
    const fetchMasterData = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const email = encodeURIComponent(session.user.email);
          const t = Date.now();
          
          // 🛑 KILLED the /bot-config GET request that was throwing 500 Invalid Action
          const res = await fetch(`/api/user?email=${email}&t=${t}`, { headers: { 'Cache-Control': 'no-store' } });
          const data = await res.json();
          
          if (data.success && data.data) {
              const userData = data.data;
              
              const hasValidToken = userData.telegram_token && userData.telegram_token.trim() !== "";
              const activeStatus = userData.bot_status?.toLowerCase() === "active";
              const botUsername = userData.tg_username || "ClawLink Node";

              if (isMounted.current) {
                  setBotInfo({
                      username: botUsername,
                      isActive: activeStatus,
                      hasToken: hasValidToken
                  });
                  // If commands exist in DB, parse them. Otherwise default to empty array.
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
          console.error("[TELEGRAM_BOT_ERROR] Failed to load Master DB", error);
        } finally {
          if (isMounted.current) setIsLoading(false);
        }
      }
    };
    fetchMasterData();
  }, [session, status]);

  // 🚀 TOGGLE BOT STATUS
  const handleToggleBot = async () => {
    if(!botInfo.hasToken) {
        alert("System Error: No Telegram Token found in Master DB. Please connect it first.");
        return;
    }
    
    // Optimistic UI update
    setBotInfo(prev => ({ ...prev, isActive: !prev.isActive }));
    
    try {
        const res = await fetch('/api/telegram/bot-config', {
            method: 'POST', // Changed to POST, as PUT might be unsupported depending on backend setup
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: session?.user?.email, 
                action: 'toggle_status', // ✅ STRICT ACTION PASSED
                isActive: !botInfo.isActive 
            })
        });
        const data = await res.json();
        if (!data.success) {
            alert("❌ BACKEND ERROR: " + (data.error || "Failed to toggle status."));
            setBotInfo(prev => ({ ...prev, isActive: !prev.isActive })); // Revert on fail
        }
    } catch(err: any) {
        alert("❌ NETWORK ERROR: " + err.message);
        setBotInfo(prev => ({ ...prev, isActive: !prev.isActive }));
    }
  };

  // 🚀 REAL SYNC WEBHOOK
  const handleSyncWebhook = async () => {
      if(!botInfo.hasToken) {
          alert("Cannot sync webhook. Token missing in Master DB.");
          return;
      }
      setIsSyncing(true);
      try {
          const res = await fetch('/api/telegram/bot-config', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  email: session?.user?.email, 
                  action: 'sync_webhook' // ✅ STRICT ACTION PASSED
              })
          });
          const data = await res.json();
          if (data.success) {
              alert("🟢 REAL SYNC: Telegram Webhook successfully synchronized to ClawLink Servers!");
          } else {
              alert("❌ BACKEND ERROR: " + (data.error || "Failed to sync webhook. Check logs."));
          }
      } catch (err: any) {
          alert("❌ NETWORK ERROR: " + err.message);
      } finally {
          if (isMounted.current) setIsSyncing(false);
      }
  };

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
            action: 'add_command', // ✅ STRICT ACTION PASSED
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
            method: 'POST', // standardizing on POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: session?.user?.email, 
                action: 'delete_command', // ✅ STRICT ACTION PASSED
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
    return <SpinnerCounter text="VERIFYING MASTER DB STATUS..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Bots" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🤖 LEFT: BOT IDENTITY & STATUS */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden">
              
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#2AABEE]/20 to-transparent"></div>
              
              <div className="relative mt-4 mb-4">
                <div className="w-24 h-24 rounded-3xl bg-[#111114] border border-[#2AABEE]/30 flex items-center justify-center shadow-[0_0_30px_rgba(42,171,238,0.2)]">
                  <Bot className="w-12 h-12 text-[#2AABEE]" />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-[#0A0A0D] flex items-center justify-center ${botInfo.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                  {botInfo.isActive ? <ShieldCheck className="w-3 h-3 text-black"/> : <Power className="w-3 h-3 text-white"/>}
                </div>
              </div>

              <h2 className="text-xl font-black text-white tracking-wide">{botInfo.username}</h2>
              
              {!botInfo.hasToken ? (
                  <p className="text-[12px] font-bold text-red-500 mt-1 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-md border border-red-500/20">Missing DB Token</p>
              ) : (
                  <p className="text-[12px] font-mono text-[#2AABEE] mt-1">Token Verified in Master DB</p>
              )}

              <div className="w-full mt-8 space-y-3">
                <button 
                  onClick={handleToggleBot}
                  title={botInfo.isActive ? "Pause Bot Engine" : "Activate Engine"}
                  aria-label="Toggle Bot Engine Status"
                  className={`w-full py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    botInfo.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                  } ${btnHover}`}
                >
                  <Power className="w-4 h-4"/> {botInfo.isActive ? 'Pause Bot Engine' : 'Activate Engine'}
                </button>
                <button 
                  onClick={handleSyncWebhook} 
                  disabled={isSyncing || !botInfo.hasToken} 
                  title="Sync Webhook to Real API"
                  aria-label="Synchronize Webhook"
                  className={`w-full bg-[#111114] hover:bg-white/5 border border-white/10 text-white py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 ${btnHover}`}
                >
                  {isSyncing ? <Activity className="w-4 h-4 animate-spin text-[#2AABEE]"/> : <RefreshCcw className="w-4 h-4 text-gray-400"/>} 
                  {isSyncing ? "Syncing..." : "Sync Webhook (Real API)"}
                </button>
              </div>
            </motion.div>
          </div>

          {/* ⚡ RIGHT: COMMAND MANAGER */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Terminal className="w-6 h-6 text-[#2AABEE]"/> Command Router
                  </h3>
                  <p className="text-[13px] text-gray-400 mt-2">Define what happens when users type specific commands (e.g. /start).</p>
                </div>
              </div>

              {/* Add New Command Form */}
              <div className="bg-[#111114] border border-white/10 p-5 rounded-2xl mb-8 flex flex-col gap-4 shadow-inner">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#2AABEE] flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Register New Command
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="new-cmd-name" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Command</label>
                    <input 
                      id="new-cmd-name"
                      type="text" 
                      title="New Command Name"
                      aria-label="New Command Name"
                      placeholder="/help" 
                      value={newCommand.command} 
                      onChange={(e)=> setNewCommand({...newCommand, command: e.target.value})} 
                      className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono outline-none focus:border-[#2AABEE]/50" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="new-cmd-desc" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Menu Description</label>
                    <input 
                      id="new-cmd-desc"
                      type="text" 
                      title="New Command Description"
                      aria-label="New Command Description"
                      placeholder="Get support information" 
                      value={newCommand.description} 
                      onChange={(e)=> setNewCommand({...newCommand, description: e.target.value})} 
                      className="w-full bg-[#0A0A0D] border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/50" 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor="new-cmd-action" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Action Routing</label>
                    <div className="flex gap-4">
                        <select 
                          id="new-cmd-action"
                          title="Select action routing" 
                          aria-label="Select action routing"
                          value={newCommand.action} 
                          onChange={(e)=> setNewCommand({...newCommand, action: e.target.value})} 
                          className="flex-1 bg-[#0A0A0D] border border-[#2AABEE]/30 rounded-lg p-2.5 text-sm text-white outline-none focus:border-[#2AABEE]/80"
                        >
                            <option value="Trigger Flow: Welcome">Trigger Flow: Welcome</option>
                            <option value="Trigger Flow: Sales">Trigger Flow: Sales</option>
                            <option value="Reply: Text Menu">Reply: Text Menu</option>
                        </select>
                        <button 
                          onClick={handleAddCommand} 
                          disabled={isSavingCommand} 
                          title="Add Command"
                          aria-label="Add Command"
                          className={`bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] border border-[#2AABEE]/20 px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(42,171,238,0.15)] disabled:opacity-50 ${btnHover}`}
                        >
                            {isSavingCommand ? <Activity className="w-4 h-4 animate-spin"/> : "Add"}
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {commands.length === 0 ? (
                  <div className="text-center py-10">
                      <Server className="w-8 h-8 text-gray-600 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-gray-500">No commands registered in the database.</p>
                  </div>
                ) : commands.map((cmd) => (
                  <div key={cmd.id} className="bg-[#111114] border border-white/5 hover:border-white/10 p-5 rounded-2xl flex items-center justify-between group transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shrink-0">
                        <Command className="w-4 h-4 text-[#2AABEE]"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[14px] font-bold text-white font-mono">{cmd.command}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                            {cmd.action}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500">{cmd.description}</p>
                      </div>
                    </div>
                    <button 
                      title="Delete command" 
                      aria-label="Delete Command"
                      onClick={() => handleDeleteCommand(cmd.id)} 
                      className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
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