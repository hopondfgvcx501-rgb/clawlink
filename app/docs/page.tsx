"use client";

import { ArrowLeft, BookOpen, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Docs() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#07070A] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto mt-10">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight flex items-center gap-4">
          <BookOpen className="w-10 h-10 text-orange-500" />
          Documentation
        </h1>
        <p className="text-gray-400 text-lg mb-12">Learn how to configure, deploy, and scale your ClawLink AI Agents.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111113] border border-white/5 p-8 rounded-2xl shadow-xl hover:border-orange-500/30 transition-colors">
            <Zap className="w-8 h-8 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Quick Start Guide</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Connect your Telegram or WhatsApp token in under 30 seconds. No coding required. Just paste your API key and deploy.
            </p>
          </div>

          <div className="bg-[#111113] border border-white/5 p-8 rounded-2xl shadow-xl hover:border-orange-500/30 transition-colors">
            <ShieldCheck className="w-8 h-8 text-green-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Security & Privacy</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              ClawLink uses AES-256 encryption. We do not store your customer's private chat data. Powered by enterprise-grade infrastructure.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-white/5 border border-white/10 p-6 rounded-xl text-center">
          <p className="text-sm text-gray-400">Detailed API references and Webhook configurations are currently being updated.</p>
          <p className="text-xs text-orange-500 mt-2 font-mono">v2.0.1 Documentation release pending.</p>
        </div>
      </div>
    </div>
  );
}