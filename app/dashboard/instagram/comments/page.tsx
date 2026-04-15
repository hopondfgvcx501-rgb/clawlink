"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM COMMENTS MODERATION
 * ==============================================================================================
 * @file app/dashboard/instagram/comments/page.tsx
 * @description Centralized dashboard for monitoring Instagram comments. 
 * Highlights AI auto-moderation actions (anti-spam, hate speech hiding).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MessageSquare, Shield, Trash2, CheckCircle2, 
  EyeOff, Search, Filter, Activity 
} from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function InstagramComments() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [filter, setFilter] = useState('all');

  const [comments, setComments] = useState([
    { id: 1, user: "@johndoe", text: "Send me the LINK please!", post: "Promo Reel", status: "auto_replied", time: "2m ago" },
    { id: 2, user: "@crypto_king99", text: "DM me for free crypto signals 🚀💸", post: "Update Post", status: "hidden_spam", time: "15m ago" },
    { id: 3, user: "@sarah_smiles", text: "This is such a cool tool, loved it.", post: "Promo Reel", status: "approved", time: "1h ago" },
    { id: 4, user: "@hater_bot", text: "Worst product ever, scam!", post: "Promo Reel", status: "hidden_hate", time: "3h ago" },
  ]);

  if (status === "unauthenticated") router.push("/");

  const handleDelete = (id: number) => {
    setComments(comments.filter(c => c.id !== id));
  };

  const filteredComments = filter === 'all' 
    ? comments 
    : comments.filter(c => c.status.includes(filter));

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'auto_replied': return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><MessageSquare className="w-3 h-3"/> Auto-DM Sent</span>;
      case 'hidden_spam': return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><EyeOff className="w-3 h-3"/> Hidden: Spam</span>;
      case 'hidden_hate': return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Shield className="w-3 h-3"/> Hidden: Hate</span>;
      default: return <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="IG Comments" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <Shield className="w-5 h-5 text-white"/>
                </div>
                AI Comment Moderation
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Monitor auto-replies and AI spam detection across all your posts.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-[#0A0A0D] border border-white/10 rounded-xl flex items-center px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-500"/>
                <input type="text" placeholder="Search comments..." className="bg-transparent border-none outline-none text-[12px] text-white ml-2 w-[150px] placeholder-gray-600"/>
              </div>
              <select 
                value={filter} onChange={(e) => setFilter(e.target.value)}
                className="bg-[#0A0A0D] border border-white/10 text-white px-4 py-2.5 rounded-xl text-[12px] outline-none cursor-pointer"
              >
                <option value="all">All Comments</option>
                <option value="hidden">Hidden by AI</option>
                <option value="auto_replied">Auto-Replied</option>
              </select>
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-[#111114] grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <div className="col-span-3">User</div>
              <div className="col-span-5">Comment</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredComments.map((comment, idx) => (
                <motion.div key={comment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} 
                  className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-white/5 transition-colors group">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-[10px] font-bold">
                      {comment.user.charAt(1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{comment.user}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{comment.time}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-5 pr-4">
                    <p className={`text-[13px] leading-relaxed ${comment.status.includes('hidden') ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      "{comment.text}"
                    </p>
                    <p className="text-[9px] text-pink-400 mt-1">on: {comment.post}</p>
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(comment.status)}
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(comment.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Delete from Instagram">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </motion.div>
              ))}
              {filteredComments.length === 0 && (
                <div className="p-12 text-center text-gray-500 text-[13px] font-mono">No comments found matching this filter.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}