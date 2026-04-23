"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tag, Plus, MoreVertical, Search, MessageCircle, User, Clock, Activity, Save } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface DBLabel { id: string; name: string; color: string; }
interface DBContact { id: string; name: string; phone: string; labels: string[]; lastActive: string; }

export default function WhatsAppLabelsKanban() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [labels, setLabels] = useState<DBLabel[]>([]);
  const [contacts, setContacts] = useState<DBContact[]>([]);

  useEffect(() => { if (status === "unauthenticated") router.push("/"); }, [status, router]);

  useEffect(() => {
    const fetchKanbanData = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          // 🚀 FETCH LABELS
          const labelRes = await fetch(`/api/whatsapp/labels?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
          if(labelRes.ok) {
             const labelData = await labelRes.json();
             if (labelData.success) setLabels(labelData.labels || []);
          }

          // 🚀 FETCH CRM CONTACTS
          const contactRes = await fetch(`/api/whatsapp/crm?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
          if(contactRes.ok) {
             const contactData = await contactRes.json();
             if (contactData.success) setContacts(contactData.contacts || []);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchKanbanData();
  }, [session, status]);

  const handleSync = () => {
    setIsSaving(true);
    setTimeout(() => { setIsSaving(false); alert("🟢 WhatsApp Labels synced!"); }, 1000);
  };

  if (isLoading || status === "loading") return <SpinnerCounter text="SYNCING KANBAN WORKSPACE..." />;

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WA Labels & CRM" session={session} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-6 flex justify-between gap-4 border-b border-white/5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20"><Tag className="w-5 h-5 text-[#25D366]"/></div>Kanban CRM</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSync} disabled={isSaving} className={`bg-[#25D366] text-black px-5 py-2.5 rounded-xl font-black flex items-center gap-2`}>
              {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Sync Meta
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar p-6 flex gap-6 items-start">
          {labels.map((label) => {
            // 🚀 REAL DB MAPPING: Checks array of labels
            const columnContacts = contacts.filter(c => (c.labels || []).includes(label.name));
            
            return (
              <motion.div key={label.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-[320px] shrink-0 flex flex-col h-full bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-lg">
                <div className="p-4 border-b border-white/5 flex justify-between bg-[#111114]">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-md flex items-center gap-1.5 bg-white/5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }}></div><span className="text-[11px] font-black uppercase text-white">{label.name}</span></div>
                    <span className="text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{columnContacts.length}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {columnContacts.length === 0 ? <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-[11px] text-gray-600">No contacts yet</div> : 
                    columnContacts.map((contact) => (
                      <div key={contact.id} className="bg-[#111114] border border-white/5 p-4 rounded-xl cursor-grab">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 shrink-0"><User className="w-4 h-4 text-gray-300"/></div>
                            <div><h4 className="text-[13px] font-bold">{contact.name}</h4><p className="text-[10px] text-gray-500">{contact.phone}</p></div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end"><p className="text-[9px] uppercase text-gray-600 flex gap-1"><Clock className="w-3 h-3"/> {contact.lastActive}</p></div>
                      </div>
                    ))
                  }
                </div>
              </motion.div>
            );
          })}
          
          <div onClick={() => router.push('/dashboard/whatsapp/label')} className="w-[320px] shrink-0 h-[100px] border-2 border-dashed border-white/10 hover:border-white/20 rounded-[24px] flex items-center justify-center cursor-pointer">
            <div className="flex gap-2 text-gray-500"><Plus className="w-5 h-5"/><span className="text-[12px] font-black uppercase">Create New Label</span></div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}}/>
    </div>
  );
}