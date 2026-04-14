"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: OMNI-CHANNEL LIVE CRM INBOX
 * ==============================================================================================
 * @file app/dashboard/crm/page.tsx
 * @description Unified Inbox connecting WhatsApp, Telegram, and Instagram DMs into a single 
 * chat interface for human agents. Integrated with Supabase for real-time data fetch.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { 
  Send, Paperclip, Search, MessageSquare, 
  User, Tag, Phone, Activity, Globe,
  Users, Smartphone, ShieldCheck, X, Bot, ShieldAlert, Clock
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UnifiedInbox() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [leads, setLeads] = useState<any[]>([]);
  const [groupedChats, setGroupedChats] = useState<Record<string, any[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCRMData = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/crm?email=${session.user.email}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []); 
        setGroupedChats(data.groupedChats || {}); 
      }
    } catch (e) {
      console.error("Failed to fetch CRM data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      fetchCRMData();
      // Auto-refresh CRM every 10 seconds for real-time feel
      const interval = setInterval(fetchCRMData, 10000);
      return () => clearInterval(interval);
    }
  }, [session, status, router]);

  useEffect(() => {
    // 🚀 ULTRA FAST SCROLL TO BOTTOM
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatId, groupedChats]);

  const handleSendManualReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeChatId || !session?.user?.email) return;
    
    setIsSending(true);

    const platformForActiveChat = chats.find(c => c.id === activeChatId)?.platform || "web";

    const newMsg = {
      email: session.user.email,
      platform: platformForActiveChat,
      platform_chat_id: activeChatId,
      customer_name: "Human Agent",
      sender_type: "human", // Identifies human takeover
      message: replyText
    };

    // Optimistic UI Update
    setGroupedChats(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), { ...newMsg, created_at: new Date().toISOString() }]
    }));
    setReplyText("");

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, chatId: activeChatId, message: newMsg.message })
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchCRMData(); // Refresh to ensure sync
      } else {
        alert("Failed to send message: " + data.error);
      }
    } catch (error) {
      alert("Network error while sending manual reply.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-orange-500 font-mono tracking-widest">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        LOADING CRM ENGINE...
      </div>
    );
  }

  // Generate Unique Chats Array
  const uniqueChatsMap = new Map();
  leads.forEach((msg) => {
    if (!uniqueChatsMap.has(msg.platform_chat_id)) {
      uniqueChatsMap.set(msg.platform_chat_id, {
        id: msg.platform_chat_id,
        name: msg.customer_name || "Unknown User",
        platform: msg.platform,
        lastMessage: msg.message,
        time: msg.created_at
      });
    }
  });
  const chats = Array.from(uniqueChatsMap.values());

  const activeMessages = activeChatId ? (groupedChats[activeChatId] || []) : [];
  const selectedLead = chats.find(l => l.id === activeChatId);

  const btn = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  const getPlatformIcon = (platform: string) => {
    if (platform === "whatsapp") return <Smartphone className="w-4 h-4 text-[#25D366]" />;
    if (platform === "telegram") return <MessageSquare className="w-4 h-4 text-[#2AABEE]" />;
    return <Globe className="w-4 h-4 text-pink-500" />;
  };

  const getPlatformColor = (platform: string) => {
    if (platform === "whatsapp") return "bg-[#25D366] text-black";
    if (platform === "telegram") return "bg-[#2AABEE] text-white";
    return "bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white"; // Instagram
  };

  const getPlatformLabel = (platform: string) => {
    if (platform === "whatsapp") return "WA";
    if (platform === "telegram") return "TG";
    return "IG";
  };

  return (
    <div className="w-full min-h-screen bg-[#07070A] text-[#E8E8EC] font-sans flex flex-col h-screen overflow-hidden selection:bg-orange-500/30">
      
      {/* 🚀 AMBIENT CINEMATIC GLOW */}
      <div className="fixed top-[-20%] right-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(249,115,22,0.05) 0%,transparent 65%)",transform:"translateZ(0)"}}/>
      <div className="fixed bottom-[-20%] left-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(99,102,241,0.05) 0%,transparent 65%)",transform:"translateZ(0)"}}/>

      <TopHeader title="Live CRM Inbox" session={session} />

      {/* Main CRM Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10 border-t border-white/5">
        
        {/* LEFT PANE: CONTACTS LIST */}
        <aside className={`w-full md:w-[350px] bg-[#0A0A0D] border-r border-white/5 flex-col shrink-0 z-20 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/5">
            <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2 mb-4 pl-1">
              <Users className="w-4 h-4 text-orange-500"/> Active Leads
            </h2>
            <div className="flex items-center bg-[#111114] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-500/50 transition-colors">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input type="text" placeholder="Search customers..." className="bg-transparent border-none outline-none text-xs ml-2 text-white w-full placeholder-gray-600" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-10 flex flex-col items-center">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p>No active conversations found.</p>
              </div>
            ) : (
              chats.map((chat, idx) => (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-4 border-b border-white/5 flex items-start gap-3 transition-colors
                    ${activeChatId === chat.id 
                      ? 'bg-blue-500/10 border-l-2 border-l-blue-500 border-b-white/5' 
                      : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center border border-white/10">
                      <User className="w-5 h-5 text-gray-400"/>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black border-2 border-[#0A0A0D] ${getPlatformColor(chat.platform)}`}>
                      {getPlatformLabel(chat.platform)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-[13px] truncate">{chat.name}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{new Date(chat.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate opacity-80">{chat.lastMessage}</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* MIDDLE PANE: CHAT WINDOW */}
        <div className={`flex-1 flex-col bg-[#07070A] relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none"></div>
              <MessageSquare className="w-16 h-16 text-gray-700 mb-4 animate-pulse opacity-30" />
              <h3 className="text-xl font-black text-white tracking-tight">Select a conversation</h3>
              <p className="text-[13px] mt-2 text-gray-400">View live AI chats and take over manually anytime.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-[70px] p-4 border-b border-white/5 bg-[#0A0A0D]/80 backdrop-blur-md flex justify-between items-center z-20 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChatId(null)} className={`md:hidden bg-white/5 border border-white/10 p-2 rounded-lg text-gray-400 hover:text-white ${btn}`}>
                    <X className="w-4 h-4"/>
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-[#111114] flex items-center justify-center shrink-0 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    {getPlatformIcon(selectedLead?.platform || "web")}
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-white tracking-wide">{selectedLead?.name || "Unknown User"}</h2>
                    <p className="text-[10px] text-green-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active Session</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hidden sm:flex">
                    <ShieldCheck className="w-3 h-3"/> Enterprise Secured
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar bg-[#07070A] relative z-10">
                <AnimatePresence>
                  {activeMessages.map((msg: any, idx: number) => {
                    const isUser = msg.sender_type === "user";
                    const isBot = msg.sender_type === "bot" || msg.sender_type === "system";
                    const isHuman = msg.sender_type === "human";

                    return (
                      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                        className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'self-start items-start' : 'self-end items-end'} relative z-10`}>
                        
                        <span className="text-[9px] text-gray-500 font-mono mb-1.5 px-1 uppercase tracking-widest flex items-center gap-1">
                          {isUser ? <User className="w-3 h-3"/> : isBot ? <Bot className="w-3 h-3 text-orange-500"/> : <ShieldAlert className="w-3 h-3 text-blue-400"/>}
                          {isUser ? msg.customer_name || "User" : isBot ? "AI Agent" : "You (Support)"}
                        </span>
                        
                        <div className={`p-3.5 md:p-4 rounded-[20px] text-[13px] leading-relaxed shadow-md
                          ${isUser 
                            ? 'bg-[#111114] border border-white/5 text-gray-200 rounded-tl-sm' 
                            : isHuman 
                              ? 'bg-blue-600 text-white rounded-tr-sm shadow-[0_5px_15px_rgba(37,99,235,0.2)]'
                              : 'bg-[#1A1A1E] border border-white/10 text-gray-300 rounded-tr-sm'
                          }`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-gray-600 font-mono mt-1.5 px-1">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/5 bg-[#0A0A0D] shrink-0 z-20">
                <form onSubmit={handleSendManualReply} className="relative flex items-end gap-2 bg-[#111114] border border-white/10 focus-within:border-blue-500/50 rounded-2xl p-2 transition-colors">
                  <button type="button" className="p-3 text-gray-500 hover:text-white transition-colors shrink-0"><Paperclip className="w-4 h-4"/></button>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendManualReply(); }}}
                    placeholder="Take over conversation (Human Handoff)..." 
                    className="flex-1 bg-transparent py-3 text-[13px] text-white focus:outline-none resize-none custom-scrollbar" 
                    rows={1}
                  />
                  <button type="submit" disabled={isSending || !replyText.trim()} 
                    className={`p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 shadow-lg shrink-0 ${btn}`}>
                    {isSending ? <Activity className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                  </button>
                </form>
                <p className="text-center text-[9px] text-gray-500 mt-3 font-mono flex items-center justify-center gap-1 uppercase tracking-widest">
                  <Clock className="w-3 h-3"/> Replies are logged in CRM database.
                </p>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANE: CRM USER INFO */}
        <aside className="hidden lg:flex w-[280px] bg-[#0A0A0D] border-l border-white/5 flex-col z-20 shrink-0 overflow-y-auto custom-scrollbar p-6">
          {!activeChatId ? (
             <div className="h-full flex items-center justify-center text-gray-600 text-[11px] font-mono text-center px-4">
               Select a chat to view CRM details.
             </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center border-2 border-white/10 mb-4 shadow-lg">
                  <User className="w-8 h-8 text-gray-400"/>
                </div>
                <h3 className="text-[16px] font-bold text-white mb-1">{selectedLead?.name || "Unknown User"}</h3>
                <p className="text-[11px] text-gray-500 font-mono">Platform ID: {selectedLead?.id.substring(0,8)}...</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2"><Tag className="w-3 h-3"/> CRM Tags</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold">In-Progress</span>
                    <button className="bg-transparent border border-dashed border-white/20 text-gray-500 px-2.5 py-1 rounded-md text-[10px] font-bold hover:text-white transition-colors">+ Add Tag</button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2"><Activity className="w-3 h-3"/> Session Data</p>
                  <div className="bg-[#111114] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-[11px] text-gray-500">Source</span><span className="text-[11px] text-white uppercase font-bold">{selectedLead?.platform}</span></div>
                    <div className="flex justify-between"><span className="text-[11px] text-gray-500">First Seen</span><span className="text-[11px] text-white">Today</span></div>
                    <div className="flex justify-between"><span className="text-[11px] text-gray-500">Message Count</span><span className="text-[11px] text-white font-mono">{activeMessages.length}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

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