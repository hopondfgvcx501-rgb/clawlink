"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Shield, ArrowLeft, Mail, Trash2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeamManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [role, setRole] = useState("Viewer");

  // Mock Data for UI presentation
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, email: session?.user?.email || "ceo@company.com", role: "Owner", status: "Active" },
    { id: 2, email: "support@company.com", role: "Editor", status: "Active" },
    { id: 3, email: "marketing@company.com", role: "Viewer", status: "Pending" },
  ]);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleInvite = () => {
    if (!inviteEmail) return;
    setTeamMembers([...teamMembers, { id: Date.now(), email: inviteEmail, role: role, status: "Pending" }]);
    setInviteEmail("");
  };

  const removeMember = (id: number) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      <header className="max-w-5xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-500" /> Team Workspace
          </h1>
          <p className="text-sm text-gray-400 mt-1">Invite colleagues, assign roles, and manage workspace access.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Invite Member */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <div className="bg-[#111] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400"/> Invite Colleague
            </h2>

            <div className="space-y-4 relative z-10">
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-white"
                />
              </div>

              <div className="relative">
                <Shield className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-white appearance-none cursor-pointer"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Editor">Editor (Can edit bot & CRM)</option>
                  <option value="Viewer">Viewer (Read-only Analytics)</option>
                </select>
              </div>

              <button 
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Send Invite
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Col: Team List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2 px-2">
              <ShieldCheck className="w-4 h-4 text-gray-400"/> Active Members ({teamMembers.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/50 text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                  <tr>
                    <th className="p-4 rounded-tl-xl">User Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-bold text-gray-200">{member.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          member.role === 'Owner' ? 'bg-purple-500/20 text-purple-400' : 
                          member.role === 'Admin' ? 'bg-red-500/20 text-red-400' : 
                          member.role === 'Editor' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1.5 text-xs ${member.status === 'Active' ? 'text-green-400' : 'text-orange-400'}`}>
                          {member.status === 'Active' ? <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> : <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {member.role !== 'Owner' && (
                          <button onClick={() => removeMember(member.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}