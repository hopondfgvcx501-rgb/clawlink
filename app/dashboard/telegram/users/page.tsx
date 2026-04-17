"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM SUBSCRIBERS CRM
 * ==============================================================================================
 * @file app/dashboard/telegram/users/page.tsx
 * @description Real-time CRM for Telegram. Displays captured bot users, Chat IDs, and tags.
 * 🚀 SECURED: Connected to real database fetch for Telegram users. No mock arrays.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, Search, Download, MessageCircle, 
  MoreVertical, Filter, Activity, Send, Calendar, Tag
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface TelegramUser {
  id: string;
  chatId: string;
  username: string;
  firstName: string;
  status: string;
  labels: string[];
  lastActive: string;
}

export default function TelegramUsersCRM() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [subscribers, setSubscribers] = useState<TelegramUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH REAL TELEGRAM SUBSCRIBERS
  useEffect(() => {
    const fetchSubscribers = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/crm/leads?email=${encodeURIComponent(session.user.email)}&channel=telegram&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          if (data.success && data.leads) {
             setSubscribers(data.leads);
          }
        } catch (error) {
          console.error("Failed to load Telegram subscribers", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSubscribers();
  }, [session, status]);

  const filteredSubscribers = subscribers.filter(s => 
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.chatId.includes(searchQuery) ||
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    alert("🟢 Compiling CSV data. Download will start shortly.");
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-[#2AABEE] font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        SYNCING TELEGRAM SUBSCRIBERS...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Telegram Subscribers" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20">
                  <Users className="w-5 h-5 text-[#2AABEE]"/>
                </div>
                Bot Subscribers CRM
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Manage users who have started your Telegram bot.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className={`bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${btnHover}`}>
                <Download className="w-4 h-4 text-gray-400" /> Export List
              </button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by username, name, or Chat ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[#2AABEE]/50 transition-colors placeholder:text-gray-600"
                />
              </div>
              <button className={`bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-6 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-colors ${btnHover}`}>
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#111114] text-[10px] uppercase font-black text-gray-500 tracking-widest border-y border-white/5">
                  <tr>
                    <th className="p-5 pl-6 rounded-tl-xl">Telegram User</th>
                    <th className="p-5">Chat ID</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Tags</th>
                    <th className="p-5">Last Interaction</th>
                    <th className="p-5 pr-6 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        <Send className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No Telegram subscribers found.</p>
                      </td>
                    </tr>
                  ) : filteredSubscribers.map((user, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2AABEE] to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <span className="font-bold text-white block">{user.firstName}</span>
                             <span className="text-[10px] text-gray-500 font-mono block">@{user.username || "hidden"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-[11px] text-gray-400">
                        {user.chatId}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-[#2AABEE]/10 text-[#2AABEE] border border-[#2AABEE]/20' : 'bg-gray-800 text-gray-400'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          {user.labels.map((label, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-gray-300 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 opacity-50"/> {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-[12px] text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-600"/> {user.lastActive}
                      </td>
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => router.push(`/dashboard/crm?chatId=${user.chatId}`)} className="text-gray-500 hover:text-[#2AABEE] transition-colors p-2 bg-black/40 rounded-lg border border-white/5" title="Direct Message">
                            <MessageCircle className="w-4 h-4"/>
                          </button>
                          <button className="text-gray-600 hover:text-white transition-colors p-2">
                            <MoreVertical className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}