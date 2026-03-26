"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Users, DollarSign, Activity, Database, 
  LogOut, Terminal, RefreshCw, ArrowLeft, LifeBuoy, 
  CheckCircle, Crown, Edit2, PlayCircle, Ban, AlertTriangle, Clock, CreditCard
} from "lucide-react";

// 🚨 ADMIN EMAIL LOCK
const ADMIN_EMAILS = ["hopondfgvcx501@gmail.com"]; 

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null); 
  const [stats, setStats] = useState({ activeBots: 0, totalRevenue: 0, totalMessages: 0, failedPayments: 0, avgLatency: "...", systemStatus: "Loading..." });
  const [clients, setClients] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const res = await fetch(`/api/admin?email=${session?.user?.email}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          activeBots: data.stats.activeBots,
          totalRevenue: data.stats.mrr,
          totalMessages: data.stats.totalMessages,
          failedPayments: data.stats.failedPayments,
          avgLatency: data.stats.avgLatency,
          systemStatus: "ALL SYSTEMS NOMINAL"
        });
        setClients(data.clients);
        setSystemLogs(data.logs || []);
        setSupportTickets(data.tickets || []);
      } else {
        setAccessDeniedReason("API Access Denied: " + data.error);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setAccessDeniedReason("You are not logged in. Please return to the Home Page and log in with Google first.");
      return;
    }

    const userEmail = session?.user?.email?.toLowerCase().trim();

    if (!userEmail) {
      setAccessDeniedReason("System cannot detect your Google Email ID. (Possible Browser Cookie Issue)");
      return;
    }

    if (!ADMIN_EMAILS.includes(userEmail)) {
      setAccessDeniedReason(`ACCESS DENIED: Your email ID [ ${userEmail} ] does not have Level 9 God Mode Clearance.`);
      return;
    }

    setIsAuthorized(true);
    fetchAdminData();
  }, [session, status]);

  // 🚀 GOD MODE ACTIONS
  const executeGodAction = async (actionType: string, botId: string, currentValue?: any) => {
    let newValue = null;
    
    if (actionType === "UPDATE_TOKENS") {
        const input = prompt("Enter new Token Limit for this bot:", currentValue);
        if (input === null || isNaN(parseInt(input))) return;
        newValue = input;
    } else if (actionType === "FORCE_RENEW") {
        if (!confirm("Are you sure you want to forcibly grant 30 days of validity to this bot?")) return;
    } else if (actionType === "BLOCK_BOT") {
        if (!confirm("WARNING: This will instantly kill the bot. Are you sure?")) return;
    }

    try {
        const res = await fetch("/api/admin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminEmail: session?.user?.email, action: actionType, botId, newValue })
        });
        const data = await res.json();
        if (data.success) {
            alert("Command Executed Successfully.");
            fetchAdminData(true); 
        } else {
            alert("Execution Failed: " + data.error);
        }
    } catch (e) {
        alert("Network error executing command.");
    }
  };

  const btn = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (accessDeniedReason) {
    return (
      <div className="min-h-screen bg-[#07070A] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] relative z-10" />
        <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase mb-4 relative z-10">Security Lockdown</h1>
        <p className="text-red-400 font-mono text-sm max-w-xl p-5 bg-red-500/10 border border-red-500/20 rounded-2xl leading-relaxed shadow-[0_0_20px_rgba(239,68,68,0.1)] relative z-10">
          {accessDeniedReason}
        </p>
        <button onClick={() => router.push('/')} className={`mt-10 px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] ${btn} relative z-10`}>
          Return to Base
        </button>
      </div>
    );
  }

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#07070A] flex flex-col items-center justify-center text-red-500 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1)_0%,transparent_50%)] pointer-events-none"></div>
        <Activity className="w-12 h-12 animate-spin mb-4" />
        <span className="tracking-widest uppercase text-sm animate-pulse">Verifying Level 9 Clearance...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070A] text-gray-300 font-sans selection:bg-orange-500/30 overflow-x-hidden relative flex flex-col custom-scrollbar">
      
      <div className="fixed top-[-20%] left-[20%] w-[800px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <nav className="relative z-20 border-b border-white/5 bg-[#07070A]/70 backdrop-blur-xl p-5 px-6 md:px-10 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className={`p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl ${btn}`}>
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-orange-600/20 to-red-600/20 rounded-xl text-orange-500 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-widest uppercase">CEO Command Center</h1>
              <p className="text-[9px] text-orange-500 font-bold tracking-[0.2em] uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span> NSA/CIA Level Tracker</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-white uppercase tracking-wider">{session?.user?.name}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className={`p-2.5 text-gray-500 hover:text-red-400 bg-white/5 border border-white/10 rounded-xl ${btn}`}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        
        {/* 🚀 TOP STATS (Financial & Speed Radar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} 
            className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20"><DollarSign className="w-4 h-4"/></div>
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total Collection</h3>
            </div>
            <p className="text-2xl font-black text-white">₹{isLoading ? "..." : stats.totalRevenue.toLocaleString()}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} 
            className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-red-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20"><AlertTriangle className="w-4 h-4"/></div>
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Failed Payments</h3>
            </div>
            <p className="text-2xl font-black text-white">{isLoading ? "..." : stats.failedPayments}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} 
            className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><Users className="w-4 h-4"/></div>
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Live Bots</h3>
            </div>
            <p className="text-2xl font-black text-white">{isLoading ? "..." : stats.activeBots}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} 
            className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20"><Activity className="w-4 h-4"/></div>
              <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Bot Traffic</h3>
            </div>
            <p className="text-2xl font-black text-white">{isLoading ? "..." : stats.totalMessages.toLocaleString()}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} 
            className="bg-[#111113] border border-orange-500/20 p-6 rounded-[1.5rem] shadow-[0_0_30px_rgba(249,115,22,0.05)] relative overflow-hidden group hover:border-orange-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20"><Clock className="w-4 h-4"/></div>
              <h3 className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Avg Latency</h3>
            </div>
            <p className="text-2xl font-black text-white">{stats.avgLatency}</p>
          </motion.div>
        </div>

        {/* 🚀 RADAR PANELS: LIVE TRACKING & SUPPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SYSTEM ERROR & ACTIVITY LOGS (TERMINAL) */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.5 }} 
            className="bg-[#0A0A0C] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col">
            <div className="p-5 border-b border-white/5 bg-[#111113] flex items-center gap-3">
              <Terminal className="w-4 h-4 text-gray-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Live Activity Matrix</h2>
              <span className="ml-auto flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            </div>
            <div className="p-5 space-y-3 h-[280px] overflow-y-auto custom-scrollbar font-mono text-xs">
              {systemLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-green-500/50">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <p>System running smoothly. Listening for events...</p>
                </div>
              ) : (
                systemLogs.map((log, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={i} className="flex items-start gap-3 border-b border-white/5 pb-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${log.type === 'ERROR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : log.type === 'PAYMENT' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : log.type === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {log.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-300 leading-relaxed">{log.message}</p>
                      <p className="text-[9px] text-gray-600 mt-1.5">{log.time}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* REFUNDS & SUPPORT TICKETS */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.6 }} 
            className="bg-[#111113] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col">
            <div className="p-5 border-b border-white/5 bg-[#0A0A0C] flex items-center gap-3">
              <LifeBuoy className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Refunds & Support Queue</h2>
              <span className="ml-auto bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{supportTickets.length} Action Needed</span>
            </div>
            <div className="p-5 space-y-4 h-[280px] overflow-y-auto custom-scrollbar">
              {supportTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <CheckCircle className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-xs font-mono">Queue is empty! Good job.</p>
                </div>
              ) : (
                supportTickets.map((ticket, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={i} className="bg-[#0A0A0C] border border-white/5 p-4 rounded-[1rem] hover:border-orange-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-[11px] font-black text-white">{ticket.user}</span>
                      <div className="flex gap-2">
                        {ticket.type === "REFUND" && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">REFUND</span>}
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${ticket.status === 'URGENT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-400 font-sans leading-relaxed">{ticket.issue}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                      <span className="text-[9px] font-mono text-gray-600">{ticket.time}</span>
                      <div className="flex gap-3">
                        {ticket.type === "REFUND" && <button className="text-[9px] uppercase tracking-widest font-black text-red-500 hover:text-red-400 transition-colors">Process Refund</button>}
                        <button className={`text-[9px] uppercase tracking-widest font-black text-blue-500 hover:text-blue-400 transition-colors ${btn}`}>Resolve →</button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* 🚀 CLIENT DATABASE TABLE (SPEED & GOD MODE) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.7 }} 
          className="bg-[#111113] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.6)]">
          <div className="p-6 md:px-8 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0A0A0C] gap-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-500" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Global Fleet Radar</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Monitor bot latency, health, and execute God Mode commands.</p>
              </div>
            </div>
            <button onClick={() => fetchAdminData(true)} className={`text-[10px] text-gray-400 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg ${btn}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} /> Refresh Radar
            </button>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#07070A] text-[9px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5">
                <tr>
                  <th className="p-5 pl-8">Client / Bot ID</th>
                  <th className="p-5">Channel</th>
                  <th className="p-5">AI Engine</th>
                  <th className="p-5">Speed / Health</th>
                  <th className="p-5">Plan Status</th>
                  <th className="p-5 pr-8 text-right">God Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-500 text-xs font-mono animate-pulse">Decrypting Server Data...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-gray-500 text-xs font-mono">No active bots found in the database.</td></tr>
                ) : (
                  <AnimatePresence>
                    {clients.map((client, idx) => {
                      const isPremium = client.is_unlimited || client.plan?.toLowerCase() === 'max' || client.plan?.toLowerCase() === 'yearly' || client.plan?.toLowerCase() === 'pro';
                      const isExpired = client.plan_expiry_date ? new Date(client.plan_expiry_date) < new Date() : false;
                      const isBlocked = client.tokens_allocated === 0 && !client.is_unlimited;

                      return (
                      <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={client.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-5 pl-8">
                            <p className="text-white font-bold text-xs">{client.email}</p>
                            <p className="text-[9px] text-gray-600 font-mono mt-1">BOT: {client.id.split('-')[0].toUpperCase()}</p>
                        </td>
                        <td className="p-5">
                          {client.selected_channel === 'whatsapp' || client.whatsapp_phone_id ? (
                            <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest border border-green-400/20 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> WhatsApp</span>
                          ) : client.selected_channel === 'telegram' || client.telegram_token ? (
                            <span className="text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest border border-blue-400/20 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Telegram</span>
                          ) : (
                            <span className="text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-md text-[9px] uppercase font-bold tracking-widest border border-purple-400/20 flex items-center w-fit gap-1"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> Widget</span>
                          )}
                        </td>
                        <td className="p-5">
                            <span className="text-gray-300 font-sans text-xs uppercase tracking-wider">{client.selected_model || "Not Set"}</span>
                        </td>
                        {/* 🚀 NEW: Speed and Health Column */}
                        <td className="p-5">
                            <div className="flex items-center gap-2">
                                <span className="text-orange-400 font-mono text-[10px] bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">{client.latency}</span>
                                {client.health === "WARNING" ? (
                                    <span className="text-yellow-500 bg-yellow-500/10 px-1.5 rounded" title="High Latency Detected">⚠️</span>
                                ) : (
                                    <span className="text-green-500 bg-green-500/10 px-1.5 rounded">✓</span>
                                )}
                            </div>
                        </td>
                        <td className="p-5 font-mono text-xs">
                          {isBlocked ? (
                              <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded text-[9px] uppercase tracking-widest">Killed</span>
                          ) : isExpired ? (
                              <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded text-[9px] uppercase tracking-widest">Expired</span>
                          ) : isPremium ? (
                            <span className="text-orange-500 font-bold tracking-widest text-[10px]">∞ UNLIMITED</span>
                          ) : (
                            <span className={`${(client.tokens_allocated - client.tokens_used) < 1000 ? 'text-red-400' : 'text-green-400'}`}>
                              {(client.tokens_allocated - (client.tokens_used || 0)).toLocaleString()} <span className="text-gray-600 text-[10px]">left</span>
                            </span>
                          )}
                        </td>
                        <td className="p-5 pr-8 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => executeGodAction("UPDATE_TOKENS", client.id, client.tokens_allocated)} title="Edit Token Limit" className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded text-gray-500 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                                <button onClick={() => executeGodAction("FORCE_RErab", client.id)} title="Force 30-Day Renewal" className="p-1.5 hover:bg-green-500/20 hover:text-green-400 rounded text-gray-500 transition-colors"><PlayCircle className="w-3.5 h-3.5"/></button>
                                <button onClick={() => executeGodAction("BLOCK_BOT", client.id)} title="Kill Switch (Block Bot)" className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500 transition-colors"><Ban className="w-3.5 h-3.5"/></button>
                            </div>
                        </td>
                      </motion.tr>
                    )})}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}