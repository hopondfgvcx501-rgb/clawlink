"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, Send, AlertTriangle, ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BroadcastDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    
    // Fetch customer count estimation
    if (session?.user?.email) {
      fetch(`/api/crm?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const unique = new Set(data.data.map((msg: any) => msg.chat_id));
            setCustomerCount(unique.size);
          }
        });
    }
  }, [session, status, router]);

  const handleBroadcast = async () => {
    if (!message.trim() || !session?.user?.email) return;
    
    if (!confirm(`Are you sure you want to blast this message to ${customerCount} customers? This action cannot be undone.`)) return;

    setIsSending(true);

    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: session.user.email, 
          message: message,
          channel: "telegram" // Locked to Telegram for now
        })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        setMessage("");
      } else {
        alert("Broadcast Failed: " + data.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans">
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-purple-500" /> Marketing Broadcast
          </h1>
          <p className="text-sm text-gray-400 mt-1">Send bulk announcements and offers to all your bot subscribers instantly.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Composer Area */}
        <div className="md:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[80px] pointer-events-none"></div>
          
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Compose Message</label>
          <textarea 
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., 🚀 Flash Sale! Get 20% off on all items today using code CLAW20. Order now!"
            className="w-full bg-black/50 border border-purple-500/30 rounded-xl p-4 text-sm focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] focus:outline-none transition-all resize-none text-white font-mono"
          />

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500"/> Spamming may result in bot suspension.
            </p>
            <button 
              onClick={handleBroadcast}
              disabled={isSending || !message.trim() || customerCount === 0}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50"
            >
              {isSending ? "Blasting..." : <><Send className="w-4 h-4"/> Blast Message</>}
            </button>
          </div>
        </div>

        {/* Stats Area */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 text-center shadow-lg">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-4xl font-black text-white mb-1">{customerCount}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Audience</p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Target Channels</h4>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-2 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">✈️</span>
                <span className="text-sm font-bold text-white">Telegram</span>
              </div>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase font-bold">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg opacity-50 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold text-gray-300">WhatsApp</span>
              </div>
              <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded uppercase font-bold">Needs Meta Approval</span>
            </div>
            <p className="text-[9px] text-gray-500 mt-3 font-mono leading-relaxed">
              *WhatsApp Cloud API restricts unsolicited outbound marketing without pre-approved templates from Meta. Telegram is currently 100% unrestricted.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}