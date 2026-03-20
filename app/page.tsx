"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Globe, Database, Mic, Zap, MessageSquare, Activity,
  LogOut, Shield, ExternalLink, CheckCircle2, Copy,
  MessageCircle, X, Send, Mail
} from "lucide-react";
import Image from "next/image";

/* ─── Pricing config ──────────────────────────────────────────── */
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini:   { name: "Gemini 3 Flash", starter: 1.2, pro: 19  },
  "gpt-5.2":{ name: "GPT-5.2",        starter: 19,  pro: 39  },
  claude:   { name: "Opus 4.6",        starter: 29,  pro: 59  },
};
const MAX_PLAN_PRICE = 89;
const OMNI_PRICING   = { monthly: 79, yearly: 790 };

/* ─── Provider icons ──────────────────────────────────────────── */
const OpenAI_Icon  = () => <Image src="/logos/openai.svg"    alt="OpenAI"  width={26} height={26} className="transform-gpu" />;
const Claude_Icon  = () => <Image src="/logos/claude.svg"    alt="Claude"  width={26} height={26} className="transform-gpu" />;
const Gemini_Icon  = () => <Image src="/logos/gemini.svg"    alt="Gemini"  width={26} height={26} className="transform-gpu" />;

const Llama_Icon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 transform-gpu">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const Omni_Icon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="text-[#00BFFF] drop-shadow-[0_0_8px_rgba(0,198,255,0.5)] transform-gpu">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
    <line x1="12" y1="22" x2="12" y2="15.5"/>
    <polyline points="22 8.5 12 15.5 2 8.5"/>
    <polyline points="2 15.5 12 8.5 22 15.5"/>
    <line x1="12" y1="2" x2="12" y2="8.5"/>
  </svg>
);

const Telegram_Icon  = ({ size = 42 }: { size?: number }) =>
  <Image src="/logos/Telegram.svg"  alt="Telegram"  width={size} height={size} className="transform-gpu" />;
const WhatsApp_Icon  = ({ size = 42 }: { size?: number }) =>
  <Image src="/logos/WhatsApp.svg"  alt="WhatsApp"  width={size} height={size} className="transform-gpu" />;

const Discord_Icon = () => (
  <svg viewBox="0 0 24 24" width="38" height="38" fill="#5865F2" className="transform-gpu">
    <path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/>
  </svg>
);

const Instagram_Icon = () => (
  <div className="w-[36px] h-[36px] rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transform-gpu">
    <div className="w-[24px] h-[24px] border-[2.5px] border-white rounded-[7px] flex items-center justify-center">
      <div className="w-[10px] h-[10px] bg-white rounded-full"/>
    </div>
  </div>
);

const Google_Icon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" className="transform-gpu">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
  </svg>
);

/* ─── Tiny reusable atoms ─────────────────────────────────────── */
const ChatBubble = ({ text, delay, isUser }: { text: string; delay: number; isUser?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.18, ease: "easeOut" }}
    className={`p-3 rounded-2xl max-w-[85%] text-[11px] shadow-md leading-relaxed transform-gpu
      ${isUser
        ? "bg-[#2AABEE] text-white self-end rounded-tr-sm"
        : "bg-[#1A1A1A] border border-white/5 text-gray-200 self-start rounded-tl-sm"}`}
  >{text}</motion.div>
);

const GuideStep = ({ step, title, desc, delay }: { step: string; title: string; desc: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.18, ease: "easeOut" }}
    className="flex gap-3 bg-[#1A1A1A] border border-white/5 p-3 rounded-xl shadow-md w-[90%] self-center mx-auto items-start transform-gpu"
  >
    <div className="w-5 h-5 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{step}</div>
    <div className="flex flex-col">
      <span className="text-white font-bold mb-1 text-[11px]">{title}</span>
      <span className="text-gray-400 text-[9px] leading-relaxed">{desc}</span>
    </div>
  </motion.div>
);

/* ─── GPU-optimised marquee ───────────────────────────────────── */
const MarqueeRow = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => (
  <div className="flex whitespace-nowrap overflow-hidden py-2">
    <motion.div
      className="flex gap-5 will-change-transform"
      style={{ transform: "translateZ(0)" }}
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ ease: "linear", duration: 32, repeat: Infinity }}
    >
      {[...items, ...items].map((item, i) => (
        <span key={i}
          className="inline-flex items-center gap-2 text-xs text-gray-400 bg-white/[0.04]
            px-4 py-2 rounded-full border border-white/[0.07] whitespace-nowrap transform-gpu
            hover:border-orange-500/30 hover:text-gray-200 transition-colors duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500/70 shrink-0"/>
          {item}
        </span>
      ))}
    </motion.div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted,          setIsMounted]          = useState(false);
  const [isTelegramModalOpen,setIsTelegramModalOpen] = useState(false);
  const [telegramToken,      setTelegramToken]       = useState("");
  const [isTokenSaved,       setIsTokenSaved]        = useState(false);
  const [showPricingPopup,   setShowPricingPopup]    = useState(false);
  const [isDeploying,        setIsDeploying]         = useState(false);
  const [botLink,            setBotLink]             = useState("");
  const [activeModel,        setActiveModel]         = useState("gpt-5.2");
  const [activeChannel,      setActiveChannel]       = useState("telegram");
  const [selectedTier,       setSelectedTier]        = useState<"starter"|"pro"|"max"|"monthly"|"yearly"|null>(null);
  const [currency,           setCurrency]            = useState<"USD"|"INR">("USD");
  const [currencySymbol,     setCurrencySymbol]      = useState("$");
  const EXCHANGE_RATE = 83;

  const [isHelpOpen,   setIsHelpOpen]   = useState(false);
  const [helpEmail,    setHelpEmail]    = useState("");
  const [helpMessage,  setHelpMessage]  = useState("");
  const [helpStatus,   setHelpStatus]   = useState<"idle"|"sending"|"sent">("idle");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") { setCurrency("INR"); setCurrencySymbol("₹"); }
    } catch {}
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const handleOpenIntegration = (ch: string) => {
    if (ch === "discord" || ch === "instagram") return;
    setActiveChannel(ch); setIsTelegramModalOpen(true);
  };
  const handleOpenPricing = (ch: string) => { setActiveChannel(ch); setShowPricingPopup(true); };
  const handleSaveToken   = () => {
    if (!telegramToken.trim()) { alert("Please enter a valid API Token."); return; }
    setIsTokenSaved(true); setIsTelegramModalOpen(false);
  };
  const handleSendHelpRequest = () => {
    if (!helpEmail.trim() || !helpMessage.trim()) { alert("Please fill all fields."); return; }
    setHelpStatus("sending");
    setTimeout(() => {
      setHelpStatus("sent");
      setTimeout(() => { setIsHelpOpen(false); setHelpStatus("idle"); setHelpMessage(""); }, 1500);
    }, 800);
  };

  const getCurrentPrice = (tier = selectedTier) => {
    if (!tier) return 0;
    let base = 0;
    if (activeModel === "omni") base = tier === "monthly" ? OMNI_PRICING.monthly : tier === "yearly" ? OMNI_PRICING.yearly : 89;
    else base = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    return currency === "INR" ? base * EXCHANGE_RATE : base;
  };

  const triggerRazorpayPayment = async () => {
    if (!selectedTier) { alert("Please select a plan."); return; }
    if (typeof window === "undefined" || !(window as any).Razorpay) { alert("Payment gateway loading…"); return; }
    const finalPrice = getCurrentPrice(); setIsDeploying(true);
    try {
      const exactPaise = Math.round(finalPrice * 100);
      const selectedModelForDB = activeModel === "omni" ? "multi_model" : activeModel;
      const res = await fetch("/api/razorpay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: exactPaise, currency, email: session?.user?.email || "user@clawlink.com", planName: selectedTier, selectedModel: selectedModelForDB }),
      });
      const order = await res.json();
      if (order.error) { alert("Order Error: " + order.error); setIsDeploying(false); return; }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency,
        name: "ClawLink Premium",
        description: `Plan: ${selectedTier.toUpperCase()} | Model: ${activeModel === "omni" ? "OmniAgent Nexus" : MODEL_DETAILS[activeModel]?.name}`,
        order_id: order.id,
        handler: async () => {
          try {
            const cfgRes = await fetch("/api/config", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: session?.user?.email, selectedModel: selectedModelForDB, selectedChannel: activeChannel, telegramToken, plan: selectedTier }),
            });
            const cfg = await cfgRes.json();
            if (cfg.success && cfg.botLink) { setBotLink(cfg.botLink); setShowPricingPopup(false); }
            else alert("Deployment failed: " + cfg.error);
          } catch { alert("Deployment error."); } finally { setIsDeploying(false); }
        },
        prefill: { email: session?.user?.email || "" }, theme: { color: "#F97316" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => { setIsDeploying(false); alert("Payment failed."); });
      rzp.open();
    } catch { alert("Gateway init failed."); setIsDeploying(false); }
  };

  const openLiveBotHandler = () => {
    if (activeChannel === "whatsapp") {
      window.open(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "https://api.whatsapp.com/send" : "https://web.whatsapp.com", "_blank");
    } else { window.open(botLink || "https://web.telegram.org", "_blank"); }
  };
  const copyToClipboard = (t: string) => { navigator.clipboard.writeText(t); alert("Copied!"); };

  /* ── marquee data ── */
  const row1 = ["📅 Productivity & Meetings","📄 Write contracts & NDAs","📊 Create presentations","🔄 Negotiate refunds","🛒 Shopping & Research","👥 Team & Monitoring"];
  const row2 = ["📅 Schedule meetings","💼 Finance, Tax & Payroll","💰 Do your taxes with AI","🎯 Screen & prioritize leads","🧾 Track expenses","👔 Write job descriptions"];
  const row3 = ["✉️ Email & Documents","📨 Read & summarize emails","🧮 Run payroll calculations","🏷️ Find coupons automatically","📈 Track OKRs & KPIs","📰 Monitor smart alerts"];
  const row4 = ["⏰ Notify before meetings","🌍 Sync time zones","📄 Generate invoices","🔍 Compare product specs","🕵️ Research competitors","🚫 Filter cold outreach"];
  const row5 = ["📅 Plan your week","📝 Take meeting notes","🔍 Find best prices","📢 Draft social media posts","📈 Sales, Marketing & Hiring","🤖 AI Automation"];

  if (!isMounted) return null;

  /* ── shared CSS classes ── */
  const glassCard  = "bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] rounded-2xl";
  const glowBtn    = "transition-all duration-150 ease-out active:scale-[0.96] transform-gpu";
  const pillActive = "ring-[2.5px] ring-blue-500 shadow-[0_0_22px_rgba(59,130,246,0.55)] scale-[1.06]";

  return (
    <div className="bg-[#0A0A0B] min-h-screen text-[#EDEDED] font-sans selection:bg-orange-500/30 overflow-x-hidden">

      {/* Global CSS */}
      <style dangerouslySetInnerHTML={{__html:`
        *{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        .no-sb::-webkit-scrollbar{display:none}.no-sb{-ms-overflow-style:none;scrollbar-width:none}
        .glow-btn:active{transform:scale(0.96)}
        @keyframes badge-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .badge-pulse{animation:badge-pulse 1.6s ease-in-out infinite}
      `}}/>

      {/* Static ambient glows — GPU composited, zero repaint */}
      <div className="fixed top-[-8%] right-[-4%] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
           style={{background:"radial-gradient(circle,rgba(249,115,22,0.13) 0%,transparent 70%)",transform:"translateZ(0)",willChange:"transform"}}/>
      <div className="fixed bottom-[-8%] left-[-8%] w-[700px] h-[700px] rounded-full pointer-events-none z-0"
           style={{background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",transform:"translateZ(0)",willChange:"transform"}}/>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[58px] flex items-center justify-between px-6 md:px-10"
           style={{backdropFilter:"blur(24px) saturate(180%)",WebkitBackdropFilter:"blur(24px) saturate(180%)",
                   background:"rgba(10,10,11,0.75)",borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
        <span className="text-[15px] font-black tracking-[0.12em] uppercase text-white">
          CLAW<span className="text-orange-500">LINK</span>.COM
        </span>
        <div className="flex items-center gap-5">
          {status === "authenticated" && (
            <div className="hidden md:flex items-center gap-3">
              <img src={session?.user?.image||""} className="w-7 h-7 rounded-full border border-white/20" alt="av"/>
              <button onClick={()=>signOut()}
                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white ${glowBtn}`}>
                <LogOut className="w-3 h-3"/> Logout
              </button>
            </div>
          )}
          <button onClick={()=>setIsSupportModalOpen(true)}
            className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white ${glowBtn}`}>
            <MessageSquare className="w-3.5 h-3.5"/> Contact Support
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center">

        {/* live badge */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:.3}}
          className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[.08em] text-orange-400"
          style={{background:"rgba(249,115,22,0.1)",border:"0.5px solid rgba(249,115,22,0.3)"}}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 badge-pulse"/>
          LIVE NOW &nbsp;·&nbsp; 30-SECOND DEPLOY
        </motion.div>

        <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.3,delay:.05}}
          className="text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[1.08] tracking-[-0.025em] mb-4">
          Deploy <span className="text-orange-500">OpenClaw</span><br/>Under 30 Seconds
        </motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.3,delay:.1}}
          className="text-gray-400 text-[16px] max-w-[460px] mb-10 leading-relaxed">
          Avoid all technical complexity — one-click deploy your own 24/7 active OpenClaw instance under 30 seconds.
        </motion.p>

        {/* ── SELECTOR GLASS CARD ──────────────────────────────── */}
        <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.3,delay:.15}}
          className={`${glassCard} w-full max-w-[660px] p-6 md:p-8 mb-8`}
          style={{boxShadow:"0 0 60px rgba(249,115,22,0.06),0 24px 48px rgba(0,0,0,0.4)"}}>

          {/* Model label */}
          <p className="text-[10px] font-bold tracking-[.12em] uppercase text-gray-500 mb-3 text-left">
            Choose a model to use as your default
          </p>

          {/* Model row — single horizontal scroll, no wrap */}
          <div className="flex gap-2.5 overflow-x-auto no-sb pb-1 mb-6 snap-x snap-mandatory">

            {/* GPT-5.2 */}
            <button
              onClick={()=>{ if(!isTokenSaved){ setActiveModel("gpt-5.2"); setSelectedTier(null); }}}
              disabled={isTokenSaved && activeModel!=="gpt-5.2"}
              className={`shrink-0 snap-center bg-white rounded-full h-[50px] px-4 flex items-center gap-2 shadow-lg ${glowBtn}
                hover:scale-[1.05] hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]
                ${activeModel==="gpt-5.2" ? pillActive : ""}
                ${isTokenSaved && activeModel!=="gpt-5.2" ? "opacity-25 pointer-events-none" : ""}`}>
              <OpenAI_Icon/>
              <span className="text-[#10A37F] font-bold text-[14px] whitespace-nowrap">GPT-5.2</span>
            </button>

            {/* Claude */}
            <button
              onClick={()=>{ if(!isTokenSaved){ setActiveModel("claude"); setSelectedTier(null); }}}
              disabled={isTokenSaved && activeModel!=="claude"}
              className={`shrink-0 snap-center bg-white rounded-full h-[50px] px-4 flex items-center gap-2 shadow-lg ${glowBtn}
                hover:scale-[1.05] hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]
                ${activeModel==="claude" ? pillActive : ""}
                ${isTokenSaved && activeModel!=="claude" ? "opacity-25 pointer-events-none" : ""}`}>
              <Claude_Icon/>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[#D97757] font-bold text-[14px]">Claude</span>
                <span className="text-[#D97757] text-[9px] font-semibold mt-[2px]">Opus 4.6</span>
              </div>
            </button>

            {/* Gemini */}
            <button
              onClick={()=>{ if(!isTokenSaved){ setActiveModel("gemini"); setSelectedTier(null); }}}
              disabled={isTokenSaved && activeModel!=="gemini"}
              className={`shrink-0 snap-center bg-white rounded-full h-[50px] px-4 flex items-center gap-2 shadow-lg ${glowBtn}
                hover:scale-[1.05] hover:shadow-[0_0_18px_rgba(59,130,246,0.4)]
                ${activeModel==="gemini" ? pillActive : ""}
                ${isTokenSaved && activeModel!=="gemini" ? "opacity-25 pointer-events-none" : ""}`}>
              <Gemini_Icon/>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[#648AF5] font-bold text-[14px]">Gemini</span>
                <span className="text-[#648AF5] text-[9px] font-semibold mt-[2px]">3 Flash</span>
              </div>
            </button>

            {/* OmniAgent */}
            <button
              onClick={()=>{ if(!isTokenSaved){ setActiveModel("omni"); setSelectedTier(null); }}}
              disabled={isTokenSaved && activeModel!=="omni"}
              className={`shrink-0 snap-center bg-white rounded-full h-[50px] px-4 flex items-center gap-2 shadow-lg border border-[#00BFFF]/40 ${glowBtn}
                hover:scale-[1.05] hover:shadow-[0_0_22px_rgba(0,191,255,0.5)]
                ${activeModel==="omni" ? "ring-[2.5px] ring-[#00BFFF] shadow-[0_0_28px_rgba(0,191,255,0.7)] scale-[1.06]" : ""}
                ${isTokenSaved && activeModel!=="omni" ? "opacity-25 pointer-events-none" : ""}`}>
              <Omni_Icon/>
              <div className="flex flex-col leading-none text-left">
                <span className="text-[#0A192F] font-black text-[14px] tracking-wide">OmniAgent</span>
                <span className="text-[#00BFFF] text-[9px] font-bold mt-[2px] tracking-widest uppercase">Nexus</span>
              </div>
            </button>

            {/* Llama 4 — soon */}
            <div className="shrink-0 snap-center bg-white/80 rounded-full h-[50px] px-4 flex items-center gap-2 shadow-md cursor-not-allowed opacity-50">
              <Llama_Icon/>
              <div className="flex flex-col leading-none text-left">
                <span className="text-gray-700 font-bold text-[14px]">Llama 4</span>
                <span className="text-blue-600 text-[9px] font-bold mt-[2px] tracking-widest uppercase animate-pulse">Soon</span>
              </div>
            </div>
          </div>

          {/* Channel label */}
          <p className="text-[10px] font-bold tracking-[.12em] uppercase text-gray-500 mb-3 text-left">
            Select a channel for sending messages
          </p>

          {/* Channel row — single horizontal scroll */}
          <div className="flex gap-2.5 overflow-x-auto no-sb pb-1 mb-6 snap-x snap-mandatory">

            {/* Telegram */}
            <button
              onClick={()=>!isTokenSaved && setActiveChannel("telegram")}
              disabled={isTokenSaved && activeChannel!=="telegram"}
              className={`shrink-0 snap-center bg-white rounded-xl h-[56px] px-5 flex items-center gap-2.5 shadow-md ${glowBtn}
                hover:scale-[1.04] hover:shadow-[0_0_18px_rgba(42,171,238,0.4)]
                ${activeChannel==="telegram" ? "ring-[2.5px] ring-blue-500 shadow-[0_0_22px_rgba(59,130,246,0.55)] scale-[1.05]" : ""}
                ${isTokenSaved && activeChannel!=="telegram" ? "opacity-25 pointer-events-none" : ""}`}>
              <Telegram_Icon size={34}/>
              <span className="text-[14px] text-gray-800 font-bold whitespace-nowrap">Telegram</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={()=>!isTokenSaved && setActiveChannel("whatsapp")}
              disabled={isTokenSaved && activeChannel!=="whatsapp"}
              className={`shrink-0 snap-center bg-white rounded-xl h-[56px] px-5 flex items-center gap-2.5 shadow-md ${glowBtn}
                hover:scale-[1.04] hover:shadow-[0_0_18px_rgba(37,211,102,0.4)]
                ${activeChannel==="whatsapp" ? "ring-[2.5px] ring-green-500 shadow-[0_0_22px_rgba(34,197,94,0.55)] scale-[1.05]" : ""}
                ${isTokenSaved && activeChannel!=="whatsapp" ? "opacity-25 pointer-events-none" : ""}`}>
              <WhatsApp_Icon size={34}/>
              <span className="text-[14px] text-gray-800 font-bold whitespace-nowrap">WhatsApp</span>
            </button>

            {/* Discord — soon */}
            <div className={`shrink-0 snap-center bg-white rounded-xl h-[56px] px-5 flex items-center gap-2.5 shadow-md cursor-not-allowed ${isTokenSaved?"opacity-20":"opacity-55"}`}>
              <Discord_Icon/>
              <div className="flex flex-col leading-none">
                <span className="text-[14px] text-gray-800 font-bold">Discord</span>
                <span className="text-[9px] text-blue-600 font-bold tracking-widest uppercase mt-[2px]">Soon</span>
              </div>
            </div>

            {/* Instagram — soon */}
            <div className={`shrink-0 snap-center bg-white rounded-xl h-[56px] px-5 flex items-center gap-2.5 shadow-md cursor-not-allowed ${isTokenSaved?"opacity-20":"opacity-55"}`}>
              <Instagram_Icon/>
              <div className="flex flex-col leading-none">
                <span className="text-[14px] text-gray-800 font-bold">Instagram</span>
                <span className="text-[9px] text-blue-600 font-bold tracking-widest uppercase mt-[2px]">Soon</span>
              </div>
            </div>
          </div>

          {/* ── CTA area ── */}
          <AnimatePresence mode="wait">
            {botLink ? (
              <motion.div key="success" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}
                className="rounded-2xl p-5 text-center"
                style={{background:"rgba(34,197,94,0.07)",border:"0.5px solid rgba(34,197,94,0.25)"}}>
                <p className="text-lg font-bold text-white mb-4">Your Bot is Live! 🚀</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button onClick={openLiveBotHandler}
                    className={`bg-white text-black font-bold px-7 py-3.5 rounded-xl text-sm ${glowBtn} hover:scale-[1.03] shadow-[0_0_18px_rgba(255,255,255,0.25)]`}>
                    Open Live Bot
                  </button>
                  <button onClick={()=>router.push("/dashboard")}
                    className={`flex items-center justify-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl text-sm ${glowBtn} hover:scale-[1.03]`}
                    style={{background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.15)"}}>
                    <Activity className="w-4 h-4"/> Live Dashboard
                  </button>
                </div>
              </motion.div>
            ) : status === "unauthenticated" ? (
              <motion.div key="login" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}>
                <button onClick={()=>signIn("google")}
                  className={`w-full bg-white text-[#4B6B8A] py-4 rounded-[2rem] flex items-center justify-center gap-3 text-[20px] font-serif tracking-tight shadow-xl ${glowBtn}
                    hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(255,255,255,0.35)]`}>
                  <Google_Icon/> Login via Google & Deploy
                </button>
                <p className="mt-4 text-sm font-serif text-white text-center tracking-wide">
                  Link your channels to proceed.{" "}
                  <span className="text-[#34A853]">Limited cloud servers — only 7 left.</span>
                </p>
              </motion.div>
            ) : (
              <motion.div key="action" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}} className="flex flex-col gap-3">
                {/* user pill */}
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{background:"rgba(0,0,0,0.45)",border:"0.5px solid rgba(255,255,255,0.09)"}}>
                  <div className="flex items-center gap-3">
                    <img src={session?.user?.image||""} className="w-9 h-9 rounded-full border border-white/20" alt="av"/>
                    <div className="text-left">
                      <p className="text-[13px] font-bold text-white leading-none">{session?.user?.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-[3px]">{session?.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={()=>signOut()}
                    className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 ${glowBtn}`}>
                    <LogOut className="w-3.5 h-3.5"/> Logout
                  </button>
                </div>

                {!isTokenSaved ? (
                  <button onClick={()=>handleOpenIntegration(activeChannel)}
                    className={`w-full bg-white text-black font-black py-4 rounded-2xl text-[15px] uppercase tracking-widest shadow-xl ${glowBtn}
                      hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(255,255,255,0.3)]`}>
                    Connect {activeChannel} to Continue
                  </button>
                ) : (
                  <button onClick={()=>handleOpenPricing(activeChannel)}
                    className={`w-full font-black py-4 rounded-2xl text-[15px] uppercase tracking-widest flex items-center justify-center gap-2 ${glowBtn}
                      hover:scale-[1.02] bg-blue-600 hover:bg-blue-500 text-white
                      shadow-[0_0_28px_rgba(37,99,235,0.45)] hover:shadow-[0_0_40px_rgba(37,99,235,0.65)]`}>
                    <Zap className="w-5 h-5"/> Deploy Your AI Agent Now
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats strip */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.3,delay:.25}}
          className="grid grid-cols-3 w-full max-w-[560px] overflow-hidden rounded-2xl"
          style={{border:"0.5px solid rgba(255,255,255,0.07)"}}>
          {[["30s","Average deploy time"],["5+","AI models supported"],["24/7","Always active agent"]].map(([n,l])=>(
            <div key={n} className="flex flex-col items-center py-5 px-3"
              style={{background:"rgba(255,255,255,0.025)",borderRight:"0.5px solid rgba(255,255,255,0.06)"}}>
              <span className="text-[1.9rem] font-black text-orange-500 leading-none">{n}</span>
              <span className="text-[11px] text-gray-500 mt-1 text-center leading-snug">{l}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-bold tracking-[.1em] uppercase text-orange-500 mb-2">Core Features</p>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-extrabold tracking-tight leading-snug">Everything your AI agent needs</h2>
          <p className="text-gray-500 mt-2 max-w-[400px] text-[15px]">Enterprise-grade capabilities, zero technical overhead.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] rounded-2xl overflow-hidden"
          style={{background:"rgba(255,255,255,0.06)",border:"0.5px solid rgba(255,255,255,0.07)"}}>
          {[
            {icon:<Globe className="w-5 h-5 text-blue-400"/>,  bg:"rgba(59,130,246,0.1)",  t:"Omnichannel Deployment",      d:"Deploy across Telegram, WhatsApp Cloud, and your website with a single click."},
            {icon:<Database className="w-5 h-5 text-green-400"/>,bg:"rgba(34,197,94,0.1)", t:"Enterprise RAG Memory",        d:"Inject FAQs, return policies and product details into the AI's Vector DB Brain."},
            {icon:<Mic className="w-5 h-5 text-purple-400"/>,  bg:"rgba(168,85,247,0.1)",  t:"Voice Note Intelligence",      d:"OpenAI Whisper integration — your bot listens to voice notes and replies contextually."},
            {icon:<Zap className="w-5 h-5 text-orange-400"/>,  bg:"rgba(249,115,22,0.1)",  t:"Actionable AI Interceptor",    d:"AI doesn't just talk; it acts. Trigger APIs to check order status or book meetings."},
            {icon:<MessageSquare className="w-5 h-5 text-pink-400"/>,bg:"rgba(236,72,153,0.1)",t:"Live CRM & Human Handoff", d:"Monitor conversations in real-time and take over instantly when a human touch is needed."},
            {icon:<Activity className="w-5 h-5 text-yellow-400"/>,bg:"rgba(234,179,8,0.1)",t:"Marketing Broadcast Engine",   d:"Blast promotional offers to thousands of captured leads with zero extra cost."},
          ].map(({icon,bg,t,d},i)=>(
            <div key={i}
              className="p-7 group transition-all duration-200 ease-out cursor-default"
              style={{background:"#0E0E10"}}
              onMouseEnter={e=>(e.currentTarget.style.background="#141416")}
              onMouseLeave={e=>(e.currentTarget.style.background="#0E0E10")}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110 transform-gpu"
                style={{background:bg,border:"0.5px solid rgba(255,255,255,0.06)"}}>
                {icon}
              </div>
              <h3 className="text-[14px] font-bold text-white mb-2">{t}</h3>
              <p className="text-[12px] text-gray-500 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6"
        style={{borderTop:"0.5px solid rgba(255,255,255,0.06)",background:"#0D0D0F"}}>
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[.1em] uppercase text-orange-500 mb-2">Comparison</p>
            <h2 className="text-[clamp(2rem,4vw,3.4rem)] font-extrabold tracking-tight">Traditional Method vs ClawLink</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-6">
            {/* Left — traditional */}
            <div className="rounded-2xl overflow-hidden" style={{border:"0.5px solid rgba(255,255,255,0.07)"}}>
              <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500"
                style={{borderBottom:"0.5px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
                Traditional Setup — Step by Step
              </div>
              {[
                ["Purchasing local virtual machine","15 min"],
                ["Creating SSH keys and storing securely","10 min"],
                ["Connecting to the server via SSH","5 min"],
                ["Installing Node.js and NPM","5 min"],
                ["Installing OpenClaw","7 min"],
                ["Setting up OpenClaw","10 min"],
                ["Connecting to AI provider","4 min"],
                ["Pairing with Telegram","4 min"],
              ].map(([label,time])=>(
                <div key={label} className="flex justify-between items-center px-6 py-4 text-[13px]"
                  style={{borderBottom:"0.5px solid rgba(255,255,255,0.04)"}}>
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-600 text-[12px] px-2.5 py-1 rounded-md"
                    style={{background:"rgba(255,255,255,0.04)"}}>{time}</span>
                </div>
              ))}
              <div className="flex justify-between px-6 py-4 font-bold text-[14px]"
                style={{background:"rgba(255,255,255,0.03)",borderTop:"0.5px solid rgba(255,255,255,0.08)"}}>
                <span>Total Time</span><span className="text-red-400">60 MINUTES</span>
              </div>
              <p className="text-[11px] text-gray-600 px-6 py-3 text-right">
                * Non-technical users: multiply by 10 — learn each step before doing.
              </p>
            </div>

            {/* Right — ClawLink */}
            <div className="rounded-2xl flex flex-col items-center justify-center text-center p-10 min-h-[320px]"
              style={{background:"linear-gradient(135deg,rgba(249,115,22,0.09),rgba(234,88,12,0.04))",border:"0.5px solid rgba(249,115,22,0.28)"}}>
              <p className="text-[11px] font-bold tracking-[.1em] uppercase text-gray-500 mb-3">With ClawLink</p>
              <p className="text-[3.6rem] font-black text-orange-500 leading-none">ClawLink</p>
              <p className="text-[2.8rem] font-black text-white leading-none mb-5">&lt;30 sec</p>
              <p className="text-[12px] text-gray-400 max-w-[260px] leading-[1.75]">
                Pick a model, connect your channel, and deploy — done in under 1 minute.
                Servers, SSH, and your OpenClaw Environment are pre-configured.
                Simple, secure, and instant.
              </p>
              <button onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}
                className={`mt-7 px-7 py-3 rounded-xl text-[13px] font-bold text-white ${glowBtn}
                  hover:scale-[1.04] bg-orange-500 hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]
                  hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]`}>
                Start Free Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── USE CASES MARQUEE ────────────────────────────────────── */}
      <section className="relative z-10 py-24 overflow-hidden"
        style={{background:"#0A0A0B",borderTop:"0.5px solid rgba(255,255,255,0.05)",borderBottom:"0.5px solid rgba(255,255,255,0.05)"}}>
        <div className="text-center mb-14 px-6">
          <p className="text-[11px] font-bold tracking-[.1em] uppercase text-orange-500 mb-2">Use Cases</p>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tighter">Unleash Thousands of Use Cases</h2>
          <p className="text-orange-400/80 font-serif italic text-[15px] mt-2">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        </div>
        <div className="flex flex-col gap-3 relative">
          <MarqueeRow items={row1}/>
          <MarqueeRow items={row2} reverse/>
          <MarqueeRow items={row3}/>
          <MarqueeRow items={row4} reverse/>
          <MarqueeRow items={row5}/>
          <div className="absolute inset-0 pointer-events-none"
            style={{background:"linear-gradient(90deg,#0A0A0B 0%,transparent 12%,transparent 88%,#0A0A0B 100%)"}}/>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="relative z-10 pt-24 pb-12 px-8 md:px-14"
        style={{background:"#080809",borderTop:"0.5px solid rgba(255,255,255,0.06)"}}>
        <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold tracking-tight mb-7"
          style={{fontFamily:"Georgia,serif"}}>Deploy. Automate. Relax.</h2>
        <button onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}
          className={`px-10 py-3.5 rounded-lg text-[15px] font-bold text-black mb-24 ${glowBtn}
            hover:scale-[1.04] shadow-lg`}
          style={{background:"linear-gradient(135deg,#FFA87A,#F97316)"}}>
          Learn More
        </button>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-gray-600 pt-8"
          style={{borderTop:"0.5px solid rgba(255,255,255,0.07)"}}>
          <span>© 2026 ClawLink Inc. All rights reserved.</span>
          <span className="hidden md:block uppercase tracking-widest text-[10px]">© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</span>
          <div className="flex gap-5">
            {[["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Documentation","/docs"]].map(([label,href])=>(
              <a key={href} href={href} className="hover:text-gray-300 transition-colors duration-150">{label}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  MODALS (logic identical, styling upgraded)               */}
      {/* ══════════════════════════════════════════════════════════ */}

      {/* Contact Support Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
            <motion.div initial={{opacity:0,scale:.96,y:8}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:.96,y:8}} transition={{duration:.15,ease:"easeOut"}}
              className="w-full max-w-md p-8 rounded-[1.75rem] relative"
              style={{background:"#111113",border:"0.5px solid rgba(255,255,255,0.1)",boxShadow:"0 0 60px rgba(0,0,0,0.8)"}}>
              <button onClick={()=>setIsSupportModalOpen(false)}
                className={`absolute top-5 right-5 p-2 rounded-full text-gray-500 hover:text-white ${glowBtn}`}
                style={{background:"rgba(255,255,255,0.05)"}}>
                <X className="w-4 h-4"/>
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{background:"rgba(59,130,246,0.1)",border:"0.5px solid rgba(59,130,246,0.2)"}}>
                  <MessageSquare className="w-5 h-5 text-blue-400"/>
                </div>
                <h2 className="text-[1.4rem] font-bold">Contact Support</h2>
              </div>
              <p className="text-[13px] text-gray-500 mb-7">Need assistance? Our team is here 24/7.</p>
              <div className="space-y-3">
                {[
                  {icon:<Mail className="w-4 h-4 text-orange-400"/>,title:"Direct Email",content:<a href="mailto:support@clawlink.com" className="text-blue-400 hover:text-blue-300 text-[13px] font-mono transition-colors duration-150">support@clawlink.com</a>},
                  {icon:<Shield className="w-4 h-4 text-green-400"/>,title:"Enterprise SLAs",content:<p className="text-[12px] text-gray-500 leading-relaxed mt-1">Pro and Max tier users get priority routing with &lt;1hr guaranteed response.</p>},
                ].map(({icon,title,content},i)=>(
                  <div key={i} className="p-5 rounded-2xl transition-colors duration-150"
                    style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.06)"}}>
                    <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[13px] font-bold text-white">{title}</span></div>
                    {content}
                  </div>
                ))}
              </div>
              <button onClick={()=>setIsSupportModalOpen(false)}
                className={`w-full mt-7 bg-white text-black font-bold py-3.5 rounded-xl text-[13px] uppercase tracking-widest ${glowBtn} hover:bg-gray-100 shadow-[0_0_18px_rgba(255,255,255,0.2)]`}>
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Integration Setup Modal */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-xl p-4">
            <motion.div initial={{opacity:0,scale:.96,y:8}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:.96,y:8}} transition={{duration:.15,ease:"easeOut"}}
              className="w-full max-w-[1000px] flex flex-col md:flex-row overflow-hidden rounded-3xl relative"
              style={{background:"#111113",border:"0.5px solid rgba(255,255,255,0.1)",boxShadow:"0 0 80px rgba(0,0,0,0.9)"}}>
              <button onClick={()=>setIsTelegramModalOpen(false)}
                className={`absolute top-5 right-5 z-20 p-2 rounded-full text-gray-500 hover:text-white ${glowBtn}`}
                style={{background:"rgba(255,255,255,0.05)"}}>✕</button>

              {/* Left pane */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[85vh] no-sb">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{background:"rgba(255,255,255,0.05)",border:"0.5px solid rgba(255,255,255,0.1)"}}>
                    {activeChannel==="telegram" ? <Telegram_Icon size={28}/> : <WhatsApp_Icon size={28}/>}
                  </div>
                  <h2 className="text-[1.4rem] font-bold">Connect {activeChannel==="telegram"?"Telegram":"WhatsApp"}</h2>
                </div>

                {activeChannel==="telegram" ? (
                  <>
                    <ol className="space-y-3.5 text-[13px] text-gray-400 list-decimal pl-5 mb-6 leading-relaxed">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send <code className="rounded px-1.5 py-0.5 text-white font-mono text-[11px]" style={{background:"rgba(255,255,255,0.08)"}}>/newbot</code> to begin.</li>
                      <li>Set your custom <strong className="text-white">Name</strong> and <strong className="text-white">Username</strong>.</li>
                      <li>BotFather generates an <strong className="text-white">HTTP API Token</strong>.</li>
                      <li>Copy and paste it below.</li>
                    </ol>
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl text-[12px] font-bold w-fit ${glowBtn}
                        text-[#2AABEE] hover:scale-[1.03]`}
                      style={{background:"rgba(42,171,238,0.08)",border:"0.5px solid rgba(42,171,238,0.2)"}}>
                      <ExternalLink className="w-3 h-3"/> Open @BotFather Directly
                    </a>
                    <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.07)"}}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">API Access Token</label>
                      <input type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)}
                        placeholder="Enter Verification Token…"
                        className="w-full px-4 py-3.5 rounded-xl text-[13px] text-white font-mono mb-5 outline-none transition-colors duration-150"
                        style={{background:"#0A0A0B",border:"0.5px solid rgba(255,255,255,0.1)"}}
                        onFocus={e=>(e.target.style.border="0.5px solid rgba(249,115,22,0.5)")}
                        onBlur={e=>(e.target.style.border="0.5px solid rgba(255,255,255,0.1)")}/>
                      <button onClick={handleSaveToken}
                        className={`w-full bg-white text-black font-black py-4 rounded-xl text-[13px] uppercase tracking-widest ${glowBtn}
                          hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_18px_rgba(255,255,255,0.2)]`}>
                        Save and Proceed
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ol className="space-y-3 text-[12px] text-gray-400 list-decimal pl-5 mb-5 leading-relaxed">
                      <li>Log in to the <strong className="text-white">Meta Developer Console</strong>.</li>
                      <li>Create a new <strong className="text-white">Business App</strong> and activate the <strong className="text-white">WhatsApp Module</strong>.</li>
                      <li>In <strong className="text-white">API Setup</strong>, register and verify your phone number.</li>
                      <li>Navigate to <strong className="text-white">System Users</strong> → generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Under <strong className="text-white">Configuration</strong>, click Edit to set your Webhook URL.</li>
                      <li>Enter the <strong className="text-white">Callback URL</strong> and <strong className="text-white">Verify Token</strong> below.</li>
                      <li>Subscribe exclusively to <strong className="text-white">messages</strong> webhook events.</li>
                    </ol>
                    <div className="p-4 rounded-2xl mb-5"
                      style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(37,211,102,0.2)"}}>
                      {[
                        {label:"Webhook Callback URL",val:"https://clawlink-six.vercel.app/api/webhook/whatsapp"},
                        {label:"Verify Token",val:"ClawLinkMeta2026"},
                      ].map(({label,val})=>(
                        <div key={label} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
                            <button onClick={()=>copyToClipboard(val)}
                              className={`text-gray-500 hover:text-white ${glowBtn}`}>
                              <Copy className="w-3 h-3"/>
                            </button>
                          </div>
                          <code className="block text-[#25D366] text-[11px] px-3 py-2 rounded-lg select-all truncate"
                            style={{background:"#0A0A0B",border:"0.5px solid rgba(255,255,255,0.06)"}}>{val}</code>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.07)"}}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Permanent API Token</label>
                      <input type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)}
                        placeholder="EAABwzL…"
                        className="w-full px-4 py-3.5 rounded-xl text-[13px] text-white font-mono mb-5 outline-none transition-colors duration-150"
                        style={{background:"#0A0A0B",border:"0.5px solid rgba(255,255,255,0.1)"}}
                        onFocus={e=>(e.target.style.border="0.5px solid rgba(37,211,102,0.5)")}
                        onBlur={e=>(e.target.style.border="0.5px solid rgba(255,255,255,0.1)")}/>
                      <button onClick={handleSaveToken}
                        className={`w-full bg-white text-black font-black py-4 rounded-xl text-[13px] uppercase tracking-widest ${glowBtn}
                          hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_18px_rgba(255,255,255,0.2)]`}>
                        Save and Proceed
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right pane — phone mockup */}
              <div className="hidden md:flex md:w-1/2 items-center justify-center p-10 relative"
                style={{background:"rgba(0,0,0,0.35)",borderLeft:"0.5px solid rgba(255,255,255,0.05)"}}>
                <div className="w-[300px] h-[580px] rounded-[2.8rem] flex flex-col relative overflow-hidden"
                  style={{border:"6px solid #1A1A1A",background:"#0A0A0B",boxShadow:"0 0 50px rgba(0,0,0,0.6)"}}>
                  <div className="absolute top-0 inset-x-0 h-6 rounded-b-3xl z-20 flex justify-center items-end pb-1"
                    style={{background:"#1A1A1A"}}>
                    <div className="w-10 h-1.5 rounded-full" style={{background:"rgba(0,0,0,0.5)"}}/>
                  </div>
                  <div className="p-4 pt-9 flex items-center gap-3 z-10"
                    style={{background:"rgba(17,17,19,0.92)",backdropFilter:"blur(12px)",borderBottom:"0.5px solid rgba(255,255,255,0.05)"}}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${activeChannel==="telegram"?"bg-[#2AABEE]":"bg-[#25D366]"}`}>
                      {activeChannel==="telegram"?<Telegram_Icon size={20}/>:<WhatsApp_Icon size={20}/>}
                    </div>
                    <div>
                      {activeChannel==="telegram" ? (
                        <>
                          <p className="text-white text-[12px] font-bold flex items-center gap-1">BotFather <CheckCircle2 className="w-3 h-3 text-blue-400"/></p>
                          <p className="text-gray-400 text-[9px] font-mono">Verified System Bot</p>
                        </>
                      ) : (
                        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
                          <p className="text-white text-[12px] font-bold flex items-center gap-1">Meta Developer <ExternalLink className="w-3 h-3 text-green-400"/></p>
                          <p className="text-gray-400 text-[9px] font-mono">API Configuration</p>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="p-4 pt-5 flex-1 flex flex-col justify-end space-y-2.5 overflow-y-auto no-sb">
                    {activeChannel==="telegram" ? (
                      <>
                        <ChatBubble isUser text="/newbot" delay={.1}/>
                        <ChatBubble text="Alright, a new bot. How are we going to call it?" delay={.2}/>
                        <ChatBubble isUser text="ClawLink Support" delay={.3}/>
                        <ChatBubble text="Good. Now let's choose a username…" delay={.4}/>
                        <ChatBubble isUser text="ClawSupport_bot" delay={.5}/>
                        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.6,duration:.18,ease:"easeOut"}}
                          className="p-3 rounded-2xl rounded-tl-sm text-gray-200 self-start max-w-[90%] text-[11px] leading-relaxed"
                          style={{background:"#1A1A1A",border:"0.5px solid rgba(42,171,238,0.25)"}}>
                          Done! Here is your token:<br/>
                          <span className="text-[#2AABEE] font-mono font-bold break-all mt-1 block">1234567890:AAH8ABC…</span>
                        </motion.div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 h-full justify-start pb-4">
                        <GuideStep delay={.1} step="1" title="Create App" desc="Select Business Type in Meta Developer Console."/>
                        <GuideStep delay={.2} step="2" title="Add Number" desc="Register your phone number in API Setup."/>
                        <GuideStep delay={.3} step="3" title="Generate Token" desc="Create System User & get Permanent Access Token."/>
                        <GuideStep delay={.4} step="4" title="Link Webhook" desc="Enter Webhook URL & Verify Token."/>
                        <GuideStep delay={.5} step="5" title="Subscribe" desc="Enable 'messages' webhook subscription."/>
                        <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.6,duration:.18,ease:"easeOut"}}
                          className="mt-3 p-3 rounded-xl text-center mx-auto w-[90%]"
                          style={{background:"rgba(37,211,102,0.08)",border:"0.5px solid rgba(37,211,102,0.25)"}}>
                          <span className="text-[#25D366] font-bold text-[11px] flex items-center justify-center gap-2">
                            <Zap className="w-3 h-3"/> Infrastructure Linked
                          </span>
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 inset-x-0 h-1 rounded-full w-28 mx-auto z-20"
                    style={{background:"#333"}}/>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Popup */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{opacity:0,y:8,scale:.98}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:8,scale:.98}} transition={{duration:.15,ease:"easeOut"}}
              className="w-full max-w-4xl p-8 md:p-12 rounded-[2rem] text-center relative overflow-y-auto max-h-[95vh] no-sb"
              style={{background:"#111113",border:"0.5px solid rgba(255,255,255,0.1)",boxShadow:"0 0 80px rgba(0,0,0,0.9)"}}>
              {!isDeploying && (
                <button onClick={()=>setShowPricingPopup(false)}
                  className={`absolute top-5 right-6 p-2 rounded-full text-gray-500 hover:text-white ${glowBtn}`}
                  style={{background:"rgba(255,255,255,0.05)"}}>✕</button>
              )}
              <h2 className="text-[1.8rem] font-black uppercase tracking-tight mb-3">
                {activeModel==="omni" ? "OmniAgent Enterprise Plans" : "Select Your Deployment Plan"}
              </h2>
              <p className="text-gray-500 text-[14px] mb-10 max-w-xl mx-auto">
                {activeModel==="omni"
                  ? "OmniAgent includes 3x AI Fallback (GPT, Claude, Gemini) for 0% downtime. Llama 4 coming soon."
                  : "Select a tier to securely initialize your AI engine."}
              </p>

              {activeModel==="omni" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 max-w-xl mx-auto text-left">
                  {[
                    {tier:"monthly" as const, accent:"#00BFFF", label:"Monthly Enterprise", badge:null, desc:"3x Smart AI Fallback. Billed monthly."},
                    {tier:"yearly"  as const, accent:"#0052D4", label:"Yearly Enterprise",  badge:"Save 16%", desc:"Maximum value for production scale."},
                  ].map(({tier,accent,label,badge,desc})=>(
                    <div key={tier} onClick={()=>!isDeploying && setSelectedTier(tier)}
                      className={`relative p-7 rounded-2xl transition-all duration-150 ease-out cursor-pointer ${glowBtn}
                        ${selectedTier===tier ? "scale-[1.04]" : "hover:scale-[1.02]"}`}
                      style={{
                        background: selectedTier===tier ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                        border: `0.5px solid ${selectedTier===tier ? accent : "rgba(255,255,255,0.07)"}`,
                        boxShadow: selectedTier===tier ? `0 0 28px ${accent}44` : "none",
                      }}>
                      {badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full tracking-widest"
                        style={{background:accent}}>{badge}</div>}
                      <h3 className="font-bold uppercase text-[11px] tracking-widest mb-2" style={{color:accent}}>{label}</h3>
                      <div className="text-[2.2rem] font-black text-white mb-3">{currencySymbol}{getCurrentPrice(tier)}</div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 text-left">
                  {[
                    {tier:"starter" as const, accent:"rgba(255,255,255,0.4)", label:"Starter",      color:"text-gray-400", badge:null,     desc:"Entry level for private use."},
                    {tier:"pro"     as const, accent:"#3B82F6",               label:"Professional", color:"text-blue-400", badge:"Popular", desc:"Expanded usage and priority routing."},
                    {tier:"max"     as const, accent:"#F97316",               label:"Maximum",      color:"text-orange-400",badge:null,    desc:"Uncapped limits, highest speeds."},
                  ].map(({tier,accent,label,color,badge,desc})=>(
                    <div key={tier} onClick={()=>!isDeploying && setSelectedTier(tier)}
                      className={`relative p-6 rounded-2xl transition-all duration-150 ease-out cursor-pointer ${glowBtn}
                        ${selectedTier===tier ? "scale-[1.04]" : "hover:scale-[1.02]"}`}
                      style={{
                        background: selectedTier===tier ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                        border: `0.5px solid ${selectedTier===tier ? accent : "rgba(255,255,255,0.07)"}`,
                        boxShadow: selectedTier===tier ? `0 0 24px ${accent}40` : "none",
                      }}>
                      {badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full tracking-widest bg-blue-600">{badge}</div>}
                      <h3 className={`font-bold uppercase text-[11px] tracking-widest mb-2 ${color}`}>{label}</h3>
                      <div className="text-[2rem] font-black text-white mb-3">{currencySymbol}{getCurrentPrice(tier)}</div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={triggerRazorpayPayment} disabled={isDeploying || !selectedTier}
                className={`w-full max-w-sm mx-auto font-black py-4 rounded-xl uppercase tracking-widest flex justify-center items-center gap-2 transition-all duration-150 ease-out ${glowBtn}
                  ${!selectedTier ? "cursor-not-allowed opacity-40 bg-gray-700 text-gray-400"
                    : activeModel==="omni"
                      ? "bg-gradient-to-r from-[#0052D4] to-[#00BFFF] text-white hover:scale-[1.02] shadow-[0_0_24px_rgba(0,191,255,0.4)]"
                      : "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-[0_0_22px_rgba(255,255,255,0.3)]"}`}>
                {isDeploying ? "Deploying Infrastructure…"
                  : !selectedTier ? "Select a Tier"
                  : `Initialize Payment — ${currencySymbol}${getCurrentPrice()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div initial={{opacity:0,y:16,scale:.92}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:16,scale:.92}} transition={{duration:.15,ease:"easeOut"}}
              className="w-80 p-5 rounded-2xl mb-3 relative overflow-hidden"
              style={{background:"#111113",border:"0.5px solid rgba(255,255,255,0.1)",boxShadow:"0 0 40px rgba(0,0,0,0.8)"}}>
              <button onClick={()=>setIsHelpOpen(false)}
                className={`absolute top-3.5 right-3.5 text-gray-500 hover:text-white ${glowBtn}`}>
                <X className="w-4 h-4"/>
              </button>
              {helpStatus==="sent" ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                    style={{background:"rgba(34,197,94,0.15)"}}>
                    <CheckCircle2 className="w-5 h-5 text-green-400"/>
                  </div>
                  <h4 className="text-white font-bold text-[15px] mb-1">Inquiry Submitted</h4>
                  <p className="text-[11px] text-gray-500">Our team will review this shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-4" style={{borderBottom:"0.5px solid rgba(255,255,255,0.06)"}}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{background:"rgba(59,130,246,0.15)"}}>
                      <MessageSquare className="w-4 h-4 text-blue-400"/>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-[13px]">ClawLink Operations</h4>
                      <p className="text-[10px] text-gray-500">Standard SLA per tier.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input type="email" placeholder="Email Address" value={helpEmail} onChange={e=>setHelpEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] text-white outline-none transition-colors duration-150"
                      style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.07)"}}
                      onFocus={e=>(e.target.style.border="0.5px solid rgba(59,130,246,0.5)")}
                      onBlur={e=>(e.target.style.border="0.5px solid rgba(255,255,255,0.07)")}/>
                    <textarea placeholder="Detail your request…" rows={3} value={helpMessage} onChange={e=>setHelpMessage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[12px] text-white outline-none resize-none transition-colors duration-150"
                      style={{background:"rgba(255,255,255,0.04)",border:"0.5px solid rgba(255,255,255,0.07)"}}
                      onFocus={e=>(e.target.style.border="0.5px solid rgba(59,130,246,0.5)")}
                      onBlur={e=>(e.target.style.border="0.5px solid rgba(255,255,255,0.07)")}/>
                    <button onClick={handleSendHelpRequest} disabled={helpStatus==="sending"}
                      className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[12px] py-2.5 rounded-xl flex items-center justify-center gap-2 ${glowBtn}
                        hover:scale-[1.02] shadow-[0_0_14px_rgba(37,99,235,0.4)]`}>
                      {helpStatus==="sending" ? "Transmitting…" : <><Send className="w-3 h-3"/> Transmit Request</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileHover={{scale:1.1}} whileTap={{scale:.9}} onClick={()=>setIsHelpOpen(!isHelpOpen)}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center transition-shadow duration-150"
          style={{background:"linear-gradient(135deg,#3B82F6,#7C3AED)",boxShadow:"0 0 22px rgba(59,130,246,0.45)"}}>
          {isHelpOpen ? <X className="w-6 h-6"/> : <MessageCircle className="w-6 h-6"/>}
        </motion.button>
      </div>

    </div>
  );
}