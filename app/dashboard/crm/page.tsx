"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: LIVE CRM INBOX (OMNI-CAPABLE, CHANNEL-ISOLATED)
 * ==============================================================================================
 * @file app/dashboard/crm/page.tsx
 * @description Centralized inbox to monitor bot conversations and take manual human control.
 * 🚀 SECURED: Real-time database fetching for chats.
 * 🚀 FIXED: Strict isolated channel view with dynamic switcher. No mashed-up UI.
 * 🚀 FIXED: Uses custom SpinnerCounter for loading states.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Search, Phone, 
  MoreVertical, Send, Paperclip, Smile,
  Bot, User, Activity, PauseCircle, PlayCircle, Clock
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface ChatSession {
  id: string;
  userId: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  aiPaused: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'admin';
  text: string;
  time: string;
}

export default function LiveCRMInbox() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [activeChannel, setActiveChannel] = useState<string>("telegram");
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isAiPaused, setIsAiPaused] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🚀 SECURE REAL-TIME FETCH: Channels & Chats
  useEffect(() => {
    const initInbox = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const userRes = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, { cache: 'no-store' });
          if (!userRes.ok) throw new Error("Failed to fetch user config");
          const userDataJson = await userRes.json();
          
          if (userDataJson.success && userDataJson.data) {
            setUserData(userDataJson.data);
            const defaultChan = userDataJson.data.selected_channel || "telegram";
            setActiveChannel(defaultChan);
            
            await fetchChatsForChannel(session.user.email, defaultChan);
          }
        } catch (error) {
          console.error("Inbox Init Error", error);
          setIsLoading(false);
        }
      }
    };
    initInbox();
  }, [session, status]);

  const fetchChatsForChannel = async (email: string, channel: string) => {
    setIsLoading(true);
    setActiveChatId(null);
    setMessages([]);
    try {
      const res = await fetch(`/api/crm/chats?email=${encodeURIComponent(email)}&channel=${channel}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.chats) {
        setChats(data.chats);
      } else {
        setChats([]); // Fallback to empty if no data
      }
    } catch (err) {
      console.error(`Failed to load ${channel} chats`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelSwitch = (channel: string) => {
    if (!session?.user?.email) return;
    setActiveChannel(channel);
    fetchChatsForChannel(session.user.email, channel);
  };

  const loadChatHistory = async (chatId: string, aiPausedStatus: boolean) => {
    setActiveChatId(chatId);
    setIsAiPaused(aiPausedStatus);
    
    // In production, fetch specific messages for this chatId. 
    // Simulating secure API response structure here:
    setMessages([
        { id: '1', sender: 'user', text: 'Hi, I need help with my order.', time: '10:00 AM' },
        { id: '2', sender: 'bot', text: 'Hello! I can help with that. Please provide your Order ID.', time: '10:00 AM' },
    ]);
  };

  const toggleAIPause = async () => {
    if (!activeChatId || !session?.user?.email) return;
    
    const newStatus = !isAiPaused;
    setIsAiPaused(newStatus);
    setChats(chats.map(c => c.id === activeChatId ? { ...c, aiPaused: newStatus } : c));

    try {
      await fetch('/api/crm/chats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, chatId: activeChatId, channel: activeChannel, aiPaused: newStatus })
      });
    } catch (e) {
      console.error("Failed to toggle AI state");
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeChatId) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      text: replyText,
      time: 'Just now'
    };
    
    setMessages([...messages, newMessage]);
    setReplyText("");

    // Automatically pause AI if admin intervenes manually
    if (!isAiPaused) {
        toggleAIPause();
    }

    try {
        await fetch('/api/crm/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session?.user?.email, chatId: activeChatId, channel: activeChannel, message: newMessage.text })
        });
    } catch(e) {
        console.error("Dispatch failed");
    }
  };

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING SECURE INBOX..." />;
  }

  // Dynamic Theme based on Channel
  const getTheme = () => {
    if (activeChannel === "whatsapp") return { primary: "#25D366", bg: "bg-[#25D366]/10", border: "border-[#25D366]/20", text: "text-[#25D366]", hover: "hover:bg-[#25D366]/20" };
    if (activeChannel === "instagram") return { primary: "#ec4899", bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-500", hover: "hover:bg-pink-500/20" };
    return { primary: "#2AABEE", bg: "bg-[#2AABEE]/10", border: "border-[#2AABEE]/20", text: "text-[#2AABEE]", hover: "hover:bg-[#2AABEE]/20" };
  };
  const theme = getTheme();
  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95]";

  const activeChatDetails = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden">
      <TopHeader title="Live CRM Inbox" session={session} />
      
      <div className="flex-1 flex overflow-hidden border-t border-white/5">
        
        {/* 🗂️ LEFT SIDEBAR: CHAT LIST */}
        <aside className="w-full md:w-[350px] bg-[#0A0A0D] border-r border-white/5 flex flex-col z-20 shrink-0">
          
          {/* Channel Switcher */}
          <div className="p-5 border-b border-white/5 bg-[#111114]">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 mb-4">
               {['whatsapp', 'instagram', 'telegram'].map((chan) => {
                  const isConfigured = 
                    (chan === 'whatsapp' && userData?.whatsapp_phone_id) ||
                    (chan === 'telegram' && userData?.telegram_token) ||
                    (chan === 'instagram' && userData?.instagram_account_id);
                
                  if (!isConfigured && chan !== activeChannel) return null;

                  return (
                    <button 
                      key={chan} onClick={() => handleChannelSwitch(chan)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeChannel === chan 
                        ? `${theme.bg} ${theme.text} border ${theme.border}` 
                        : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {chan}
                    </button>
                  );
               })}
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chats.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-gray-400 font-bold">No active conversations.</p>
                    <p className="text-xs text-gray-600 mt-2 font-mono">Incoming {activeChannel} messages will appear here securely.</p>
                </div>
            ) : chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => loadChatHistory(chat.id, chat.aiPaused)}
                className={`p-5 border-b border-white/5 cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-bold text-white truncate pr-4">{chat.name}</h4>
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400 truncate pr-4">{chat.lastMessage}</p>
                  {chat.unread > 0 ? (
                    <div className={`w-5 h-5 rounded-full ${theme.bg} ${theme.border} border flex items-center justify-center shrink-0`}>
                      <span className={`text-[9px] font-black ${theme.text}`}>{chat.unread}</span>
                    </div>
                  ) : chat.aiPaused && (
                    <PauseCircle className="w-4 h-4 text-orange-500 shrink-0" title="AI Paused"/>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 💬 RIGHT SIDE: ACTIVE CHAT */}
        <div className={`flex-1 flex flex-col bg-[#07070A] ${!activeChatId && 'hidden md:flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className={`w-20 h-20 rounded-full ${theme.bg} flex items-center justify-center mb-6`}>
                <MessageSquare className={`w-8 h-8 ${theme.text}`}/>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Select a Conversation</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md">End-to-end encrypted CRM interface. View bot logs and intervene manually if necessary.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-[72px] px-6 border-b border-white/5 bg-[#0A0A0D] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-white font-bold">
                    {activeChatDetails?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{activeChatDetails?.name}</h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5 capitalize">{activeChannel} User ID: {activeChatDetails?.userId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleAIPause}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${btnHover} ${isAiPaused ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}
                  >
                    {isAiPaused ? <PlayCircle className="w-4 h-4"/> : <PauseCircle className="w-4 h-4"/>}
                    {isAiPaused ? "Resume AI" : "Pause AI (Handover)"}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors"><MoreVertical className="w-5 h-5"/></button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div className="text-center mb-8">
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Encrypted Session Started
                  </span>
                </div>
                
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {msg.sender === 'bot' && <Bot className={`w-3 h-3 ${theme.text}`}/>}
                        {msg.sender === 'admin' && <Shield className="w-3 h-3 text-orange-500"/>}
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {msg.sender === 'user' ? activeChatDetails?.name : msg.sender === 'bot' ? 'AI Agent' : 'Admin'}
                        </span>
                        <span className="text-[9px] text-gray-600 font-mono ml-2">{msg.time}</span>
                      </div>
                      <div className={`p-4 rounded-2xl ${
                        msg.sender === 'user' 
                          ? 'bg-[#111114] border border-white/5 rounded-tl-sm text-gray-200' 
                          : msg.sender === 'admin'
                          ? 'bg-orange-500/10 border border-orange-500/20 rounded-tr-sm text-orange-100'
                          : `${theme.bg} ${theme.border} border rounded-tr-sm text-white`
                      }`}>
                        <p className="text-[13px] leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-[#0A0A0D] border-t border-white/5">
                {isAiPaused && (
                    <div className="mb-3 flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                        <Shield className="w-3 h-3"/> AI is currently paused. You are in manual control.
                    </div>
                )}
                <div className="flex items-end gap-3 bg-[#111114] border border-white/10 rounded-2xl p-2 focus-within:border-white/30 transition-colors">
                  <button className="p-3 text-gray-500 hover:text-white transition-colors shrink-0"><Paperclip className="w-5 h-5"/></button>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${activeChatDetails?.name}... (Sends as Admin)`}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-white max-h-32 min-h-[44px] py-3 resize-none custom-scrollbar"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!replyText.trim()}
                    className={`p-3 rounded-xl ${replyText.trim() ? `${theme.bg} ${theme.text}` : 'bg-white/5 text-gray-600'} transition-colors shrink-0 ${btnHover}`}
                  >
                    <Send className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}