"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: LIVE CRM INBOX (TELEGRAM)
 * ==============================================================================================
 * @file app/dashboard/telegram/inbox/page.tsx
 * @description Real-time conversational monitoring system with HUMAN TAKEOVER capabilities.
 * 🚀 FIXED: Unlocked the Manual Messaging input box.
 * 🚀 FIXED: Added Live AI Pause/Resume toggle connected to Supabase `crm_controls`.
 * 🚀 FIXED (TYPESCRIPT): Relaxed ChatMessage interface to prevent strict literal overlap errors.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, User, Bot, Search, Clock, 
  MoreVertical, ShieldAlert, Zap, Send, Activity, ShieldCheck
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

// ==========================================
// 🧩 ENTERPRISE TYPE DEFINITIONS 
// ==========================================
interface ChatMessage {
  id: string;
  sender_type: string; // 🔥 FIXED: Changed to 'string' to allow 'human_agent' without strict TS errors
  message: string;
  created_at: string;
  customer_name?: string; // 🔥 FIXED: Added optional customer_name
}

interface Conversation {
  chatId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
  isAiPaused?: boolean;
}

export default function TelegramCRMInbox() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🔥 Action States
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingAi, setIsTogglingAi] = useState(false);
  const [currentAiStatus, setCurrentAiStatus] = useState<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH CHAT HISTORY FROM API
  const fetchInboxData = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/telegram/inbox?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        
        if (data.success && data.conversations) {
          setConversations(data.conversations);
          if (data.conversations.length > 0 && !selectedChatId) {
            setSelectedChatId(data.conversations[0].chatId);
          }
        }
      } catch (error) {
        console.error("[CRM_ERROR] Failed to load inbox data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInboxData();
    const interval = setInterval(fetchInboxData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatId, conversations]);

  // 🔥 ACTION: SEND MANUAL MESSAGE
  const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedChatId || !session?.user?.email) return;
      
      setIsSending(true);
      const textToSend = newMessage;
      setNewMessage(""); // Optimistic clear

      try {
          const res = await fetch('/api/telegram/inbox/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: session.user.email,
                  chatId: selectedChatId,
                  message: textToSend,
                  action: "send_message"
              })
          });
          const data = await res.json();
          if (!data.success) {
              alert("Failed to send message: " + data.error);
          } else {
              // Force refresh chat immediately to show the new message
              await fetchInboxData();
          }
      } catch (error) {
          console.error("Send message error:", error);
          alert("Network error while sending message.");
      } finally {
          setIsSending(false);
      }
  };

  // 🔥 ACTION: TOGGLE AI PAUSE/RESUME
  const handleToggleAi = async () => {
      if (!selectedChatId || !session?.user?.email) return;
      
      setIsTogglingAi(true);
      try {
          const res = await fetch('/api/telegram/inbox/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: session.user.email,
                  chatId: selectedChatId,
                  action: "toggle_pause",
                  currentStatus: currentAiStatus
              })
          });
          const data = await res.json();
          if (data.success) {
              setCurrentAiStatus(data.newStatus);
              alert(data.newStatus ? "🛑 AI is now PAUSED. You are in manual control." : "✅ AI RESUMED. Bot is back in autopilot.");
          } else {
              alert("Failed to toggle AI: " + data.error);
          }
      } catch (error) {
          alert("Network error.");
      } finally {
          setIsTogglingAi(false);
      }
  };

  const filteredConversations = conversations.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.chatId.includes(searchQuery)
  );

  const selectedConversation = conversations.find(c => c.chatId === selectedChatId);

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING LIVE CHAT HISTORY..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Live CRM Inbox" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5">
        
        {/* 🗂️ LEFT SIDEBAR: CONVERSATION LIST */}
        <aside className="w-full md:w-[350px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-10 shrink-0">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-[14px] font-black uppercase tracking-[0.1em] text-white flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-[#2AABEE]" /> Telegram Users
            </h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111114] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-[#2AABEE]/50 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-xs">No conversations found.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div 
                  key={conv.chatId}
                  onClick={() => setSelectedChatId(conv.chatId)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${selectedChatId === conv.chatId ? 'bg-[#2AABEE]/10 border-l-2 border-l-[#2AABEE]' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm truncate pr-2 text-gray-200">{conv.customerName}</span>
                    <span className="text-[9px] text-gray-500 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> 
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 💬 RIGHT PANEL: CHAT VIEW */}
        <main className="hidden md:flex flex-1 flex-col bg-[#07070A] relative">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[72px] bg-[#0A0A0D] border-b border-white/5 flex items-center justify-between px-6 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2AABEE]/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{selectedConversation.customerName}</h3>
                    <p className="text-[10px] text-gray-500 font-mono">ID: {selectedConversation.chatId} • Telegram</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  
                  {/* 🔥 TOGGLE AI BUTTON */}
                  <button 
                    onClick={handleToggleAi}
                    disabled={isTogglingAi}
                    className={`${currentAiStatus ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'} border px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50`}
                  >
                    {isTogglingAi ? <Activity className="w-3.5 h-3.5 animate-spin" /> : (currentAiStatus ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />)}
                    {currentAiStatus ? 'Resume AI' : 'Pause AI (Manual)'}
                  </button>

                  <button className="text-gray-500 hover:text-white p-2 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/chat-bg-pattern.png')] bg-repeat bg-opacity-5">
                {selectedConversation.messages.map((msg, idx) => {
                  const isBot = msg.sender_type === 'bot' || msg.sender_type === 'human_agent';
                  const isHumanAgent = msg.customer_name === 'Agent Reply';

                  return (
                    <div key={idx} className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                        
                        {/* Avatar */}
                        <div className="shrink-0 mt-auto">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isHumanAgent ? 'bg-purple-500/20 border border-purple-500/30' : (isBot ? 'bg-[#2AABEE]/20 border border-[#2AABEE]/30' : 'bg-green-500/20 border border-green-500/30')}`}>
                            {isHumanAgent ? <User className="w-3.5 h-3.5 text-purple-400" /> : (isBot ? <Bot className="w-3.5 h-3.5 text-[#2AABEE]" /> : <User className="w-3 h-3 text-green-400" />)}
                          </div>
                        </div>

                        {/* Bubble */}
                        <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-md ${isHumanAgent ? 'bg-purple-500/10 border border-purple-500/20 text-white rounded-bl-sm' : (isBot ? 'bg-[#111114] border border-white/10 text-gray-200 rounded-bl-sm' : 'bg-[#2AABEE] text-white rounded-br-sm shadow-[0_0_15px_rgba(42,171,238,0.2)]')}`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div className={`text-[9px] mt-1.5 font-mono opacity-60 text-right flex justify-end gap-2`}>
                            {isHumanAgent && <span className="text-purple-300">Sent by You</span>}
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* 🔥 ACTIVE INPUT AREA FOR HUMAN TAKEOVER */}
              <div className="p-4 bg-[#0A0A0D] border-t border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder={currentAiStatus ? "Type to reply manually..." : "Pause AI first to reply safely, or type anyway..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-[#111114] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-[#2AABEE]/50 outline-none transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="bg-[#2AABEE] hover:bg-[#2298D6] text-white p-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(42,171,238,0.3)] disabled:opacity-50"
                  >
                    {isSending ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                {!currentAiStatus && (
                    <p className="text-center text-[10px] text-orange-400 uppercase tracking-widest mt-3 flex items-center justify-center gap-1.5">
                        <ShieldAlert className="w-3 h-3" /> Warning: AI is currently active. Pause it above to prevent overlapping replies.
                    </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Select a conversation to view history</p>
            </div>
          )}
        </main>
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