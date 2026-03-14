"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Users, DollarSign, Activity, Database, LogOut, Terminal, RefreshCw, ArrowLeft, LifeBuoy, CheckCircle } from "lucide-react";

// 🚨 ADMIN EMAIL LOCK
const ADMIN_EMAILS = ["hopondfgvcx501@gmail.com"]; 

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalRevenue: 0, apiCalls: 0, systemStatus: "Loading..." });
  const [clients, setClients] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin?email=${session.user.email}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          totalUsers: data.stats.activeClients,
          totalRevenue: data.stats.mrr,
          apiCalls: data.stats.apiCalls,
          systemStatus: "ALL SYSTEMS NOMINAL"
        });
        setClients(data.clients);
        setSystemLogs(data.logs || []);
        setSupportTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
    fetchAdminData();
  }, [session, status, router]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500 font-mono">
        <ShieldAlert className="w-10 h-10 animate-pulse" />
        <span className="ml-3 tracking-widest uppercase text-sm">Verifying Level 9 Clearance...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-300 font-mono selection:bg-red-500/30 overflow-x-hidden relative flex flex-col">
      
      {/* 🔴 RED "GOD MODE" GLOW */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <nav className="relative z-10 border-b border-red-500/20 bg-black/50 backdrop-blur-xl p-6 px-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-widest uppercase">CEO Command Center</h1>
              <p className="text-[10px] text-red-500 font-bold tracking-widest uppercase">Level 9 Clearance: Granted</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white uppercase">{session?.user?.name}</p>
            <p className="text-[10px] text-gray-500">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto w-full p-6 md:p-10 space-y-8 flex-1">
        
        {/* 🚀 TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#111] to-[#0A1A10] border border-green-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.15)] relative overflow-hidden group hover:border-green-500/60 transition-colors">
            <div className="absolute -right-4 -top-4 text-green-500/10 text-8xl"><DollarSign/></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-xl"><DollarSign className="w-6 h-6"/></div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Revenue</h3>
            </div>
            <p className="text-3xl font-black text-white relative z-10">${isLoading ? "..." : stats.totalRevenue.toLocaleString()}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Users className="w-6 h-6"/></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Bots</h3>
            </div>
            <p className="text-3xl font-black text-white">{isLoading ? "..." : stats.totalUsers.toLocaleString()}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl"><Activity className="w-6 h-6"/></div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total API Calls</h3>
            </div>
            <p className="text-3xl font-black text-white">{isLoading ? "..." : stats.apiCalls.toLocaleString()}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111] border border-red-500/20 p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Database className="w-6 h-6"/></div>
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">System Status</h3>
            </div>
            <p className="text-sm font-bold text-white flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> {stats.systemStatus}
            </p>
          </motion.div>
        </div>

        {/* 🚀 RADAR PANELS: ERROR LOGS & SUPPORT TICKETS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SYSTEM ERROR LOGS (TERMINAL) */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-[#0A0A0B] border border-red-500/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)] flex flex-col">
            <div className="p-4 border-b border-red-500/20 bg-red-950/20 flex items-center gap-3">
              <Terminal className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">Live System Logs</h2>
              <span className="ml-auto flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div className="p-4 space-y-3 h-[250px] overflow-y-auto custom-scrollbar font-mono text-xs">
              {systemLogs.length === 0 ? (
                <p className="text-green-500">System running smoothly. No errors detected.</p>
              ) : (
                systemLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${log.type === 'ERROR' ? 'bg-red-500 text-black' : log.type === 'WARNING' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                      {log.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-300">{log.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* CLIENT SUPPORT TICKETS */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-4 border-b border-white/5 bg-[#161618] flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Active Support Tickets</h2>
              <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{supportTickets.length} Pending</span>
            </div>
            <div className="p-4 space-y-3 h-[250px] overflow-y-auto custom-scrollbar">
              {supportTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <CheckCircle className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm font-sans">All caught up! No active tickets.</p>
                </div>
              ) : (
                supportTickets.map((ticket, i) => (
                  <div key={i} className="bg-black/50 border border-white/5 p-4 rounded-xl hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-blue-400">{ticket.user}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ticket.status === 'URGENT' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-sans leading-relaxed">{ticket.issue}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                      <span className="text-[10px] text-gray-600">{ticket.time}</span>
                      <button className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-white transition-colors">Resolve →</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* 🚀 CLIENT DATABASE TABLE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#161618]">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white uppercase tracking-widest">Global Client Roster</h2>
            </div>
            <button onClick={fetchAdminData} className="text-xs text-gray-400 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest font-bold">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} /> Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0A0A0B] text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-5 pl-8">Client Email</th>
                  <th className="p-5">Platform</th>
                  <th className="p-5">Model</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5 pr-8 text-right">Tokens Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Decrypting Server Data...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No active clients found in the database.</td></tr>
                ) : (
                  clients.map((client, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="p-5 pl-8 text-white">{client.email}</td>
                      <td className="p-5">
                        {client.whatsapp_token ? (
                          <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-green-400/20">WhatsApp</span>
                        ) : client.telegram_token ? (
                          <span className="text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-blue-400/20">Telegram</span>
                        ) : (
                          <span className="text-gray-400 bg-gray-400/10 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest">Pending</span>
                        )}
                      </td>
                      <td className="p-5 text-gray-400 font-sans">{client.ai_model || "Not Set"}</td>
                      <td className="p-5">
                        <span className={`uppercase text-[11px] font-bold tracking-wider ${client.plan === 'max' ? 'text-pink-400' : client.plan === 'pro' ? 'text-orange-400' : 'text-gray-400'}`}>
                          {client.plan || 'Starter'}
                        </span>
                      </td>
                      <td className="p-5 pr-8 font-mono text-right">
                        {client.is_unlimited ? (
                          <span className="text-purple-400 font-bold">∞ UNLIMITED</span>
                        ) : (
                          <span className={`${client.available_tokens < 1000 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                            {client.available_tokens?.toLocaleString() || 0}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
}