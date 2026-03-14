"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radio, Send, Users, Activity, Zap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader"; // 🚀 Added our Universal Header!

export default function BroadcastEngine() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [audienceCount, setAudienceCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [channel, setChannel] = useState("whatsapp");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/broadcast?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setAudienceCount(data.audienceCount);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, status, router]);

  const handleBroadcast = async () => {
    if (!message.trim() || audienceCount === 0) return;
    
    const confirmBlast = confirm(`Are you sure you want to blast this message to ${audienceCount} leads? This action cannot be undone.`);
    if (!confirmBlast) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, message, channel })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`🚀 BOOM! Successfully broadcasted to ${data.sentCount} users.`);
        setMessage("");
      } else {
        alert("Broadcast Failed: " + data.error);
      }
    } catch (error) {
      alert("Network Error during broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || status === "loading") {
    return <div className="w-full h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-pink-500 font-mono"><Activity className="w-10 h-10 animate-spin mb-4" />LOADING BROADCAST ENGINE...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-pink-500/30">
      
      {/* 🚀 Top Header Component */}
      <TopHeader title="Broadcast Hub" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
        
        {/* 🌇 CINEMATIC GLOW EFFECT */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-10">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <Radio className="w-8 h-8 text-pink-500" /> Broadcast Engine
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">Blast promotional offers, updates, and newsletters to your entire captured audience with a single click.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COMPOSER SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-[#111] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-widest uppercase text-gray-300">Compose Message</h2>
                <div className="flex gap-2 bg-black/50 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setChannel("whatsapp")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${channel === 'whatsapp' ? 'bg-green-500 text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => setChannel("telegram")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${channel === 'telegram' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                    Telegram
                  </button>
                </div>
              </div>

              <textarea 
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your marketing message here... e.g., '🚨 FLASH SALE: Get 50% off all enterprise plans today only!'"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 text-gray-200 focus:border-pink-500 focus:shadow-[0_0_20px_rgba(236,72,153,0.15)] focus:outline-none transition-all resize-none mb-6 font-sans text-lg custom-scrollbar"
              />

              <div className="flex items-center justify-between bg-pink-500/10 border border-pink-500/20 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-pink-400" />
                  <p className="text-xs text-pink-200">This action will consume <strong className="text-pink-400">{audienceCount} API Tokens</strong>. Ensure your plan has sufficient balance.</p>
                </div>
              </div>

              <button 
                onClick={handleBroadcast}
                disabled={isSending || !message.trim() || audienceCount === 0}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-400 hover:to-orange-400 text-white font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
              >
                {isSending ? (
                  <>Deploying Payload <Activity className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Launch Broadcast <Send className="w-5 h-5" /></>
                )}
              </button>
            </motion.div>

            {/* AUDIENCE STATS SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
              
              <div className="bg-[#1C1C1E] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-colors"></div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-500 border border-pink-500/30 mb-6">
                  <Users className="w-6 h-6"/>
                </div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Captured Leads</h3>
                <p className="text-5xl font-black text-white">{audienceCount.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-4 font-mono border-t border-white/10 pt-4">Leads are automatically captured when a user sends their first message to your bot.</p>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Pro Tips
                </h3>
                <ul className="space-y-4 text-xs text-gray-400 leading-relaxed">
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0"></div> Keep your message under 500 characters for higher engagement.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0"></div> Avoid spamming. Meta and Telegram may block numbers if users report your bot.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0"></div> Include a clear Call to Action (CTA) or a link.</li>
                </ul>
              </div>

            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}