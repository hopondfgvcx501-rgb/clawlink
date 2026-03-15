"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Zap, MessageSquare, Activity, Shield, ExternalLink, CheckCircle2, Copy, MessageCircle, X, Send, Mail } from "lucide-react";
import Image from "next/image";

// --- 📦 IMPORTING OUR NEW COMPONENTS ---
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Comparison from "@/components/landing/Comparison";

// --- CONFIGURATION & PRICING ---
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 1.2, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 } 
};
const MAX_PLAN_PRICE = 89; 

// --- LOGO COMPONENTS ---
const OpenAI_Icon = () => <Image src="/logos/openai.svg" alt="OpenAI" width={24} height={24} />;
const Claude_Icon = () => <Image src="/logos/claude.svg" alt="Claude" width={24} height={24} />;
const Gemini_Icon = () => <Image src="/logos/gemini.svg" alt="Gemini" width={24} height={24} />;
const Telegram_Icon = () => <Image src="/logos/Telegram.svg" alt="Telegram" width={24} height={24} />;
const WhatsApp_Icon = () => <Image src="/logos/WhatsApp.svg" alt="WhatsApp" width={24} height={24} />;
const Soon_Icon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#FFB900" d="M12 2a10 10 0 00-7.07 17.07l1.41-1.41A8 8 0 1120 12h2a10 10 0 00-10-10z"/><path fill="#F25022" d="M2 12a10 10 0 0017.07 7.07l-1.41-1.41A8 8 0 014 12H2z"/><path fill="#7FBA00" d="M12 22a10 10 0 007.07-17.07l-1.41 1.41A8 8 0 0112 20v2z"/><path fill="#00A4EF" d="M22 12A10 10 0 004.93 4.93l1.41 1.41A8 8 0 0120 12h2z"/></svg>;
const Discord_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#5865F2"><path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/></svg>;
const Instagram_Icon = () => <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center"><div className="w-[16px] h-[16px] border-[2px] border-white rounded-[4px] flex items-center justify-center"><div className="w-[6px] h-[6px] bg-white rounded-full"></div></div></div>;
const Google_Icon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>;

// --- REUSABLE MINI-COMPONENTS ---
const ChatBubble = ({ text, delay, isUser }: { text: string, delay: number, isUser?: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.2, ease: "easeOut" }} className={`p-3 rounded-2xl max-w-[85%] text-[11px] shadow-md leading-relaxed ${isUser ? 'bg-[#2AABEE] text-white self-end rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/5 text-gray-200 self-start rounded-tl-sm'}`}>
    {text}
  </motion.div>
);

const GuideStep = ({ step, title, desc, delay }: { step: string, title: string, desc: string, delay: number }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.2, ease: "easeOut" }} className="flex gap-3 bg-[#1A1A1A] border border-white/5 p-3 rounded-xl shadow-md w-[90%] self-center mx-auto items-start">
    <div className="w-5 h-5 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{step}</div>
    <div className="flex flex-col">
      <span className="text-white font-bold mb-1 text-[11px]">{title}</span>
      <span className="text-gray-400 text-[9px] leading-relaxed">{desc}</span>
    </div>
  </motion.div>
);

const MarqueeRow = ({ items, reverse = false }: { items: string[], reverse?: boolean }) => (
  <div className="flex whitespace-nowrap overflow-hidden py-3">
    <motion.div className="flex gap-6" animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }}>
      {items.concat(items).map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
          {item}
        </div>
      ))}
    </motion.div>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  
  const [isMounted, setIsMounted] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [botLink, setBotLink] = useState("");
  
  const [activeModel, setActiveModel] = useState("gpt-5.2");
  const [activeChannel, setActiveChannel] = useState("telegram");
  const [selectedTier, setSelectedTier] = useState<"starter" | "pro" | "max" | null>(null); 
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const EXCHANGE_RATE = 83; 

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpEmail, setHelpEmail] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpStatus, setHelpStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true); 
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes("Asia/Calcutta") || tz.includes("Asia/Kolkata")) {
        setCurrency("INR");
        setCurrencySymbol("₹");
      }
    } catch (e) { console.log("Timezone error fallback"); }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const getCurrentPrice = (tier = selectedTier) => {
    if (!tier) return 0; 
    let basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    return currency === "INR" ? basePrice * EXCHANGE_RATE : basePrice;
  };

  const triggerRazorpayPayment = async () => {
    if (!selectedTier) { alert("Please select a plan."); return; }
    if (typeof window === "undefined" || !(window as any).Razorpay) { alert("Gateway loading..."); return; }
    
    const finalPrice = getCurrentPrice();
    setIsDeploying(true);
    
    try {
      const exactPaise = Math.round(finalPrice * 100);
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: exactPaise, currency, email: session?.user?.email, planName: selectedTier, selectedModel: activeModel }), 
      });
      const order = await response.json();
      if (order.error) throw new Error(order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency, 
        name: "ClawLink Premium",
        order_id: order.id,
        handler: async function () {
          const configRes = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, selectedModel: activeModel, selectedChannel: activeChannel, telegramToken, plan: selectedTier })
          });
          const configData = await configRes.json();
          if (configData.success && configData.botLink) {
            setBotLink(configData.botLink);
            setShowPricingPopup(false); 
          }
          setIsDeploying(false);
        },
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#ffffff" },
      };
      new (window as any).Razorpay(options).open();
    } catch (error) { setIsDeploying(false); alert("Payment Error"); }
  };

  const rows = [
    ["📅 Productivity & Meetings", "📄 Write contracts & NDAs", "📊 Create presentations", "🛒 Shopping & Research"],
    ["💼 Finance, Tax & Payroll", "💰 Do your taxes with AI", "🎯 prioritize leads", "🧾 Track expenses"],
    ["✉️ Email & Documents", "📨 Read & summarize emails", "📈 Track OKRs & KPIs", "📰 Monitor news"],
    ["⏰ Notify before a meeting", "🌍 Sync time zones", "📄 Generate invoices", "🔍 Compare specs"]
  ];

  if (!isMounted) return null;

  return (
    <div className="bg-[#1C1D21] min-h-screen text-[#EDEDED] font-sans overflow-x-hidden relative">
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px] pointer-events-none"></div>
      
      {/* 🚀 NAVBAR COMPONENT */}
      <Navbar session={session} status={status} onSupportClick={() => setIsSupportModalOpen(true)} />

      {/* 🚀 HERO SECTION */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111] p-6 rounded-2xl border border-white/5 shadow-2xl">
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <Zap className="w-10 h-10 text-orange-500 mb-4 bg-orange-500/10 p-2 rounded-full" />
              <h3 className="text-white font-bold mb-2">Omnichannel</h3>
              <p className="text-xs text-gray-400">Deploy across Telegram, WhatsApp, and Website.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <Shield className="w-10 h-10 text-blue-500 mb-4 bg-blue-500/10 p-2 rounded-full" />
              <h3 className="text-white font-bold mb-2">RAG Memory</h3>
              <p className="text-xs text-gray-400">Train AI on your business data & FAQs.</p>
            </div>
            {/* ... Other grid items can stay here or be extracted next ... */}
          </div>

          <div className="flex flex-col items-center text-center lg:pt-8 w-full">
            <h1 className="text-4xl md:text-[3.2rem] text-white mb-2 font-serif tracking-tight leading-tight">Deploy OpenClaw in 30 SEC</h1>
            <p className="text-gray-400 mb-12 max-w-lg">One-click deploy your own 24/7 active AI instance.</p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-10 w-full">
              <button onClick={() => !isTokenSaved && setActiveModel("gpt-5.2")} className={`bg-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl ${activeModel === 'gpt-5.2' ? 'ring-2 ring-blue-500' : ''}`}><OpenAI_Icon /><span className="text-[#10A37F] font-bold">gpt-5.2</span></button>
              <button onClick={() => !isTokenSaved && setActiveModel("claude")} className={`bg-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl ${activeModel === 'claude' ? 'ring-2 ring-blue-500' : ''}`}><Claude_Icon /><span className="text-[#D97757] font-bold">Claude</span></button>
              <button onClick={() => !isTokenSaved && setActiveModel("gemini")} className={`bg-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-xl ${activeModel === 'gemini' ? 'ring-2 ring-blue-500' : ''}`}><Gemini_Icon /><span className="text-[#648AF5] font-bold">Gemini</span></button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10 w-full">
              <button onClick={() => !isTokenSaved && setActiveChannel("telegram")} className={`bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-md min-w-[150px] ${activeChannel === 'telegram' ? 'ring-2 ring-blue-500' : ''}`}><Telegram_Icon /><span className="text-gray-800 font-bold">Telegram</span></button>
              <button onClick={() => !isTokenSaved && setActiveChannel("whatsapp")} className={`bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-md min-w-[150px] ${activeChannel === 'whatsapp' ? 'ring-2 ring-green-500' : ''}`}><WhatsApp_Icon /><span className="text-gray-800 font-bold">WhatsApp</span></button>
            </div>

            <div className="w-full max-w-[500px]">
              <AnimatePresence mode="wait">
                {botLink ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                    <h3 className="text-white font-bold mb-4 italic">ClawLink is LIVE!</h3>
                    <a href={botLink} target="_blank" className="bg-white text-black font-bold px-8 py-3 rounded-lg block">Open Live Bot</a>
                  </motion.div>
                ) : status === "unauthenticated" ? (
                  <button onClick={() => signIn("google")} className="w-full bg-white text-gray-800 py-5 rounded-[2rem] flex items-center justify-center gap-4 text-xl font-serif shadow-xl"><Google_Icon /> Login & Quick Deploy</button>
                ) : (
                  <button onClick={() => isTokenSaved ? setShowPricingPopup(true) : setIsTelegramModalOpen(true)} className={`w-full py-5 rounded-[2rem] text-xl font-bold uppercase tracking-widest ${isTokenSaved ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white text-black shadow-xl'}`}>
                    {isTokenSaved ? "DEPLOY AI AGENT" : `CONNECT ${activeChannel.toUpperCase()}`}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 COMPARISON COMPONENT */}
      <Comparison />

      {/* 🚀 USE CASES MARQUEE */}
      <section className="py-20 bg-[#161618] overflow-hidden">
        {rows.map((row, i) => <MarqueeRow key={i} items={row} reverse={i % 2 !== 0} />)}
      </section>

      {/* 🚀 FOOTER COMPONENT */}
      <Footer />

      {/* 🚀 MODALS (Can be moved in next step) */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-[#111] p-8 rounded-3xl w-full max-w-lg border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Link {activeChannel} API Token</h2>
              <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Enter API Token..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white mb-6" />
              <button onClick={() => { setIsTokenSaved(true); setIsTelegramModalOpen(false); }} className="w-full bg-white text-black font-bold py-4 rounded-xl">SAVE TOKEN</button>
            </div>
          </div>
        )}
        
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
            <div className="bg-[#111] p-10 rounded-[2rem] w-full max-w-2xl text-center">
              <h2 className="text-white text-3xl font-black mb-10">SELECT YOUR POWER PLAN</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div onClick={() => setSelectedTier("starter")} className={`p-6 rounded-2xl border cursor-pointer ${selectedTier === 'starter' ? 'border-white bg-white/5' : 'border-white/10'}`}>Starter<br/>{currencySymbol}{getCurrentPrice("starter")}</div>
                <div onClick={() => setSelectedTier("pro")} className={`p-6 rounded-2xl border cursor-pointer ${selectedTier === 'pro' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10'}`}>Pro<br/>{currencySymbol}{getCurrentPrice("pro")}</div>
                <div onClick={() => setSelectedTier("max")} className={`p-6 rounded-2xl border cursor-pointer ${selectedTier === 'max' ? 'border-orange-500 bg-orange-500/5' : 'border-white/10'}`}>Max<br/>{currencySymbol}{getCurrentPrice("max")}</div>
              </div>
              <button onClick={triggerRazorpayPayment} className="bg-white text-black font-black px-12 py-4 rounded-xl">DEPLOY & PAY {currencySymbol}{getCurrentPrice()}</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}