"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: HELP & SUPPORT DESK
 * ==============================================================================================
 * @file app/dashboard/support/page.tsx
 * @description Centralized support ticket creation and help desk interface.
 * Matches the new modular dashboard architecture.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { LifeBuoy, Send, MessageSquare, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";

export default function HelpDesk() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [issueType, setIssueType] = useState("Technical Issue");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API Call for Support Ticket
    setTimeout(() => {
      setIsSuccess(true);
      setDescription("");
      setIsSubmitting(false);
      setTimeout(() => setIsSuccess(false), 8000); // Auto reset after 8 seconds
    }, 1500);

    /* REAL API CALL (Uncomment when backend is ready)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: session?.user?.email, 
          issueType, 
          description 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setDescription("");
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Network Error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
    */
  };

  const btnHover = "transition-all duration-[120ms] ease-out active:scale-[0.95] transform-gpu will-change-transform";

  return (
    <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-blue-500/30">
      <TopHeader title="Help & Support" session={session} />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        
        <header className="max-w-5xl mx-auto flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <LifeBuoy className="w-6 h-6 text-blue-500" /> Technical Support
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">Open a ticket and our engineering team will resolve your issue.</p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Support Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-3 bg-[#0A0A0D] border border-white/5 rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 relative z-10">
                <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3 tracking-wide">Ticket Dispatched!</h2>
                <p className="text-gray-400 text-[13px] max-w-sm leading-relaxed">Our automated systems and human engineers have received your request. We will email you shortly.</p>
                <button onClick={() => setIsSuccess(false)} className={`mt-8 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-widest hover:bg-white/10 ${btnHover}`}>
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400"/> Select Issue Area
                  </label>
                  <select 
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full bg-[#111114] border border-white/10 rounded-xl p-4 text-[13px] focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white appearance-none cursor-pointer transition-all"
                  >
                    <option value="Technical Issue">Technical Issue (Bot not replying/Offline)</option>
                    <option value="API Integration">API Integration & Webhooks</option>
                    <option value="Billing / Payment">Billing / Payment Problem</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400"/> Describe the Problem
                  </label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide specific details, error messages, or steps to reproduce..."
                    rows={7}
                    required
                    className="w-full bg-[#111114] border border-white/10 rounded-xl p-4 text-[13px] focus:outline-none focus:border-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white resize-none custom-scrollbar transition-all leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className={`w-full bg-[#2AABEE] hover:bg-[#2298D6] text-white py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(42,171,238,0.2)] ${btnHover}`}
                >
                  {isSubmitting ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Transmitting...</>
                  ) : (
                    <><Send className="w-4 h-4"/> Submit Ticket</>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Info Boxes */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-[#111114] to-[#1A1A1E] border border-blue-500/20 rounded-[24px] p-8 shadow-[0_10px_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">SLA: 2 Hours</span>
              </div>
              <h3 className="text-white font-black mb-3 text-lg">Priority Support</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Users on the <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">MAX Plan</span> receive priority routing. Our engineering team addresses these tickets first during business hours.
              </p>
            </div>
            
            <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-8 shadow-lg">
              <h3 className="text-white font-black mb-3">Direct Email</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
                Need to attach large log files or screenshots? Email our engineering team directly.
              </p>
              <a href="mailto:support@clawlink.com" className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-xl text-blue-400 font-mono text-[12px] transition-colors">
                support@clawlink.com
              </a>
            </div>
          </motion.div>

        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}}/>
    </div>
  );
}