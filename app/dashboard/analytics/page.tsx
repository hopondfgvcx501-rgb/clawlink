"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, MessageSquare, BrainCircuit, ArrowLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    
    if (session?.user?.email) {
      fetch(`/api/analytics?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStats(data.data);
          }
          setIsLoading(false);
        });
    }
  }, [session, status, router]);

  const exportLeadsCSV = () => {
    if (!stats?.recentLeads) return;
    const headers = "Customer_ID,Last_Active_Date\n";
    const rows = stats.recentLeads.map((lead: any) => `${lead.chatId},${new Date(lead.lastActive).toLocaleString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'ClawLink_Leads.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-blue-500 animate-pulse font-mono">LOADING ANALYTICS ENGINE...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <header className="max-w-6xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-500" /> Deep Analytics & Leads
          </h1>
          <p className="text-sm text-gray-400 mt-1">Track AI performance and download captured customer leads.</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Users className="w-6 h-6"/></div>
            </div>
            <h3 className="text-4xl font-black text-white mb-1">{stats?.totalLeads || 0}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Unique Leads Captured</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-xl"><MessageSquare className="w-6 h-6"/></div>
            </div>
            <h3 className="text-4xl font-black text-white mb-1">{stats?.userMessages || 0}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Customer Messages</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><BrainCircuit className="w-6 h-6"/></div>
            </div>
            <h3 className="text-4xl font-black text-white mb-1">{stats?.aiReplies || 0}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">AI Responses Generated</p>
          </motion.div>
        </div>

        {/* Lead Capture Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Recent Active Leads</h3>
              <p className="text-xs text-gray-500">Customers interacting with your bot across channels</p>
            </div>
            <button 
              onClick={exportLeadsCSV}
              disabled={!stats?.recentLeads || stats?.recentLeads.length === 0}
              className="bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-black/50 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-4 rounded-tl-xl">Customer ID / Phone</th>
                  <th className="p-4">Last Interaction</th>
                  <th className="p-4 rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentLeads?.length > 0 ? (
                  stats.recentLeads.map((lead: any, idx: number) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{lead.chatId}</td>
                      <td className="p-4">{new Date(lead.lastActive).toLocaleString()}</td>
                      <td className="p-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Captured</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500 font-mono">No leads captured yet. Deploy your bot to start gathering data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </main>
    </div>
  );
}