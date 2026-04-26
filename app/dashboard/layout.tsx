"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: DYNAMIC OMNI-CHANNEL SIDEBAR (LAYOUT)
 * ==============================================================================================
 * @file app/dashboard/layout.tsx
 * @description Master layout wrapper. Dynamically renders "Active Channels" in the sidebar
 * and routes to the exact Advanced PRO Features based on the platform.
 * 🚀 SECURED: Added Cache-Control and timestamping to prevent stale data leaks.
 * 🚀 SECURED: Strict null checks and anti-flicker UI for session loading.
 * 🚀 FIXED: Enforced strict full-name channel rendering (WhatsApp, Instagram, Telegram).
 * 🚀 FIXED: Replaced legacy <Activity /> icon with the new premium <SpinnerCounter />.
 * 🚀 FIXED: Added strict instagram_token check for proper sidebar rendering.
 * 🚀 SECURED: Strict frontend Payment Gatekeeper based on plan tier.
 * 🚀 FIXED: Replaced broken Instagram CSS div with proper SVG to match other channels.
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
  ChevronDown, AlertCircle, Menu, X, Cpu, BrainCircuit
} from "lucide-react";
import SpinnerCounter from "@/components/SpinnerCounter"; // 🚀 IMPORTED NEW SPINNER

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  // 🚀 DYNAMIC STATE: Defaults to false. Overridden by secure DB fetch.
  const [activeChannels, setActiveChannels] = useState({
    telegram: false,
    whatsapp: false,
    instagram: false
  });

  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  // Secure Auth Redirect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // 🚀 SECURE REAL-TIME FETCH LOGIC
  useEffect(() => {
    const fetchActiveChannels = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          // Added cache-busting to ensure fresh, secure data retrieval
          const res = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          
          if (!res.ok) throw new Error("Secure fetch failed");
          
          const data = await res.json();
          
          if (data.success && data.data) {
            
            // 🚀 STRICT PAYMENT GATEKEEPER
            const currentPlan = (data.data.plan || "starter").toLowerCase();
            // If the user hasn't paid, they are on 'starter', 'free', or 'unassigned'.
            const isUnpaid = currentPlan === "starter" || currentPlan === "free" || currentPlan === "unassigned";

            // If Unpaid -> Force everything to false, ignoring tokens completely.
            if (isUnpaid) {
               setActiveChannels({
                 telegram: false,    
                 whatsapp: false,    
                 instagram: false   
               });
            } else {
               // If Paid -> Respect the tokens present in the DB
               setActiveChannels({
                 telegram: !!data.data.telegram_token,    
                 whatsapp: !!data.data.whatsapp_phone_id || !!data.data.whatsapp_token,    
                 instagram: !!data.data.instagram_account_id || !!data.data.instagram_token   
               });
            }
            
            if (data.data.selected_channel) {
              setExpandedChannel(data.data.selected_channel);
            }
          }
        } catch (err) {
          console.error("[SECURITY_LOG] Failed to load active channels safely", err);
        } finally {
          setIsLoadingChannels(false);
        }
      }
    };

    fetchActiveChannels();
  }, [session, status]);

  const toggleChannel = (channel: string) => {
    setExpandedChannel(prev => prev === channel ? null : channel);
  };

  // 🚀 ADVANCED PRO FEATURES ROUTING MATRIX
  const menuItems = {
    whatsapp: [
      { name: "Live CRM Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Automation Rules", icon: Cpu, path: "/dashboard/whatsapp/automation" },
      { name: "Flow Builder", icon: Workflow, path: "/dashboard/whatsapp/flow" },
      { name: "Broadcast Engine", icon: Megaphone, path: "/dashboard/whatsapp/broadcast" },
      { name: "Contacts & CRM", icon: Users, path: "/dashboard/whatsapp/contacts" },
      { name: "Chat Labels", icon: Tag, path: "/dashboard/whatsapp/labels" },
      { name: "Data Analytics", icon: BarChart3, path: "/dashboard/analytics" },
      { name: "AI Copilot", icon: BrainCircuit, path: "/dashboard/whatsapp/copilot" },
      { name: "Team Access", icon: UsersRound, path: "/dashboard/team" }
    ],
    instagram: [
      { name: "Live CRM Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Auto Comments", icon: MessageSquareQuote, path: "/dashboard/instagram/comments" },
      { name: "DM Automations", icon: Cpu, path: "/dashboard/instagram/automations" },
      { name: "Flow Builder", icon: Workflow, path: "/dashboard/instagram/flow" },
      { name: "Leads Database", icon: Users, path: "/dashboard/instagram/leads" },
      { name: "Mass Campaigns", icon: Megaphone, path: "/dashboard/instagram/campaigns" },
      { name: "Growth Funnels", icon: Sparkles, path: "/dashboard/instagram/growth" },
      { name: "Data Analytics", icon: BarChart3, path: "/dashboard/analytics" },
      { name: "AI Copilot", icon: BrainCircuit, path: "/dashboard/instagram/copilot" },
      { name: "Team Access", icon: UsersRound, path: "/dashboard/team" }
    ],
    telegram: [
      { name: "Live CRM Inbox", icon: MessageCircle, path: "/dashboard/crm" },
      { name: "Bot Manager", icon: Bot, path: "/dashboard/telegram/bots" },
      { name: "Automation Rules", icon: Cpu, path: "/dashboard/telegram/automation" },
      { name: "Flow Builder", icon: Workflow, path: "/dashboard/telegram/flow" },
      { name: "Broadcast Engine", icon: Megaphone, path: "/dashboard/telegram/broadcast" },
      { name: "Groups Mod", icon: UsersRound, path: "/dashboard/telegram/groups" },
      { name: "Media Library", icon: Folder, path: "/dashboard/telegram/media" },
      { name: "Subscribers", icon: Users, path: "/dashboard/telegram/users" },
      { name: "Data Analytics", icon: BarChart3, path: "/dashboard/analytics" },
      { name: "AI Copilot", icon: BrainCircuit, path: "/dashboard/telegram/copilot" },
      { name: "Team Access", icon: UsersRound, path: "/dashboard/team" }
    ]
  };

  const getBrandColor = (channel: string) => {
    if (channel === "whatsapp") return "text-[#25D366] bg-[#25D366]/10";
    if (channel === "telegram") return "text-[#2AABEE] bg-[#2AABEE]/10";
    if (channel === "instagram") return "text-pink-500 bg-pink-500/10";
    return "text-gray-400";
  };

  // Explicit Strict Casing Function
  const getExactChannelName = (channel: string) => {
    if (channel === "whatsapp") return "WhatsApp";
    if (channel === "instagram") return "Instagram";
    if (channel === "telegram") return "Telegram";
    return channel;
  };

  const BrandIcon = ({ channel, size = 18 }: { channel: string, size?: number }) => {
    if (channel === "whatsapp") return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor"><path d="M50 15c-19.3 0-35 15.7-35 35 0 6.2 1.6 12.2 4.7 17.5L15 85l17.5-4.7c5.3 3.1 11.3 4.7 17.5 4.7 19.3 0 35-15.7 35-35S69.3 15 50 15zm0 63.8c-5.2 0-10.4-1.4-15-4.1l-1.1-.6-11.1 2.9 2.9-10.8-.7-1.1c-2.9-4.7-4.5-10.1-4.5-15.6 0-16.2 13.2-29.4 29.4-29.4s29.4 13.2 29.4 29.4-13.2 29.4-29.4 29.4z"/><path d="M42 34h9.5c5.5 0 8.5 2.5 8.5 5.5s-2.8 4.2-5.5 4.8c4 1 7 3.5 7 7.5 0 5.5-5.5 7.2-10 7.2H42V34zm5 5.5v7h4c2 0 4-1 4-3.5s-2-3.5-4-3.5h-4zm0 11v8h4.5c3 0 4.5-1.5 4.5-4s-2-4-4.5-4H47z"/></svg>
    );
    if (channel === "telegram") return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="currentColor"/><path d="M5.425 11.871L16.48 7.61c.526-.196 1.006.124.819.86l-1.892 8.92c-.167.755-.615.939-1.242.593L10.73 15.45l-1.657 1.588c-.183.183-.338.338-.692.338l.245-3.528 6.425-5.8c.28-.249-.06-.388-.435-.138L6.68 12.89l-3.417-1.066c-.744-.233-.759-.745.155-1.103z" fill="#fff"/></svg>
    );
    if (channel === "instagram") return (
      // 🚀 FIXED: Solid SVG replacing broken div logic
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    );
    return null;
  };

  // 🚀 FIXED: REPLACED OLD 'ACTIVITY' ZIGZAG WITH NEW SPINNERCOUNTER
  if (status === "loading") {
    return <SpinnerCounter text="AUTHENTICATING WORKSPACE..." />;
  }

  const deployedChannels = Object.keys(activeChannels).filter(k => activeChannels[k as keyof typeof activeChannels]);

  return (
    <div className="flex h-screen bg-[#07070A] text-[#E8E8EC] font-sans overflow-hidden selection:bg-orange-500/30">
      
      {/* 📱 MOBILE OVERLAY BACKDROP */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 🚀 SMART SIDEBAR */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-[280px] bg-[#0A0A0D] border-r border-white/5 flex flex-col shrink-0 z-50 shadow-[5px_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        {/* Header / Logo */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="cursor-pointer" onClick={() => router.push("/")}>
            <svg width="120" height="20" viewBox="0 0 152 26" fill="none">
              <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
              <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              <text x="30" y="18" fontFamily="sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="#fff">LAWLINK</text>
            </svg>
          </div>
          <button title="Close menu" onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* Core Enterprise Tools */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-2">Enterprise Tools</p>
            <div className="space-y-1">
              <button onClick={() => router.push("/dashboard")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <LayoutDashboard className="w-4 h-4"/> Global Overview
              </button>
              <button onClick={() => router.push("/dashboard/crm")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard/crm" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <Inbox className="w-4 h-4"/> Live CRM Inbox
              </button>
              <button onClick={() => router.push("/dashboard/analytics")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${pathname === "/dashboard/analytics" ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                <BarChart3 className="w-4 h-4"/> Universal Analytics
              </button>
            </div>
          </div>

          {/* Dynamic Channels & Sub-features */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3 pl-2">Active Workspaces</p>
            
            {isLoadingChannels ? (
               <div className="pl-3 py-2 text-[11px] text-gray-600 font-mono flex items-center gap-2">
                 <SpinnerCounter text="Syncing..." />
               </div>
            ) : deployedChannels.length > 0 ? (
              <div className="space-y-3">
                {deployedChannels.map((channel) => (
                  <div key={channel} className={`flex flex-col transition-all duration-300 rounded-2xl overflow-hidden ${expandedChannel === channel ? 'bg-[#111114] border border-white/5 shadow-xl' : 'bg-transparent border border-transparent'}`}>
                    
                    <button 
                      onClick={() => toggleChannel(channel)}
                      className={`flex items-center justify-between w-full p-3 transition-colors rounded-xl ${expandedChannel === channel ? '' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBrandColor(channel)}`}>
                          <BrandIcon channel={channel} />
                        </div>
                        <span className="text-[13px] font-bold text-white">{getExactChannelName(channel)}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedChannel === channel ? "rotate-180 text-white" : ""}`}/>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedChannel === channel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 pt-0 pb-3 space-y-0.5 mt-1">
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
              <div className="bg-[#111114] border border-dashed border-white/10 rounded-xl p-4 text-center mx-2 mt-2">
                <AlertCircle className="w-5 h-5 text-orange-500/50 mx-auto mb-2" />
                <p className="text-[11px] text-gray-400 leading-relaxed mb-3">No bots deployed yet.</p>
                <button 
                  onClick={() => alert("Please head to the homepage and deploy a bot.")} 
                  className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors w-full"
                >
                  Pending Deploy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 bg-[#0A0A0D]">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {session?.user?.name?.charAt(0) || "C"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[12px] font-bold text-white truncate">{session?.user?.name || "Workspace Owner"}</span>
                <span className="text-[10px] text-gray-500 truncate">{session?.user?.email}</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); signOut(); }} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Secure Logout">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#07070A] overflow-hidden relative">
        
        {/* 📱 Mobile Top Navbar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0A0A0D] z-30 shrink-0">
           <div className="flex items-center gap-2">
             <svg width="90" height="16" viewBox="0 0 152 26" fill="none">
               <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
               <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
               <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
               <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
               <text x="30" y="18" fontFamily="sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="#fff">LAWLINK</text>
             </svg>
           </div>
           <button title="Open menu" onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 bg-white/5 border border-white/10 rounded-md text-white hover:bg-white/10 transition-colors">
             <Menu className="w-5 h-5" />
           </button>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </main>
      </div>

    </div>
  );
}