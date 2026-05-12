"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: UNIVERSAL ANALYTICS DASHBOARD
 * ==============================================================================================
 * @file app/dashboard/telegram/analytics/page.tsx
 * @description Real-time data visualization for Telegram operations.
 * 🚀 SECURED: Strict real DB fetch with no-store cache control.
 * 🚀 UPGRADED: Custom Tailwind CSS charts for zero-dependency blazing fast rendering.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart3, Users, MessageSquare, Zap, 
  Activity, ArrowUpRight, Cpu, Bot
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

export default function TelegramAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 FETCH REAL DATABASE METRICS
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const res = await fetch(`/api/telegram/analytics?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-store' }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setMetrics(data.data);
          }
        } catch (error) {
          console.error("[ANALYTICS_SYNC_ERROR] Failed to load metrics", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAnalytics();
  }, [session, status]);

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="AGGREGATING LIVE DATABASE METRICS..." />;
  }

  if (!metrics) {
      return (
          <div className="flex flex-col h-screen bg-[#07070A] text-white">
              <TopHeader title="Universal Analytics" session={session} />
              <div className="flex-1 flex items-center justify-center text-gray-500">
                  Failed to load analytics data. Please check backend logs.
              </div>
          </div>
      );
  }

  // Calculate Max for Chart Scaling
  const maxChartValue = Math.max(...metrics.chartData.map((d: any) => Math.max(d.user, d.bot, 1)));
  const usagePercentage = metrics.billing.tokensAllocated > 0 
      ? Math.min(100, Math.round((metrics.billing.tokensUsed / metrics.billing.tokensAllocated) * 100)) 
      : 0;

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Universal Analytics" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
          
          {/* 🌟 HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-[#2AABEE]" /> Operations Center
              </h1>
              <p className="text-[12px] text-gray-500 mt-2 uppercase tracking-widest font-mono">
                  Live Telegram Metrics • Last 7 Days
              </p>
            </div>
            <div className="bg-[#111114] border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time DB Sync Active</span>
            </div>
          </div>

          {/* 📊 TOP STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard 
                icon={<Users className="w-5 h-5 text-purple-400" />} 
                title="Unique Customers" 
                value={metrics.overview.totalUniqueUsers} 
                subtitle="Interacted with bot"
                borderColor="border-purple-500/20"
                bgGradient="from-purple-500/10 to-transparent"
            />
            <StatCard 
                icon={<MessageSquare className="w-5 h-5 text-[#2AABEE]" />} 
                title="Total Traffic (7D)" 
                value={metrics.overview.totalMessages7D} 
                subtitle="Inbound & Outbound"
                borderColor="border-[#2AABEE]/20"
                bgGradient="from-[#2AABEE]/10 to-transparent"
            />
            <StatCard 
                icon={<Bot className="w-5 h-5 text-green-400" />} 
                title="AI Responses" 
                value={metrics.overview.botMessages} 
                subtitle="Automated replies sent"
                borderColor="border-green-500/20"
                bgGradient="from-green-500/10 to-transparent"
            />
            <StatCard 
                icon={<Cpu className="w-5 h-5 text-orange-400" />} 
                title="Messages This Month" 
                value={metrics.billing.messagesThisMonth} 
                subtitle={`Plan: ${metrics.billing.plan.toUpperCase()}`}
                borderColor="border-orange-500/20"
                bgGradient="from-orange-500/10 to-transparent"
            />
          </div>

          {/* 📉 MAIN CHART & SYSTEM HEALTH */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: 7-DAY ACTIVITY CHART */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              
              <div className="flex items-center justify-between mb-8">
                  <div>
                      <h3 className="text-[13px] font-black uppercase tracking-widest text-white">Traffic Volume</h3>
                      <p className="text-[10px] text-gray-500 mt-1">Daily comparison of User vs Bot messages.</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-600"/> User</span>
                      <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#2AABEE] shadow-[0_0_10px_rgba(42,171,238,0.5)]"/> Bot AI</span>
                  </div>
              </div>

              {/* CUSTOM TAILWIND BAR CHART */}
              <div className="flex-1 flex items-end gap-2 md:gap-4 h-[250px] mt-auto border-b border-white/10 pb-2 relative">
                  {/* Y-Axis Grid Lines (Decorative) */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                      <div className="border-b border-white border-dashed w-full h-0"/>
                      <div className="border-b border-white border-dashed w-full h-0"/>
                      <div className="border-b border-white border-dashed w-full h-0"/>
                  </div>

                  {metrics.chartData.map((day: any, idx: number) => {
                      const userHeight = `${Math.max(5, (day.user / maxChartValue) * 100)}%`;
                      const botHeight = `${Math.max(5, (day.bot / maxChartValue) * 100)}%`;
                      const displayDate = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

                      return (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end group z-10">
                              <div className="flex items-end justify-center w-full gap-1 px-1 h-full">
                                  {/* User Bar */}
                                  <div className="w-1/2 bg-gray-600/50 hover:bg-gray-500 rounded-t-md transition-all relative group-hover:opacity-100 opacity-80" style={{ height: userHeight }}>
                                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{day.user}</span>
                                  </div>
                                  {/* Bot Bar */}
                                  <div className="w-1/2 bg-[#2AABEE] hover:bg-[#43b6f2] rounded-t-md transition-all relative shadow-[0_0_15px_rgba(42,171,238,0.15)] group-hover:shadow-[0_0_20px_rgba(42,171,238,0.4)]" style={{ height: botHeight }}>
                                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#2AABEE] opacity-0 group-hover:opacity-100 transition-opacity">{day.bot}</span>
                                  </div>
                              </div>
                              <span className="text-[9px] text-gray-500 font-mono mt-3 uppercase tracking-tighter">{displayDate}</span>
                          </div>
                      );
                  })}
              </div>
            </motion.div>

            {/* RIGHT: AI RESOURCE BURN (TOKEN METER) */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              
              <h3 className="text-[13px] font-black uppercase tracking-widest text-white mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> AI Resource Burn
              </h3>
              <p className="text-[10px] text-gray-500 mb-8">Token utilization for the current billing cycle.</p>

              <div className="flex-1 flex flex-col justify-center">
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                      {/* Circular Progress Background */}
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                          <circle 
                              cx="96" cy="96" r="88" 
                              stroke={usagePercentage > 85 ? "#ef4444" : "#eab308"} 
                              strokeWidth="12" fill="none" 
                              strokeDasharray="552.92" 
                              strokeDashoffset={552.92 - (552.92 * usagePercentage) / 100} 
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                          />
                      </svg>
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-white">{usagePercentage}%</span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Consumed</span>
                      </div>
                  </div>

                  <div className="mt-8 bg-[#111114] border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tokens Used</span>
                          <span className="text-xs font-mono text-white">{metrics.billing.tokensUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Limit</span>
                          <span className="text-xs font-mono text-white">{metrics.billing.tokensAllocated === 0 ? "Unlimited" : metrics.billing.tokensAllocated.toLocaleString()}</span>
                      </div>
                  </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}

// Sub-component for Stats
function StatCard({ icon, title, value, subtitle, borderColor, bgGradient }: any) {
    return (
        <motion.div whileHover={{ y: -4 }} className={`bg-gradient-to-b ${bgGradient} border ${borderColor} rounded-[20px] p-5 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <ArrowUpRight className="w-12 h-12" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center mb-4 relative z-10 backdrop-blur-sm">
                {icon}
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 relative z-10">{title}</h4>
            <div className="text-2xl font-black text-white mt-1 mb-2 font-mono relative z-10">{value.toLocaleString()}</div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider relative z-10">{subtitle}</p>
        </motion.div>
    );
}