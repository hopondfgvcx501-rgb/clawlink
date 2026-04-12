"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Mic, MessageCircle, Instagram, PhoneCall, ArrowLeft, Zap, Lock, Settings, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OmnichannelHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🚀 STATE MANAGEMENT FOR INPUTS & DB DATA
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    // Fetch user plan to dynamically unlock premium features
    if (session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setUserData(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="w-full h-screen bg-[#0A0A0B] flex flex-col items-center justify-center text-indigo-500 font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        LOADING HUB...
      </div>
    );
  }

  // 🚀 DYNAMIC PLAN CHECKING
  const userPlan = userData?.plan?.toLowerCase() || "free";
  const hasMaxPlan = userPlan === "adv_max" || userPlan === "yearly" || userPlan === "max" || userPlan === "ultra";

  const handleConnectVoice = async () => {
    if (!twilioSid || !twilioToken) {
        alert("Please enter both Twilio SID and Auth Token.");
        return;
    }
    setIsConnectingVoice(true);
    // TODO: Wire this to /api/voice/setup later
    setTimeout(() => {
        alert("Voice Engine configuration saved! (Backend wiring pending)");
        setIsConnectingVoice(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      
      <header className="max-w-6xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Mic className="w-6 h-6 text-indigo-500" /> Omnichannel & Voice Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">Dominate every platform. Deploy your AI across Voice, Instagram, and Messenger.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 🎙️ Voice AI Agent */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-indigo-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/30 relative z-10">
            <PhoneCall className="w-6 h-6"/>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Voice AI Caller</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">Assign a dedicated virtual phone number. Your AI will answer live calls and converse with customers in a human-like voice.</p>
          <div className="space-y-4 mb-6 mt-auto relative z-10">
            <input 
                type="text" 
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="Twilio Account SID" 
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-colors" 
            />
            <input 
                type="password" 
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                placeholder="Twilio Auth Token" 
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-colors" 
            />
          </div>
          <button onClick={handleConnectVoice} disabled={isConnectingVoice} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all relative z-10 disabled:opacity-50">
            <Zap className="w-4 h-4"/> {isConnectingVoice ? "Connecting..." : "Connect Voice Engine"}
          </button>
        </motion.div>

        {/* 📸 Instagram DMs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-pink-500/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-6 border border-pink-500/20 relative z-10">
            <Instagram className="w-6 h-6"/>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Instagram DMs</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">Auto-reply to Instagram Direct Messages and comments. Convert followers into paying customers instantly.</p>
          <div className="flex-1 flex flex-col justify-end mt-auto relative z-10">
            <button className="w-full bg-black border border-pink-500/30 text-pink-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-pink-500/10 transition-all">
              <Settings className="w-4 h-4"/> Configure Webhook
            </button>
          </div>
        </motion.div>

        {/* 💬 FB Messenger (Dynamically Locked/Unlocked) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-blue-500/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 relative z-10">
            <MessageCircle className="w-6 h-6"/>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">FB Messenger</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">Deploy your AI on your Facebook Business Page. Handle support tickets and lead generation 24/7.</p>
          <div className="flex-1 flex flex-col justify-end mt-auto relative z-10">
            {hasMaxPlan ? (
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 transition-all">
                  <Settings className="w-4 h-4"/> Configure Messenger
                </button>
            ) : (
                <button disabled className="w-full bg-white/5 border border-white/10 text-gray-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2 cursor-not-allowed">
                  <Lock className="w-4 h-4"/> Max Plan Required
                </button>
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}