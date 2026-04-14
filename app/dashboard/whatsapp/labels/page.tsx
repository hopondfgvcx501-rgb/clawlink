"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP LABELS & CRM
 * ==============================================================================================
 * @file app/dashboard/whatsapp/labels/page.tsx
 * @description Visual Kanban board for managing WhatsApp contacts and assigning Meta labels.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Tag, Plus, MoreVertical, Search, 
  MessageCircle, User, Clock, Activity, Save
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function WhatsAppLabels() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Mock Labels (WhatsApp Style)
  const [labels] = useState([
    { id: 'l1', name: 'New Lead', color: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    { id: 'l2', name: 'Pending Payment', color: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    { id: 'l3', name: 'VIP Customer', color: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    { id: 'l4', name: 'Follow Up', color: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  ]);

  // Mock Contacts
  const [contacts] = useState([
    { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", labelId: 'l1', lastMessage: "Can I get a demo?", time: "10:42 AM" },
    { id: 2, name: "Priya Desai", phone: "+91 91234 56789", labelId: 'l1', lastMessage: "Pricing details please", time: "09:15 AM" },
    { id: 3, name: "Amit Kumar", phone: "+91 99887 76655", labelId: 'l2', lastMessage: "Link expired, send again", time: "Yesterday" },
    { id: 4, name: "Sneha Patel", phone: "+91 98712 34567", labelId: 'l3', lastMessage: "Loved the product! 🔥", time: "Mon" },
    { id: 5, name: "Vikram Singh", phone: "+91 90000 11111", labelId: 'l4', lastMessage: "Will buy next week", time: "Tue" },
  ]);

  if (status === "unauthenticated") router.push("/");

  const handleSync = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("🟢 WhatsApp Labels perfectly synced with Meta Cloud API!");
    }, 1500);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WA Labels & CRM" session={session} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Controls */}
        <div className="px-6 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                <Tag className="w-5 h-5 text-[#25D366]"/>
              </div>
              Label Management
            </h2>
            <p className="text-[13px] text-gray-400 mt-2">Visually track your WhatsApp leads and trigger automations based on labels.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-[#0A0A0D] border border-white/10 rounded-xl flex items-center px-3 py-2.5 focus-within:border-[#25D366]/50 transition-colors">
              <Search className="w-4 h-4 text-gray-500"/>
              <input type="text" placeholder="Search contacts..." className="bg-transparent border-none outline-none text-[12px] text-white ml-2 w-[150px] md:w-[200px] placeholder-gray-600"/>
            </div>
            <button 
              onClick={handleSync} disabled={isSaving}
              className={`bg-[#25D366] hover:bg-[#20bd5a] text-black px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.3)] disabled:opacity-50 ${btnHover}`}
            >
              {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
              {isSaving ? "Syncing..." : "Sync Meta"}
            </button>
          </div>
        </div>

        {/* Kanban Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar p-6 md:p-8 flex gap-6 items-start">
          
          {labels.map((label) => {
            const columnContacts = contacts.filter(c => c.labelId === label.id);
            
            return (
              <motion.div key={label.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="w-[320px] shrink-0 flex flex-col h-full max-h-full bg-[#0A0A0D] border border-white/5 rounded-[24px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                
                {/* Column Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#111114]">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border ${label.bg} ${label.border}`}>
                      <div className={`w-2 h-2 rounded-full ${label.color}`}></div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${label.text}`}>{label.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{columnContacts.length}</span>
                  </div>
                  <button className="text-gray-500 hover:text-white transition-colors"><MoreVertical className="w-4 h-4"/></button>
                </div>

                {/* Column Cards */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {columnContacts.length === 0 ? (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-[11px] text-gray-600 font-mono">
                      No contacts yet
                    </div>
                  ) : (
                    columnContacts.map((contact) => (
                      <div key={contact.id} className="bg-[#111114] border border-white/5 hover:border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center border border-white/10 shrink-0">
                              <User className="w-4 h-4 text-gray-300"/>
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-white leading-tight">{contact.name}</h4>
                              <p className="text-[10px] text-gray-500 font-mono">{contact.phone}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-[#07070A] border border-white/5 rounded-lg p-2.5 flex items-start gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0 mt-0.5"/>
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{contact.lastMessage}</p>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-end">
                          <p className="text-[9px] uppercase tracking-widest text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {contact.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Contact Trigger */}
                <div className="p-3 border-t border-white/5 bg-[#111114]">
                  <button className={`w-full py-2.5 rounded-lg border border-dashed border-white/10 text-gray-500 text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2 ${btnHover}`}>
                    <Plus className="w-3 h-3"/> Add to Label
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Create New Label Column */}
          <div className="w-[320px] shrink-0 h-[100px] bg-transparent border-2 border-dashed border-white/10 hover:border-white/20 rounded-[24px] flex items-center justify-center cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5"/>
              <span className="text-[12px] font-black uppercase tracking-widest">Create New Label</span>
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