"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, CheckCircle, TrendingUp, Users, DollarSign } from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function PartnerProgram() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  
  // Generating a unique affiliate link based on user email
  const affiliateId = session?.user?.email ? Buffer.from(session.user.email).toString('base64').substring(0, 8) : "AFF-XXXX";
  const affiliateLink = `https://clawlink.vercel.app/?ref=${affiliateId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-orange-500/30">
      <TopHeader title="Partner Program" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          
          <div className="bg-gradient-to-r from-[#111] to-[#1A1005] border border-orange-500/20 p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center">
            <Gift className="w-16 h-16 text-orange-500 mb-6" />
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Earn 30% Recurring Revenue.</h1>
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed mb-8">
              Share your unique referral link. When someone upgrades to a paid plan using your link, you earn a 30% commission every single month for as long as they stay a customer.
            </p>

            <div className="w-full max-w-xl bg-black/50 border border-orange-500/30 p-2 rounded-2xl flex items-center justify-between shadow-inner">
              <span className="text-orange-300 font-mono text-sm px-4 truncate">{affiliateLink}</span>
              <button 
                onClick={handleCopy}
                className="bg-orange-500 hover:bg-orange-400 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all shrink-0"
              >
                {copied ? <><CheckCircle className="w-4 h-4"/> Copied</> : <><Copy className="w-4 h-4"/> Copy Link</>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-white/5 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4"><Users className="w-6 h-6"/></div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Referred Users</h3>
              <p className="text-3xl font-black text-white">0</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111] border border-white/5 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4"><TrendingUp className="w-6 h-6"/></div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Active Subscriptions</h3>
              <p className="text-3xl font-black text-white">0</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111] border border-orange-500/20 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4"><DollarSign className="w-6 h-6"/></div>
              <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-2">Unpaid Earnings</h3>
              <p className="text-3xl font-black text-white">$0.00</p>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}