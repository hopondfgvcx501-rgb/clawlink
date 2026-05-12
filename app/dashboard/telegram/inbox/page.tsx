"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: LIVE CRM INBOX (TELEGRAM)
 * ==============================================================================================
 * @file app/dashboard/telegram/inbox/page.tsx
 * @description Real-time conversational monitoring system. Groups chat_history by users.
 * 🚀 SECURED: Strict tenant isolation using session email.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MessageSquare, User, Bot, Search, Clock, 
  MoreVertical, ShieldAlert, Zap
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

// Types
interface ChatMessage {
  id: string;
  sender_type: 'user' | 'bot' | 'human_agent';
  message: string;
  created_at: string;
}

interface Conversation {
  chatId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export default function TelegramCRMInbox() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH CHAT HISTORY FROM API
  useEffect(() => {
    const fetchInboxData = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          // Note: Hum iska API route next step mein banayenge
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

    fetchInboxData();
    // Optional: Setup polling every 10 seconds for "Live" feel
    const interval = setInterval(fetchInboxData, 10000);
    return () => clearInterval(interval);
  }, [session, status, selectedChatId]);

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
                  <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                    <ShieldAlert className="w-3 h-3" /> Pause AI
                  </button>
                  <button className="text-gray-500 hover:text-white p-2 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/chat-bg-pattern.png')] bg-repeat bg-opacity-5">
                {selectedConversation.messages.map((msg, idx) => {
                  const isBot = msg.sender_type === 'bot';
                  return (
                    <div key={idx} className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                        
                        {/* Avatar */}
                        <div className="shrink-0 mt-auto">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isBot ? 'bg-[#2AABEE]/20 border border-[#2AABEE]/30' : 'bg-green-500/20 border border-green-500/30'}`}>
                            {isBot ? <Bot className="w-3.5 h-3.5 text-[#2AABEE]" /> : <User className="w-3 h-3 text-green-400" />}
                          </div>
                        </div>

                        {/* Bubble */}
                        <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-md ${isBot ? 'bg-[#111114] border border-white/10 text-gray-200 rounded-bl-sm' : 'bg-[#2AABEE] text-white rounded-br-sm shadow-[0_0_15px_rgba(42,171,238,0.2)]'}`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div className={`text-[9px] mt-1.5 font-mono opacity-60 text-right`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area (For Manual Human Takeover - Future Phase) */}
              <div className="p-4 bg-[#0A0A0D] border-t border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Type to reply manually (coming soon)..." 
                    disabled
                    className="flex-1 bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none opacity-50 cursor-not-allowed"
                  />
                  <button disabled className="bg-[#2AABEE] text-white p-3 rounded-xl opacity-50 cursor-not-allowed">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-[9px] text-gray-500 uppercase tracking-widest mt-2">Human Intervention mode is currently locked.</p>
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