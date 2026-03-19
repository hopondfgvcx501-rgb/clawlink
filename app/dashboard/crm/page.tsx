"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, ShieldAlert, RefreshCw, MessageSquare, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader"; 

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, groupedChats]);

  const handleSendManualReply = async () => {
    if (!replyText.trim() || !activeChatId || !session?.user?.email) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, chatId: activeChatId, message: replyText })
      });
      const data = await res.json();
      
      if (data.success) {
        setReplyText("");
        await fetchCRMData(); // Refresh to show new message immediately
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
      <div className="w-full h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-orange-500 font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        LOADING CRM ENGINE...
      </div>
    );
  }

  const activeMessages = activeChatId ? (groupedChats[activeChatId] || []) : [];
  const selectedLead = leads.find(l => l.platform_chat_id === activeChatId);

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden">
      
      <TopHeader title="Live CRM Inbox" session={session} />

      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT SIDEBAR: LEAD LIST */}
        <div className="w-full md:w-1/3 bg-[#111] border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-[#1A1A1A] flex justify-between items-center">
            <h2 className="font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-blue-500"/> Active Leads</h2>
            <button onClick={fetchCRMData} className="text-gray-500 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {leads.length === 0 ? (
              <p className="text-center text-gray-500 text-xs mt-10">No leads found yet.</p>
            ) : (
              leads.map((lead, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveChatId(lead.platform_chat_id)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between ${activeChatId === lead.platform_chat_id ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-white capitalize">{lead.customer_name || "Unknown User"}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 capitalize flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${lead.platform === 'whatsapp' ? 'bg-green-500' : lead.platform === 'telegram' ? 'bg-blue-400' : 'bg-purple-500'}`}></span>
                      {lead.platform}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-600">{new Date(lead.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE: CHAT AREA */}
        <div className={`flex-1 bg-[#111] border border-white/5 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a lead to view conversation history</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 bg-[#1A1A1A] flex justify-between items-center z-10">
                <div>
                  <h2 className="font-bold text-white capitalize">{selectedLead?.customer_name || "Unknown User"}</h2>
                  <p className="text-xs text-gray-400 font-mono">ID: {activeChatId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Live Takeover
                  </span>
                  <button onClick={() => setActiveChatId(null)} className="md:hidden text-gray-500 hover:text-white ml-2">Close</button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0A0A0B]">
                {activeMessages.map((msg: any, idx: number) => {
                  const isUser = msg.sender_type === "user";
                  const isHumanAgent = msg.sender_type === "human";
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-lg ${
                        isUser ? 'bg-[#1A1A1A] border border-white/10 text-gray-200 rounded-bl-sm' 
                        : isHumanAgent ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-br-sm border border-orange-500/50' 
                        : 'bg-blue-600/30 text-blue-100 rounded-br-sm border border-blue-500/30'
                      }`}>
                        {!isUser && (
                          <div className="flex items-center gap-1 mb-1.5 opacity-70 text-[10px] uppercase font-bold border-b border-white/10 pb-1">
                            {isHumanAgent ? <><ShieldAlert className="w-3 h-3"/> You (Manual)</> : <><Bot className="w-3 h-3"/> AI Agent</>}
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-[9px] opacity-40 block mt-2 text-right font-mono">{new Date(msg.created_at).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input (Manual Reply) */}
              <div className="p-4 bg-[#1A1A1A] border-t border-white/5 z-10">
                <div className="relative flex items-end gap-2">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendManualReply(); }}}
                    placeholder="Type to take over from AI and message user..." 
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all resize-none custom-scrollbar" 
                    rows={1}
                  />
                  <button onClick={handleSendManualReply} disabled={isSending || !replyText.trim()} className="absolute right-2 bottom-2 p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
                    {isSending ? <span className="animate-spin inline-block">⚙️</span> : <Send className="w-4 h-4"/>}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-2 font-mono">Press Enter to send. Messages are routed directly to the customer's {selectedLead?.platform || "app"}.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}