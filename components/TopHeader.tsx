"use client";

import { Search, Bell, ExternalLink, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  session: any;
  onBotClick?: () => void;
}

export default function TopHeader({ title, session, onBotClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#111]/50 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-2xl font-serif text-white tracking-tight">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}. Your AI fleet is active.
        </p>
      </div>
      <div className="flex items-center gap-4">
        {onBotClick && (
          <button
            onClick={onBotClick}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:scale-105"
          >
            <Bot className="w-4 h-4" /> DEPLOY LIVE AGENT NOW <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        )}
        <div className="hidden md:flex items-center bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm ml-2 text-white placeholder-gray-600 w-32 font-mono" />
        </div>
        <button className="relative p-2.5 bg-[#1A1A1A] border border-white/10 rounded-full hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#111]"></span>
        </button>
      </div>
    </header>
  );
}