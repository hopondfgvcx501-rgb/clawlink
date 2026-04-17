"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM GROUPS & CHANNELS MANAGER
 * ==============================================================================================
 * @file app/dashboard/telegram/groups/page.tsx
 * @description Control panel for Telegram groups and channels where the bot is an admin.
 * 🚀 SECURED: Fetches live connected groups from the database.
 * 🚀 UPGRADED: No dummy data. Direct API sync for moderation rules.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  UsersRound, ShieldAlert, Link as LinkIcon, 
  MessageSquare, RefreshCcw, Activity, ShieldCheck,
  Settings2, Trash2
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface TelegramGroup {
  id: string;
  groupId: string;
  name: string;
  type: 'group' | 'channel';
  members: number;
  autoDeleteLinks: boolean;
  antiSpam: boolean;
  welcomeMessage: boolean;
}

export default function TelegramGroups() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [groups, setGroups] = useState<TelegramGroup[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE REAL-TIME FETCH LOGIC
  useEffect(() => {
    const fetchGroups = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/telegram/groups?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          
          if (!res.ok) throw new Error("Secure fetch failed");
          
          const data = await res.json();
          if (data.success && data.groups) {
             setGroups(data.groups);
          }
        } catch (error) {
          console.error("[TELEGRAM_GROUPS_ERROR] Failed to load secure group data", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchGroups();
  }, [session, status]);

  // 🚀 UPDATE MODERATION SETTINGS IN DB
  const handleToggleRule = async (groupId: string, rule: keyof TelegramGroup) => {
    // Optimistic update
    const updatedGroups = groups.map(g => {
      if (g.groupId === groupId) {
        return { ...g, [rule]: !g[rule] };
      }
      return g;
    });
    setGroups(updatedGroups);

    try {
      await fetch('/api/telegram/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, groupId, rule, value: !groups.find(g => g.groupId === groupId)?.[rule] })
      });
    } catch (error) {
      console.error("Failed to sync rule state");
    }
  };

  const handleSyncGroups = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/telegram/groups/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email })
      });
      const data = await res.json();
      if(data.success && data.groups) {
        setGroups(data.groups);
        alert("🟢 Telegram groups successfully synchronized!");
      }
    } catch (err) {
      alert("Failed to sync groups from Telegram servers.");
    } finally {
      setIsSyncing(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-[#2AABEE] font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        SYNCING TELEGRAM GROUPS...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Groups & Channels" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                  <UsersRound className="w-5 h-5 text-[#2AABEE]"/>
                </div>
                Group & Channel Moderation
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Manage AI moderation rules for communities where your bot is an admin.</p>
            </div>
            
            <button onClick={handleSyncGroups} disabled={isSyncing} className={`bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(42,171,238,0.3)] disabled:opacity-50 ${btnHover}`}>
              {isSyncing ? <Activity className="w-4 h-4 animate-spin"/> : <RefreshCcw className="w-4 h-4" />} 
              {isSyncing ? "Fetching..." : "Sync Communities"}
            </button>
          </div>

          {/* Communities List */}
          <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden min-h-[500px] p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Connected Communities</h3>
              <span className="bg-[#111114] border border-white/10 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold">
                {groups.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {groups.length === 0 ? (
                <div className="text-center py-16">
                  <ShieldAlert className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-50" />
                  <p className="text-[14px] font-bold text-gray-300">No communities found.</p>
                  <p className="text-[12px] text-gray-500 mt-2 max-w-md mx-auto">Add your bot as an Administrator to any Telegram Group or Channel, then click "Sync Communities" to see them here.</p>
                </div>
              ) : groups.map((group) => (
                <motion.div key={group.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111114] border border-white/5 hover:border-[#2AABEE]/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors group">
                  
                  {/* Community Info */}
                  <div className="flex items-center gap-4 md:w-1/3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-[14px] shrink-0 border border-white/10">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white leading-tight">{group.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                          {group.type}
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                          <UsersRound className="w-3 h-3"/> {group.members.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                    
                    {/* Auto-Delete Links */}
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-orange-400"/>
                        <span className="text-[11px] font-bold text-gray-300">Block Links</span>
                      </div>
                      <div onClick={() => handleToggleRule(group.groupId, 'autoDeleteLinks')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${group.autoDeleteLinks ? 'bg-orange-500' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${group.autoDeleteLinks ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                    {/* Anti-Spam */}
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400"/>
                        <span className="text-[11px] font-bold text-gray-300">Anti-Spam</span>
                      </div>
                      <div onClick={() => handleToggleRule(group.groupId, 'antiSpam')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${group.antiSpam ? 'bg-green-500' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${group.antiSpam ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                    {/* Welcome Messages */}
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400"/>
                        <span className="text-[11px] font-bold text-gray-300">Welcome MSG</span>
                      </div>
                      <div onClick={() => handleToggleRule(group.groupId, 'welcomeMessage')} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${group.welcomeMessage ? 'bg-[#2AABEE]' : 'bg-white/10'}`}>
                        <motion.div layout className={`w-3 h-3 bg-white rounded-full shadow-sm ${group.welcomeMessage ? 'ml-4' : 'ml-0'}`} />
                      </div>
                    </div>

                  </div>

                </motion.div>
              ))}
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