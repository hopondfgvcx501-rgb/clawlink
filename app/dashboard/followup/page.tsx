"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Clock, Save, ArrowLeft, MessageSquareWarning, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SmartFollowUps() {
  const { status } = useSession();
  const router = useRouter();
  
  const [enabled, setEnabled] = useState(false);
  const [delay, setDelay] = useState("24");
  const [message, setMessage] = useState("Hi there! Just checking in. Did you need any more help with your previous query?");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-12 font-sans selection:bg-fuchsia-500/30">
      <header className="max-w-4xl mx-auto flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <button onClick={() => router.push('/dashboard')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Ghost className="w-6 h-6 text-fuchsia-500" /> Ghost Recovery System
          </h1>
          <p className="text-sm text-gray-400 mt-1">Automated smart follow-ups for customers who stop responding.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-fuchsia-500/20 rounded-[2rem] p-8 md:p-12 shadow-[0_0_40px_rgba(217,70,239,0.05)] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Enable Auto Follow-Ups</h2>
                <p className="text-xs text-gray-500 max-w-md">If a user doesn't reply within the set timeframe, the AI will automatically send them a nudge message to recover the lead.</p>
              </div>
              
              {/* Custom Toggle Switch */}
              <button 
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 ${enabled ? 'bg-fuchsia-500' : 'bg-white/10'}`}
              >
                <motion.div 
                  layout 
                  className={`w-5 h-5 bg-white rounded-full shadow-md`}
                  animate={{ x: enabled ? 28 : 0 }}
                />
              </button>
            </div>

            <div className={`space-y-6 transition-opacity duration-300 ${!enabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4"/> Delay Before Sending (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    value={delay}
                    onChange={(e) => setDelay(e.target.value)}
                    className="w-32 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm focus:border-fuchsia-500 outline-none text-white font-mono"
                  />
                  <span className="text-sm text-gray-500">Hours after last customer message</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4"/> Nudge Message Template
                </label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm focus:border-fuchsia-500 outline-none text-white resize-none font-sans"
                />
              </div>

            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
              {saved ? (
                <span className="text-green-400 text-sm font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Saved Successfully</span>
              ) : <span></span>}
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isSaving ? "Saving..." : <><Save className="w-4 h-4"/> Save Configuration</>}
              </button>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}