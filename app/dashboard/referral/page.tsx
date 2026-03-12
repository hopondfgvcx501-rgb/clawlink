"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Share2, TrendingUp, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReferralDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    
    if (session?.user?.email) {
      fetch(`/api/referral?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setStats(data.data);
          }
          setIsLoading(false);
        });
    }
  }, [session, status, router]);

  const referralLink = stats?.referral_code 
    ? `https://clawlink.com/?ref=${stats.referral_code}` 
    : "Generating your unique link...";

  const handleCopy = () => {
    if (!stats?.referral_code) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share && stats?.referral_code) {
      navigator.share({
        title: "Deploy your AI Bot instantly with ClawLink",
        text: "I use ClawLink to run my AI support bots. Use my link to get priority servers!",
        url: referralLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-blue-500 animate-pulse font-mono">LOADING VIRAL ENGINE...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-pink-500/30">
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Gift className="w-6 h-6 text-pink-500" /> Partner Program
          </h1>
          <p className="text-sm text-gray-400 mt-1">Invite friends and earn free AI limits for every successful deployment.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* The Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-pink-500/20 rounded-3xl p-8 shadow-[0_0_30px_rgba(236,72,153,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[60px] pointer-events-none"></div>
          
          <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Your Unique Link</h3>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">Share this link across your network. When someone deploys a Pro or Max bot using your link, you instantly earn <strong className="text-pink-400">500 Bonus AI Tokens</strong>.</p>
          
          <div className="bg-black/50 border border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 mb-6 relative">
            <p className="font-mono text-sm text-pink-300 truncate select-all">{referralLink}</p>
            <button 
              onClick={handleCopy}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title="Copy Link"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : <Copy className="w-5 h-5 text-gray-400"/>}
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" /> Share & Earn
          </button>
        </motion.div>

        {/* Stats Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
          
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-8 h-8"/>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Referrals</p>
              <h2 className="text-4xl font-black text-white">{stats?.total_referrals || 0}</h2>
              <p className="text-[10px] text-gray-400 mt-1">Users deployed via your link</p>
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-xl flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-8 h-8"/>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tokens Earned</p>
              <h2 className="text-4xl font-black text-white">{stats?.referral_earnings || 0}</h2>
              <p className="text-[10px] text-gray-400 mt-1">Free limits added to your account</p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-500 font-mono leading-relaxed text-center">
            *Tokens are credited automatically when your referred user completes a successful plan deployment. Max plan users receive cashback instead of tokens.
          </div>

        </motion.div>

      </main>
    </div>
  );
}