"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

// ============================================================================
// SELF-CONTAINED ICONS (Standalone banaya hai taaki page.tsx par depend na kare)
// ============================================================================
const OpenAI_Icon = ({ size = 40 }: { size?: number }) => (
  <Image src="/logos/openai.svg" alt="GPT-4o OpenAI Agent Icon" width={size} height={size} className="transform-gpu shrink-0" />
);

const Omni_Icon = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#00BFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transform-gpu" aria-hidden="true">
    <path d="M12 4.5C10 4.5 8 5.5 7.5 7.5 6 7.5 4.5 8.5 4.5 10.5 4 11.5 4 13 5 14 4.5 15.5 5.5 17 7 17.5 7.5 19 9 20 10.5 20H12"/>
    <path d="M12 4.5C14 4.5 16 5.5 16.5 7.5 18 7.5 19.5 8.5 19.5 10.5 20 11.5 20 13 19 14 19.5 15.5 18.5 17 17 17.5 16.5 19 15 20 13.5 20H12"/>
    <line x1="12" y1="4.5" x2="12" y2="20"/>
    <circle cx="8.5" cy="10.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="15.5" cy="10.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="7.5" cy="14.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="16.5" cy="14.5" r="1" fill="#00BFFF" stroke="none"/>
    <line x1="8.5" y1="10.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="15.5" y1="10.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="7.5" y1="14.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="16.5" y1="14.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function HomePricing() {
  const handleScrollToDeploy = () => {
    // Agar future mein component split ho, toh smooth scroll kaam karta rahe
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="relative z-10 py-28 px-6 md:px-12 transition-colors duration-300" style={{ borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-section)" }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="sr-up text-center mb-16">
          <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">Enterprise Pricing</p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] mb-4" style={{ color: "var(--text-main)" }}>Simple pricing. No surprises.</h2>
          <p className="text-[16px] max-w-[500px] mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>Stop paying per message. One flat fee for unlimited Enterprise scale.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Standard Plan */}
          <div className="sr-left fi-card p-8 rounded-[24px] border transition-all duration-300 flex flex-col justify-between" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="font-bold uppercase text-[12px] tracking-widest text-blue-500 mb-2">Pro Engine</h3>
                      <div className="text-[3rem] font-black leading-none" style={{ color: "var(--text-main)" }}>$18<span className="text-[14px] text-gray-500 font-normal">/mo</span></div>
                   </div>
                   <OpenAI_Icon size={40} />
                </div>
                <p className="text-[14px] leading-relaxed mb-6 pb-6 border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>Perfect for growing businesses. High speed customer support powered by GPT-5.5.</p>
                <ul className="space-y-4 mb-8">
                   {["Unlimited integrations", "Fair usage of AI tool calls", "Priority email support", "Single-channel deployment"].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-[13px] font-medium" style={{ color: "var(--text-main)" }}><Check className="w-4 h-4 text-green-500"/> {f}</li>
                   ))}
                </ul>
             </div>
             <button onClick={handleScrollToDeploy} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-[12px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20">Select Pro Engine</button>
          </div>

          {/* Nexus Tier Highlight */}
          <div className="sr-rght fi-card p-8 rounded-[24px] border-2 transition-all duration-300 flex flex-col justify-between transform lg:-translate-y-4 shadow-[0_30px_60px_rgba(249,115,22,0.15)]" style={{ backgroundColor: "var(--bg-card)", borderColor: "#f97316" }}>
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-pink-500"></div>
             <div>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="font-bold uppercase text-[12px] tracking-widest text-orange-500 mb-2 flex items-center gap-2">Omni Nexus <span className="bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full">MOST POPULAR</span></h3>
                      <div className="text-[3rem] font-black leading-none" style={{ color: "var(--text-main)" }}>$89<span className="text-[14px] text-gray-500 font-normal">/mo</span></div>
                   </div>
                   <Omni_Icon size={40} />
                </div>
                <p className="text-[14px] leading-relaxed mb-6 pb-6 border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>Elite 4x Omni-Fallback (Claude, GPT, Gemini, Llama) for Zero downtime.</p>
                <ul className="space-y-4 mb-8">
                   {["4x Cross-Provider Fallback Routing", "Unlimited AI tool calls & memory", "Priority Razorpay/Stripe Sync", "Live CRM & Instant Handoff", "24/7 Dedicated Engineering Support"].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-[13px] font-bold" style={{ color: "var(--text-main)" }}><Check className="w-4 h-4 text-orange-500"/> {f}</li>
                   ))}
                </ul>
             </div>
             <button onClick={handleScrollToDeploy} className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-[12px] bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1 transition-all">Deploy Omni Nexus</button>
          </div>
        </div>
      </div>
    </section>
  );
}