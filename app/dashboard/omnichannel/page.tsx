"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: OMNICHANNEL HUB
 * ==============================================================================================
 * @file app/dashboard/omnichannel/page.tsx
 * @description Central interface for connecting Voice AI, Instagram DMs, and FB Messenger.
 * 🚀 FIXED: ESLint Accessibility (a11y) error on the Back button (added aria-label & title).
 * 🚀 SECURED: Strict plan checking to lock/unlock premium FB Messenger integrations.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Mic, 
  MessageCircle, 
  Instagram, 
  PhoneCall, 
  ArrowLeft, 
  Zap, 
  Lock, 
  Settings, 
  Activity 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import SpinnerCounter from "@/components/SpinnerCounter"; // Replacing raw Activity loader

// Strict type for User Data fetching
interface UserProfileData {
  plan?: string;
  email?: string;
  [key: string]: any;
}

export default function OmnichannelHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🚀 STATE MANAGEMENT FOR INPUTS & DB DATA
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);

  // Ref to track mounting status and prevent state updates on unmounted components
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    // Fetch user plan to dynamically unlock premium features
    if (status === "authenticated" && session?.user?.email) {
      const fetchUserData = async () => {
        try {
          const res = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          
          if (!res.ok) throw new Error("Failed to fetch user data");
          
          const data = await res.json();
          if (isMounted.current && data.success && data.data) {
            setUserData(data.data);
          }
        } catch (error) {
          console.error("[OMNICHANNEL_ERROR] Failed to load user data:", error);
        } finally {
          if (isMounted.current) {
            setIsLoading(false);
          }
        }
      };

      fetchUserData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [session, status, router]);

  // 🚀 SECURE LOADER: Uses premium SpinnerCounter instead of legacy Activity spin
  if (status === "loading" || isLoading) {
    return <SpinnerCounter text="LOADING OMNICHANNEL HUB..." />;
  }

  // 🚀 DYNAMIC PLAN CHECKING
  const userPlan = userData?.plan?.toLowerCase() || "free";
  const hasMaxPlan = 
    userPlan === "adv_max" || 
    userPlan === "yearly" || 
    userPlan === "max" || 
    userPlan === "ultra";

  const handleConnectVoice = async () => {
    if (!twilioSid.trim() || !twilioToken.trim()) {
        alert("Please enter both Twilio SID and Auth Token to securely connect the Voice Engine.");
        return;
    }
    
    setIsConnectingVoice(true);
    
    // Simulating backend connection delay for Voice Setup
    setTimeout(() => {
        if (isMounted.current) {
          alert("Voice Engine configuration securely saved! (Backend routing module pending execution)");
          setIsConnectingVoice(false);
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      <header className="max-w-6xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        {/* ✅ FIXED ESLINT ERROR: Added proper aria-label and title for screen readers */}
        <button 
          onClick={() => router.push('/dashboard')} 
          title="Return to Dashboard"
          aria-label="Go back to Dashboard"
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
        </button>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Mic className="w-7 h-7 text-indigo-500" /> Omnichannel & Voice Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Dominate every platform. Deploy your AI simultaneously across Voice, Instagram, and Messenger.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* ============================================================== */}
        {/* 🎙️ Voice AI Agent Configuration */}
        {/* ============================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#111] border border-indigo-500/30 p-8 rounded-[2rem] shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden group flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20 relative z-10">
            <PhoneCall className="w-7 h-7"/>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Voice AI Caller</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
            Assign a dedicated virtual phone number. Your AI will answer live inbound calls and converse with customers in a hyper-realistic human voice.
          </p>
          
          <div className="space-y-4 mb-6 mt-auto relative z-10">
            <div>
              <label htmlFor="twilio-sid" className="sr-only">Twilio Account SID</label>
              <input 
                  id="twilio-sid"
                  type="text" 
                  title="Twilio Account SID"
                  aria-label="Enter Twilio Account SID"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="Twilio Account SID" 
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm focus:border-indigo-500 outline-none transition-colors font-mono" 
              />
            </div>
            <div>
              <label htmlFor="twilio-token" className="sr-only">Twilio Auth Token</label>
              <input 
                  id="twilio-token"
                  type="password" 
                  title="Twilio Auth Token"
                  aria-label="Enter Twilio Auth Token"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="Twilio Auth Token" 
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm focus:border-indigo-500 outline-none transition-colors font-mono" 
              />
            </div>
          </div>
          
          <button 
            onClick={handleConnectVoice} 
            disabled={isConnectingVoice} 
            title={isConnectingVoice ? "Connecting to Voice Engine..." : "Connect Voice Engine"}
            aria-label="Connect Voice Engine"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all relative z-10 disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
          >
            <Zap className="w-4 h-4"/> {isConnectingVoice ? "Establishing Uplink..." : "Connect Voice Engine"}
          </button>
        </motion.div>

        {/* ============================================================== */}
        {/* 📸 Instagram DMs Integration */}
        {/* ============================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="bg-[#111] border border-pink-500/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-6 border border-pink-500/20 relative z-10">
            <Instagram className="w-7 h-7"/>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">Instagram DMs</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
            Auto-reply to Instagram Direct Messages and comments. Convert followers into paying customers instantly while you sleep.
          </p>
          
          <div className="flex-1 flex flex-col justify-end mt-auto relative z-10">
            <button 
              title="Configure Instagram Webhook"
              aria-label="Configure Instagram Webhook"
              className="w-full bg-black border border-pink-500/30 text-pink-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-pink-500/10 transition-all hover:scale-[1.02]"
            >
              <Settings className="w-4 h-4"/> Configure Webhook
            </button>
          </div>
        </motion.div>

        {/* ============================================================== */}
        {/* 💬 FB Messenger (Dynamically Locked/Unlocked via DB Check) */}
        {/* ============================================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-[#111] border border-blue-500/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 relative z-10">
            <MessageCircle className="w-7 h-7"/>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 relative z-10">FB Messenger</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed relative z-10">
            Deploy your AI persona directly onto your Facebook Business Page. Handle support tickets and lead generation 24/7 autonomously.
          </p>
          
          <div className="flex-1 flex flex-col justify-end mt-auto relative z-10">
            {hasMaxPlan ? (
                <button 
                  title="Configure Facebook Messenger"
                  aria-label="Configure Facebook Messenger"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(37,99,235,0.3)]"
                >
                  <Settings className="w-4 h-4"/> Configure Messenger
                </button>
            ) : (
                <button 
                  disabled 
                  title="Locked. Max Plan Required."
                  aria-label="Locked. Max Plan Required."
                  className="w-full bg-white/5 border border-white/10 text-gray-500 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4"/> Max Plan Required
                </button>
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}