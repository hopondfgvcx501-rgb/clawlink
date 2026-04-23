"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Tag as TagIcon, Plus, Trash2, Activity, Palette, Users, AlertCircle, Save } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface ChatLabel { id: string; name: string; color: string; userCount: number; }
const PRESET_COLORS = ["#25D366", "#3B82F6", "#A855F7", "#F97316", "#EF4444", "#EAB308"];

export default function WhatsAppLabelsList() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [labels, setLabels] = useState<ChatLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);

  if (status === "unauthenticated") router.push("/");

  const fetchLabels = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        // 🚀 ISOLATED API HIT
        const res = await fetch(`/api/whatsapp/labels?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.success && data.labels) setLabels(data.labels);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => { fetchLabels(); }, [session, status]);

  // 🚀 FIXED: STREAM CRASH IN POST
  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !session?.user?.email) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/whatsapp/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email, name: newLabelName, color: newLabelColor })
      });

      const responseText = await res.text();
      if (!res.ok) throw new Error(`API Error ${res.status}: Is your backend deployed?`);
      
      const data = JSON.parse(responseText);
      if (data.success) {
          await fetchLabels(); 
          setNewLabelName(""); 
      } else {
          alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
        alert(`❌ Error: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  // 🚀 FIXED: STREAM CRASH IN DELETE
  const handleDeleteLabel = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    setLabels(labels.filter(l => l.id !== id));
    try {
        const res = await fetch(`/api/whatsapp/labels`, { 
            method: 'DELETE',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, labelId: id })
        });
        if (!res.ok) throw new Error("Delete failed");
    } catch (e) {
        fetchLabels(); 
    }
  };

  if (isLoading || status === "loading") return <SpinnerCounter text="SYNCING WORKSPACE LABELS..." />;
  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp Chat Labels" session={session} />
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto space-y-8">
          <div><h2 className="text-2xl font-black text-white flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20"><TagIcon className="w-5 h-5 text-[#25D366]"/></div>Chat Organization</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-lg">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2"><Plus className="w-4 h-4"/> Create New Label</h3>
                <div className="space-y-5">
                  <input type="text" placeholder="e.g. VIP Customer" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} className="w-full bg-[#111114] border border-white/10 rounded-xl p-3 text-sm text-white outline-none" maxLength={25} />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button key={color} onClick={() => setNewLabelColor(color)} className={`w-8 h-8 rounded-full ${newLabelColor === color ? 'scale-110 ring-2 ring-white' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <button onClick={handleCreateLabel} disabled={isSaving || !newLabelName.trim()} className={`w-full bg-[#25D366] text-black py-3 rounded-xl font-black uppercase tracking-widest flex justify-center gap-2 ${btnHover}`}>
                    {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} {isSaving ? "Saving..." : "Save Label"}
                  </button>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-lg min-h-[400px]">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"><h3 className="text-[11px] font-black uppercase text-gray-500">Active Database Labels</h3><span className="bg-[#111114] px-3 py-1 rounded-full text-[10px] font-bold">{labels.length} Total</span></div>
                <div className="space-y-3">
                  {labels.length === 0 ? <div className="text-center py-10"><p className="text-sm text-gray-500">No labels created yet.</p></div> : labels.map((label) => (
                    <div key={label.id} className="bg-[#111114] border border-white/5 p-4 rounded-2xl flex justify-between">
                      <div className="flex items-center gap-4"><div className="w-3 h-10 rounded-full" style={{ backgroundColor: label.color }}></div><div><h4 className="text-[14px] font-bold">{label.name}</h4></div></div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end"><span className="text-[10px] uppercase text-gray-500">Contacts</span><span className="text-[13px] font-black">{label.userCount}</span></div>
                        <button onClick={() => handleDeleteLabel(label.id)} className="text-gray-600 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}}/>
    </div>
  );
}