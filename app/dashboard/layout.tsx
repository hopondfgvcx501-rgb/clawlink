"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: DYNAMIC OMNI-CHANNEL SIDEBAR (LAYOUT)
 * ==============================================================================================
 * @file app/dashboard/layout.tsx
 * @description Master layout wrapper. Dynamically renders "Active Channels" in the sidebar
 * ONLY if the user has successfully deployed/paid for that channel (verified via tokens).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Inbox, BarChart3, Settings, LogOut, 
  MessageCircle, Bot, Workflow, Megaphone, Users, Tag, 
  Sparkles, MessageSquareQuote, UsersRound, Folder, 
  ChevronDown, Activity, AlertCircle
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  
  // 🚀 DYNAMIC STATE: Default to false. Will be overridden by DB fetch.
  const [activeChannels, setActiveChannels] = useState({
    telegram: false,
    whatsapp: false,
    instagram: false
  });

  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // 🚀 REAL-TIME FETCH LOGIC: Checks database to see which bots are LIVE
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Channel is ONLY active if the token exists in the database
            setActiveChannels({
              telegram: !!data.data.telegram_token,    
              whatsapp: !!data.data.whatsapp_token,    
              instagram: !!data.data.instagram_token   
            });
          }
          setIsLoadingChannels(false);
        })
        .catch(err => {
          console.error("Failed to load active channels", err);
          setIsLoadingChannels(false);
        });
    }
  }, [session, status]);

  const toggleChannel = (channel: string) => {
    setExpandedChannel(prev => prev === channel ? null : channel);
  };

  // Channel-specific tools mapping
  const menuItems = {
    whatsapp: [
      { name: "Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Automation", icon: Bot, path: "/dashboard/whatsapp/automation" },
      { name: "Flow Builder", icon: Workflow, path: "/dashboard/whatsapp/flow" },
      { name: "Broadcast", icon: Megaphone, path: "/dashboard/whatsapp/broadcast" },
      { name: "Labels", icon: Tag, path: "/dashboard/whatsapp/labels" },
    ],
    instagram: [
      { name: "Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Automations", icon: Bot, path: "/dashboard/instagram/automations" },
      { name: "Comments", icon: MessageSquareQuote, path: "/dashboard/instagram/comments" },
      { name: "Campaigns", icon: Megaphone, path: "/dashboard/instagram/campaigns" },
      { name: "Growth Tools", icon: Sparkles, path: "/dashboard/instagram/growth" },
    ],
    telegram: [
      { name: "Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Bots", icon: Bot, path: "/dashboard/telegram/bots" },
      { name: "Flow Builder", icon: Workflow, path: "/dashboard/telegram/flow" },
      { name: "Broadcast", icon: Megaphone, path: "/dashboard/telegram/broadcast" },
      { name: "Groups & Channels", icon: UsersRound, path: "/dashboard/telegram/groups" },
      { name: "Media Library", icon: Folder, path: "/dashboard/telegram/media" },
    ]
  };

  const getBrandColor = (channel: string) => {
    if (channel === "whatsapp") return "text-[#25D366] bg-[#25D366]/10";
    if (channel === "telegram") return "text-[#2AABEE] bg-[#2AABEE]/10";
    if (channel === "instagram") return "text-pink-500 bg-pink-500/10";
    return "text-gray-400";
  };

  const BrandIcon = ({ channel, size = 18 }: { channel: string, size?: number }) => {
    if (channel === "whatsapp") return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor"><path d="M50 15c-19.3 0-35 15.7-35 35 0 6.2 1.6 12.2 4.7 17.5L15 85l17.5-4.7c5.3 3.1 11.3 4.7 17.5 4.7 19.3 0 35-15.7 35-35S69.3 15 50 15zm0 63.8c-5.2 0-10.4-1.4-15-4.1l-1.1-.6-11.1 2.9 2.9-10.8-.7-1.1c-2.9-4.7-4.5-10.1-4.5-15.6 0-16.2 13.2-29.4 29.4-29.4s29.4 13.2 29.4 29.4-13.2 29.4-29.4 29.4z"/><path d="M42 34h9.5c5.5 0 8.5 2.5 8.5 5.5s-2.8 4.2-5.5 4.8c4 1 7 3.5 7 7.5 0 5.5-5.5 7.2-10 7.2H42V34zm5 5.5v7h4c2 0 4-1 4-3.5s-2-3.5-4-3.5h-4zm0 11v8h4.5c3 0 4.5-1.5 4.5-4s-2-4-4.5-4H47z"/></svg>
    );
    if (channel === "telegram") return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="currentColor"/><path d="M5.425 11.871L16.48 7.61c.526-.196 1.006.124.819.86l-1.892 8.92c-.167.755-.615.939-1.242.593L10.73 15.45l-1.657 1.588c-.183.183-.338.338-.692.338l.245-3.528 6.425-5.8c.28-.249-.06-.388-.435-.138L6.68 12.89l-3.417-1.066c-.744-.233-.759-.745.155-1.103z" fill="#fff"/></svg>
    );
    if (channel === "instagram") return (
      <div style={{ width: size, height: size }} className={`rounded-[4px] bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transform-gpu shrink-0`}>
        <div className="w-[60%] h-[60%] border-[1.5px] border-white rounded-[3px] flex items-center justify-center">
          <div className="w-[30%] h-[30%] bg-white rounded-full"/>
        </div>
      </div>
    );
    return null;
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#07070A] flex flex-col items-center justify-center text-orange-500 font-mono tracking-widest"><Activity className="w-8 h-8 animate-spin mb-4"/>LOADING INTERFACE...</div>;
  }

  // Filter ONLY the channels that returned true (meaning they have tokens deployed in DB)
  const deployedChannels = Object.keys(activeChannels).filter(k => activeChannels[k as keyof typeof activeChannels]);

  return (
    <div className="flex h-screen bg-[#07070A] text-[#E8E8EC] font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* 🚀 SMART SIDEBAR */}
      <aside className="w-[280px] bg-[#0A0A0D] border-r border-white/5 flex flex-col shrink-0 relative z-50 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        
        {/* Header / Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-white/5 shrink-0 cursor-pointer" onClick={() => router.push("/")}>
          <svg width="120" height="20" viewBox="0 0 152 26" fill="none">
            <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
            <text x="30" y="18" fontFamily="sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="#fff">LAWLINK</text>
          </svg>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Core Tools (Always Visible) */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-2">Enterprise Tools</p>
            <div className="space-y-1">
              <button onClick={() => router.push("/dashboard")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <LayoutDashboard className="w-4 h-4"/> Overview
              </button>
              <button onClick={() => router.push("/dashboard/crm")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard/crm" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <Inbox className="w-4 h-4"/> Live CRM Inbox
              </button>
              <button onClick={() => router.push("/dashboard/analytics")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard/analytics" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <BarChart3 className="w-4 h-4"/> Data Analytics
              </button>
            </div>
          </div>

          {/* Dynamic Channels (Only Visible if Deployed) */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-2">Active Channels</p>
            
            {isLoadingChannels ? (
               <div className="pl-3 py-2 text-[11px] text-gray-600 font-mono flex items-center gap-2">
                 <Activity className="w-3 h-3 animate-spin"/> Syncing Deployment Status...
               </div>
            ) : deployedChannels.length > 0 ? (
              <div className="space-y-2">
                {deployedChannels.map((channel) => (
                  <div key={channel} className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-[#111114]">
                    
                    {/* Parent Toggle */}
                    <button 
                      onClick={() => toggleChannel(channel)}
                      className={`flex items-center justify-between w-full p-3 transition-colors ${expandedChannel === channel ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBrandColor(channel)}`}>
                          <BrandIcon channel={channel} />
                        </div>
                        <span className="text-[13px] font-bold text-white capitalize">My {channel}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedChannel === channel ? "rotate-180" : ""}`}/>
                    </button>

                    {/* Children (Animated Accordion) */}
                    <AnimatePresence initial={false}>
                      {expandedChannel === channel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 pb-3 space-y-0.5 border-t border-white/5 mt-1 bg-black/20">
                            {menuItems[channel as keyof typeof menuItems].map((item, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => router.push(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all group ${pathname === item.path ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                              >
                                <item.icon className={`w-4 h-4 transition-colors ${pathname === item.path ? 'opacity-100 text-orange-400' : 'opacity-50 group-hover:opacity-100 group-hover:text-orange-400'}`} />
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                ))}
              </div>
            ) : (
              // Empty State: If no bots are deployed yet
              <div className="bg-[#111114] border border-dashed border-white/10 rounded-xl p-4 text-center mx-2 mt-2">
                <AlertCircle className="w-5 h-5 text-orange-500/50 mx-auto mb-2" />
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">No bots deployed yet.</p>
                <button 
                  onClick={() => router.push('/dashboard/settings')} 
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors w-full"
                >
                  Connect API Keys
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 bg-[#0A0A0D]">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors" onClick={() => router.push('/dashboard/settings')}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {session?.user?.name?.charAt(0) || "C"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[12px] font-bold text-white truncate">{session?.user?.name || "Workspace Owner"}</span>
                <span className="text-[10px] text-gray-500 truncate">{session?.user?.email}</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); signOut(); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>

      </aside>

      {/* 🚀 MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-[#07070A] overflow-hidden relative">
        {/* Content injected here (page.tsx, crm/page.tsx, etc.) */}
        {children}
      </main>

    </div>
  );
}