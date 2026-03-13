"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Users, DollarSign, Activity, Database, LogOut, Terminal } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 🚨🚨 BOSS, YAHAN APNI ASLI EMAIL ID DAALNA 🚨🚨
  const CEO_EMAIL = "your-email@gmail.com"; 

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      if (session?.user?.email !== CEO_EMAIL) {
        // Hacker ya normal user ko seedha bahar feko
        router.push("/dashboard");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [status, session, router]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500 font-mono">
        <ShieldAlert className="w-10 h-10 animate-pulse" />
        <span className="ml-3 tracking-widest uppercase text-sm">Verifying Clearance Level...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-300 font-mono selection:bg-red-500/30 overflow-x-hidden relative">
      
      {/* 🔴 RED "GOD MODE" GLOW */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <nav className="relative z-10 border-b border-red-500/20 bg-black/50 backdrop-blur-xl p-6 px-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase">CEO Command Center</h1>
            <p className="text-[10px] text-red-500 font-bold tracking-widest uppercase">Level 9 Clearance: Granted</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold text-white uppercase">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-500 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-10 space-y-8">
        
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><DollarSign className="w-5 h-5"/></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total MRR</h3>
            </div>
            <p className="text-3xl font-black text-white">$12,450</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users className="w-5 h-5"/></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Clients</h3>
            </div>
            <p className="text-3xl font-black text-white">348</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Activity className="w-5 h-5"/></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">API Calls (Today)</h3>
            </div>
            <p className="text-3xl font-black text-white">84.2K</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111] border border-red-500/20 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Database className="w-5 h-5"/></div>
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">System Status</h3>
            </div>
            <p className="text-xl font-bold text-white flex items-center gap-2 mt-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span> ALL SYSTEMS NOMINAL
            </p>
          </motion.div>
        </div>

        {/* CLIENT DATABASE TABLE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Global Client Roster</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A0A0B] text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-5 pl-8">Client Email</th>
                  <th className="p-5">Platform</th>
                  <th className="p-5">Model</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5 pr-8">Tokens Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                {/* 🔴 MOCK DATA - You will connect this to Supabase later */}
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-5 pl-8">johndoe@company.com</td>
                  <td className="p-5"><span className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs uppercase">WhatsApp</span></td>
                  <td className="p-5 text-gray-400">gpt-4-turbo</td>
                  <td className="p-5"><span className="text-orange-400 uppercase text-xs">Pro</span></td>
                  <td className="p-5 pr-8 font-mono">489,200</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-5 pl-8">startup@agency.net</td>
                  <td className="p-5"><span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded text-xs uppercase">Telegram</span></td>
                  <td className="p-5 text-gray-400">gemini-3-flash</td>
                  <td className="p-5"><span className="text-pink-400 uppercase text-xs">Max</span></td>
                  <td className="p-5 pr-8 font-mono text-purple-400">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
}