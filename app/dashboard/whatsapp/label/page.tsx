"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP CHAT LABELS
 * ==============================================================================================
 * @file app/dashboard/whatsapp/labels/page.tsx
 * @description Manage custom CRM labels/tags for WhatsApp contacts.
 * 🚀 BUILT: Connected to real database fetch and creation APIs for WhatsApp labels.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Tag as TagIcon, Plus, Trash2, Activity, 
  Palette, Users, AlertCircle, Save
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface ChatLabel {
  id: string;
  name: string;
  color: string;
  userCount: number;
}

const PRESET_COLORS = [
  "#25D366", // WhatsApp Green
  "#3B82F6", // Blue
  "#A855F7", // Purple
  "#F97316", // Orange
  "#EF4444", // Red
  "#EAB308", // Yellow
];

export default function WhatsAppLabels() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [labels, setLabels] = useState<ChatLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Label State
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  if (status === "unauthenticated") router.push("/");

  // 🚀 FETCH REAL LABELS FROM DB
  useEffect(() => {
    const fetchLabels = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/crm/labels?email=${session.user.email}&channel=whatsapp`);
          const data = await res.json();
          if (data.success && data.labels) {
             setLabels(data.labels);
          }
        } catch (error) {
          console.error("Failed to load labels", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchLabels();
  }, [session, status]);

  // 🚀 SAVE REAL LABEL TO DB
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !session?.user?.email) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/crm/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              email: session.user.email,
              channel: "whatsapp",
              name: newLabelName,
              color: newLabelColor
          })
      });

      const data = await res.json();
      
      if (data.success) {
          // Re-fetch to get real DB IDs
          const refreshRes = await fetch(`/api/crm/labels?email=${session.user.email}&channel=whatsapp`);
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.labels) setLabels(refreshData.labels);
          
          setNewLabelName(""); // Reset input
      } else {
          alert("Failed to create label: " + data.error);
      }
    } catch (error) {
        alert("Network error while creating label.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteLabel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this label? Contacts will keep the tag but it won't be color-coded.")) return;
    
    // Optimistic delete
    setLabels(labels.filter(l => l.id !== id));

    // Optional: Send delete request to API
    // await fetch(`/api/crm/labels?id=${id}`, { method: 'DELETE' });
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-[#25D366] font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        SYNCING WORKSPACE LABELS...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp Chat Labels" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                <TagIcon className="w-5 h-5 text-[#25D366]"/>
              </div>
              Chat Organization
            </h2>
            <p className="text-[13px] text-gray-400 mt-2">Create custom labels to organize your WhatsApp contacts and trigger specific broadcasts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CREATE LABEL SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] sticky top-0">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                  <Plus className="w-4 h-4"/> Create New Label
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Label Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. VIP Customer" 
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#25D366]/50 transition-colors"
                      maxLength={25}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                      <Palette className="w-3 h-3"/> Select Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button 
                          key={color}
                          onClick={() => setNewLabelColor(color)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${newLabelColor === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#0A0A0D] ring-white' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateLabel} 
                    disabled={isSaving || !newLabelName.trim()}
                    className={`w-full bg-[#25D366] hover:bg-[#20bd5a] text-black py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.2)] disabled:opacity-50 disabled:scale-100 ${btnHover}`}
                  >
                    {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    {isSaving ? "Saving..." : "Save Label"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* EXISTING LABELS SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-h-[400px]">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Active Database Labels</h3>
                  <span className="bg-[#111114] border border-white/10 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold">
                    {labels.length} Total
                  </span>
                </div>

                <div className="space-y-3">
                  {labels.length === 0 ? (
                    <div className="text-center py-10">
                      <TagIcon className="w-8 h-8 text-gray-600 mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-gray-500">No labels created yet.</p>
                    </div>
                  ) : labels.map((label) => (
                    <div key={label.id} className="bg-[#111114] border border-white/5 hover:border-white/10 p-4 rounded-2xl flex items-center justify-between group transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-10 rounded-full" style={{ backgroundColor: label.color }}></div>
                        <div>
                          <h4 className="text-[14px] font-bold text-white">{label.name}</h4>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-widest">ID: {label.id.substring(0,8)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5 flex items-center gap-1"><Users className="w-3 h-3"/> Contacts</span>
                          <span className="text-[13px] font-black text-white">{label.userCount.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                        <button onClick={() => handleDeleteLabel(label.id)} className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"/>
                    <p className="text-[11px] text-blue-200/70 leading-relaxed">Labels are automatically synced with your Live CRM Inbox. You can filter contacts by these labels when sending out a Broadcast Campaign.</p>
                  </div>
                </div>

              </div>
            </motion.div>

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