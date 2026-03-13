"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Globe, Database, Mic, Zap, MessageSquare, Activity, LogOut, Shield } from "lucide-react";

// --- CORE SYSTEM DATA ---
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 9, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 } 
};
const MAX_PLAN_PRICE = 89; 

// --- INLINE ORIGINAL SVGS FOR PERFECT BRAND COLORS ---
const OpenAI_Icon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#10A37F"><path d="M22.28 9.68a2.18 2.18 0 0 0 .06-.52 6.09 6.09 0 0 0-4.63-6 6.09 6.09 0 0 0-7.25 1.54A6.1 6.1 0 0 0 3 8.35a2.2 2.2 0 0 0-.05.5 6.1 6.1 0 0 0 4.63 6 6.1 6.1 0 0 0 7.25-1.54 6.1 6.1 0 0 0 7.45-3.63zm-4.7-3.9a4.8 4.8 0 0 1 3.2 4 4.7 4.7 0 0 1-1.34 3.7l-4.52-2.6v-5.2h.02A4.7 4.7 0 0 1 17.58 5.78zm-9.35-.9a4.8 4.8 0 0 1 5.3-.23l-2.26 3.9h-5.2l2.25-3.9a4.8 4.8 0 0 1-.09.23zm-3.23 6a4.8 4.8 0 0 1 .45-4.14l4.5 2.6v5.2l-4.5-2.6a4.8 4.8 0 0 1-.45-1.06zm1.75 6.1a4.8 4.8 0 0 1-3.2-4 4.7 4.7 0 0 1 1.34-3.7l4.52 2.6v5.2l-2.66-1.54-.01 1.44zm9.35.9a4.8 4.8 0 0 1-5.3.23l2.26-3.9h5.2l-2.25 3.9a4.8 4.8 0 0 1 .09-.23zm3.23-6a4.8 4.8 0 0 1-.45 4.14l-4.5-2.6v-5.2l4.5 2.6a4.8 4.8 0 0 1 .45 1.06zM12 15.6l-3.1-1.8v-3.6L12 8.4l3.1 1.8v3.6L12 15.6z"/></svg>;
const Claude_Icon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#D97757"><path d="M12 2L13 9L20 7L15 12L22 15L15 16L18 22L12 18L6 22L9 16L2 15L9 12L4 7L11 9L12 2Z"/></svg>;
const Gemini_Icon = () => <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4E7CFF" d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/></svg>;
const Discord_Icon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="#5865F2"><path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/></svg>;
const Instagram_Icon = () => <div className="w-[16px] h-[16px] rounded-md bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center"><div className="w-[10px] h-[10px] border-[1.5px] border-white rounded-[3px] flex items-center justify-center"><div className="w-[3px] h-[3px] bg-white rounded-full"></div></div></div>;
const Telegram_Icon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#2AABEE"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.11.03-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.2.27.22.42.02.13.02.26 0 .38z"/></svg>;
const WhatsApp_Icon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg>;
const Google_Icon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>;

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
  const [selectedTier, setSelectedTier] = useState<"starter" | "pro" | "max">("pro"); 
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const EXCHANGE_RATE = 83; 

  useEffect(() => {
    setIsMounted(true); 
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") {
        setCurrency("INR");
        setCurrencySymbol("₹");
      }
    } catch (e) {
      console.log("Timezone error fallback");
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleOpenIntegration = (channel: string) => {
    if(channel === 'discord' || channel === 'instagram') return;
    setActiveChannel(channel);
    setIsTelegramModalOpen(true);
  };

  const handleOpenPricing = () => {
    setShowPricingPopup(true);
  };

  const getCurrentPrice = (tier = selectedTier) => {
    let basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    return currency === "INR" ? basePrice * EXCHANGE_RATE : basePrice;
  };

  const triggerRazorpayPayment = async () => {
    if (typeof window === "undefined" || !(window as any).Razorpay) {
      alert("Payment gateway is loading. Please disable Adblocker.");
      return;
    }
    const finalPrice = getCurrentPrice();
    setIsDeploying(true);
    
    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalPrice * 100, currency: currency }), 
      });
      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency, 
        name: "ClawLink Premium",
        description: `Plan: ${selectedTier.toUpperCase()} | Model: ${selectedTier === 'max' ? 'ALL' : MODEL_DETAILS[activeModel]?.name}`,
        order_id: order.id,
        handler: async function () {
          try {
            const configRes = await fetch("/api/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: session?.user?.email, selectedModel: activeModel, selectedChannel: activeChannel, telegramToken, plan: selectedTier })
            });
            const configData = await configRes.json();

            if (configData.success && configData.botLink) {
              setBotLink(configData.botLink);
              setShowPricingPopup(false); 
            } else {
              alert("Deployment failed: " + configData.error);
            }
          } catch (error) {
            alert("An error occurred during deployment. Please check console.");
          } finally {
            setIsDeploying(false);
          }
        },
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#ffffff" },
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        setIsDeploying(false); 
        alert("Payment failed or cancelled.");
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  // 🚀 MARQUEE ARRAYS (Exactly 5 Rows for Cinematic Use Cases)
  const row1 = ["📅 Productivity & Meetings", "📄 Write contracts & NDAs", "📊 Create presentations", "🔄 Negotiate refunds", "🛒 Shopping & Research", "👥 Team & Monitoring"];
  const row2 = ["📅 Schedule meetings from chat", "💼 Finance, Tax & Payroll", "💰 Do your taxes with AI", "🎯 Screen & prioritize leads", "🧾 Track expenses", "👔 Write job descriptions"];
  const row3 = ["✉️ Email & Documents", "📨 Read & summarize emails", "🧮 Run payroll calculations", "🏷️ Find coupons automatically", "📈 Track OKRs & KPIs", "📰 Monitor news & smart alerts"];
  const row4 = ["⏰ Notify before a meeting", "🌍 Sync across time zones", "📄 Generate invoices instantly", "🔍 Compare product specs", "🕵️ Research competitors", "🚫 Filter cold outreach & spam"];
  const row5 = ["📅 Plan your week automatically", "📝 Take meeting notes", "📅 Productivity & Meetings", "🔍 Find best prices online", "📢 Draft social media posts", "📈 Sales, Marketing & Hiring"];

  const MarqueeRow = ({ items, reverse = false }: { items: string[], reverse?: boolean }) => (
    <div className="flex whitespace-nowrap overflow-hidden py-3">
      <motion.div 
        className="flex gap-6"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 40, repeat: Infinity }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
            {item}
          </div>
        ))}
        {/* Duplicate array for seamless infinite scroll loop */}
        {items.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <div className="bg-[#18181A] min-h-screen relative text-[#EDEDED] font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🌇 CINEMATIC SUNSET GLOW EFFECT */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* 🚀 TOP NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-[1600px] mx-auto">
        <div className="text-xl md:text-2xl font-black tracking-widest uppercase text-white">CLAWLINK.COM</div>
        <div className="flex items-center gap-6">
          {status === "authenticated" && (
             <div className="hidden md:flex items-center gap-3">
               <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar"/>
               <button onClick={() => signOut()} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"><LogOut className="w-3 h-3"/> Logout</button>
             </div>
          )}
          <a href="#" className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors uppercase tracking-widest">
            <MessageSquare className="w-4 h-4"/> CONTACT SUPPORT
          </a>
        </div>
      </nav>

      {/* 🚀 MAIN HERO SPLIT SECTION (Exactly matching Canva Layout) */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          
          {/* LEFT: Features Grid (Dark grey cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111] p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-2xl">
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4"><Globe className="w-5 h-5 text-blue-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Omnichannel Deployment</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Deploy your AI agent across Telegram, WhatsApp Cloud, and your own website with a single click.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><Database className="w-5 h-5 text-green-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Enterprise RAG Memory</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4"><Mic className="w-5 h-5 text-purple-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Voice Note Intelligence</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-orange-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Actionable AI Interceptor</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center mb-4"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Live CRM & Human Handoff</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Monitor AI conversations in real-time and instantly take over manually when a human touch is needed.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4"><Activity className="w-5 h-5 text-yellow-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Marketing Broadcast Engine</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost.</p>
            </div>
          </div>

          {/* RIGHT: Deployment Console */}
          <div className="flex flex-col items-center text-center lg:pt-8 xl:pt-12">
            <h1 className="text-4xl md:text-[3rem] text-white mb-4 font-serif tracking-tight leading-tight">
              Deploy OpenClaw under 30 SECONDS
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-12 font-serif max-w-md mx-auto leading-relaxed">
              Avoid all technical complexity and one-click deploy your own 24/7 active OpenClaw instance under 30 seconds.
            </p>

            {/* Model Selector (White pills, SVG Logos) */}
            <h3 className="text-white text-xl md:text-2xl mb-6 font-serif tracking-tight">Choose a model to use as your default !</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-12 w-full max-w-xl">
              <button onClick={() => setActiveModel("gpt-5.2")} className={`bg-white rounded-[2rem] px-6 py-3 flex items-center gap-3 shadow-xl transition-transform hover:scale-105 ${activeModel === 'gpt-5.2' ? 'ring-4 ring-blue-500' : ''}`}>
                <OpenAI_Icon />
                <span className="text-[#10A37F] font-bold text-[16px]">gpt-5.2</span>
              </button>

              <button onClick={() => setActiveModel("claude")} className={`bg-white rounded-[2rem] px-6 py-2.5 flex items-center gap-3 shadow-xl transition-transform hover:scale-105 ${activeModel === 'claude' ? 'ring-4 ring-blue-500' : ''}`}>
                <Claude_Icon />
                <div className="text-left leading-none flex flex-col justify-center">
                  <span className="text-[#D97757] font-bold text-[16px]">Claude</span>
                  <span className="text-[#D97757] text-[9px] font-bold">Opus 4.6</span>
                </div>
              </button>

              <button onClick={() => setActiveModel("gemini")} className={`bg-white rounded-[2rem] px-6 py-3 flex items-center gap-3 shadow-xl transition-transform hover:scale-105 ${activeModel === 'gemini' ? 'ring-4 ring-blue-500' : ''}`}>
                <Gemini_Icon />
                <span className="text-[#4E7CFF] font-bold text-[16px]">Gemini 3 flash</span>
              </button>

              <div className="bg-white rounded-[2rem] px-8 py-3 flex items-center shadow-xl opacity-80 cursor-not-allowed">
                <span className="font-black text-[16px] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-orange-500 to-pink-500">soon</span>
              </div>
            </div>

            {/* Channel Selector (White rectangles, SVG Logos) */}
            <h3 className="text-white text-xl md:text-2xl mb-6 font-serif tracking-tight">Select a channel for sending messages !</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 w-full max-w-2xl">
              <button onClick={() => setActiveChannel("telegram")} className={`bg-white text-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 ${activeChannel === 'telegram' ? 'ring-4 ring-blue-500' : ''}`}>
                <Telegram_Icon />
                <span className="text-[14px] font-bold text-gray-800">Telegram</span>
              </button>
              <button onClick={() => setActiveChannel("whatsapp")} className={`bg-white text-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 ${activeChannel === 'whatsapp' ? 'ring-4 ring-green-500' : ''}`}>
                <WhatsApp_Icon />
                <span className="text-[14px] font-bold text-gray-800">WhatsApp</span>
              </button>
              <button className="bg-white text-black py-2 px-4 rounded-xl flex flex-col items-center justify-center shadow-md opacity-70 cursor-not-allowed">
                <span className="text-[14px] font-bold text-gray-800 flex items-center gap-1"><Discord_Icon/> Discord</span>
                <span className="text-[10px] text-gray-500">coming soon</span>
              </button>
              <button className="bg-white text-black py-2 px-4 rounded-xl flex flex-col items-center justify-center shadow-md opacity-70 cursor-not-allowed">
                <span className="text-[14px] font-bold text-gray-800 flex items-center gap-1"><Instagram_Icon/> Instagram</span>
                <span className="text-[10px] text-gray-500">coming soon</span>
              </button>
            </div>

            {/* Auth / Deploy Action Button */}
            <div className="w-full max-w-xl">
              {botLink ? (
                <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
                  <h3 className="text-xl font-bold text-white mb-4">OpenClaw is Live! 🚀</h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a href={botLink} target="_blank" rel="noopener noreferrer" className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm transition-transform hover:scale-105 w-full sm:w-auto text-center">
                      Open Live Bot
                    </a>
                    <button onClick={() => router.push('/dashboard')} className="bg-[#1A1A1A] border border-white/20 text-white font-bold px-8 py-4 rounded-xl text-sm transition-colors hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4"/> Dashboard
                    </button>
                  </div>
                </div>
              ) : status === "unauthenticated" ? (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => signIn("google")} className="w-full bg-white text-[#4A5568] py-4 rounded-2xl flex items-center justify-center gap-3 text-[18px] font-bold shadow-xl">
                    <Google_Icon /> Login with Google & Quick Deploy
                  </motion.button>
                  <p className="mt-5 text-sm font-serif text-gray-400">Connect {activeChannel} to continue. <span className="text-green-500 italic">Limited cloud servers — only 7 left.</span></p>
                </>
              ) : !isTokenSaved ? (
                <button onClick={() => handleOpenIntegration(activeChannel)} className="w-full bg-white text-black font-bold py-4 rounded-2xl text-[18px] shadow-xl uppercase tracking-widest transition-transform hover:scale-[1.02]">
                  CONNECT {activeChannel} TO CONTINUE
                </button>
              ) : (
                <button onClick={() => handleOpenPricing(activeChannel)} className="w-full bg-white text-black font-bold py-4 rounded-2xl text-[18px] shadow-xl uppercase tracking-widest transition-transform hover:scale-[1.02] flex justify-center items-center gap-3">
                  <Zap className="w-5 h-5"/> Deploy OpenClaw
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 🚀 COMPARISON SECTION */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-[#141414]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block relative">
              <h3 className="text-white text-sm font-bold tracking-widest font-serif mb-2 uppercase">Comparison</h3>
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
            </div>
            <h2 className="text-3xl md:text-5xl text-white mt-4 tracking-tight font-serif">Traditional Method vs clawlink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 font-serif border-b border-white/20 pb-8">
            <div className="w-full md:w-[60%]">
              <ul className="space-y-5 text-gray-300 text-base md:text-lg">
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Purchasing local virtual machine</div><span>15 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Creating SSH keys and storing securely</div><span>10 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to the server via SSH</div><span>5 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing Node.js and NPM</div><span>5 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing OpenClaw</div><span>7 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Setting up OpenClaw</div><span>10 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to AI provider</div><span>4 min</span></li>
                <li className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Pairing with Telegram</div><span>4 min</span></li>
              </ul>
            </div>

            <div className="w-full md:w-[40%] flex flex-col justify-center items-center text-center">
              <h3 className="text-5xl md:text-6xl font-bold text-white mb-4 font-serif tracking-tight">clawlink</h3>
              <div className="text-4xl font-bold text-white mb-6">&lt;30 sec</div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto font-sans">
                Pick a model, connect Telegram, deploy — done under 1 minute. Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned. Simple, secure and fast connection to your bot.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-xl text-white font-serif mt-6">
            <span className="font-bold">total</span>
            <span className="font-bold tracking-widest">60 MINUTES</span>
          </div>
        </div>
      </section>

      {/* 🚀 5 ROW USE CASES (MARQUEE) */}
      <section className="py-24 relative z-10 bg-[#161618] overflow-hidden border-b border-white/5">
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">Unleash thousands of use cases</h2>
          <p className="text-orange-500 font-serif text-sm md:text-lg italic">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        </div>

        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 relative">
          <MarqueeRow items={row1} />
          <MarqueeRow items={row2} reverse />
          <MarqueeRow items={row3} />
          <MarqueeRow items={row4} reverse />
          <MarqueeRow items={row5} />
          
          {/* Gradient overlay for fade effect on edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#161618] via-transparent to-[#161618] pointer-events-none"></div>
        </div>
      </section>

      {/* 🚀 FOOTER */}
      <footer className="pt-24 pb-12 relative z-10 bg-[#141414]">
        <div className="max-w-6xl mx-auto px-10 text-left mb-24">
          <h2 className="text-4xl md:text-[3.5rem] text-white mb-8 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>Deploy. Automate. Relax.</h2>
          <button className="bg-[#FFA87A] hover:bg-[#FF905A] text-black font-bold px-10 py-4 rounded-lg text-sm transition-colors shadow-lg">
            Learn More
          </button>
        </div>

        <div className="border-t border-white/10 px-10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-serif">
          <p>© 2026 ClawLink Inc. All rights reserved.</p>
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[10px] text-gray-400 font-sans">
            © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 font-sans">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>

      {/* 🚀 MODALS (Intact Logic) */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`bg-[#111] border border-white/10 rounded-3xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden relative shadow-2xl`}>
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">✕</button>
              
              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/20 flex items-center justify-center shadow-lg">
                    {activeChannel === 'telegram' ? <Telegram_Icon /> : <WhatsApp_Icon />}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Connect {activeChannel === 'telegram' ? 'Telegram' : 'WhatsApp'}</h2>
                </div>
                
                {activeChannel === "telegram" ? (
                  <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10">
                    <li>Search for <strong className="text-white">@BotFather</strong> in Telegram.</li>
                    <li>Send the command <code className="bg-white/10 px-2 py-1 rounded text-white">/newbot</code>.</li>
                    <li>Copy the HTTP API token provided by BotFather.</li>
                  </ol>
                ) : (
                  <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10">
                    <li>Go to the <strong className="text-white">Meta for Developers</strong> console.</li>
                    <li>Generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                    <li>Paste the token below.</li>
                  </ol>
                )}

                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">API Access Token</label>
                  <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Enter Token..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none mb-6 text-white font-mono" />
                  <button onClick={() => { setIsTokenSaved(true); setIsTelegramModalOpen(false); }} className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-gray-200 uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]">Authenticate & Proceed</button>
                </div>
              </div>

              <div className="hidden md:flex md:w-1/2 bg-black/40 items-center justify-center p-10 border-l border-white/5 relative">
                 <div className="w-[300px] h-[500px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-[#0A0A0B] flex flex-col relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-7 bg-[#1A1A1A] rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
                      <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                    </div>
                    <div className="p-4 pt-10 flex-1 flex flex-col justify-end space-y-4 opacity-90 text-[12px] font-mono">
                      <div className="bg-[#2AABEE] text-white p-3 rounded-2xl rounded-tr-sm w-fit ml-auto shadow-md">/newbot</div>
                      <div className="bg-[#1A1A1A] border border-white/5 text-gray-200 p-3 rounded-2xl rounded-tl-sm w-[85%] shadow-md">System configured securely. Pending token validation...</div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[2rem] w-full max-w-4xl text-center shadow-2xl relative">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white">✕</button>}
              
              <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Deploy OpenClaw under 30 seconds.</h2>
              <p className="text-gray-400 text-base mb-10 max-w-2xl mx-auto">Avoid technical complexity. One-click deploy your autonomous agent immediately.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 text-left">
                <div onClick={() => !isDeploying && setSelectedTier("starter")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "starter" ? "bg-[#1A1A1A] border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105" : "bg-[#0A0A0B] border-white/10"}`}>
                  <h3 className="text-gray-400 font-bold uppercase text-xs mb-2 tracking-widest">Starter</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("starter")}</div>
                  <p className="text-sm text-gray-400">Limited tokens for personal use.</p>
                </div>
                <div onClick={() => !isDeploying && setSelectedTier("pro")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "pro" ? "bg-[#1A1A1A] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-105" : "bg-[#0A0A0B] border-white/10"}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">Popular</div>
                  <h3 className="text-blue-400 font-bold uppercase text-xs mb-2 tracking-widest">Pro</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("pro")}</div>
                  <p className="text-sm text-gray-400">Unlimited credits and Priority Routing.</p>
                </div>
                <div onClick={() => !isDeploying && setSelectedTier("max")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "max" ? "bg-[#1A1A1A] border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)] scale-105" : "bg-[#0A0A0B] border-white/10"}`}>
                  <h3 className="text-orange-400 font-bold uppercase text-xs mb-2 tracking-widest">Max</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("max")}</div>
                  <p className="text-sm text-gray-400">Multi-AI access with maximum speed.</p>
                </div>
              </div>

              <button onClick={triggerRazorpayPayment} disabled={isDeploying} className="w-full max-w-sm mx-auto bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest flex justify-center items-center gap-2 shadow-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                {isDeploying ? "Deploying Database..." : `Deploy OpenClaw ${currencySymbol}${getCurrentPrice()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}