"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM COMMENTS MODERATION
 * ==============================================================================================
 * @file app/dashboard/instagram/comments/page.tsx
 * @description Centralized dashboard for monitoring Instagram comments. 
 * Highlights AI auto-moderation actions (anti-spam, hate speech hiding).
 * 🚀 SECURED: Strict cache-busting and session verification for live comment sync.
 * 🚀 FIXED: Integrated premium SpinnerCounter and exact backend error surfacing for deletes.
 * 🚀 FIXED: Enforced strict "Instagram" casing and terminology.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  MessageSquare, Shield, Trash2, CheckCircle2, 
  EyeOff, Search, Activity, Instagram
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter"; // 🚀 Premium Loader Imported

interface CommentLog {
  id: string | number;
  user: string;
  text: string;
  post: string;
  status: 'auto_replied' | 'hidden_spam' | 'hidden_hate' | 'approved';
  time: string;
}

export default function InstagramComments() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<CommentLog[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  // 🚀 SECURE REAL-TIME FETCH LOGIC
  const fetchComments = async () => {
    if (status === "authenticated" && session?.user?.email) {
      try {
        const res = await fetch(`/api/instagram/comments?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-store' }
        });
        
        if (!res.ok) throw new Error("Secure fetch failed");
        
        const data = await res.json();
        if (data.success && data.comments) {
           setComments(data.comments);
        }
      } catch (error) {
        console.error("[INSTAGRAM_COMMENTS_ERROR] Failed to sync comment logs", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComments();
  }, [session, status]);

  // 🚀 SECURE DELETE ACTION WITH ERROR SURFACING
  const handleDelete = async (id: string | number) => {
    if(!confirm("Are you sure you want to permanently delete this comment from Instagram?")) return;
    
    // Optimistic UI Update
    setComments(comments.filter(c => c.id !== id));
    
    try {
      const res = await fetch(`/api/instagram/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, commentId: id })
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
      if(!data.success) {
          alert(`Failed to delete comment: ${data.error}`);
          fetchComments(); // Revert optimistic update
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      alert(`Backend Error: ${error.message || "Failed to delete comment on server."}`);
      fetchComments(); // Revert optimistic update
    }
  };

  const filteredComments = comments.filter(c => {
    const matchesFilter = filter === 'all' || c.status.includes(filter);
    const matchesSearch = c.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (commentStatus: string) => {
    switch(commentStatus) {
      case 'auto_replied': return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5"/> Auto-DM Sent</span>;
      case 'hidden_spam': return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5"/> Hidden: Spam</span>;
      case 'hidden_hate': return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> Hidden: Hate</span>;
      default: return <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Approved</span>;
    }
  };

  // 🚀 Premium Loader
  if (isLoading || status === "loading") {
    return <SpinnerCounter text="SYNCING INSTAGRAM COMMENTS..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-pink-500/30">
      <TopHeader title="Instagram Comments" session={session} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <div className="w-full h-full bg-[#0A0A0D] rounded-[10px] flex items-center justify-center">
                     <Shield className="w-5 h-5 text-white"/>
                  </div>
                </div>
                AI Comment Moderation
              </h2>
              <p className="text-[13px] text-gray-400 mt-2">Monitor auto-replies and AI spam detection across all your Instagram posts.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="bg-[#0A0A0D] border border-white/10 rounded-xl flex items-center px-4 py-3 w-full sm:w-[250px] focus-within:border-pink-500/50 transition-colors">
                <Search className="w-4 h-4 text-gray-500"/>
                <input 
                  type="text" 
                  placeholder="Search comments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] text-white ml-3 w-full placeholder-gray-600"
                />
              </div>
              <select title="Select comment filter" 
                value={filter} onChange={(e) => setFilter(e.target.value)}
                className="bg-[#0A0A0D] border border-white/10 text-white px-4 py-3 rounded-xl text-[13px] outline-none cursor-pointer w-full sm:w-auto hover:bg-white/5 transition-colors"
              >
                <option value="all">All Comments</option>
                <option value="hidden">Hidden by AI</option>
                <option value="auto_replied">Auto-Replied DMs</option>
                <option value="approved">Safe / Approved</option>
              </select>
            </div>
          </div>

          {/* Comments List Grid */}
          <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-[#111114] grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <div className="col-span-12 sm:col-span-3">User Profile</div>
              <div className="col-span-12 sm:col-span-5">Comment Content</div>
              <div className="col-span-12 sm:col-span-3">AI Action Status</div>
              <div className="col-span-12 sm:col-span-1 text-right hidden sm:block">Actions</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredComments.map((comment, idx) => (
                <motion.div key={comment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} 
                  className="p-5 grid grid-cols-12 gap-4 items-center hover:bg-white/5 transition-colors group">
                  
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-[12px] font-bold border border-white/10 shrink-0">
                      {comment.user.charAt(1).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-bold text-white truncate">{comment.user}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{comment.time}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-12 sm:col-span-5 pr-4 border-l border-white/5 sm:border-none pl-4 sm:pl-0 mt-2 sm:mt-0">
                    <p className={`text-[13px] leading-relaxed ${comment.status.includes('hidden') ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      &quot;{comment.text}&quot;
                    </p>
                    <p className="text-[10px] text-pink-400 mt-2 flex items-center gap-1.5 font-medium">
                      <Instagram className="w-3 h-3"/> Post: {comment.post}
                    </p>
                  </div>
                  
                  <div className="col-span-12 sm:col-span-3 mt-2 sm:mt-0">
                    {getStatusBadge(comment.status)}
                  </div>
                  
                  <div className="col-span-12 sm:col-span-1 flex items-center justify-start sm:justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
                    <button onClick={() => handleDelete(comment.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/10" title="Delete from Instagram">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </motion.div>
              ))}
              
              {filteredComments.length === 0 && (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                   <Shield className="w-10 h-10 text-gray-700 mb-4" />
                   <p className="text-[13px] font-bold text-gray-400">No matching comments found.</p>
                   <p className="text-[11px] text-gray-600 mt-1 font-mono">Your AI is actively monitoring incoming traffic.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}