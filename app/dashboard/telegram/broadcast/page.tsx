"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM BROADCAST ENGINE
 * ==============================================================================================
 * @file app/dashboard/telegram/broadcast/page.tsx
 * @description Advanced bulk messaging system. Replaces email marketing.
 * 🚀 FIXED: Modals changed from absolute to fixed z-[100] to prevent background clipping.
 * 🚀 FIXED: Added type="button" to prevent accidental default behavior.
 * 🚀 SECURED: Real-time PostgreSQL database sync for campaigns. No dummy data.
 * 🛡️ UI POLISH: Added strict TypeScript interfaces and fixed ESLint a11y warnings.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Send, CalendarClock, Users, 
  Image as ImageIcon, Paperclip, Sparkles, Activity,
  CheckCircle2, Clock, BarChart3, X, Film, FileText
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

interface VaultFile {
  id: string;
  type: string;
  name: string;
  size: string;
}

export default function TelegramBroadcast() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State Management
  const [audience, setAudience] = useState('all');
  const [message, setMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const isMounted = useRef(false);

  // Real Database Campaign History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // 🚀 MEDIA PICKER STATE
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // 🚀 SCHEDULE MODAL STATE
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    isMounted.current = true;
    if (status === "unauthenticated") {
        router.replace("/");
    }
    return () => { isMounted.current = false; };
  }, [status, router]);

  const fetchCampaigns = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/broadcast?email=${encodeURIComponent(session.user.email)}&channel=telegram&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        if (!res.ok) throw new Error("Secure fetch failed");
        const data = await res.json();
        if (isMounted.current && data.success && data.campaigns) {
           setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error("[TELEGRAM_CAMPAIGN_ERROR] Failed to load history safely", error);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [session, status]);

  // 🚀 OPEN MEDIA VAULT MODAL (REAL DB)
  const openMediaVault = async (e: React.MouseEvent) => {
      e.preventDefault();
      setShowMediaPicker(true);
      setIsLoadingVault(true);
      if (session?.user?.email) {
          try {
              const res = await fetch(`/api/telegram/media?email=${encodeURIComponent(session.user.email)}`);
              const data = await res.json();
              if (isMounted.current && data.success && data.files) {
                  setVaultFiles(data.files);
              }
          } catch (err) {
              console.error("Failed to fetch vault");
          } finally {
              if (isMounted.current) setIsLoadingVault(false);
          }
      }
  };

  // 🚀 INSERT MEDIA TAG INTO MESSAGE
  const selectMediaForBroadcast = (fileId: string) => {
      setMessage(prev => prev + ` {{media:${fileId}}}`);
      setShowMediaPicker(false);
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  // 🔥 UPGRADED DISPATCH FIX (Handles both Now and Scheduled)
  const executeBroadcast = async (scheduledFor: string | null = null) => {
    if (!message.trim()) {
      alert("Message cannot be empty!");
      return;
    }
    if (!session?.user?.email) return;
    
    setIsSending(true);
    setShowScheduleModal(false); // Close modal automatically
    
    try {
      const payload: any = {
          email: session.user.email,
          channel: "telegram",
          audience: audience,
          message: message,
          name: scheduledFor ? "Scheduled Telegram Broadcast" : "Telegram Mass Broadcast"
      };

      if (scheduledFor) {
          payload.send_at = scheduledFor;
      }

      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
         let errorDetail = `HTTP Error ${res.status}`;
         try {
            const errData = await res.json();
            errorDetail = errData.error || errorDetail;
         } catch(e) {
            errorDetail = await res.text();
         }
         throw new Error(errorDetail);
      }

      const data = await res.json();
      
      if (isMounted.current) setIsSending(false);
      
      if (data.success) {
        if (isMounted.current) setMessage('');
        fetchCampaigns(); // Refresh history instantly from DB
        
        setTimeout(() => {
           alert(scheduledFor ? "📅 Campaign Scheduled successfully!" : "🚀 Telegram Broadcast successfully dispatched!");
        }, 50);
      } else {
        setTimeout(() => {
           alert(`Failed to queue campaign: ${data.error}`);
        }, 50);
      }
    } catch (error: any) {
      console.error("Broadcast Dispatch Error:", error);
      if (isMounted.current) setIsSending(false);
      
      setTimeout(() => {
         alert(`Backend Error: ${error.message || "Failed to reach server."}`);
      }, 50);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-pink-400" aria-hidden="true"/>;
      case 'video': return <Film className="w-5 h-5 text-purple-400" aria-hidden="true"/>;
      case 'document': return <FileText className="w-5 h-5 text-[#2AABEE]" aria-hidden="true"/>;
      default: return <FileText className="w-5 h-5 text-gray-400" aria-hidden="true"/>;
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="LOADING TELEGRAM LOGS..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30 relative">
      <TopHeader title="Telegram Broadcast" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🚀 LEFT COLUMN: COMPOSER */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20">
                  <Megaphone className="w-5 h-5 text-[#2AABEE]" aria-hidden="true"/>
                </div>
                New Telegram Campaign
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Design and dispatch bulk messages to your Telegram bot subscribers.</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
              
              {/* Audience Selector */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">1. Select Audience Segment</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'all', label: 'All Subscribers', count: 'Active' },
                    { id: 'active_24h', label: 'Active (Last 24h)', count: 'Filter' },
                    { id: 'premium_tag', label: 'Tagged: VIP', count: 'Filter' },
                  ].map((seg) => (
                    <button 
                      key={seg.id}
                      type="button"
                      aria-label={`Select audience ${seg.label}`}
                      title={`Select ${seg.label}`}
                      onClick={() => setAudience(seg.id)}
                      className={`px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all ${btnHover} ${
                        audience === seg.id 
                        ? 'bg-[#2AABEE]/10 border-[#2AABEE]/50 text-[#2AABEE] shadow-[0_0_15px_rgba(42,171,238,0.15)]' 
                        : 'bg-[#111114] border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4" aria-hidden="true"/> {seg.label} <span className="opacity-50 text-[10px] font-mono">({seg.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="broadcast-message" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">2. Compose Message</label>
                  <button aria-label="Ask AI to write" title="Ask AI to write message" type="button" className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1 hover:text-orange-300 transition-colors">
                    <Sparkles className="w-3 h-3" aria-hidden="true"/> Ask AI to Write
                  </button>
                </div>
                
                <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#2AABEE]/50 focus-within:shadow-[0_0_20px_rgba(42,171,238,0.1)] transition-all">
                  <textarea 
                    id="broadcast-message"
                    aria-label="Broadcast Message"
                    title="Broadcast Message Input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... Use {{first_name}} to personalize."
                    className="w-full h-[200px] bg-transparent text-[14px] text-white p-5 outline-none resize-none custom-scrollbar"
                  />
                  
                  <div className="bg-[#1A1A1E] border-t border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button aria-label="Attach Media from Vault" title="Attach Media" type="button" onClick={openMediaVault} className="p-2 hover:bg-white/10 rounded-lg text-[#2AABEE] bg-[#2AABEE]/10 transition-colors"><ImageIcon className="w-4 h-4" aria-hidden="true"/></button>
                      <button aria-label="Attach File from Vault" title="Attach File" type="button" onClick={openMediaVault} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"><Paperclip className="w-4 h-4" aria-hidden="true"/></button>
                      <div className="w-px h-5 bg-white/10 mx-2"></div>
                      <button aria-label="Insert First Name Variable" title="Insert First Name" type="button" onClick={() => insertVariable('{{first_name}}')} className="text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-gray-300 transition-colors">+ first_name</button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{message.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button 
                  type="button"
                  aria-label="Dispatch Broadcast Now"
                  title="Send Broadcast Now"
                  onClick={() => executeBroadcast(null)}
                  disabled={isSending}
                  className={`flex-1 bg-[#2AABEE] hover:bg-[#2298D6] text-white py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(42,171,238,0.2)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSending ? <Activity className="w-5 h-5 animate-spin" aria-hidden="true"/> : <Send className="w-5 h-5" aria-hidden="true"/>}
                  {isSending ? "Dispatching..." : "Send Now"}
                </button>
                
                <button 
                  type="button"
                  aria-label="Schedule Broadcast"
                  title="Schedule Broadcast"
                  onClick={(e) => { e.preventDefault(); setShowScheduleModal(true); }}
                  disabled={isSending}
                  className={`flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-white border border-white/10 py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${btnHover}`}
                >
                  <CalendarClock className="w-5 h-5 text-gray-400" aria-hidden="true"/> Schedule
                </button>
              </div>

            </motion.div>
          </div>

          {/* 📊 RIGHT COLUMN: HISTORY */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-gray-400" aria-hidden="true"/> Campaign History
              </h2>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[600px]">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {campaigns.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm text-gray-500">No campaigns launched yet.</p>
                  </div>
                ) : campaigns.map((camp) => (
                  <div key={camp.id} className="bg-[#111114] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[13px] font-bold text-white truncate max-w-[150px]">{camp.name}</h4>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 ${
                        camp.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : camp.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {camp.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" aria-hidden="true"/> : <Clock className="w-3 h-3" aria-hidden="true"/>} {camp.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono mb-3">{camp.date}</p>
                    
                    <div className="flex items-center gap-4 bg-[#07070A] p-3 rounded-xl border border-white/5">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Sent</p>
                        <p className="text-[13px] font-black text-white">{camp.sent.toLocaleString()}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Open Rate</p>
                        <p className="text-[13px] font-black text-[#2AABEE]">{camp.opens}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>

        </div>
      </div>

      {/* 🚀 THE MEDIA PICKER MODAL (In-Page Vault) */}
      <AnimatePresence>
        {showMediaPicker && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                 className="bg-[#0A0A0D] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
               >
                 {/* Modal Header */}
                 <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#111114]">
                     <h3 className="text-[14px] font-black text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#2AABEE]" aria-hidden="true"/> Select Media from Vault
                     </h3>
                     <button aria-label="Close Media Vault" title="Close" type="button" onClick={() => setShowMediaPicker(false)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                        <X className="w-4 h-4" aria-hidden="true"/>
                     </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                     {isLoadingVault ? (
                         <div className="flex flex-col items-center justify-center py-10">
                            <Activity className="w-8 h-8 text-[#2AABEE] animate-spin mb-3" aria-hidden="true"/>
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Accessing Secure Vault...</p>
                         </div>
                     ) : vaultFiles.length === 0 ? (
                         <div className="text-center py-10">
                            <p className="text-sm text-gray-500">Vault is empty. Please upload files in the Media Library first.</p>
                         </div>
                     ) : (
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                             {vaultFiles.map(file => (
                                 <div 
                                    key={file.id} 
                                    onClick={() => selectMediaForBroadcast(file.id)}
                                    className="bg-[#111114] border border-white/5 hover:border-[#2AABEE] p-3 rounded-xl cursor-pointer group transition-all"
                                 >
                                    <div className="bg-[#1A1A1E] h-[80px] rounded-lg flex items-center justify-center mb-3">
                                        {getFileIcon(file.type)}
                                    </div>
                                    <p className="text-[11px] font-bold text-white truncate">{file.name}</p>
                                    <p className="text-[9px] text-gray-500 font-mono mt-1">{file.size}</p>
                                 </div>
                             ))}
                         </div>
                     )}
                  </div>
               </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 INJECTED: SCHEDULE MODAL (FIXED POSITIONING) */}
      <AnimatePresence>
        {showScheduleModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} 
                 className="bg-[#0A0A0D] border border-[#2AABEE]/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(42,171,238,0.1)] overflow-hidden"
               >
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#111114]">
                     <h3 className="text-[14px] font-black text-white flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-[#2AABEE]" aria-hidden="true"/> Schedule Broadcast
                     </h3>
                     <button aria-label="Close Schedule Modal" title="Close" type="button" onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-red-400">
                        <X className="w-4 h-4" aria-hidden="true"/>
                     </button>
                  </div>
                  <div className="p-6 space-y-4">
                     <p className="text-[12px] text-gray-400">Select the exact date and time to dispatch this campaign.</p>
                     <label htmlFor="schedule-date" className="sr-only">Schedule Date</label>
                     <input 
                        id="schedule-date"
                        type="datetime-local" 
                        aria-label="Schedule Date Input"
                        title="Schedule Date Input"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-[#111114] border border-white/10 text-white p-4 rounded-xl outline-none focus:border-[#2AABEE] transition-colors"
                     />
                     <button 
                        type="button"
                        aria-label="Confirm Schedule Broadcast"
                        title="Confirm Schedule"
                        onClick={() => executeBroadcast(scheduleDate)}
                        disabled={!scheduleDate || isSending}
                        className="w-full bg-[#2AABEE] text-white py-4 rounded-xl text-[13px] font-black uppercase tracking-widest disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(42,171,238,0.2)]"
                     >
                        {isSending ? "Processing..." : "Confirm Schedule"}
                     </button>
                  </div>
               </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}