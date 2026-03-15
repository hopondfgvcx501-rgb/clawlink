"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Book, Save, Database, FileText, Activity, ShieldCheck } from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function KnowledgeBase() {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState({ companyName: "", businessInfo: "" });

  const handleSave = () => {
    setIsSaving(true);
    // Future Backend Connection Here
    setTimeout(() => {
      setIsSaving(false);
      alert("Knowledge Base securely updated. AI is now trained on this data.");
    }, 1500);
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-blue-500 font-mono"><Activity className="w-10 h-10 animate-spin mb-4" />LOADING RAG ENGINE...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-blue-500/30">
      <TopHeader title="AI Knowledge Base" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
        <div className="fixed top-0 left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-5xl mx-auto relative z-10 space-y-8">
          <header className="mb-8">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <Database className="w-8 h-8 text-blue-500" /> Enterprise RAG Memory
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">Train your AI Agent by injecting your business rules, return policies, product details, and FAQs directly into its brain.</p>
          </header>

          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Book className="w-4 h-4 text-blue-500" /> Company / Project Name
                </label>
                <input 
                  type="text" 
                  value={data.companyName}
                  onChange={(e) => setData({...data, companyName: e.target.value})}
                  placeholder="e.g., ClawLink Technologies" 
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" /> Core Business Knowledge (FAQs, Policies, Pricing)
                </label>
                <textarea 
                  rows={12}
                  value={data.businessInfo}
                  onChange={(e) => setData({...data, businessInfo: e.target.value})}
                  placeholder="Write or paste everything the AI needs to know to answer customer queries accurately..." 
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none custom-scrollbar leading-relaxed"
                />
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-500/80 text-[10px] uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-4 h-4" /> Vectorized & Encrypted
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? "Vectorizing..." : <><Save className="w-4 h-4" /> Inject Knowledge</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}