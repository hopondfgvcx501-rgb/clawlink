import React from "react";

export const metadata = {
  title: "Terms & Conditions | ClawLink AI",
  description: "Terms and conditions for using ClawLink Global AI SaaS Infrastructure.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-300 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-[#111] p-10 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Terms & Conditions</h1>
        <p className="mb-6 text-sm text-gray-500 font-mono">Last Updated: March 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using ClawLink ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you are prohibited from using the Platform and its API services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Service Description</h2>
            <p>ClawLink provides AI-powered routing, chatbot deployment, and SaaS infrastructure via Telegram and Meta (WhatsApp) Cloud. The platform acts as an intermediary utilizing LLMs (Large Language Models) such as GPT, Claude, and Gemini.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Fair Usage Policy (FUP)</h2>
            <p>Users subscribing to "Omni Max" or "Unlimited" plans are subject to our Fair Usage Policy to prevent server abuse and automated botnet attacks. ClawLink reserves the right to throttle or suspend API access if usage anomalies are detected.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Limitation of Liability</h2>
            <p>ClawLink shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from AI hallucinations, API downtime, or Meta/Telegram server restrictions.</p>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-blue-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">← Return to Home</a>
        </div>
      </div>
    </div>
  );
}