"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TEAM WORKSPACE MANAGEMENT
 * ==============================================================================================
 * @file app/dashboard/team/page.tsx
 * @description Secure interface for assigning roles and inviting team members.
 * 🚀 FIXED: Variable name mismatch (ownerEmail -> owner_email) resolved to stop 400 errors!
 * 🚀 SECURED: Replaced hardcoded mock data with real-time PostgreSQL database fetch.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, UserPlus, Shield, ShieldAlert, 
  Trash2, Mail, CheckCircle2, Activity, AlertCircle, ArrowLeft
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; 

interface TeamMember {
  id: string;
  member_email: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  status: 'Active' | 'Pending';
  invitedAt: string;
}

export default function TeamAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  
  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>("VIEWER");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE REAL-TIME FETCH
  const fetchTeamMembers = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/team?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        
        if (!res.ok) throw new Error("Secure fetch failed");
        
        const data = await res.json();
        
        if (data.success && data.members) {
          setMembers(data.members);
        } else {
          setMembers([
            { id: 'owner-id', member_email: session.user.email, role: 'OWNER', status: 'Active', invitedAt: new Date().toISOString() }
          ]);
        }
      } catch (error) {
        console.error("[TEAM_SYNC_ERROR]", error);
        if(session?.user?.email) {
            setMembers([
                { id: 'owner-id', member_email: session.user.email, role: 'OWNER', status: 'Active', invitedAt: new Date().toISOString() }
            ]);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [session, status]);

  // 🚀 REAL DATABASE INSERT (FIXED VARIABLES)
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !session?.user?.email) return;

    setIsInviting(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_email: session.user.email, // 🔥 FIXED MATCH
          member_email: inviteEmail.trim().toLowerCase(), // 🔥 FIXED MATCH
          role: inviteRole
        })
      });

      if (!res.ok) {
         let errorDetail = `HTTP Error ${res.status}`;
         try {
            const errData = await res.json();
            errorDetail = errData.error || errorDetail;
         } catch(e) {
            errorDetail = await res.text();
         }
         throw new Error(errorDetail);
      }

      const data = await res.json();
      
      if (data.success) {
        alert(`🟢 Invitation successfully sent to ${inviteEmail}!`);
        setInviteEmail("");
        setInviteRole("VIEWER");
        await fetchTeamMembers(); 
      } else {
        alert(`❌ Failed to invite member: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Invite Dispatch Error:", error);
      alert(`Backend Error: ${error.message || "Failed to reach server."}`);
    } finally {
      setIsInviting(false);
    }
  };

  // 🚀 REAL DATABASE DELETE (FIXED VARIABLES)
  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if(!confirm(`Are you sure you want to revoke access for ${memberEmail}?`)) return;

    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          owner_email: session?.user?.email, // 🔥 FIXED MATCH
          id: memberId // 🔥 FIXED MATCH
        })
      });
      const data = await res.json();
      
      if(data.success) {
          fetchTeamMembers();
      } else {
          alert("Failed to remove member: " + data.error);
      }
    } catch(err) {
      alert("Network error while removing member.");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'ADMIN': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'EDITOR': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'VIEWER': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING WORKSPACE MEMBERS..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
      <TopHeader title="Team Workspace" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-8">
          
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400"/>
            </button>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-[#2AABEE]"/> Team Workspace
              </h2>
              <p className="text-[13px] text-gray-400 mt-1">Invite colleagues, assign roles, and manage workspace access.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 🚀 LEFT COLUMN: INVITE FORM */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="bg-[#0A0A0D] border border-[#2AABEE]/30 rounded-[24px] p-6 shadow-[0_10px_40px_rgba(42,171,238,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2AABEE] to-purple-500"></div>
                
                <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2 mb-6">
                  <UserPlus className="w-4 h-4 text-[#2AABEE]" /> Invite Colleague
                </h3>

                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="email" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="name@company.com" 
                        className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-[13px] text-white outline-none focus:border-[#2AABEE]/50 transition-colors placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <select 
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="w-full bg-[#111114] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-[13px] text-gray-300 outline-none focus:border-[#2AABEE]/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="VIEWER">Viewer (Read-only Analytics)</option>
                        <option value="EDITOR">Editor (Manage Automations)</option>
                        <option value="ADMIN">Admin (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isInviting}
                    className={`w-full bg-[#2AABEE] hover:bg-[#2298D6] text-white py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(42,171,238,0.2)] mt-4 disabled:opacity-50 ${btnHover}`}
                  >
                    {isInviting ? "Processing..." : "Send Invite"}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-2">
                   <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5"/>
                   <p className="text-[10px] text-gray-500 leading-relaxed">Invitations expire in 48 hours. Ensure the email address is correct before sending.</p>
                </div>
              </div>
            </motion.div>

            {/* 📊 RIGHT COLUMN: ACTIVE MEMBERS */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
              <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl flex flex-col h-full min-h-[400px]">
                
                <div className="p-6 border-b border-white/5 bg-[#111114]">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-gray-400" /> Active Members ({members.length})
                  </h3>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-[13px] text-gray-300">
                    <thead className="bg-[#0A0A0D] text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                      <tr>
                        <th className="p-5 pl-6">User Email</th>
                        <th className="p-5">Role</th>
                        <th className="p-5">Status</th>
                        <th className="p-5 pr-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-5 pl-6 font-bold text-white">{member.member_email}</td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 text-[11px]">
                              {member.status === 'Active' ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> <span className="text-green-400">Active</span></>
                              ) : (
                                <><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> <span className="text-orange-400">Pending</span></>
                              )}
                            </div>
                          </td>
                          <td className="p-5 pr-6 text-right">
                            {member.role !== 'OWNER' && (
                              <button onClick={() => handleRemoveMember(member.id, member.member_email)} className={`text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors ml-auto ${btnHover}`} title="Revoke Access">
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
    </div>
  );
}