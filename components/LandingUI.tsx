"use client";

import React from "react";
import { Globe, Database, Mic, Zap, MessageSquare, Activity } from "lucide-react";

interface LandingUIProps {
  renderActionArea: () => React.ReactNode;
  isLocked?: boolean;
}

export default function LandingUI({ renderActionArea, isLocked }: LandingUIProps) {
  return (
    <section className="relative z-10 max-w-[1600px] mx-auto px-6 pt-4 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
        
        {/* LEFT SIDE: Canva 6 Features Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111] p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-2xl transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4"><Globe className="w-5 h-5 text-blue-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Omnichannel Deployment</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Deploy your AI agent across Telegram, WhatsApp Cloud, and your website with a single click.</p>
          </div>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><Database className="w-5 h-5 text-green-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Enterprise RAG Memory</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain.</p>
          </div>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4"><Mic className="w-5 h-5 text-purple-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Voice Note Intelligence</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually.</p>
          </div>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-orange-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Actionable AI Interceptor</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings.</p>
          </div>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center mb-4"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Live CRM & Human Handoff</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Monitor AI conversations in real-time and instantly take over manually when a human touch is needed.</p>
          </div>
          <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4"><Activity className="w-5 h-5 text-yellow-500" /></div>
            <h3 className="text-white font-bold mb-2 text-sm">Marketing Broadcast Engine</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed">Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost.</p>
          </div>
        </div>

        {/* RIGHT SIDE: Action Area (Injected from page.tsx) */}
        <div className="flex flex-col items-center text-center lg:pt-8 xl:pt-12 w-full">
          <h1 className="text-4xl md:text-[3rem] text-white mb-4 font-serif tracking-tight leading-tight">
            Deploy OpenClaw under 30 SECONDS
          </h1>
          <p className="text-gray-300 text-sm md:text-base mb-12 font-serif max-w-md mx-auto leading-relaxed">
            Avoid all technical complexity and one-click deploy your own 24/7 active OpenClaw instance under 30 seconds.
          </p>
          
          <div className="w-full">
            {renderActionArea()}
          </div>
        </div>

      </div>
    </section>
  );
}