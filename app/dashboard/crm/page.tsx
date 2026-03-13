"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

// 👇 YAHAN EXPORT DEFAULT LIKHA HAI, YEHI VERCEL KO CHAHIYE THA!
export default function CRMDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
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
        setMessages(data.data);
        
        // Group messages by Customer ID (chat_id)
        const grouped: Record<string, any[]> = {};
        data.data.forEach((msg: any) => {
          if (!grouped[msg.chat_id]) grouped[msg.chat_id] = [];
          grouped[msg.chat_id].push(msg);
        });
        setGroupedChats(grouped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      fetchCRMData();
      // Auto-refresh CRM every 10 seconds to feel "Live"
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
        await fetchCRMData(); // Immediately refresh to show sent message
      } else {
        alert("Failed to send message: " + data.error);
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-green-500 animate-pulse font-mono">LOADING CRM ENGINE...</div>;
  }

  const activeMessages = activeChatId ? groupedChats[activeChatId] : [];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col font-sans selection:bg-orange-500/30">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-[#111] p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5"/></button>
          <div>
            <h1 className="text-lg font-bold tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500"/> ClawLink Live CRM
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Monitor & Intervene</p>
          </div>
        </div>
        <button onClick={fetchCRMData} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4"/> Sync
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
        
        {/* Sidebar: Customer List */}
        <div className="w-full md:w-80 border-r border-white/10 bg-[#0d0d0f] overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 border-b border-white/5 bg-black/50 sticky top-0 backdrop-blur-md">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Conversations ({Object.keys(groupedChats).length})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {Object.keys(groupedChats).length === 0 ? (
              <p className="p-6 text-sm text-gray-600 text-center font-mono">No active conversations found.</p>
            ) : (
              Object.entries(groupedChats).map(([chatId, msgs]) => {
                const lastMsg = msgs[msgs.length - 1];
                const isUnread = lastMsg.role === "user";
                return (
                  <button 
                    key={chatId}
                    onClick={() => setActiveChatId(chatId)}
                    className={`w-full text-left p-4 border-b border-white/5 transition-all hover:bg-white/5 ${activeChatId === chatId ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-gray-200 truncate">Customer #{chatId.slice(-6)}</p>
                      <span className="text-[10px] text-gray-500 font-mono">{new Date(lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className={`text-xs truncate ${isUnread ? 'text-white font-bold' : 'text-gray-500'}`}>
                      {lastMsg.role === "user" ? "👤 " : lastMsg.role === "human" ? "🧑‍💻 " : "🤖 "}
                      {lastMsg.content}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Area: Chat Interface */}
        <div className={`flex-1 flex flex-col bg-black/50 relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Bot className="w-16 h-16 text-gray-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-400">Select a conversation</h2>
              <p className="text-sm text-gray-600">Monitor AI chats or take over manually.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-[#111] border-b border-white/10 p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center">
                    <User className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Customer ID: {activeChatId}</h3>
                    <p className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Monitored Session</p>
                  </div>
                </div>
                <button onClick={() => setActiveChatId(null)} className="md:hidden text-gray-500 hover:text-white">Close</button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                {activeMessages.map((msg: any, idx: number) => {
                  const isUser = msg.role === "user";
                  const isHumanAgent = msg.role === "human";
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      key={idx} 
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl p-4 shadow-lg text-sm ${
                        isUser 
                          ? 'bg-[#1A1A1A] border border-white/10 text-gray-200 rounded-tl-sm' 
                          : isHumanAgent 
                            ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-tr-sm border border-orange-500/50'
                            : 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-2 opacity-50 border-b border-white/10 pb-2">
                          {isUser ? <User className="w-3 h-3"/> : isHumanAgent ? <ShieldAlert className="w-3 h-3"/> : <Bot className="w-3 h-3"/>}
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {isUser ? "Customer" : isHumanAgent ? "You (Manual Overwrite)" : "ClawLink AI"}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className="text-[9px] text-right opacity-40 mt-2 font-mono">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area for Human Takeover */}
              <div className="p-4 bg-[#111] border-t border-white/10">
                <div className="max-w-4xl mx-auto relative flex items-end gap-2">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendManualReply(); }}}
                    placeholder="Type to take over from AI..."
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 pr-16 text-sm focus:outline-none focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all resize-none text-white"
                    rows={1}
                  />
                  <button 
                    onClick={handleSendManualReply}
                    disabled={isSending || !replyText.trim()}
                    className="absolute right-2 bottom-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {isSending ? <span className="animate-spin text-sm">⚙️</span> : <Send className="w-4 h-4"/>}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-500 mt-2 font-mono">Press Enter to send. Sending a message automatically pauses AI routing for this conversation.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}