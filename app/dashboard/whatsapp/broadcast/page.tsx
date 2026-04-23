"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: WHATSAPP BROADCAST ENGINE
 * ==============================================================================================
 * @file app/dashboard/whatsapp/broadcast/page.tsx
 * @description WhatsApp specific bulk messaging requiring Meta-approved templates.
 * 🚀 SECURED: Full DB sync. Integrated strict backend error handling.
 * 🚀 ISOLATED: Pointed directly to /api/whatsapp/broadcast to prevent mix-ups.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Megaphone, Send, CalendarClock, Users, 
  Activity, CheckCircle2, Clock, BarChart3, 
  AlertCircle, LayoutTemplate, Link as LinkIcon
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; 

interface Campaign {
  id: string | number;
  name: string;
  status: string;
  sent: number;
  opens: string;
  date: string;
}

export default function WhatsAppBroadcast() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [audience, setAudience] = useState('all');
  const [template, setTemplate] = useState('promo_v1');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
      if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // 🚀 FETCH REAL CAMPAIGN HISTORY FROM ISOLATED BACKEND
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/whatsapp/broadcast?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          if (data.success && data.campaigns) {
             setCampaigns(data.campaigns);
          }
        } catch (error) {
          console.error("Failed to load real campaigns", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchCampaigns();
  }, [session, status]);

  // 🚀 DISPATCH REAL CAMPAIGN WITH STRICT ERROR HANDLING
  const handleSendBroadcast = async () => {
    if (!session?.user?.email) return;
    setIsSending(true);
    
    try {
      const res = await fetch("/api/whatsapp/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              email: session.user.email,
              audience: audience,
              template: template,
              name: `Promo: ${template}`
          })
      });

      // Strict error surfacing
      const responseText = await res.text();
      let data;
      try {
          data = JSON.parse(responseText);
      } catch(e) {
          throw new Error(`Server error: ${responseText.substring(0, 50)}...`);
      }

      if (!res.ok || !data.success) {
         throw new Error(data.error || `HTTP Error ${res.status}`);
      }
      
      alert("🟢 WhatsApp Broadcast successfully queued in Database!");
      
      // Re-fetch to get the newly created campaign history
      const refreshRes = await fetch(`/api/whatsapp/broadcast?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success && refreshData.campaigns) setCampaigns(refreshData.campaigns);
      
    } catch (error: any) {
        console.error("Broadcast Dispatch Error:", error);
        alert(`❌ Backend Error: ${error.message || "Network error while dispatching campaign."}`);
    } finally {
        setIsSending(false);
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING CAMPAIGN HISTORY..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#25D366]/30">
      <TopHeader title="WhatsApp Broadcast Engine" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: COMPOSER */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                  <Megaphone className="w-5 h-5 text-[#25D366]"/>
                </div>
                New WhatsApp Campaign
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Dispatch Meta-approved templates to your contacts.</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              
              {/* Target Audience */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">1. Select Target Audience</label>
                <div className="flex flex-wrap gap-3">
                  {[{ id: 'all', label: 'All Contacts', count: 'Active' }, { id: 'active_24h', label: 'Active (Last 24h)', count: 'Filter' }].map((seg) => (
                    <button key={seg.id} onClick={() => setAudience(seg.id)}
                      className={`px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all ${btnHover} ${audience === seg.id ? 'bg-[#25D366]/10 border-[#25D366]/50 text-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.15)]' : 'bg-[#111114] border-white/10 text-gray-400 hover:bg-white/5'}`}>
                      <Users className="w-4 h-4"/> {seg.label} <span className="opacity-50 text-[10px] font-mono">({seg.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">2. Choose Approved Template</label>
                  <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-[#25D366] flex items-center gap-1 hover:text-[#20bd5a] transition-colors">
                    <LinkIcon className="w-3 h-3"/> Meta Template Manager
                  </a>
                </div>
                
                <select 
                  value={template} onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-[#111114] border border-white/10 text-white p-4 rounded-xl text-[13px] outline-none focus:border-[#25D366]/50 cursor-pointer appearance-none transition-colors"
                >
                  <option value="promo_v1">promo_v1 (Marketing - Text + Image)</option>
                  <option value="event_v2">event_v2 (Utility - Text + CTA Button)</option>
                  <option value="welcome_onboard">welcome_onboard (Marketing - Text Only)</option>
                </select>
                
                <div className="mt-4 p-4 bg-black/30 border border-white/5 rounded-xl">
                  <p className="text-[11px] font-mono text-gray-400">Preview: "Hi {'{{1}}'}, we have a special offer running this week! Click below to see."</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button onClick={handleSendBroadcast} disabled={isSending}
                  className={`flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-black py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,211,102,0.2)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSending ? <Activity className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>} {isSending ? "Dispatching to Database..." : "Send Campaign"}
                </button>
                <button className={`flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-white border border-white/10 py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${btnHover}`}>
                  <CalendarClock className="w-5 h-5 text-gray-400"/> Schedule
                </button>
              </div>

            </motion.div>
          </div>

          {/* RIGHT: HISTORY */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-gray-400"/> Campaign History
            </h2>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[550px]">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {campaigns.length === 0 ? (
                    <div className="text-center py-10">
                        <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No campaigns launched yet.</p>
                    </div>
                ) : campaigns.map((camp) => (
                  <div key={camp.id} className="bg-[#111114] border border-white/5 p-4 rounded-2xl hover:border-[#25D366]/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[13px] font-bold text-white truncate max-w-[150px]">{camp.name}</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono mb-3">{camp.date}</p>
                    <div className="flex items-center gap-4 bg-[#07070A] p-3 rounded-xl border border-white/5">
                      <div><p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Sent</p><p className="text-[13px] font-black text-white">{camp.sent.toLocaleString()}</p></div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div><p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Open Rate</p><p className="text-[13px] font-black text-[#25D366]">{camp.opens}</p></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5"/>
                  <p className="text-[10px] text-orange-200 leading-relaxed font-medium">WhatsApp requires active opt-in. Unsolicited templates may decrease your Meta Quality Rating.</p>
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