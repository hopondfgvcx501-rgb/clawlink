import React from "react";

export const metadata = {
  title: "Privacy Policy | ClawLink AI",
  description: "How ClawLink handles, encrypts, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-300 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-[#111] p-10 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Privacy Policy</h1>
        <p className="mb-6 text-sm text-gray-500 font-mono">Last Updated: March 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Data Collection</h2>
            <p>We collect essential information required to provision your AI servers, including your email address, API tokens (Telegram/Meta), and billing history. We do not store your end-users' chat messages permanently unless explicitly enabled in the CRM settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Data Processing & Encryption</h2>
            <p>All HTTP API tokens and access keys are encrypted at rest using enterprise-grade AES-256 encryption. Our databases are secured within the Supabase Global Edge Network with strict Row Level Security (RLS) policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Third-Party Sharing</h2>
            <p>We do not sell your personal data. We securely transmit data only to necessary sub-processors, including Razorpay (for payments) and OpenAI/Anthropic/Google (for AI generation). These transmissions are anonymized where possible.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-blue-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">← Return to Home</a>
        </div>
      </div>
    </div>
  );
}