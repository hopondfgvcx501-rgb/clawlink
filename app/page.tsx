"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingUI from "../components/LandingUI";
import { useRouter } from "next/navigation";
import { Globe, Database, Mic, Zap, MessageSquare, Activity, Shield } from "lucide-react";

const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 9, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 } 
};
const MAX_PLAN_PRICE = 89; 

// --- INLINE ORIGINAL SVGS FOR PERFECT LOGO COLORS ---
const OpenAI_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#10A37F"><path d="M22.28 9.68a2.18 2.18 0 0 0 .06-.52 6.09 6.09 0 0 0-4.63-6 6.09 6.09 0 0 0-7.25 1.54A6.1 6.1 0 0 0 3 8.35a2.2 2.2 0 0 0-.05.5 6.1 6.1 0 0 0 4.63 6 6.1 6.1 0 0 0 7.25-1.54 6.1 6.1 0 0 0 7.45-3.63zm-4.7-3.9a4.8 4.8 0 0 1 3.2 4 4.7 4.7 0 0 1-1.34 3.7l-4.52-2.6v-5.2h.02A4.7 4.7 0 0 1 17.58 5.78zm-9.35-.9a4.8 4.8 0 0 1 5.3-.23l-2.26 3.9h-5.2l2.25-3.9a4.8 4.8 0 0 1-.09.23zm-3.23 6a4.8 4.8 0 0 1 .45-4.14l4.5 2.6v5.2l-4.5-2.6a4.8 4.8 0 0 1-.45-1.06zm1.75 6.1a4.8 4.8 0 0 1-3.2-4 4.7 4.7 0 0 1 1.34-3.7l4.52 2.6v5.2l-2.66-1.54-.01 1.44zm9.35.9a4.8 4.8 0 0 1-5.3.23l2.26-3.9h5.2l-2.25 3.9a4.8 4.8 0 0 1 .09-.23zm3.23-6a4.8 4.8 0 0 1-.45 4.14l-4.5-2.6v-5.2l4.5 2.6a4.8 4.8 0 0 1 .45 1.06zM12 15.6l-3.1-1.8v-3.6L12 8.4l3.1 1.8v3.6L12 15.6z"/></svg>;
const Claude_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#D97757"><path d="M12 2L13 9L20 7L15 12L22 15L15 16L18 22L12 18L6 22L9 16L2 15L9 12L4 7L11 9L12 2Z"/></svg>;
const Gemini_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#4E7CFF" d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"/></svg>;
const Discord_Icon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="#5865F2"><path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/></svg>;
const Instagram_Icon = () => <div className="w-[18px] h-[18px] rounded-md bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center"><div className="w-[12px] h-[12px] border-[1.5px] border-white rounded-[4px] flex items-center justify-center"><div className="w-[4px] h-[4px] bg-white rounded-full"></div></div></div>;
const Telegram_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#2AABEE"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.11.03-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.2.27.22.42.02.13.02.26 0 .38z"/></svg>;
const WhatsApp_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#25D366"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg>;
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

  const handleOpenPricing = (channel: string) => {
    setActiveChannel(channel);
    setShowPricingPopup(true);
  };

  const getCurrentPrice = (tier = selectedTier) => {
    let basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    return currency === "INR" ? basePrice * EXCHANGE_RATE : basePrice;
  };

  const triggerRazorpayPayment = async () => {
    if (typeof window === "undefined" || !(window as any).Razorpay) {
      alert("Payment gateway is loading. Please disable Adblocker if it doesn't open.");
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

  // 🚀 ACTION AREA INJECTED INTO LANDING UI
  const renderDynamicButtons = () => {
    if (botLink) {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-md bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md mx-auto mt-6">
          <h3 className="text-xl font-bold text-white mb-2">Your OpenClaw is Live! 🚀</h3>
          <p className="text-sm text-gray-400 mb-6">
            {activeChannel === "whatsapp" 
              ? "Your WhatsApp AI agent is now connected to the Meta Cloud." 
              : "Your Telegram webhook is fully connected and processing data."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a href={botLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center">
              {activeChannel === "whatsapp" ? "Open WhatsApp Bot" : "Open Telegram Bot"}
            </a>
            <button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto bg-[#1A1A1A] border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm">
              <Activity className="w-4 h-4"/> Access Dashboard
            </button>
          </div>
        </motion.div>
      );
    }

    if (status === "unauthenticated") {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="w-full flex flex-col items-center mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => signIn("google")} className="w-full max-w-md bg-white text-[#4A5568] py-4 rounded-xl flex items-center justify-center gap-3 text-[17px] font-medium shadow-xl">
            <Google_Icon /> login google & quick deploy
          </motion.button>
          <p className="mt-4 text-sm font-serif text-gray-300">connect {activeChannel} to continue . <span className="text-green-500 italic">limited cloud servers--only 7 left</span></p>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-3xl mx-auto space-y-6 mt-6">
        
        {/* USER PROFILE */}
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg max-w-md mx-auto">
          <div className="flex items-center gap-3">
             <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar"/>
             <div className="text-left">
               <p className="text-sm font-bold text-white">{session?.user?.name}</p>
               <p className="text-xs text-gray-500">{session?.user?.email}</p>
             </div>
          </div>
          <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors">Logout</button>
        </div>

        {/* 🚀 THE MODEL SELECTOR WITH LOGOS */}
        <div className="text-center pt-8 pb-4">
          <h3 className="text-white text-xl md:text-2xl font-serif tracking-tight mb-6">
            Choose a model to use as your default !
          </h3>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            <button onClick={() => setActiveModel("gpt-5.2")} className={`bg-white rounded-[2rem] px-5 py-2.5 flex items-center gap-2 shadow-xl transition-transform hover:scale-105 ${activeModel === 'gpt-5.2' ? 'ring-4 ring-blue-500' : ''}`}>
              <OpenAI_Icon />
              <span className="text-[#10A37F] font-bold text-sm">gpt-5.2</span>
            </button>

            <button onClick={() => setActiveModel("claude")} className={`bg-white rounded-[2rem] px-5 py-2 flex items-center gap-2 shadow-xl transition-transform hover:scale-105 ${activeModel === 'claude' ? 'ring-4 ring-blue-500' : ''}`}>
              <Claude_Icon />
              <div className="text-left leading-none flex items-center gap-1">
                <span className="text-[#D97757] font-bold text-sm">Claude</span>
                <span className="text-[#D97757] text-[8px] font-bold leading-tight pt-[1px]">Opus<br/>4.6</span>
              </div>
            </button>

            <button onClick={() => setActiveModel("gemini")} className={`bg-white rounded-[2rem] px-5 py-2.5 flex items-center gap-2 shadow-xl transition-transform hover:scale-105 ${activeModel === 'gemini' ? 'ring-4 ring-blue-500' : ''}`}>
              <Gemini_Icon />
              <span className="text-[#4E7CFF] font-bold text-sm">Gemini 3 flash</span>
            </button>

            <div className="bg-white rounded-[2rem] px-6 py-2.5 flex items-center shadow-xl opacity-80 cursor-not-allowed">
              <span className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-orange-500 to-pink-500">soon</span>
            </div>
          </div>
        </div>

        {/* 🚀 CHANNEL SELECTOR WITH LOGOS */}
        <h3 className="text-white text-xl md:text-2xl font-serif tracking-tight mb-6 text-center">Select a channel for sending messages !</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full max-w-2xl mx-auto">
          <button onClick={() => setActiveChannel("telegram")} className={`bg-white text-black py-3 px-4 flex items-center justify-center gap-2 transition-transform hover:scale-105 ${activeChannel === 'telegram' ? 'ring-4 ring-blue-500' : ''}`}>
            <Telegram_Icon />
            <span className="text-sm font-medium">Telegram</span>
          </button>
          <button onClick={() => setActiveChannel("whatsapp")} className={`bg-white text-black py-3 px-4 flex items-center justify-center gap-2 transition-transform hover:scale-105 ${activeChannel === 'whatsapp' ? 'ring-4 ring-green-500' : ''}`}>
            <WhatsApp_Icon />
            <span className="text-sm font-medium">whatsapp</span>
          </button>
          <button className="bg-white text-black py-2 px-4 flex flex-col items-center justify-center opacity-70 cursor-not-allowed">
            <span className="text-sm font-medium flex items-center gap-1"><Discord_Icon/> discord</span>
            <span className="text-[10px] text-gray-500">coming soon</span>
          </button>
          <button className="bg-white text-black py-2 px-4 flex flex-col items-center justify-center opacity-70 cursor-not-allowed">
            <span className="text-sm font-medium flex items-center gap-1"><Instagram_Icon/> instagram</span>
            <span className="text-[10px] text-gray-500">coming soon</span>
          </button>
        </div>

        {/* CONNECTION BUTTON */}
        <div className="max-w-2xl mx-auto pt-2">
          {!isTokenSaved ? (
            <button onClick={() => handleOpenIntegration(activeChannel)} className="w-full bg-white text-black font-medium py-4 rounded-xl text-[17px] shadow-xl uppercase">
              CONNECT {activeChannel} TO CONTINUE
            </button>
          ) : (
            <button onClick={() => handleOpenPricing(activeChannel)} className="w-full bg-white text-black font-medium py-4 rounded-xl text-[17px] shadow-xl uppercase transition-transform hover:scale-[1.02]">
              Deploy OpenClaw
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // 🚀 MARQUEE ARRAYS (5 Rows exactly as requested)
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
        {/* Duplicate for seamless loop */}
        {items.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );

  const themeColor = activeChannel === "telegram" ? "rgba(42, 171, 238, 0.15)" : "rgba(37, 211, 102, 0.15)";
  const borderColor = activeChannel === "telegram" ? "border-blue-500/30" : "border-green-500/30";

  if (!isMounted) return null;

  return (
    <div className="bg-[#18181A] min-h-screen relative text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🌇 CINEMATIC SUNSET GLOW */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* 🚀 NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-10 py-8 max-w-[1500px] mx-auto">
        <div className="text-xl font-black tracking-widest uppercase text-white font-serif">CLAWLINK.COM</div>
        <a href="#" className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors uppercase tracking-widest">
          <MessageSquare className="w-4 h-4"/> CONTACT SUPPORT
        </a>
      </nav>

      {/* 🚀 1. The Original Landing UI Wrapper */}
      <div className="relative z-10 w-full min-h-[80vh] flex flex-col items-center justify-center pb-20">
        <h1 className="text-4xl md:text-[3rem] text-white mb-2 font-serif tracking-tight leading-tight text-center">
          Deploy OpenClaw under 30 SECOND
        </h1>
        <p className="text-gray-300 text-sm mb-12 font-serif text-center">
          Avoid all technical complexity and one-click<br/>deploy your own 24/7 active OpenClaw instance under 30 second.
        </p>
        <LandingUI renderActionArea={renderDynamicButtons} isLocked={isTokenSaved || isDeploying} />
      </div>

      {/* 🚀 2. COMPARISON SECTION (Traditional vs ClawLink) */}
      <section className="py-24 bg-[#141414] relative z-0 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-4 font-serif">Comparison</h3>
            <h2 className="text-3xl md:text-5xl text-white tracking-tight font-serif">Traditional Method vs clawlink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 font-serif">
            {/* Left Side: Traditional */}
            <div className="w-full md:w-1/2">
              <ul className="space-y-5 text-gray-300 text-lg">
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Purchasing local virtual machine</div>
                  <span>15 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Creating SSH keys and storing securely</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to the server via SSH</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing Node.js and NPM</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing OpenClaw</div>
                  <span>7 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Setting up OpenClaw</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to AI provider</div>
                  <span>4 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Pairing with Telegram</div>
                  <span>4 min</span>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-gray-600 flex justify-between items-center text-xl text-white font-bold">
                <span>total</span>
                <span>60 MINUTES</span>
              </div>
            </div>

            {/* Right Side: Clawlink */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-center px-4">
              <h3 className="text-5xl font-bold text-white mb-2 font-serif tracking-tight">clawlink</h3>
              <div className="text-4xl font-bold text-white mb-4">&lt;30 sec</div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[320px] mx-auto font-sans font-medium">
                Pick a model, connect Telegram, deploy — done under 1 minute. Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned. Simple, secure and fast connection to your bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 5 ROW USE CASES (MARQUEE) */}
      <section className="py-20 relative z-10 bg-[#18181A] overflow-hidden border-b border-white/5">
        <div className="text-center mb-12 px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">unleash thousands of use cases</h2>
          <p className="text-orange-500 font-serif text-sm md:text-lg">your clawlink agent handle complex cognitive tasks instantly</p>
        </div>

        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-3 relative">
          <MarqueeRow items={row1} />
          <MarqueeRow items={row2} reverse />
          <MarqueeRow items={row3} />
          <MarqueeRow items={row4} reverse />
          <MarqueeRow items={row5} />
          
          {/* Gradient overlay for fade effect on edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#18181A] via-transparent to-[#18181A] pointer-events-none"></div>
        </div>
      </section>

      {/* 🚀 3. FOOTER WITH FEATURES */}
      <footer className="text-center pt-24 pb-12 bg-[#18181A] relative z-10">
        <div className="max-w-4xl mx-auto px-6 mb-16 text-left">
           <h4 className="text-white font-bold text-lg mb-6 border-b border-white/10 pb-2 font-serif">Enterprise Capabilities:</h4>
           <ul className="space-y-4 text-sm text-gray-400 font-medium">
             <li>👉 <strong className="text-gray-200">Omnichannel Presence</strong> (Telegram, WhatsApp, Web Widget).</li>
             <li>👉 <strong className="text-gray-200">Audio Intelligence</strong> (Whisper Voice Notes).</li>
             <li>👉 <strong className="text-gray-200">Enterprise RAG</strong> (Business Knowledge Injector).</li>
             <li>👉 <strong className="text-gray-200">Actionable AI</strong> (Function Calling & API Triggers).</li>
             <li>👉 <strong className="text-gray-200">Live CRM & Broadcast Hub.</strong></li>
           </ul>
        </div>

        <h2 className="text-3xl md:text-5xl text-white mb-6 font-serif">Deploy. Automate. Relax.</h2>
        <button className="bg-[#FFA87A] hover:bg-[#FF905A] text-black font-bold px-8 py-3 rounded text-sm transition-colors shadow-lg mb-16">
          learn more
        </button>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-serif border-t border-white/10 pt-6 px-10">
          <p>© 2026 ClawLink Inc. All rights reserved.</p>
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[10px] text-gray-400 font-sans">
            © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 font-sans">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Documentation</a>
          </div>
        </div>
      </footer>

      {/* 🚀 MODALS */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className={`bg-[#0A0A0B]/90 backdrop-blur-2xl border ${borderColor} rounded-3xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden relative shadow-2xl`}
              style={{ boxShadow: `0 0 100px ${themeColor}` }}
            >
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">✕</button>

              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative z-10">
                {activeChannel === "telegram" ? (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/20 flex items-center justify-center text-[#2AABEE] shadow-[0_0_30px_rgba(42,171,238,0.3)]">
                        <Telegram_Icon />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Connect Telegram</h2>
                    </div>
                    <ol className="space-y-5 text-sm text-gray-300 list-decimal pl-5 mb-10 font-medium leading-relaxed">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send the command <code className="bg-white/10 px-2 py-1 rounded text-white font-mono text-xs">/newbot</code>.</li>
                      <li>Provide a unique name and username for your agent.</li>
                      <li>Copy the HTTP API token provided by BotFather.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.3)]">
                        <WhatsApp_Icon />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Connect WhatsApp Cloud</h2>
                    </div>
                    <ol className="space-y-5 text-sm text-gray-300 list-decimal pl-5 mb-10 font-medium leading-relaxed">
                      <li>Navigate to the <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline font-bold transition-colors">Meta for Developers</a> console.</li>
                      <li>Create an App and add the <strong className="text-white">WhatsApp Product</strong>.</li>
                      <li>Generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Securely paste the token below to authenticate.</li>
                    </ol>
                  </>
                )}

                <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-inner">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    {activeChannel === "telegram" ? "HTTP API Token" : "Meta Access Token"}
                  </label>
                  <input 
                    type="password" 
                    value={telegramToken} 
                    onChange={(e) => setTelegramToken(e.target.value)} 
                    placeholder={activeChannel === "telegram" ? "1234567890:ABCdefGhI..." : "EAABwzL..."} 
                    className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none transition-all mb-6 font-mono text-white ${activeChannel === "telegram" ? "focus:border-blue-500 focus:shadow-[0_0_15px_rgba(42,171,238,0.2)]" : "focus:border-green-500 focus:shadow-[0_0_15px_rgba(37,211,102,0.2)]"}`} 
                  />
                  <button 
                    onClick={() => { 
                      if (activeChannel === "telegram") {
                        const match = telegramToken.match(/\d{8,10}:[a-zA-Z0-9_-]{35}/);
                        if (match) { 
                          setTelegramToken(match[0]); setIsTokenSaved(true); setIsTelegramModalOpen(false); 
                        } else alert("Invalid token structure. Please verify the BotFather token."); 
                      } else {
                        if (telegramToken.startsWith("EAA") && telegramToken.length > 20) {
                          setTelegramToken(telegramToken); setIsTokenSaved(true); setIsTelegramModalOpen(false);
                        } else alert("Invalid Meta Token structure. WhatsApp tokens typically begin with 'EAA'.");
                      }
                    }} 
                    className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-transform active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Authenticate & Proceed
                  </button>
                </div>
              </div>

              <div className="hidden md:flex md:w-1/2 bg-black/40 items-center justify-center p-10 border-l border-white/5 relative">
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${activeChannel === "telegram" ? "bg-blue-500/20" : "bg-green-500/20"}`}></div>

                 <div className="w-[300px] h-[600px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-[#0A0A0B] relative overflow-hidden shadow-2xl z-10 flex flex-col">
                    <div className="absolute top-0 inset-x-0 h-7 bg-[#1A1A1A] rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
                      <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                    </div>

                    <div className="bg-[#111]/80 backdrop-blur-md p-4 pt-10 flex items-center gap-3 border-b border-white/5 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg ${activeChannel === "telegram" ? "bg-[#2AABEE]" : "bg-[#25D366]"}`}>
                        {activeChannel === "telegram" ? <Telegram_Icon/> : <WhatsApp_Icon/>}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold flex items-center gap-1">
                          {activeChannel === "telegram" ? "BotFather" : "Meta Cloud"} 
                        </p>
                        <p className="text-gray-400 text-[10px] font-mono tracking-wider">{activeChannel === "telegram" ? "verified bot" : "system user"}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-5 flex-1 overflow-hidden text-[12px] font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-90 flex flex-col justify-end pb-8">
                       {activeChannel === "telegram" ? (
                         <>
                           <div className="bg-[#2AABEE] text-white p-3 rounded-2xl rounded-tr-sm w-fit ml-auto shadow-md">/newbot</div>
                           <div className="bg-[#1A1A1A] border border-white/5 text-gray-200 p-3 rounded-2xl rounded-tl-sm w-[85%] shadow-md">Alright, a new bot. Please choose a name.</div>
                           <div className="bg-[#2AABEE] text-white p-3 rounded-2xl rounded-tr-sm w-fit ml-auto shadow-md">ClawLink AI</div>
                           <div className="bg-[#1A1A1A] text-gray-200 p-4 rounded-2xl rounded-tl-sm w-[90%] shadow-lg border border-blue-500/20">
                             Done! <br/><br/>
                             <span className="text-gray-400">HTTP API Token:</span><br/>
                             <span className="text-blue-400 break-all select-all animate-pulse mt-2 block bg-black/50 p-2 rounded-lg border border-white/5">1234567890:AAH8...</span>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="bg-[#1A1A1A] border border-white/5 text-gray-200 p-3 rounded-2xl rounded-tl-sm w-[90%] shadow-md">Meta App Dashboard.</div>
                           <div className="bg-[#25D366] text-black font-medium p-3 rounded-2xl rounded-tr-sm w-fit ml-auto shadow-md">Generate Token</div>
                           <div className="bg-[#1A1A1A] text-gray-200 p-4 rounded-2xl rounded-tl-sm w-[95%] shadow-lg border border-green-500/20">
                             Success! <br/><br/>
                             <span className="text-gray-400">Permanent Token:</span><br/>
                             <span className="text-green-400 break-all select-all animate-pulse mt-2 block bg-black/50 p-2 rounded-lg border border-white/5">EAABwzL8x...</span>
                           </div>
                         </>
                       )}
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1.5 bg-[#333] rounded-full w-32 mx-auto z-20"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#0A0A0B] border border-white/10 p-8 md:p-10 rounded-[2rem] w-full max-w-4xl shadow-2xl relative text-center my-8">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white text-2xl">✕</button>}
              
              <div className="w-14 h-14 bg-[#111] border border-white/10 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-4 shadow-inner">✨</div>
              <h2 className="text-2xl md:text-3xl font-black mb-2 text-white tracking-tight uppercase">Deploy OpenClaw under 30 seconds.</h2>
              <p className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
                Avoid all technical complexity and one-click deploy your own 24/7 active instance immediately.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div onClick={() => !isDeploying && setSelectedTier("starter")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "starter" ? "bg-[#111] border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Starter</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("starter")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-6">Limited tokens specifically for {MODEL_DETAILS[activeModel]?.name}. Best for personal use.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex items-center justify-center ml-auto">
                    {selectedTier === "starter" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>

                <div onClick={() => !isDeploying && setSelectedTier("pro")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "pro" ? "bg-[#111] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
                  <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Pro</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("pro")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-6">Unlimited credits and Priority Routing for {MODEL_DETAILS[activeModel]?.name}.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center ml-auto">
                    {selectedTier === "pro" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                </div>

                <div onClick={() => !isDeploying && setSelectedTier("max")} className={`relative p-6 rounded-2xl border transition-all duration-200 ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "max" ? "bg-gradient-to-b from-[#221508] to-black border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)] scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Ultimate</div>
                  <h3 className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">Omni Max</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("max")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-6">Multi-AI access. Use GPT, Claude, and Gemini simultaneously with Lightning Speed.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center ml-auto">
                    {selectedTier === "max" && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                  </div>
                </div>
              </div>

              <button 
                onClick={triggerRazorpayPayment} 
                disabled={isDeploying}
                className="w-full max-w-sm mx-auto bg-white text-black hover:bg-gray-200 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {isDeploying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deploying... Please wait
                  </>
                ) : (
                  `Deploy OpenClaw ${currencySymbol}${getCurrentPrice()}`
                )}
              </button>
              <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secured by Razorpay API</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}