"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { LifeBuoy, Send, MessageSquare, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

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
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-blue-500" /> Help & Support
          </h1>
          <p className="text-sm text-gray-400 mt-1">Need assistance? Open a ticket and our engineering team will look into it.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Support Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-3 bg-[#111] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          {isSuccess ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h2>
              <p className="text-gray-400 text-sm max-w-xs">Our CEO and support team have received your request. We will email you shortly.</p>
              <button onClick={() => setIsSuccess(false)} className="mt-8 text-blue-400 text-sm font-bold hover:text-blue-300">Submit another ticket</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle className="w-4 h-4"/> Issue Type
                </label>
                <select 
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 text-white appearance-none cursor-pointer"
                >
                  <option value="Technical Issue">Technical Issue (Bot not replying)</option>
                  <option value="Billing / Payment">Billing / Payment Problem</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-4 h-4"/> Describe Your Problem
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  rows={6}
                  required
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 text-white resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                {isSubmitting ? "Submitting Ticket..." : <><Send className="w-4 h-4"/> Submit Ticket</>}
              </button>
            </form>
          )}
        </motion.div>

        {/* Info Box */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-[2rem] p-8 shadow-xl">
            <h3 className="text-white font-bold mb-2">Priority Support</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Users on the <span className="text-pink-400 font-bold">MAX Plan</span> receive priority routing. Our average response time is under 2 hours during business days.
            </p>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 shadow-xl">
            <h3 className="text-white font-bold mb-2">Direct Email</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              You can also reach our engineering team directly via email.
            </p>
            <a href="mailto:support@clawlink.com" className="text-blue-400 font-mono text-sm hover:underline">support@clawlink.com</a>
          </div>
        </motion.div>

      </main>
    </div>
  );
}