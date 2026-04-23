"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP CRM & CONTACTS
 * ==============================================================================================
 * @file app/dashboard/whatsapp/contacts/page.tsx
 * 🚀 FIXED: Added missing 'Save' icon import that caused the client-side crash on Modal open.
 * 🚀 SECURED: Pointed to isolated API /api/whatsapp/crm.
 * 🚀 UNLOCKED: Real CSV Export compiled directly from DB.
 * 🚀 UNLOCKED: Dynamic 'Add Contact' Modal saving directly to DB.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Download, UserPlus, 
  MessageCircle, MoreVertical, Filter, Activity,
  Phone, Calendar, Tag as TagIcon, X, Check, ChevronDown, Save 
} from "lucide-react"; // 🔥 YAHAN 'Save' MISSING THA! FIX KAR DIYA.
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

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
  
  // States for Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // States for Add Contact Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", status: "Lead" });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchContacts = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/whatsapp/crm?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
           headers: { 'Cache-Control': 'no-store' }
        });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const data = await res.json();
        if (data.success && data.contacts) setContacts(data.contacts);
      } catch (error) {
        console.error("Failed to load contacts", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [session, status]);

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredContacts.length === 0) return alert("⚠️ No data available to export!");
    alert("🟢 Compiling CSV data. Download will start shortly.");
    
    setTimeout(() => {
        try {
            const headers = ["Name", "Phone Number", "Status", "Labels", "Last Interaction"];
            const csvRows = filteredContacts.map(sub => {
                return [
                    `"${sub.name.replace(/"/g, '""')}"`, 
                    `"${sub.phone}"`, 
                    `"${sub.status}"`, 
                    `"${sub.labels.join(" | ")}"`, 
                    `"${sub.lastActive}"`
                ].join(",");
            });

            const csvContent = [headers.join(","), ...csvRows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `ClawLink_WA_CRM_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export Error:", e);
            alert("❌ Failed to compile CSV file.");
        }
    }, 500);
  };

  const handleAddContact = async () => {
    if (!newContact.phone) return alert("⚠️ Phone number is required!");
    setIsSaving(true);
    
    try {
        const res = await fetch("/api/whatsapp/crm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: session?.user?.email,
                name: newContact.name,
                phone: newContact.phone,
                status: newContact.status,
                labels: ["Manual_Add"]
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("🟢 Contact successfully added to Database!");
            setIsAddModalOpen(false);
            setNewContact({ name: "", phone: "", status: "Lead" });
            fetchContacts(); 
        } else {
            alert(`Failed to add: ${data.error}`);
        }
    } catch (error) {
        alert("❌ Server Error while saving contact.");
    } finally {
        setIsSaving(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") return <SpinnerCounter text="SYNCING WHATSAPP CRM..." />;

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp CRM" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
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
              <button onClick={() => setIsAddModalOpen(true)} className={`bg-[#25D366] hover:bg-[#20bd5a] text-black px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-colors ${btnHover}`}>
                <UserPlus className="w-4 h-4" /> Add Contact
              </button>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-h-[500px]">
            
            <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
              <div className="flex-1 relative z-0">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by name or phone number..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-[#25D366]/50 transition-colors placeholder:text-gray-600"
                />
              </div>

              <div className="relative z-10">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`h-full bg-[#111114] border border-white/10 text-white px-6 py-3 rounded-xl text-[12px] font-bold flex items-center justify-between gap-3 min-w-[150px] transition-colors ${
                    filterStatus !== "All" ? "border-[#25D366]/50 text-[#25D366] bg-[#25D366]/5" : "hover:bg-white/5"
                  } ${btnHover}`}
                >
                  <div className="flex items-center gap-2"><Filter className="w-4 h-4" /> {filterStatus}</div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`}/>
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-[200px] bg-[#111114] border border-white/10 rounded-xl shadow-2xl py-2 z-[100]"
                    >
                      {["All", "Active", "Lead", "Inactive"].map((statusOption) => (
                        <div 
                          key={statusOption}
                          onClick={() => { setFilterStatus(statusOption); setIsFilterOpen(false); }}
                          className="px-4 py-2.5 text-[12px] font-bold text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          {statusOption}
                          {filterStatus === statusOption && <Check className="w-4 h-4 text-[#25D366]"/>}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="overflow-x-auto relative z-0">
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
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>No contacts found. Try adjusting filters or add a new contact.</p>
                      </td>
                    </tr>
                  ) : filteredContacts.map((contact, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#25D366] to-emerald-400 flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-inner">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-white">{contact.name}</span>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-gray-400 flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-600"/> {contact.phone}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          contact.status === 'Active' ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20' : 
                          contact.status === 'Lead' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          'bg-gray-800 text-gray-400 border-white/5'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          {contact.labels.map((label, i) => (
                            <span key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-gray-300 flex items-center gap-1 shadow-sm">
                              <TagIcon className="w-2.5 h-2.5 opacity-50"/> {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-[12px] text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-600"/> {contact.lastActive}
                      </td>
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => alert(`Opening WhatsApp Chat with ${contact.name}`)} className="text-gray-500 hover:text-[#25D366] transition-colors p-2 bg-black/40 rounded-lg border border-white/5 shadow-sm">
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

      {/* 🚀 ZINDA 'ADD CONTACT' MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0A0A0D] border border-white/10 rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#25D366]"/> Add New Contact</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full bg-[#111114] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#25D366]/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">WhatsApp Number</label>
                  <input type="text" placeholder="e.g. +1234567890" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full bg-[#111114] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#25D366]/50 font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={newContact.status} onChange={e => setNewContact({...newContact, status: e.target.value})} className="w-full bg-[#111114] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#25D366]/50 appearance-none">
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                <button onClick={() => setIsAddModalOpen(false)} className={`flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-bold transition-colors ${btnHover}`}>Cancel</button>
                <button onClick={handleAddContact} disabled={isSaving} className={`flex-1 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black text-[12px] font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-colors disabled:opacity-50 ${btnHover}`}>
                  {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Contact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}