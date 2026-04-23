"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TEAM WORKSPACE
 * ==============================================================================================
 * @file app/dashboard/whatsapp/team/page.tsx
 * @description Manage team access, invite colleagues, and assign roles for WhatsApp.
 * 🚀 SECURED: Full Real DB integration with workspace_members table.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, Shield, Mail, Activity, Trash2, ArrowLeft, AlertCircle
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface TeamMember {
  id: string;
  member_email: string;
  role: string;
  status: string;
}

export default function TeamWorkspace() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // 🚀 FETCH TEAM FROM DB
  const fetchTeam = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/whatsapp/team?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.success && data.members) {
          setMembers(data.members);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => { fetchTeam(); }, [session, status]);

  // 🚀 SEND INVITE TO DB
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !session?.user?.email) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/whatsapp/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_email: session.user.email,
          member_email: inviteEmail,
          role: inviteRole
        })
      });

      const responseText = await res.text();
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      
      const data = JSON.parse(responseText);
      if (data.success) {
        alert("🟢 Colleague invited successfully!");
        setInviteEmail(""); // Clear input
        fetchTeam(); // Refresh list
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Backend Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🚀 REMOVE MEMBER FROM DB
  const handleRemove = async (id: string) => {
    if (!confirm("Remove this member from your workspace?")) return;
    
    try {
      const res = await fetch("/api/whatsapp/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_email: session?.user?.email, id })
      });
      const data = await res.json();
      if (data.success) fetchTeam();
      else alert(`Error: ${data.error}`);
    } catch (err) {
      alert("Failed to remove member.");
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95]";

  if (isLoading || status === "loading") return <SpinnerCounter text="LOADING WORKSPACE..." />;

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Team Workspace" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <button onClick={() => router.back()} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Users className="w-6 h-6 text-[#2AABEE]"/> Team Workspace
              </h2>
              <p className="text-[13px] text-gray-400 mt-1">Invite colleagues, assign roles, and manage workspace access.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 🟢 LEFT: INVITE COLLEAGUE */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-[#2AABEE]"></div>
                
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2AABEE]"/> Invite Colleague
                </h3>

                <div className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder="e.g. colleague@company.com" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none focus:border-[#2AABEE]/50 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-[#111114] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-gray-300 outline-none focus:border-[#2AABEE]/50 appearance-none transition-colors cursor-pointer"
                    >
                      <option value="Editor">Editor (Manage Automations)</option>
                      <option value="Viewer">Viewer (Read Only)</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleInvite} 
                    disabled={isProcessing || !inviteEmail}
                    className={`w-full bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/30 text-[#2AABEE] py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${btnHover}`}
                  >
                    {isProcessing ? <Activity className="w-4 h-4 animate-spin"/> : null}
                    {isProcessing ? "Processing..." : "Send Invite"}
                  </button>

                  <div className="pt-4 flex gap-3 text-[10px] text-gray-500 leading-relaxed items-start">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0"/>
                    <p>Invitations expire in 48 hours. Ensure the email address is correct before sending.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 🟢 RIGHT: ACTIVE MEMBERS TABLE */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 shadow-xl min-h-[400px]">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500"/> Active Members ({members.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] uppercase font-black text-gray-600 tracking-widest border-b border-white/5">
                      <tr>
                        <th className="pb-4 pl-2">User Email</th>
                        <th className="pb-4">Role</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 pl-2 font-bold text-gray-300">{member.member_email}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                              member.role === 'OWNER' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                              member.role === 'Editor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                              'bg-gray-800 text-gray-400 border-white/10'
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="py-4 flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></div> {member.status}
                          </td>
                          <td className="py-4 text-right pr-4">
                            {member.role !== 'OWNER' && (
                              <button onClick={() => handleRemove(member.id)} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                                <Trash2 className="w-4 h-4"/>
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

          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }`}}/>
    </div>
  );
}