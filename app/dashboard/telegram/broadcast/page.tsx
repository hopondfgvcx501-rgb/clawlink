"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM BROADCAST ENGINE
 * ==============================================================================================
 * @file app/dashboard/telegram/broadcast/page.tsx
 * @description Advanced bulk messaging system. Replaces email marketing.
 * Allows segmenting users, personalizing messages with variables, and tracking campaign stats.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Megaphone, Send, CalendarClock, Users, 
  Image as ImageIcon, Paperclip, Smile, Activity,
  CheckCircle2, Clock, BarChart3, AlertCircle, Sparkles
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function TelegramBroadcast() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State Management
  const [audience, setAudience] = useState('all'); // all, active_24h, premium_tag
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mock Campaign History
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: "Flash Sale Alert", status: "Completed", sent: 4208, opens: "89%", date: "2 hours ago" },
    { id: 2, name: "Product Update V2", status: "Completed", sent: 3910, opens: "92%", date: "Yesterday" },
    { id: 3, name: "Webinar Reminder", status: "Scheduled", sent: 0, opens: "-", date: "Tomorrow, 10 AM" },
  ]);

  if (status === "unauthenticated") {
    router.push("/");
  }

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  const handleSendBroadcast = () => {
    if (!message.trim()) {
      alert("Message cannot be empty!");
      return;
    }
    
    setIsSending(true);
    
    // Simulate API Call to Telegram Bulk Endpoint
    setTimeout(() => {
      setIsSending(false);
      const newCampaign = {
        id: Date.now(),
        name: "Quick Broadcast",
        status: "Completed",
        sent: audience === 'all' ? 4208 : 1050, // Mock numbers based on segment
        opens: "Wait...",
        date: "Just now"
      };
      setCampaigns([newCampaign, ...campaigns]);
      setMessage('');
      alert("🚀 Broadcast successfully dispatched to Telegram API!");
    }, 1500);
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Broadcast Engine" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🚀 LEFT COLUMN: COMPOSER (Takes 2/3 space) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Area */}
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center border border-[#2AABEE]/20">
                  <Megaphone className="w-5 h-5 text-[#2AABEE]"/>
                </div>
                New Campaign
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Design and dispatch bulk messages to your Telegram bot subscribers.</p>
            </div>

            {/* Composer Box */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
              
              {/* Audience Selector */}
              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">1. Select Audience Segment</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'all', label: 'All Subscribers', count: '4,208' },
                    { id: 'active_24h', label: 'Active (Last 24h)', count: '1,050' },
                    { id: 'premium_tag', label: 'Tagged: VIP', count: '342' },
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
                  <button className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1 hover:text-orange-300">
                    <Sparkles className="w-3 h-3"/> Ask AI to Write
                  </button>
                </div>
                
                <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#2AABEE]/50 focus-within:shadow-[0_0_20px_rgba(42,171,238,0.1)] transition-all">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... Use {{variables}} to personalize."
                    className="w-full h-[200px] bg-transparent text-[14px] text-white p-5 outline-none resize-none custom-scrollbar"
                  />
                  
                  {/* Editor Toolbar */}
                  <div className="bg-[#1A1A1E] border-t border-white/5 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors tooltip-trigger" title="Attach Media"><ImageIcon className="w-4 h-4"/></button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors tooltip-trigger" title="Attach File"><Paperclip className="w-4 h-4"/></button>
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

          {/* 📊 RIGHT COLUMN: HISTORY (Takes 1/3 space) */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-gray-400"/> Campaign History
              </h2>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col h-[600px]">
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {campaigns.map((camp) => (
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

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}