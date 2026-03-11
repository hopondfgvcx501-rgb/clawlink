"use client";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(json => {
        setData(json.stats);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-gray-500 flex items-center justify-center font-mono">LOADING COMMAND CENTER...</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">ClawLink <span className="text-blue-500">Control Room</span></h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">Global Infrastructure Overview</p>
      </header>

      {/* High-Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl">
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2">Total Deployments</p>
          <p className="text-5xl font-black italic">{data.activeBots}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl">
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2">Global Word Count</p>
          <p className="text-5xl font-black italic text-blue-500">{(data.totalTokens / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl">
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2">Infrastructure Health</p>
          <p className="text-5xl font-black italic text-green-500">99.9%</p>
        </div>
      </div>

      {/* Active User Table */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest">Active Multi-Model Instances</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="text-[10px] text-gray-600 uppercase font-black bg-black/50">
            <tr>
              <th className="p-6">User / Email</th>
              <th className="p-6">AI Brain</th>
              <th className="p-6">Channel</th>
              <th className="p-6">Deployed On</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.recentConfigs?.map((config: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-6 font-bold">{config.email}</td>
                <td className="p-6 font-mono text-blue-400 text-xs uppercase">{config.ai_provider} - {config.ai_model}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${config.selected_channel === 'telegram' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {config.selected_channel}
                  </span>
                </td>
                <td className="p-6 text-gray-600 font-mono text-xs">{new Date(config.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}