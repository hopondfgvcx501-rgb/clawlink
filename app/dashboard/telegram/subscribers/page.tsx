"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM SUBSCRIBERS CRM
 * ==============================================================================================
 * @file app/dashboard/telegram/subscribers/page.tsx
 * @description Advanced CRM table for bot users. Includes Tagging, Banning, and CSV Export.
 * 🚀 SECURED: Real DB fetching from bot_subscribers table.
 * 🚀 PERFORMANCE: Client-side search and filtering for instant UI response.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, Search, Download, Ban, ShieldCheck, 
  Tag, MoreVertical, Activity, MessageSquare
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface Subscriber {
  id: string;
  name: string;
  username: string;
  chatId: string;
  joinedAt: string;
  status: 'active' | 'banned';
  tags: string[];
}

export default function TelegramSubscribers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    if (status === "unauthenticated") router.replace("/");
    return () => { isMounted.current = false; };
  }, [status, router]);

  // 🚀 FETCH SUBSCRIBERS FROM DB
  const fetchSubscribers = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const email = encodeURIComponent(session.user.email);
        const res = await fetch(`/api/telegram/subscribers?email=${email}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        
        if (data.success && data.subscribers) {
            if (isMounted.current) setSubscribers(data.subscribers);
        }
      } catch (error) {
        console.error("[CRM_FETCH_ERROR]", error);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [session, status]);

  // 🚀 HANDLE USER BAN/UNBAN
  const toggleUserStatus = async (chatId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      const actionText = newStatus === 'banned' ? 'ban' : 'unban';
      
      if(!confirm(`Are you sure you want to ${actionText} this user?`)) return;

      // Optimistic update
      setSubscribers(subscribers.map(sub => sub.chatId === chatId ? { ...sub, status: newStatus } : sub));

      try {
          const res = await fetch('/api/telegram/subscribers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  email: session?.user?.email, 
                  action: 'toggle_status',
                  chatId: chatId,
                  status: newStatus
              })
          });
          const data = await res.json();
          if(!data.success) throw new Error(data.error);
      } catch (err: any) {
          alert(`❌ BACKEND ERROR: Failed to ${actionText} user.`);
          // Revert on fail
          setSubscribers(subscribers.map(sub => sub.chatId === chatId ? { ...sub, status: currentStatus as any } : sub));
      }
  };

  // 🚀 CSV EXPORT FUNCTION
  const exportToCSV = () => {
      if (subscribers.length === 0) return;
      setIsExporting(true);

      setTimeout(() => {
          const headers = ["Name", "Username", "Chat ID", "Joined Date", "Status", "Tags"];
          const csvRows = subscribers.map(sub => [
              `"${sub.name}"`,
              `"${sub.username}"`,
              `"${sub.chatId}"`,
              `"${sub.joinedAt}"`,
              `"${sub.status}"`,
              `"${sub.tags.join(', ')}"`
          ].join(','));

          const csvData = [headers.join(','), ...csvRows].join('\n');
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          
          a.setAttribute('hidden', '');
          a.setAttribute('href', url);
          a.setAttribute('download', `clawlink_tg_subs_${new Date().getTime()}.csv`);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setIsExporting(false);
      }, 500); // Small delay for UI feedback
  };

  // Filter Logic
  const filteredSubs = subscribers.filter(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sub.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.chatId.includes(searchQuery)
  );

  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING CRM DATA..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Subscribers CRM" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* HEADER & STATS */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20 shadow-[0_0_20px_rgba(42,171,238,0.15)]">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#2AABEE]" aria-hidden="true"/>
                    </div>
                    Audience CRM
                </h2>
                <p className="text-xs sm:text-[14px] text-gray-400 mt-3 leading-relaxed">
                    Manage your bot subscribers, apply segmentation tags, and export data for external retargeting campaigns.
                </p>
            </div>

            <div className="flex gap-4 shrink-0">
                <div className="bg-[#111114] border border-white/5 rounded-xl px-5 py-3 flex flex-col justify-center">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Audience</p>
                    <p className="text-xl font-black text-white">{subscribers.length}</p>
                </div>
                <div className="bg-[#111114] border border-[#2AABEE]/20 rounded-xl px-5 py-3 flex flex-col justify-center shadow-[0_0_15px_rgba(42,171,238,0.05)]">
                    <p className="text-[10px] uppercase tracking-widest text-[#2AABEE] font-bold mb-1">Active Users</p>
                    <p className="text-xl font-black text-white">{activeCount}</p>
                </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-[#0A0A0D] border border-white/5 rounded-[20px] p-4 shadow-lg">
              <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true"/>
                  <input 
                      type="text" 
                      placeholder="Search by name, @username, or Chat ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[#2AABEE]/50 transition-colors"
                  />
              </div>
              <button 
                  type="button"
                  onClick={exportToCSV}
                  disabled={isExporting || subscribers.length === 0}
                  className={`bg-[#111114] hover:bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 ${btnHover}`}
              >
                  {isExporting ? <Activity className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4 text-[#2AABEE]"/>}
                  {isExporting ? "Exporting..." : "Export CSV"}
              </button>
          </div>

          {/* DATA TABLE */}
          <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-[#111114] border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                              <th className="p-5 font-medium">User Details</th>
                              <th className="p-5 font-medium">Chat ID</th>
                              <th className="p-5 font-medium">Tags</th>
                              <th className="p-5 font-medium">Status</th>
                              <th className="p-5 font-medium text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredSubs.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="py-16 text-center">
                                      <Users className="w-10 h-10 text-gray-600 mx-auto mb-4 opacity-50" aria-hidden="true"/>
                                      <p className="text-sm text-gray-500 font-medium">No subscribers found.</p>
                                  </td>
                              </tr>
                          ) : filteredSubs.map((sub, idx) => (
                              <motion.tr 
                                  initial={{ opacity: 0, y: 10 }} 
                                  animate={{ opacity: 1, y: 0 }} 
                                  transition={{ delay: Math.min(idx * 0.02, 0.5) }} // Cap delay
                                  key={sub.chatId} 
                                  className={`hover:bg-white/[0.02] transition-colors group ${sub.status === 'banned' ? 'opacity-60' : ''}`}
                              >
                                  <td className="p-5">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2AABEE]/20 to-purple-500/20 flex items-center justify-center border border-white/10 font-bold text-[#2AABEE]">
                                              {sub.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                              <p className="text-[14px] font-bold text-white">{sub.name}</p>
                                              <p className="text-[11px] text-gray-500">{sub.username !== 'N/A' ? `@${sub.username}` : 'No Username'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      <span className="bg-black/40 border border-white/5 px-2 py-1 rounded text-[11px] font-mono text-gray-400">
                                          {sub.chatId}
                                      </span>
                                  </td>
                                  <td className="p-5">
                                      <div className="flex flex-wrap gap-2">
                                          {sub.tags.length === 0 ? (
                                              <span className="text-[11px] text-gray-600">-</span>
                                          ) : sub.tags.map(tag => (
                                              <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] px-2 py-0.5 rounded flex items-center gap-1">
                                                  <Tag className="w-2.5 h-2.5"/> {tag}
                                              </span>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="p-5">
                                      {sub.status === 'active' ? (
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                                              <ShieldCheck className="w-3.5 h-3.5"/> Active
                                          </span>
                                      ) : (
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                                              <Ban className="w-3.5 h-3.5"/> Banned
                                          </span>
                                      )}
                                  </td>
                                  <td className="p-5 text-right">
                                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                              type="button" 
                                              title="Send Direct Message"
                                              className="p-2 text-gray-500 hover:text-[#2AABEE] hover:bg-[#2AABEE]/10 rounded-lg transition-colors"
                                          >
                                              <MessageSquare className="w-4 h-4"/>
                                          </button>
                                          <button 
                                              type="button" 
                                              title={sub.status === 'active' ? "Ban User" : "Unban User"}
                                              onClick={() => toggleUserStatus(sub.chatId, sub.status)}
                                              className={`p-2 rounded-lg transition-colors ${sub.status === 'active' ? 'text-gray-500 hover:text-red-500 hover:bg-red-500/10' : 'text-red-500 hover:text-green-500 hover:bg-green-500/10'}`}
                                          >
                                              <Ban className="w-4 h-4"/>
                                          </button>
                                          <button 
                                              type="button" 
                                              title="Manage Tags"
                                              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                          >
                                              <MoreVertical className="w-4 h-4"/>
                                          </button>
                                      </div>
                                  </td>
                              </motion.tr>
                          ))}
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