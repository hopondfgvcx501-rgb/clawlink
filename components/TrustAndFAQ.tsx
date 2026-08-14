"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Server, ChevronDown, CheckCircle } from "lucide-react";

// ============================================================================
// FAQ DATA
// ============================================================================
const faqs = [
  {
    question: "Will my WhatsApp or Instagram account get banned?",
    answer: "Absolutely not. ClawLink strictly uses Official Meta Cloud APIs and approved Webhooks. Since we do not use unofficial scrapers, your accounts have 0% risk of getting banned."
  },
  {
    question: "Is my business data and customer chat history secure?",
    answer: "Yes. All data streams are protected by military-grade AES-256 encryption. Furthermore, our Enterprise RAG Memory ensures that your Vector DB data is isolated and strictly yours."
  },
  {
    question: "Do I need any coding skills to deploy the Omni-Engine?",
    answer: "Zero. Our 1-Click Auto deployment bypasses the complex Meta Developer console setup. If you can log into Facebook, you can launch a fully functioning AI agent in 30 seconds."
  },
  {
    question: "How does the Omni Nexus Fallback actually work?",
    answer: "If the primary AI provider experiences an outage, our engine instantly routes the incoming message to the next available model (Claude -> GPT-4o -> Gemini -> Llama). Your business experiences true 0% downtime."
  },
  {
    question: "How do I manage or cancel my subscription?",
    answer: "You have full control. You can upgrade, downgrade, or cancel your automated Stripe/Razorpay billing directly from your Command Center dashboard with a single click."
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function TrustAndFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative z-10 py-28 px-6 md:px-12 transition-colors duration-300" style={{ borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)" }}>
      <div className="max-w-[1200px] mx-auto">
        
        {/* ========================================== */}
        {/* TRUST SHIELDS SECTION */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="fi-card p-8 rounded-[24px] border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-6 border border-green-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>Official Meta Partner</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>We use 100% verified Meta Cloud APIs. No unauthorized scraping, ensuring your WhatsApp and Instagram accounts remain perfectly safe and compliant.</p>
          </div>

          <div className="fi-card p-8 rounded-[24px] border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>Enterprise Security</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>Your conversations and customer leads are secured with AES-256 encryption. We enforce a strict zero-retention policy on your isolated vector databases.</p>
          </div>

          <div className="fi-card p-8 rounded-[24px] border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6 border border-orange-500/20">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>0% Downtime SLA</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>Our Omni-Fallback architecture guarantees uninterrupted service. If one AI engine fails, the system autonomously routes traffic to the next active provider.</p>
          </div>
        </div>

        {/* ========================================== */}
        {/* FAQ SECTION */}
        {/* ========================================== */}
        <div className="max-w-[800px] mx-auto">
          <div className="sr-up text-center mb-12">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">Clear Your Doubts</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] mb-4" style={{ color: "var(--text-main)" }}>Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className="border rounded-2xl overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: isOpen ? "rgba(249,115,22,0.5)" : "var(--border-color)" }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="text-[15px] font-bold pr-4 flex items-center gap-3" style={{ color: "var(--text-main)" }}>
                      <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-gray-500"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 pl-14 text-[14px] leading-relaxed border-t border-white/5" style={{ color: "var(--text-muted)" }}>
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}