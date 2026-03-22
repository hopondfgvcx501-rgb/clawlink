"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import TopHeader from "@/components/TopHeader"; 

// 🚀 FIXED: Imported 'Users' and 'X' to resolve all VS Code & Vercel Red Errors!
import { 
  Send, User, Users, Bot, ShieldAlert, RefreshCw, 
  MessageSquare, Activity, Search, Smartphone, 
  Globe, Clock, ShieldCheck, X 
} from "lucide-react";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CRMDashboard() {
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

  const handleSendManualReply = async () => {
    if (!replyText.trim() || !activeChatId || !session?.user?.email) return;
    setIsSending(true);

    const newMsg = {
      email: session.user.email,
      platform: chats.find(c => c.id === activeChatId)?.platform || "web",
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
        body: JSON.stringify({ email: session.user.email, chatId: activeChatId, message: replyText })
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
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-orange-500 font-mono">
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
        name: msg.customer_name,
        platform: msg.platform,
        lastMessage: msg.message,
        time: msg.created_at
      });
    }
  });
  const chats = Array.from(uniqueChatsMap.values());

  const activeMessages = activeChatId ? (groupedChats[activeChatId] || []) : [];
  const selectedLead = chats.find(l => l.id === activeChatId);

  // 🚀 ULTRA FAST BTN CLASS
  const btn = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  const getPlatformIcon = (platform: string) => {
    if (platform === "whatsapp") return <Smartphone className="w-4 h-4 text-[#25D366]" />;
    if (platform === "telegram") return <MessageSquare className="w-4 h-4 text-[#2AABEE]" />;
    return <Globe className="w-4 h-4 text-pink-500" />;
  };

  return (
    <div className="w-full min-h-screen bg-[#07070A] text-[#E8E8EC] font-sans flex flex-col h-screen overflow-hidden selection:bg-orange-500/30">
      
      {/* 🚀 AMBIENT CINEMATIC GLOW (Matches landing page) */}
      <div className="fixed top-[-20%] right-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 65%)",transform:"translateZ(0)"}}/>
      <div className="fixed bottom-[-20%] left-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)",transform:"translateZ(0)"}}/>

      <TopHeader title="Live CRM Inbox" session={session} />

      {/* Main CRM Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10 p-4 md:p-6 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* LEFT PANE: CONTACTS LIST */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} 
          className="w-full md:w-[350px] flex flex-col rounded-3xl overflow-hidden border border-white/5 bg-[#111113] shadow-[0_0_40px_rgba(0,0,0,0.6)] shrink-0">
          
          <div className="p-5 border-b border-white/5 bg-[#0A0A0C]">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-orange-500"/> Active Leads</h2>
            <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-orange-500/50 transition-colors shadow-inner">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input type="text" placeholder="Search customers..." className="bg-transparent border-none outline-none text-xs ml-2 text-white w-full font-mono placeholder-gray-600" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
                  className={`w-full text-left p-4 rounded-2xl flex items-start gap-3 transition-all duration-[150ms] ease-out transform-gpu will-change-transform
                    ${activeChatId === chat.id 
                      ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)] scale-[1.01]' 
                      : 'hover:bg-white/5 border border-transparent hover:scale-[1.01] active:scale-[0.98]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1A1A1A] to-[#222] flex items-center justify-center shrink-0 border border-white/10 shadow-md">
                    {getPlatformIcon(chat.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm truncate tracking-wide">{chat.name}</span>
                      <span className="text-[9px] text-gray-500 font-mono">{new Date(chat.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate font-mono opacity-80">{chat.lastMessage}</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>

        {/* RIGHT PANE: CHAT WINDOW */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }} 
          className={`flex-1 flex-col rounded-3xl overflow-hidden border border-white/5 bg-[#111113] shadow-[0_0_40px_rgba(0,0,0,0.6)] relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0A0A0C]/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none"></div>
              <MessageSquare className="w-16 h-16 text-gray-700 mb-4 animate-pulse opacity-30" />
              <h3 className="text-xl font-black text-white tracking-tight">Select a conversation</h3>
              <p className="text-xs mt-2 text-gray-400">View live AI chats and take over manually anytime.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-md flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-pink-600 flex items-center justify-center shrink-0 border border-white/10 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white tracking-wide">{selectedLead?.name || "Unknown User"}</h2>
                    <p className="text-[10px] text-green-400 font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active Session • {selectedLead?.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 hidden sm:flex">
                    <ShieldCheck className="w-3 h-3 text-orange-500"/> Enterprise Secured
                  </span>
                  <button onClick={() => setActiveChatId(null)} className={`md:hidden bg-white/10 p-2 rounded-lg text-white ${btn}`}>
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar bg-[#07070A] relative z-10">
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none">
                  <Globe className="w-96 h-96"/>
                </div>

                <AnimatePresence>
                  {activeMessages.map((msg: any, idx: number) => {
                    const isUser = msg.sender_type === "user";
                    const isBot = msg.sender_type === "bot";
                    const isHuman = msg.sender_type === "human";

                    return (
                      <motion.div key={idx} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'self-start' : 'self-end items-end'} relative z-10`}>
                        
                        <span className="text-[9px] text-gray-500 font-mono mb-1.5 ml-1 uppercase tracking-widest flex items-center gap-1">
                          {isUser ? <User className="w-3 h-3"/> : isBot ? <Bot className="w-3 h-3 text-orange-500"/> : <ShieldAlert className="w-3 h-3 text-blue-400"/>}
                          {isUser ? msg.customer_name : isBot ? "AI Agent" : "You (Support)"}
                        </span>
                        
                        <div className={`p-3.5 md:p-4 rounded-[1.25rem] text-[13px] leading-[1.6] shadow-md
                          ${isUser 
                            ? 'bg-[#1A1A1E] border border-white/5 text-gray-200 rounded-tl-sm' 
                            : isHuman 
                              ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-50 rounded-tr-sm'
                              : 'bg-gradient-to-br from-orange-600/20 to-pink-600/20 border border-orange-500/30 text-orange-50 rounded-tr-sm'
                          }`}>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-gray-600 font-mono mt-1.5 mr-1">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Chat Input (Manual Reply) */}
              <div className="p-4 border-t border-white/5 bg-[#0A0A0C] z-20">
                <div className="relative flex items-end gap-2">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendManualReply(); }}}
                    placeholder="Take over conversation (Human Handoff)..." 
                    className="w-full bg-[#111113] border border-white/10 rounded-2xl py-3.5 pl-4 pr-14 text-sm text-white focus:outline-none focus:border-orange-500 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all resize-none custom-scrollbar shadow-inner" 
                    rows={1}
                  />
                  <button onClick={handleSendManualReply} disabled={isSending || !replyText.trim()} 
                    className={`absolute right-2 bottom-2 p-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl disabled:opacity-50 shadow-[0_0_15px_rgba(249,115,22,0.3)] ${btn}`}>
                    {isSending ? <Activity className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4 ml-0.5"/>}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-2.5 font-mono flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3"/> Replies are logged in CRM. Dispatches require backend webhook setup.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Global CSS Overrides for this specific page */}
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}