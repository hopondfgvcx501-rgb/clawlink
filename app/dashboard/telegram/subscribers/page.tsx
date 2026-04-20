"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM SUBSCRIBERS CRM
 * ==============================================================================================
 * @file app/dashboard/telegram/subscribers/page.tsx
 * @description Centralized CRM to view and manage all users interacting with the Telegram Bot.
 * 🚀 SECURED: Fetches unique users directly from real chat history interactions.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  UsersRound, Search, Filter, Download, 
  MoreHorizontal, Activity, MessageSquare, Tag
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface Subscriber {
  id: string;
  name: string;
  chatId: string;
  status: string;
  tags: string[];
  lastInteraction: string;
}

export default function TelegramSubscribers() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchSubscribers = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/telegram/subscribers?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        
        if (data.success && data.subscribers) {
          setSubscribers(data.subscribers);
        }
      } catch (error) {
        console.error("Failed to load subscribers", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [session, status]);

  // Filter logic
  const filteredSubscribers = subscribers.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sub.chatId.includes(searchTerm)
  );

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING CRM DATA..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Subscribers" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                  <UsersRound className="w-5 h-5 text-[#2AABEE]"/>
                </div>
                Bot Subscribers CRM
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Manage users who have interacted with your Telegram bot.</p>
            </div>
            
            <button className={`bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 ${btnHover}`}>
              <Download className="w-4 h-4" /> Export List
            </button>
          </div>

          {/* CRM Container */}
          <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[600px]">
            
            {/* Toolbar */}
            <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search by username, name, or Chat ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 text-white text-[13px] rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#2AABEE]/50 transition-colors"
                />
              </div>
              <button className="bg-[#111114] border border-white/10 text-white px-6 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 hover:bg-white/5 transition-colors shrink-0">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111114]/50 border-b border-white/5">
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap">Telegram User</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap">Chat ID</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap">Status</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap">Tags</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap">Last Interaction</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                         <div className="flex flex-col items-center justify-center py-20 text-center">
                            <UsersRound className="w-12 h-12 text-gray-700 mb-4 opacity-50"/>
                            <p className="text-gray-400 font-medium">No Telegram subscribers found.</p>
                            <p className="text-gray-600 text-[12px] mt-1">Users will appear here once they interact with your bot.</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, idx) => (
                      <motion.tr key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-[12px] shrink-0">
                              {sub.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[13px] font-bold text-white">{sub.name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-[12px] text-gray-400 font-mono">{sub.chatId}</td>
                        <td className="p-5">
                          <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-2">
                            {sub.tags.map(tag => (
                              <span key={tag} className="flex items-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded text-[10px] font-mono">
                                <Tag className="w-3 h-3"/> {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-5 text-[12px] text-gray-500 font-mono">{sub.lastInteraction}</td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#2AABEE] transition-colors tooltip-trigger" title="Send Message">
                              <MessageSquare className="w-4 h-4"/>
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors tooltip-trigger" title="More Options">
                              <MoreHorizontal className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}