"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM BROADCAST ENGINE
 * ==============================================================================================
 * @file app/dashboard/telegram/broadcast/page.tsx
 * @description Advanced bulk messaging system. Replaces email marketing.
 * 🚀 FIXED: Activated Media & Attachment buttons to open an in-page Media Vault Picker.
 * 🚀 FIXED: Resolved button freeze state by resetting UI before the native alert box triggers.
 * 🚀 SECURED: Real-time PostgreSQL database sync for campaigns.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Send, CalendarClock, Users, 
  Image as ImageIcon, Paperclip, Sparkles, Activity,
  CheckCircle2, Clock, BarChart3, AlertCircle, X, Film, FileText
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

export default function TelegramBroadcast() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State Management
  const [audience, setAudience] = useState('all');
  const [message, setMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Real Database Campaign History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // 🚀 MEDIA PICKER STATE
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [vaultFiles, setVaultFiles] = useState<any[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchCampaigns = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/broadcast?email=${encodeURIComponent(session.user.email)}&channel=telegram&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        if (!res.ok) throw new Error("Secure fetch failed");
        const data = await res.json();
        if (data.success && data.campaigns) {
           setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error("[TELEGRAM_CAMPAIGN_ERROR] Failed to load history safely", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [session, status]);

  // 🚀 OPEN MEDIA VAULT MODAL
  const openMediaVault = async () => {
      setShowMediaPicker(true);
      setIsLoadingVault(true);
      if (session?.user?.email) {
          try {
              const res = await fetch(`/api/telegram/media?email=${encodeURIComponent(session.user.email)}`);
              const data = await res.json();
              if (data.success && data.files) setVaultFiles(data.files);
          } catch (err) {
              console.error("Failed to fetch vault");
          } finally {
              setIsLoadingVault(false);
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

  // 🔥 THE INSTA-RESET DISPATCH FIX
  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      alert("Message cannot be empty!");
      return;
    }
    if (!session?.user?.email) return;
    
    setIsSending(true);
    
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          channel: "telegram",
          audience: audience,
          message: message,
          name: "Telegram Mass Broadcast"
        })
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
      
      // ⚡ Reset state BEFORE alert freezes the browser
      setIsSending(false);
      
      if (data.success) {
        setMessage('');
        fetchCampaigns(); // Refresh history
        
        // Micro-delay to allow React to paint the non-loading button state
        setTimeout(() => {
           alert("🚀 Telegram Broadcast successfully dispatched!");
        }, 50);
      } else {
        setTimeout(() => {
           alert(`Failed to queue campaign: ${data.error}`);
        }, 50);
      }
    } catch (error: any) {
      console.error("Broadcast Dispatch Error:", error);
      setIsSending(false);
      
      setTimeout(() => {
         alert(`Backend Error: ${error.message || "Failed to reach server."}`);
      }, 50);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-pink-400"/>;
      case 'video': return <Film className="w-5 h-5 text-purple-400"/>;
      case 'document': return <FileText className="w-5 h-5 text-[#2AABEE]"/>;
      default: return <FileText className="w-5 h-5 text-gray-400"/>;
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
                  <Megaphone className="w-5 h-5 text-[#2AABEE]"/>
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
                      onClick={() => setAudience(seg.id)}
                      className={`px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all ${btnHover} ${
                        audience === seg.id 
                        ? 'bg-[#2AABEE]/10 border-[#2AABEE]/50 text-[#2AABEE] shadow-[0_0_15px_rgba(42,171,238,0.15)]' 
                        : 'bg-[#111114] border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4"/> {seg.label} <span className="opacity-50 text-[10px] font-mono">({seg.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">2. Compose Message</label>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1 hover:text-orange-300 transition-colors">
                    <Sparkles className="w-3 h-3"/> Ask AI to Write
                  </button>
                </div>
                
                <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#2AABEE]/50 focus-within:shadow-[0_0_20px_rgba(42,171,238,0.1)] transition-all">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... Use {{first_name}} to personalize."
                    className="w-full h-[200px] bg-transparent text-[14px] text-white p-5 outline-none resize-none custom-scrollbar"
                  />
                  
                  <div className="bg-[#1A1A1E] border-t border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* 🔥 CONNECTED BUTTONS TO OPEN VAULT */}
                      <button onClick={openMediaVault} className="p-2 hover:bg-white/10 rounded-lg text-[#2AABEE] bg-[#2AABEE]/10 transition-colors tooltip-trigger" title="Attach Media"><ImageIcon className="w-4 h-4"/></button>
                      <button onClick={openMediaVault} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors tooltip-trigger" title="Attach File"><Paperclip className="w-4 h-4"/></button>
                      <div className="w-px h-5 bg-white/10 mx-2"></div>
                      <button onClick={() => insertVariable('{{first_name}}')} className="text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-gray-300 transition-colors">+ first_name</button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">{message.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button 
                  onClick={handleSendBroadcast}
                  disabled={isSending}
                  className={`flex-1 bg-[#2AABEE] hover:bg-[#2298D6] text-white py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(42,171,238,0.2)] disabled:opacity-50 ${btnHover}`}
                >
                  {isSending ? <Activity className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                  {isSending ? "Dispatching..." : "Send Now"}
                </button>
                <button className={`flex-1 bg-[#1A1A1E] hover:bg-[#222228] text-white border border-white/10 py-4 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${btnHover}`}>
                  <CalendarClock className="w-5 h-5 text-gray-400"/> Schedule
                </button>
              </div>

            </motion.div>
          </div>

          {/* 📊 RIGHT COLUMN: HISTORY */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-gray-400"/> Campaign History
              </h2>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[600px]">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {campaigns.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No campaigns launched yet.</p>
                  </div>
                ) : campaigns.map((camp) => (
                  <div key={camp.id} className="bg-[#111114] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[13px] font-bold text-white truncate max-w-[150px]">{camp.name}</h4>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border flex items-center gap-1 ${
                        camp.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {camp.status === 'Completed' ? <CheckCircle2 className="w-3 h-3"/> : <Clock className="w-3 h-3"/>} {camp.status}
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

              <div className="pt-4 border-t border-white/5 mt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"/>
                  <p className="text-[10px] text-blue-200 leading-relaxed font-medium">Telegram allows unlimited broadcasting with no 24h rule restrictions. Maintain message quality to avoid user blocks.</p>
                </div>
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
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            >
               <motion.div 
                 initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                 className="bg-[#0A0A0D] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
               >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#111114]">
                     <h3 className="text-[14px] font-black text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#2AABEE]"/> Select Media from Vault
                     </h3>
                     <button onClick={() => setShowMediaPicker(false)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                        <X className="w-4 h-4"/>
                     </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                     {isLoadingVault ? (
                         <div className="flex flex-col items-center justify-center py-10">
                            <Activity className="w-8 h-8 text-[#2AABEE] animate-spin mb-3"/>
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

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}