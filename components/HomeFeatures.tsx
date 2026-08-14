"use client";

import React from "react";

export default function HomeFeatures() {
  return (
    <>
      {/* ══ HOW IT WORKS ══ */}
      <section className="relative z-10 py-28 px-6 md:px-12 transition-colors duration-300" style={{ borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="sr-up text-center mb-20">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">How It Works</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] mb-4" style={{ color: "var(--text-main)" }}>4 steps to go live</h2>
            <p className="text-[16px] max-w-[500px] mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>Zero to live AI agent in 30 seconds. No tech expertise needed.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px" style={{background:"linear-gradient(90deg,transparent,rgba(249,115,22,.25) 30%,rgba(249,115,22,.25) 70%,transparent)"}}/>
            {[
              {n:"01",e:"🔑",t:"Login with Google",  d:"One tap. No passwords, no friction."},
              {n:"02",e:"🤖",t:"Choose Model & Channel",d:"Pick AI model + Telegram or WhatsApp."},
              {n:"03",e:"✅",t:"Token Verify",         d:"Paste token. Verified & secured instantly."},
              {n:"04",e:"🚀",t:"Go Live",              d:"Enterprise infra spins up. 24/7, zero maintenance."},
            ].map(({n,e,t,d},i)=>(
              <div key={n} className={`sr-up sd${i+1} flex flex-col items-center text-center px-4 relative z-10`}>
                <div className="icon-lift w-[70px] h-[70px] lg:w-[80px] lg:h-[80px] rounded-full flex items-center justify-center font-black text-[22px] lg:text-[26px] text-orange-500 mb-6 z-10 shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-colors duration-300"
                  style={{backgroundColor:"var(--bg-main)",border:"2px solid rgba(249,115,22,0.25)"}}
                  onMouseEnter={e2=>{(e2.target as HTMLElement).style.backgroundColor="rgba(249,115,22,0.1)";(e2.target as HTMLElement).style.boxShadow="0 0 40px rgba(249,115,22,0.3)"}}
                  onMouseLeave={e2=>{(e2.target as HTMLElement).style.backgroundColor="var(--bg-main)";(e2.target as HTMLElement).style.boxShadow="0 0 30px rgba(249,115,22,0.1)"}}>
                  {n}
                </div>
                <div className="text-[26px] mb-3">{e}</div>
                <div className="text-[15px] font-black mb-2" style={{ color: "var(--text-main)" }}>{t}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="relative z-10 py-28 px-6 md:px-12 transition-colors duration-300" style={{ backgroundColor: "var(--bg-section)", borderTop: "1px solid var(--border-color)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="sr-up text-center mb-16">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">Features</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] mb-4" style={{ color: "var(--text-main)" }}>Enterprise power, zero complexity</h2>
            <p className="text-[16px] max-w-[500px] mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>Built in, battle-tested, ready on day one.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[1px] rounded-t-[28px] overflow-hidden border border-b-0 transition-colors duration-300" style={{ backgroundColor: "var(--border-color)", borderColor: "var(--border-color)" }}>
            {[
              {bg:"rgba(59,130,246,.09)", e:"🌐",t:"Omnichannel Deployment",  d:"Deploy an AI Agent across Telegram, WhatsApp, and Instagram simultaneously. Switch channels in seconds.",tag:"Multi-platform"},
              {bg:"rgba(168,85,247,.09)",e:"🎙️",t:"Voice Intelligence",      d:"Whisper AI transcribes voice notes and replies naturally in real-time.",tag:"Whisper AI"},
              {bg:"rgba(234,179,8,.09)", e:"🚀",t:"Ultra Low Latency",         d:"Global edge network ensures sub-second response times worldwide.",tag:"Fast Response"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card p-8 md:p-10 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)" }}
                   onMouseEnter={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1.1)"}
                   onMouseLeave={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1)"}>
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>{t}</h3>
                <p className="text-[13px] leading-[1.8] mb-5" style={{ color: "var(--text-muted)" }}>{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[1px] border border-t-0 border-b-0 transition-colors duration-300" style={{ backgroundColor: "var(--border-color)", borderColor: "var(--border-color)" }}>
            {[
              {bg:"rgba(34,197,94,.09)", e:"🗃️",t:"Enterprise RAG Memory",      d:"Inject catalog, FAQs, brand voice into Vector DB. Your agent knows your business inside out.",tag:"Vector DB"},
              {bg:"rgba(0,191,255,.09)", e:"🧠",t:"OmniAgent — 3x AI Fallback", d:"Routes between GPT-5.4, Claude Opus 4.7, and Gemini 3.1 in real-time. 0% downtime. The ultimate OpenClaw alternative.",tag:"0% Downtime"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card p-8 md:p-10 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)" }}
                   onMouseEnter={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1.1)"}
                   onMouseLeave={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1)"}>
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>{t}</h3>
                <p className="text-[13px] leading-[1.8] mb-5" style={{ color: "var(--text-muted)" }}>{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] rounded-b-[28px] overflow-hidden border border-t-0 transition-colors duration-300" style={{ backgroundColor: "var(--border-color)", borderColor: "var(--border-color)" }}>
            {[
              {bg:"rgba(249,115,22,.09)",e:"⚡",t:"AI Interceptor",      d:"Check orders, book slots, trigger webhooks, update CRMs — fully autonomous.",tag:"API Triggers"},
              {bg:"rgba(236,72,153,.09)",e:"💬",t:"Live CRM & Handoff",  d:"Monitor all conversations. One click to take over from AI seamlessly.",tag:"Real-time CRM"},
              {bg:"rgba(16,185,129,.09)",e:"🔒",t:"Enterprise Security", d:"AES-256 encryption. SOC 2 compliant. Zero data retention on our servers.",tag:"AES-256"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card p-8 md:p-10 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)" }}
                   onMouseEnter={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1.1)"}
                   onMouseLeave={e2 => (e2.currentTarget as HTMLElement).style.filter = "brightness(1)"}>
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black mb-3" style={{ color: "var(--text-main)" }}>{t}</h3>
                <p className="text-[13px] leading-[1.8] mb-5" style={{ color: "var(--text-muted)" }}>{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}