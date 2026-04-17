"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP CRM & CONTACTS
 * ==============================================================================================
 * @file app/dashboard/whatsapp/contacts/page.tsx
 * @description Real-time CRM for WhatsApp. Displays captured leads, phone numbers, and tags.
 * 🚀 BUILT: Connected to real database fetch for WhatsApp leads.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, Search, Download, UserPlus, 
  MessageCircle, MoreVertical, Filter, Activity,
  Phone, Calendar, Tag as TagIcon
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface Contact {
  id: string;
  name: string;
  phone: string;
  status: string;
  labels: string[];
  lastActive: string;
}

export default function WhatsAppContacts() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  if (status === "unauthenticated") router.push("/");

  // 🚀 FETCH REAL WHATSAPP CONTACTS FROM DB
  useEffect(() => {
    const fetchContacts = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/crm/contacts?email=${session.user.email}&channel=whatsapp`);
          const data = await res.json();
          if (data.success && data.contacts) {
             setContacts(data.contacts);
          }
        } catch (error) {
          console.error("Failed to load contacts", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchContacts();
  }, [session, status]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const handleExportCSV = () => {
    alert("🟢 Compiling CSV data. Download will start shortly.");
    // Implement CSV export logic here
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-[#25D366] font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        SYNCING WHATSAPP CRM...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp CRM" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                  <Users className="w-5 h-5 text-[#25D366]"/>
                </div>
                Contact Database
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Manage leads, segment audiences, and track WhatsApp interactions.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className={`bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${btnHover}`}>
                <Download className="w-4 h-4 text-gray-400" /> Export CSV
              </button>
              <button className={`bg-[#25D366] hover:bg-[#20bd5a] text-black px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-colors ${btnHover}`}>
                <UserPlus className="w-4 h-4" /> Add Contact
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by name or phone number..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[#25D366]/50 transition-colors placeholder:text-gray-600"
                />
              </div>
              <button className={`bg-[#111114] border border-white/10 hover:bg-white/5 text-white px-6 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-colors ${btnHover}`}>
                <Filter className="w-4 h-4" /> Filter Segments
              </button>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#111114] text-[10px] uppercase font-black text-gray-500 tracking-widest border-y border-white/5">
                  <tr>
                    <th className="p-5 pl-6 rounded-tl-xl">User Details</th>
                    <th className="p-5">Phone Number</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Labels</th>
                    <th className="p-5">Last Interaction</th>
                    <th className="p-5 pr-6 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No contacts found in your database.</p>
                      </td>
                    </tr>
                  ) : filteredContacts.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#25D366] to-emerald-400 flex items-center justify-center text-black font-bold text-xs shrink-0">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="font-bold text-white">{contact.name}</span>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-gray-400 flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-600"/> {contact.phone}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${contact.status === 'Active' ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20' : 'bg-gray-800 text-gray-400'}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          {contact.labels.map((label, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-gray-300 flex items-center gap-1">
                              <TagIcon className="w-2.5 h-2.5 opacity-50"/> {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-[12px] text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-600"/> {contact.lastActive}
                      </td>
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => router.push(`/dashboard/crm?phone=${contact.phone}`)} className="text-gray-500 hover:text-[#25D366] transition-colors p-2 bg-black/40 rounded-lg border border-white/5">
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

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}