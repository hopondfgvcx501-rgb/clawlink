"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, Clock, ArrowLeft, Mail, AlertTriangle, Activity } from "lucide-react";

// Admin email lock
const ADMIN_EMAILS = ["hopondfgvcx501@gmail.com"]; 

interface SupportTicket {
  id: string;
  user_email: string;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeTickets: 0, systemStatus: "Loading..." });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      router.push("/");
      return;
    }

    fetchAdminData();
  }, [session, status, router]);

  const fetchAdminData = async () => {
    try {
      // Fetch Tickets
      const ticketRes = await fetch("/api/admin/support");
      const ticketData = await ticketRes.json();
      if (ticketData.success) {
        setTickets(ticketData.data);
      }

      // Fetch Live Stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Resolved" })
      });
      const data = await res.json();
      if (data.success) {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: "Resolved" } : t));
        setStats(prev => ({ ...prev, activeTickets: Math.max(0, prev.activeTickets - 1) }));
      } else {
        alert("Failed to update ticket status.");
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white"><span className="animate-spin text-4xl">⚙️</span></div>;
  }

  const openTickets = tickets.filter(t => t.status === "Open").length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-red-500/30">
      
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12 border-b border-red-500/20 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="text-2xl font-bold tracking-wider font-mono">clawlink<span className="text-red-500">.</span>admin</div>
        </div>
        <div className="text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-full flex items-center gap-2">
          <ShieldAlert className="w-4 h-4"/> ROOT ACCESS GRANTED
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
            <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400"><Activity className="w-8 h-8"/></div>
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total Active Bots</p>
              <h3 className="text-3xl font-black text-white">{stats.totalUsers}</h3>
            </div>
          </div>
          <div className="bg-[#111] border border-orange-500/30 rounded-2xl p-6 flex items-center gap-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <div className="p-4 bg-orange-500/20 rounded-xl text-orange-400"><AlertTriangle className="w-8 h-8"/></div>
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Action Required</p>
              <h3 className="text-3xl font-black text-white">{openTickets}</h3>
            </div>
          </div>
          <div className="bg-[#111] border border-green-500/30 rounded-2xl p-6 flex items-center gap-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <div className="p-4 bg-green-500/20 rounded-xl text-green-400"><CheckCircle className="w-8 h-8"/></div>
            <div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">System Status</p>
              <h3 className="text-xl font-black text-green-400 mt-1">{stats.systemStatus}</h3>
            </div>
          </div>
        </div>

        {/* TICKETS LIST */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400"/> Recent User Reports
          </h2>

          {tickets.length === 0 ? (
            <div className="text-center py-10 bg-black/50 rounded-xl border border-white/5">
              <p className="text-gray-400">No support tickets found. System is running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {tickets.map((ticket) => (
                  <motion.div 
                    key={ticket.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-6 rounded-2xl border ${ticket.status === 'Open' ? 'bg-orange-500/5 border-orange-500/30' : 'bg-black/50 border-white/5'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${ticket.status === 'Open' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                            {ticket.status}
                          </span>
                          <span className="text-gray-500 text-xs font-mono">{new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{ticket.issue_type}</h4>
                        <p className="text-sm text-blue-400 font-mono mb-4">{ticket.user_email}</p>
                        <div className="bg-[#0A0A0B] p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed">
                          {ticket.description}
                        </div>
                      </div>

                      {ticket.status === "Open" && (
                        <button 
                          onClick={() => markAsResolved(ticket.id)}
                          className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4"/> Mark Resolved
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}