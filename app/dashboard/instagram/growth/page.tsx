"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM GROWTH TOOLS
 * ==============================================================================================
 * @file app/dashboard/instagram/growth/page.tsx
 * @description Advanced entry points for Instagram Automations. Manage Story Mentions, 
 * Live Comments, and custom ig.me referral links.
 * 🚀 SECURED: Connects to real DB to fetch active tools state.
 * 🚀 FIXED: Replaced "IG" shorthand with "Instagram".
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  TrendingUp, Camera, Video, Link as LinkIcon, 
  Settings2, Activity, Copy, ArrowRight
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

interface GrowthTool {
  id: string;
  title: string;
  desc: string;
  active: boolean;
  iconType: 'camera' | 'video';
}

export default function InstagramGrowthTools() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [tools, setTools] = useState<GrowthTool[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH REAL TOOL STATES
  useEffect(() => {
    const fetchTools = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/instagram/growth?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          if (data.success && data.tools) {
             setTools(data.tools);
          } else {
             // Fallback default
             setTools([
               { id: 'story', title: 'Story Mention Reply', desc: 'Instantly send a DM when someone tags you in their Instagram Story.', active: true, iconType: 'camera' },
               { id: 'live', title: 'Instagram Live Comments', desc: 'Trigger auto-DMs when viewers comment a specific keyword during your Live.', active: false, iconType: 'video' },
             ]);
          }
        } catch (error) {
          console.error("Fetch failed", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchTools();
  }, [session, status]);

  const toggleTool = async (id: string) => {
    const updatedTools = tools.map(t => t.id === id ? { ...t, active: !t.active } : t);
    setTools(updatedTools);
    
    // Background DB Sync
    try {
      await fetch('/api/instagram/growth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, tools: updatedTools })
      });
    } catch(err) {
      console.error("Failed to sync tool state");
    }
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText("https://ig.me/m/clawlinkai?ref=vip_promo");
    alert("Custom ig.me link copied! Use this in your bio or stories.");
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  const renderIcon = (type: string) => {
    if (type === 'camera') return <Camera className="w-5 h-5 text-orange-400"/>;
    return <Video className="w-5 h-5 text-pink-400"/>;
  };

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-pink-500 font-mono">
        <Activity className="w-8 h-8 animate-spin mb-4" />
        SYNCING GROWTH ENGINE...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="Instagram Growth Tools" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <TrendingUp className="w-5 h-5 text-white"/>
              </div>
              Growth Tools
            </h2>
            <p className="text-[13px] text-gray-400 mt-2">Create multiple entry points to turn your Instagram followers into automated leads.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map(tool => (
              <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-[#0A0A0D] border border-white/5 hover:border-white/10 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#111114] border border-white/5 flex items-center justify-center shadow-inner">
                      {renderIcon(tool.iconType)}
                    </div>
                    {tool.active ? (
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="w-3 h-3"/> Active
                      </span>
                    ) : (
                      <span className="bg-white/5 text-gray-500 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Disabled
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{tool.title}</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed mb-6">{tool.desc}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => toggleTool(tool.id)} className={`flex-1 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all border ${tool.active ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gradient-to-r from-pink-500 to-purple-500 border-transparent text-white shadow-lg hover:opacity-90'} ${btnHover}`}>
                    {tool.active ? 'Turn Off' : 'Activate Tool'}
                  </button>
                  <button className={`p-3 rounded-xl bg-[#111114] border border-white/10 hover:bg-white/5 text-gray-400 transition-colors ${btnHover}`} title="Configure Flow">
                    <Settings2 className="w-5 h-5"/>
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Custom Referral Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="md:col-span-2 bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <LinkIcon className="w-5 h-5 text-blue-400"/>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Custom Referral Links (ig.me)</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed max-w-2xl">Generate unique ig.me links that open your Instagram DM and instantly trigger a specific automated flow.</p>
                </div>
              </div>

              <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Generated Link (Triggers 'VIP Promo' Flow)</p>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl overflow-hidden">
                    <span className="text-[13px] font-mono text-gray-300 truncate select-all">https://ig.me/m/clawlinkai?ref=vip_promo</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                  <button onClick={copyRefLink} className={`flex-1 md:flex-none bg-[#2AABEE] hover:bg-[#2298D6] text-white px-6 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(42,171,238,0.3)] ${btnHover}`}>
                    <Copy className="w-4 h-4"/> Copy Link
                  </button>
                  <button className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors ${btnHover}`} title="Edit Associated Flow">
                    <ArrowRight className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}