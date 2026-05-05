"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM LEADS CRM
 * ==============================================================================================
 * @file app/dashboard/instagram/leads/page.tsx
 * @description Real-time CRM for Instagram. Displays captured DM leads, handles, and tags.
 * 🚀 SECURED: Strict real-time database fetch from isolated microservice API.
 * 🚀 FIXED: Upgraded Export CSV with strict string escaping for perfect Excel compatibility.
 * 🚀 FIXED: Restored Premium "Filters" button with animated custom dropdown menu.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Download, MessageCircle, 
  MoreVertical, Filter, Activity, Instagram, Calendar, Tag, Check
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; 

interface IGLead {
  id: string;
  handle: string;
  name: string;
  follower: boolean;
  status: string;
  labels: string[];
  lastActive: string;
}

export default function InstagramLeadsCRM() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [leads, setLeads] = useState<IGLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🚀 ACTIVE FILTERS
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false); // 🔥 For custom dropdown

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH REAL INSTAGRAM LEADS
  useEffect(() => {
    const fetchLeads = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/instagram/leads?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          
          if (!res.ok) throw new Error("Secure fetch failed");

          const data = await res.json();
          if (data.success && data.leads) {
             setLeads(data.leads);
          }
        } catch (error) {
          console.error("Failed to load leads", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchLeads();
  }, [session, status]);

  // 🚀 SMART FILTERING (Search + Status)
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.handle.toLowerCase().includes(searchQuery.toLowerCase()) || l.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 🚀 REAL CSV EXPORT FUNCTIONALITY (Bulletproof Escaping)
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
        alert("No leads available to export.");
        return;
    }
    
    const headers = ["Instagram Profile", "Name", "Follower Status", "Lead Status", "Labels", "Last Interaction Date"];
    
    const escapeCsv = (text: string) => {
        if (!text) return '""';
        return `"${text.replace(/"/g, '""')}"`; // Escapes quotes and commas perfectly for Excel
    };

    const csvRows = filteredLeads.map(l => {
        return [
            escapeCsv(l.handle),
            escapeCsv(l.name),
            escapeCsv(l.follower ? 'Follower' : 'Not Following'),
            escapeCsv(l.status),
            escapeCsv(l.labels.join('; ')), // Labels separated by ;
            escapeCsv(l.lastActive)
        ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ClawLink_IG_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING INSTAGRAM CRM..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="Instagram Leads" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                  <Users className="w-5 h-5 text-pink-500"/>
                </div>
                Leads Database
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Manage prospects captured from Instagram DMs and Story replies.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className={`bg-gradient-to-r from-pink-600 to-pink-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-colors ${btnHover}`}>
                <Download className="w-4 h-4 text-white" /> Export CSV
              </button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by handle or name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-pink-500/50 transition-colors placeholder:text-gray-600"
                />
              </div>
              
              {/* 🔥 PREMIUM CUSTOM FILTER DROPDOWN */}
              <div className="relative">
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-6 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-colors h-full w-full md:w-auto ${btnHover}`}
                >
                  <Filter className="w-4 h-4" /> Filters 
                  {statusFilter !== 'All' && <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded text-[10px] ml-1">{statusFilter}</span>}
                </button>
                
                <AnimatePresence>
                    {isFilterMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-[#111114] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 z-50 overflow-hidden"
                        >
                            {['All', 'Active', 'Inactive', 'Converted'].map((statusOption) => (
                                <button 
                                    key={statusOption}
                                    onClick={() => { setStatusFilter(statusOption); setIsFilterMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-[12px] text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                                >
                                    {statusOption === 'All' ? 'All Statuses' : statusOption}
                                    {statusFilter === statusOption && <Check className="w-3.5 h-3.5 text-pink-500" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#111114] text-[10px] uppercase font-black text-gray-500 tracking-widest border-y border-white/5">
                  <tr>
                    <th className="p-5 pl-6 rounded-tl-xl">Instagram Profile</th>
                    <th className="p-5">Relationship</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Labels</th>
                    <th className="p-5">Last Interaction</th>
                    <th className="p-5 pr-6 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        <Instagram className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-gray-400">No matching leads found.</p>
                        <p className="text-xs mt-1 font-mono">Your AI will capture leads automatically upon interaction.</p>
                      </td>
                    </tr>
                  ) : filteredLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                            {lead.handle.charAt(1).toUpperCase()}
                          </div>
                          <div>
                             <span className="font-bold text-white block">{lead.handle}</span>
                             <span className="text-[10px] text-gray-500 block">{lead.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`text-[11px] font-bold ${lead.follower ? 'text-pink-400' : 'text-gray-500'}`}>
                          {lead.follower ? 'Follower' : 'Not Following'}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${lead.status === 'Active' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : lead.status === 'Converted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 border border-white/5'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          {lead.labels.length === 0 ? <span className="text-[10px] text-gray-600 font-mono">No labels</span> : lead.labels.map((label, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-gray-300 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 opacity-50"/> {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-[12px] text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-600"/> {lead.lastActive}
                      </td>
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Message Lead" onClick={() => router.push(`/dashboard/crm?handle=${lead.handle}`)} className="text-gray-500 hover:text-pink-500 transition-colors p-2 bg-black/40 rounded-lg border border-white/5 hover:border-pink-500/30 shadow-sm">
                            <MessageCircle className="w-4 h-4"/>
                          </button>
                          <button title="More options" className="text-gray-600 hover:text-white transition-colors p-2 bg-black/40 rounded-lg border border-white/5">
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

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}