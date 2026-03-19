"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Globe, Database, Mic, Zap, MessageSquare, Activity, LogOut, Shield, ExternalLink, CheckCircle2, Copy, MessageCircle, X, Send, Mail } from "lucide-react";
import Image from "next/image";

// Pricing Configuration
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 1.2, pro: 19 }, 
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 }
};
const MAX_PLAN_PRICE = 89; 

// OmniAgent Nexus Pricing (Calculated for 3 Active Models)
const OMNI_PRICING = { monthly: 79, yearly: 790 };

// Provider Icons
const OpenAI_Icon = () => <Image src="/logos/openai.svg" alt="OpenAI" width={26} height={26} className="transform-gpu" />;
const Claude_Icon = () => <Image src="/logos/claude.svg" alt="Claude" width={26} height={26} className="transform-gpu" />;
const Gemini_Icon = () => <Image src="/logos/gemini.svg" alt="Gemini" width={26} height={26} className="transform-gpu" />;

// 🚀 Robust Inline SVG Icons
const Llama_Icon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 transform-gpu">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
    <line x1="4" y1="22" x2="4" y2="15"></line>
  </svg>
); 

const Omni_Icon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00BFFF] drop-shadow-[0_0_8px_rgba(0,198,255,0.4)] transform-gpu">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
    <line x1="12" y1="22" x2="12" y2="15.5"></line>
    <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
    <polyline points="2 15.5 12 8.5 22 15.5"></polyline>
    <line x1="12" y1="2" x2="12" y2="8.5"></line>
  </svg>
);

// Scaled Channel Icons
const Telegram_Icon = ({ size = 42 }: { size?: number }) => <Image src="/logos/Telegram.svg" alt="Telegram" width={size} height={size} className="transform-gpu" />;
const WhatsApp_Icon = ({ size = 42 }: { size?: number }) => <Image src="/logos/WhatsApp.svg" alt="WhatsApp" width={size} height={size} className="transform-gpu" />;
const Discord_Icon = () => <svg viewBox="0 0 24 24" width="38" height="38" fill="#5865F2" className="transform-gpu"><path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/></svg>;
const Instagram_Icon = () => <div className="w-[36px] h-[36px] rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transform-gpu"><div className="w-[24px] h-[24px] border-[2.5px] border-white rounded-[7px] flex items-center justify-center"><div className="w-[10px] h-[10px] bg-white rounded-full"></div></div></div>;
const Google_Icon = () => <svg viewBox="0 0 24 24" width="24" height="24" className="transform-gpu"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>;

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
  
  const [selectedTier, setSelectedTier] = useState<"starter" | "pro" | "max" | "monthly" | "yearly" | null>(null); 
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
      if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") {
        setCurrency("INR");
        setCurrencySymbol("₹");
      }
    } catch (e) {
      console.log("Timezone parsing failed. Defaulting to USD.");
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

  const handleSaveToken = () => {
    if (!telegramToken || telegramToken.trim() === "") {
      alert("Please enter a valid API Token or Webhook URL to continue.");
      return;
    }
    setIsTokenSaved(true); 
    setIsTelegramModalOpen(false);
  };

  const handleSendHelpRequest = () => {
    if (!helpEmail.trim() || !helpMessage.trim()) {
      alert("Please provide both your email address and message.");
      return;
    }
    setHelpStatus("sending");
    setTimeout(() => {
      setHelpStatus("sent");
      setTimeout(() => {
        setIsHelpOpen(false);
        setHelpStatus("idle");
        setHelpMessage("");
      }, 1500);
    }, 800);
  };

  const getCurrentPrice = (tier = selectedTier) => {
    if (!tier) return 0; 
    let basePrice = 0;
    
    if (activeModel === "omni") {
      basePrice = tier === "monthly" ? OMNI_PRICING.monthly : tier === "yearly" ? OMNI_PRICING.yearly : 89;
    } else {
      basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    }
    return currency === "INR" ? basePrice * EXCHANGE_RATE : basePrice;
  };

  const triggerRazorpayPayment = async () => {
    if (!selectedTier) {
      alert("Please select a subscription plan to proceed.");
      return;
    }

    if (typeof window === "undefined" || !(window as any).Razorpay) {
      alert("The payment gateway is still loading. Please temporarily disable your adblocker if the issue persists.");
      return;
    }
    const finalPrice = getCurrentPrice();
    setIsDeploying(true);
    
    try {
      const exactPaise = Math.round(finalPrice * 100);
      const selectedModelForDB = activeModel === "omni" ? "multi_model" : activeModel;

      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: exactPaise, 
          currency: currency,
          email: session?.user?.email || "user@clawlink.com",
          planName: selectedTier,
          selectedModel: selectedModelForDB
        }), 
      });
      const order = await response.json();

      if (order.error) {
        alert("Order Initialization Error: " + order.error);
        setIsDeploying(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency, 
        name: "ClawLink Premium",
        description: `Plan: ${selectedTier.toUpperCase()} | Model: ${activeModel === 'omni' ? 'OmniAgent Nexus (3x AI)' : MODEL_DETAILS[activeModel]?.name}`,
        order_id: order.id,
        handler: async function () {
          try {
            const configRes = await fetch("/api/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: session?.user?.email, selectedModel: selectedModelForDB, selectedChannel: activeChannel, telegramToken, plan: selectedTier })
            });
            const configData = await configRes.json();

            if (configData.success && configData.botLink) {
              setBotLink(configData.botLink);
              setShowPricingPopup(false); 
            } else {
              alert("Deployment failed: " + configData.error);
            }
          } catch (error) {
            alert("An unexpected error occurred during the deployment sequence.");
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
        alert("Payment was failed or cancelled by the user.");
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway initialization failed.");
      setIsDeploying(false);
    }
  };

  const openLiveBotHandler = () => {
    if (activeChannel === 'whatsapp') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.open("https://api.whatsapp.com/send", "_blank");
      } else {
        window.open("https://web.whatsapp.com", "_blank");
      }
    } else {
      window.open(botLink || "https://web.telegram.org", "_blank");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Token successfully copied to clipboard.");
  };

  const row1 = ["📅 Productivity & Meetings", "📄 Write contracts & NDAs", "📊 Create presentations", "🔄 Negotiate refunds", "🛒 Shopping & Research", "👥 Team & Monitoring"];
  const row2 = ["📅 Schedule meetings from chat", "💼 Finance, Tax & Payroll", "💰 Do your taxes with AI", "🎯 Screen & prioritize leads", "🧾 Track expenses", "👔 Write job descriptions"];
  const row3 = ["✉️ Email & Documents", "📨 Read & summarize emails", "🧮 Run payroll calculations", "🏷️ Find coupons automatically", "📈 Track OKRs & KPIs", "📰 Monitor news & smart alerts"];
  const row4 = ["⏰ Notify before a meeting", "🌍 Sync across time zones", "📄 Generate invoices instantly", "🔍 Compare product specs", "🕵️ Research competitors", "🚫 Filter cold outreach & spam"];
  const row5 = ["📅 Plan your week automatically", "📝 Take meeting notes", "📅 Productivity & Meetings", "🔍 Find best prices online", "📢 Draft social media posts", "📈 Sales, Marketing & Hiring"];

  // 🚀 GPU-Optimized Marquee Component
  const MarqueeRow = ({ items, reverse = false }: { items: string[], reverse?: boolean }) => (
    <div className="flex whitespace-nowrap overflow-hidden py-3">
      <motion.div 
        className="flex gap-6 will-change-transform" 
        style={{ transform: "translateZ(0)" }}
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} 
        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap transform-gpu">
            {item}
          </div>
        ))}
        {items.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap transform-gpu">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );

  const ChatBubble = ({ text, delay, isUser }: { text: string, delay: number, isUser?: boolean }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.2, ease: "easeOut" }} 
      className={`p-3 rounded-2xl max-w-[85%] text-[11px] shadow-md leading-relaxed transform-gpu ${isUser ? 'bg-[#2AABEE] text-white self-end rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/5 text-gray-200 self-start rounded-tl-sm'}`}
    >
      {text}
    </motion.div>
  );

  const GuideStep = ({ step, title, desc, delay }: { step: string, title: string, desc: string, delay: number }) => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay, duration: 0.2, ease: "easeOut" }} 
      className="flex gap-3 bg-[#1A1A1A] border border-white/5 p-3 rounded-xl shadow-md w-[90%] self-center mx-auto items-start transform-gpu"
    >
      <div className="w-5 h-5 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{step}</div>
      <div className="flex flex-col">
        <span className="text-white font-bold mb-1 text-[11px]">{title}</span>
        <span className="text-gray-400 text-[9px] leading-relaxed">{desc}</span>
      </div>
    </motion.div>
  );

  if (!isMounted) return null;

  return (
    <div className="bg-[#1C1D21] min-h-screen relative text-[#EDEDED] font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* Scrollbar Removal CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* 🚀 FIXED STATIC GLOWS (No Repaint Lag) */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px] pointer-events-none z-0" style={{ transform: 'translateZ(0)', willChange: 'transform' }}></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none z-0" style={{ transform: 'translateZ(0)', willChange: 'transform' }}></div>

      {/* Header Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-[1600px] mx-auto">
        <div className="text-xl md:text-2xl font-black tracking-widest uppercase text-white font-sans transform-gpu">CLAWLINK.COM</div>
        <div className="flex items-center gap-6">
          {status === "authenticated" && (
             <div className="hidden md:flex items-center gap-3">
               <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full border border-white/20 transform-gpu" alt="Avatar"/>
               <button onClick={() => signOut()} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors duration-200"><LogOut className="w-3 h-3"/> Logout</button>
             </div>
          )}
          <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 hover:text-white transition-colors duration-200 uppercase tracking-widest">
            <MessageSquare className="w-4 h-4"/> CONTACT SUPPORT
          </button>
        </div>
      </nav>

      {/* Main Deployment Dashboard Section */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          
          {/* Information Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl transform-gpu">
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 transform-gpu"><Globe className="w-5 h-5 text-blue-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Omnichannel Deployment</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Deploy your AI agent across Telegram, WhatsApp Cloud, and your own website with a single click.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4 transform-gpu"><Database className="w-5 h-5 text-green-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Enterprise RAG Memory</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 transform-gpu"><Mic className="w-5 h-5 text-purple-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Voice Note Intelligence</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 transform-gpu"><Zap className="w-5 h-5 text-orange-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Actionable AI Interceptor</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 transform-gpu"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Live CRM & Human Handoff</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Monitor AI conversations in real-time and instantly take over manually when a human touch is needed.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors duration-200">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 transform-gpu"><Activity className="w-5 h-5 text-yellow-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Marketing Broadcast Engine</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center lg:pt-8 w-full">
            <h1 className="text-3xl md:text-[3.2rem] text-white mb-2 font-serif tracking-tight leading-tight">
              Deploy OpenClaw under 30 SECOND
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-12 font-serif max-w-lg mx-auto leading-snug">
              Avoid all technical complexity and one-click<br/>deploy your own 24/7 active OpenClaw instance under 30 seconds.
            </p>

            <h3 className="text-white text-xl md:text-2xl mb-4 font-serif tracking-tight">Choose a model to use as your default</h3>
            
            {/* Model Selection Row (Ultra Fast GPU transitions) */}
            <div className="flex flex-nowrap justify-start lg:justify-center items-center gap-3 mb-10 w-full max-w-[1000px] px-4 py-2 overflow-x-auto no-scrollbar snap-x">
              
              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("gpt-5.2"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full h-[54px] px-5 flex items-center justify-center gap-2 shadow-xl transition-transform duration-200 ease-out hover:scale-105 snap-center transform-gpu ${activeModel === 'gpt-5.2' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' : ''} ${isTokenSaved && activeModel !== 'gpt-5.2' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <OpenAI_Icon />
                <span className="text-[#10A37F] font-bold text-sm md:text-[16px] tracking-tight">GPT-5.2</span>
              </button>

              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("claude"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full h-[54px] px-5 flex items-center justify-center gap-2 shadow-xl transition-transform duration-200 ease-out hover:scale-105 snap-center transform-gpu ${activeModel === 'claude' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' : ''} ${isTokenSaved && activeModel !== 'claude' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Claude_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#D97757] font-bold text-sm md:text-[16px] tracking-tight">Claude</span>
                  <span className="text-[#D97757] text-[10px] font-bold mt-0.5">Opus 4.6</span>
                </div>
              </button>

              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("gemini"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full h-[54px] px-5 flex items-center justify-center gap-2 shadow-xl transition-transform duration-200 ease-out hover:scale-105 snap-center transform-gpu ${activeModel === 'gemini' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' : ''} ${isTokenSaved && activeModel !== 'gemini' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Gemini_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#648AF5] font-bold text-sm md:text-[16px] tracking-tight">Gemini</span>
                  <span className="text-[#648AF5] text-[10px] font-bold mt-0.5">3 Flash</span>
                </div>
              </button>

              {/* OmniAgent Nexus Selection */}
              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("omni"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white border border-[#00BFFF]/50 rounded-full h-[54px] px-5 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,198,255,0.3)] transition-transform duration-200 ease-out hover:scale-105 snap-center transform-gpu ${activeModel === 'omni' ? 'ring-[3px] ring-[#00BFFF] shadow-[0_0_35px_rgba(0,198,255,0.8)] scale-105' : ''} ${isTokenSaved && activeModel !== 'omni' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Omni_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#0A192F] font-black text-sm md:text-[16px] tracking-wide">OmniAgent</span>
                  <span className="text-[#00BFFF] text-[10px] font-bold mt-0.5 tracking-widest uppercase">Nexus</span>
                </div>
              </button>

              {/* Llama 4 Maverick */}
              <div className="shrink-0 bg-white/90 rounded-full h-[54px] px-5 flex items-center justify-center gap-2 shadow-xl cursor-not-allowed opacity-60 snap-center transform-gpu">
                <Llama_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-gray-800 font-bold text-sm md:text-[16px] tracking-tight">Llama 4</span>
                  <span className="text-blue-600 text-[10px] font-bold mt-0.5 tracking-widest uppercase animate-pulse">Soon</span>
                </div>
              </div>

            </div>

            <h3 className="text-white text-xl md:text-2xl mb-4 font-serif tracking-tight">Select a channel for sending messages</h3>
            
            {/* Channel Selection Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 w-full max-w-4xl px-4">
              <button 
                onClick={() => !isTokenSaved && setActiveChannel("telegram")} 
                className={`bg-white rounded-xl h-[64px] flex items-center justify-center gap-3 shadow-md transition-transform duration-200 ease-out hover:scale-105 w-full transform-gpu ${activeChannel === 'telegram' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' : ''} ${isTokenSaved && activeChannel !== 'telegram' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Telegram_Icon size={42} />
                <span className="text-[16px] text-gray-800 font-bold tracking-tight">Telegram</span>
              </button>

              <button 
                onClick={() => !isTokenSaved && setActiveChannel("whatsapp")} 
                className={`bg-white rounded-xl h-[64px] flex items-center justify-center gap-3 shadow-md transition-transform duration-200 ease-out hover:scale-105 w-full transform-gpu ${activeChannel === 'whatsapp' ? 'ring-[3px] ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105' : ''} ${isTokenSaved && activeChannel !== 'whatsapp' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <WhatsApp_Icon size={42} />
                <span className="text-[16px] text-gray-800 font-bold tracking-tight">WhatsApp</span>
              </button>

              <button className={`bg-white rounded-xl h-[64px] flex items-center justify-center gap-3 shadow-md cursor-not-allowed w-full transform-gpu ${isTokenSaved ? 'opacity-20' : 'opacity-60'}`}>
                <Discord_Icon/>
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[16px] text-gray-800 font-bold tracking-tight">Discord</span>
                  <span className="text-[10px] text-blue-600 font-bold mt-0.5 tracking-widest uppercase">Soon</span>
                </div>
              </button>

              <button className={`bg-white rounded-xl h-[64px] flex items-center justify-center gap-3 shadow-md cursor-not-allowed w-full transform-gpu ${isTokenSaved ? 'opacity-20' : 'opacity-60'}`}>
                <Instagram_Icon/>
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[16px] text-gray-800 font-bold tracking-tight">Instagram</span>
                  <span className="text-[10px] text-blue-600 font-bold mt-0.5 tracking-widest uppercase">Soon</span>
                </div>
              </button>
            </div>

            <div className="w-full max-w-[600px] min-h-[120px] flex flex-col justify-center items-center">
              <AnimatePresence mode="wait">
                {botLink ? (
                  <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15, ease: "easeOut" }} className="w-full bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md transform-gpu">
                    <h3 className="text-xl font-bold text-white mb-4">Your Bot is Live! 🚀</h3>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <button onClick={openLiveBotHandler} className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm transition-transform duration-200 ease-out hover:scale-105 w-full sm:w-auto text-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform-gpu">
                        Open Live Bot
                      </button>
                      <button onClick={() => router.push('/dashboard')} className="bg-[#1A1A1A] border border-white/20 text-white font-bold px-8 py-4 rounded-xl text-sm transition-colors duration-200 hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2 transform-gpu">
                        <Activity className="w-4 h-4"/> Live Dashboard
                      </button>
                    </div>
                  </motion.div>
                ) : status === "unauthenticated" ? (
                  <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="w-full flex flex-col items-center transform-gpu">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.1 }} onClick={() => signIn("google")} className="w-full bg-white text-[#4B6B8A] py-4 rounded-[2rem] flex items-center justify-center gap-4 text-[22px] font-serif tracking-tight shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transform-gpu">
                      <Google_Icon /> Login via Google & Deploy
                    </motion.button>
                    <p className="mt-5 text-sm font-serif text-white tracking-wide">
                      Link your channels to proceed. <span className="text-[#34A853]">Limited cloud servers — only 7 left.</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4 transform-gpu">
                    <div className="w-full flex items-center justify-between bg-[#111] border border-white/10 p-3 px-4 rounded-[2rem] shadow-lg transform-gpu">
                      <div className="flex items-center gap-3">
                        <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar"/>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{session?.user?.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{session?.user?.email}</p>
                        </div>
                      </div>
                      <button onClick={() => signOut()} className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors duration-200 uppercase tracking-widest flex items-center gap-1">
                        <LogOut className="w-4 h-4"/> Logout
                      </button>
                    </div>

                    {!isTokenSaved ? (
                      <button onClick={() => handleOpenIntegration(activeChannel)} className="w-full bg-white text-black font-bold py-4 rounded-[2rem] text-[18px] shadow-xl uppercase tracking-widest transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transform-gpu">
                        CONNECT {activeChannel} TO CONTINUE
                      </button>
                    ) : (
                      <button onClick={() => handleOpenPricing(activeChannel)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-[2rem] text-[18px] shadow-[0_0_30px_rgba(37,99,235,0.4)] uppercase tracking-widest transition-transform duration-200 ease-out hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] flex justify-center items-center gap-3 transform-gpu">
                        <Zap className="w-5 h-5"/> DEPLOY YOUR AI AGENT NOW
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-[#1C1D21]">
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <h3 className="text-white text-2xl font-serif inline-block border-b-2 border-[#D95B30] pb-1 mb-2">Comparison</h3>
            <h2 className="text-4xl md:text-[3.5rem] text-white tracking-tight font-serif">Traditional Method vs ClawLink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-12 font-serif pb-8 relative pt-4">
            <div className="w-full md:w-[60%] border-t-4 border-white pt-6">
              <ul className="space-y-5 text-gray-300 text-lg md:text-xl">
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Purchasing local virtual machine</div>
                  <span>15 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Creating SSH keys and storing securely</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Connecting to the server via SSH</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Installing Node.js and NPM</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Installing OpenClaw</div>
                  <span>7 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Setting up OpenClaw</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Connecting to AI provider</div>
                  <span>4 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full transform-gpu"></div>Pairing with Telegram</div>
                  <span>4 min</span>
                </li>
              </ul>
              
              <div className="border-t-[3px] border-white mt-6 pt-2 flex justify-between items-center pr-10">
                <span className="text-xl">Total Time</span>
                <span className="text-xl">60 MINUTES</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-3 pr-10 text-right tracking-wide">
                If you're non-technical, multiply these times by 10 — you have to learn each step before doing.
              </p>
            </div>

            <div className="w-full md:w-[40%] flex flex-col items-center text-center pb-12 transform-gpu">
              <h3 className="text-[4rem] font-serif text-white leading-none">ClawLink</h3>
              <div className="text-[3.5rem] font-serif text-white mb-4 leading-none">&lt;30 sec</div>
              <p className="text-[12px] text-gray-300 leading-tight font-serif max-w-[320px]">
                Pick a model, connect your channel, and deploy — done in under 1 minute.<br/>
                Servers, SSH, and your OpenClaw Environment are pre-configured.<br/>
                Simple, secure, and instant connection to your bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Row Cases */}
      <section className="py-24 relative z-10 bg-[#161618] overflow-hidden border-b border-white/5 transform-gpu">
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl md:text-[4rem] font-black text-white tracking-tighter mb-4">Unleash Thousands of Use Cases</h2>
          <p className="text-[#D95B30] font-serif text-sm md:text-lg italic">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        </div>

        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 relative transform-gpu">
          <MarqueeRow items={row1} />
          <MarqueeRow items={row2} reverse />
          <MarqueeRow items={row3} />
          <MarqueeRow items={row4} reverse />
          <MarqueeRow items={row5} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161618] via-transparent to-[#161618] pointer-events-none transform-gpu"></div>
        </div>
      </section>

      {/* Footer Details */}
      <footer className="pt-24 pb-12 relative z-10 bg-[#141414] transform-gpu">
        <div className="max-w-6xl mx-auto px-10 text-left mb-24">
          <h2 className="text-4xl md:text-[3.5rem] text-white mb-8 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>Deploy. Automate. Relax.</h2>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#FFA87A] hover:bg-[#FF905A] text-black font-bold px-10 py-3 rounded text-lg transition-transform duration-200 ease-out shadow-lg font-serif hover:scale-105 transform-gpu">
            Learn More
          </button>
        </div>

        <div className="border-t border-white/10 px-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 font-serif relative z-10">
          <p>© 2026 ClawLink Inc. All rights reserved.</p>
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[11px] text-gray-500 font-sans">
            © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 font-serif">
            <a href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</a>
            <a href="/docs" className="hover:text-white transition-colors duration-200">Documentation</a>
          </div>
        </div>
      </footer>

      {/* Contact Support Modal Interface */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 transform-gpu">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-[#111] border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar transform-gpu"
            >
              <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors duration-200">
                <X className="w-5 h-5"/>
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 transform-gpu">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white font-serif">Contact Support</h2>
              </div>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">Need assistance with your deployment? We are here 24/7.</p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors duration-200 transform-gpu">
                   <div className="flex items-center gap-3 mb-2">
                     <Mail className="w-5 h-5 text-orange-500" />
                     <span className="text-white font-bold text-sm">Direct Email Access</span>
                   </div>
                   <a href="mailto:support@clawlink.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-mono break-all">support@clawlink.com</a>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors duration-200 transform-gpu">
                   <div className="flex items-center gap-3 mb-2">
                     <Shield className="w-5 h-5 text-green-500" />
                     <span className="text-white font-bold text-sm">Enterprise SLAs</span>
                   </div>
                   <p className="text-gray-400 text-xs leading-relaxed">Pro and Max tier users gain priority routing with guaranteed response times under 1 hour.</p>
                </div>
              </div>
              
              <button onClick={() => setIsSupportModalOpen(false)} className="w-full mt-8 bg-white text-black font-bold py-3.5 rounded-xl text-sm transition-transform duration-200 ease-out hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)] transform-gpu">
                CLOSE MENU
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Integration Setup Modal */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 transform-gpu">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15, ease: "easeOut" }} className={`bg-[#111] border border-white/10 rounded-3xl w-full max-w-[1000px] flex flex-col md:flex-row overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.8)] transform-gpu`}>
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors duration-200">✕</button>
              
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 overflow-y-auto max-h-[85vh] md:max-h-none custom-scrollbar">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10 transform-gpu">
                    {activeChannel === 'telegram' ? <Telegram_Icon size={28} /> : <WhatsApp_Icon size={28} />}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Connect {activeChannel === 'telegram' ? 'Telegram' : 'WhatsApp'}</h2>
                </div>
                
                {activeChannel === "telegram" ? (
                  <>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-6 leading-relaxed">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send the command <code className="bg-white/10 px-2 py-1 rounded text-white font-mono text-xs">/newbot</code> to begin setup.</li>
                      <li>Enter your custom <strong className="text-white">Name</strong> and <strong className="text-white">Username</strong>.</li>
                      <li>BotFather will generate an <strong className="text-white">HTTP API Access Token</strong>.</li>
                      <li>Copy that exact string and paste it securely below.</li>
                    </ol>
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 mb-8 bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20 border border-[#2AABEE]/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors duration-200 w-fit transform-gpu">
                      <ExternalLink className="w-3 h-3" /> Open @BotFather Directly
                    </a>

                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 shadow-inner transform-gpu">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">API Access Token</label>
                      <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Enter Verification Token..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none mb-6 text-white font-mono transition-colors" />
                      <button onClick={handleSaveToken} className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-gray-200 uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform duration-200 hover:scale-105 transform-gpu">
                        SAVE AND PROCEED
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ol className="space-y-3 text-[13px] text-gray-400 list-decimal pl-5 mb-6 leading-relaxed">
                      <li>Log in to the <strong className="text-white">Meta Developer Console</strong>.</li>
                      <li>Create a new <strong className="text-white">Business App</strong> and activate the <strong className="text-white">WhatsApp Module</strong>.</li>
                      <li>In <strong className="text-white">API Setup</strong>, register and verify your physical phone number.</li>
                      <li>Navigate to <strong className="text-white">System Users</strong> to generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Under <strong className="text-white">Configuration</strong>, click Edit to establish your Webhook URL.</li>
                      <li>Enter the precise <strong className="text-white">Callback URL</strong> and <strong className="text-white">Verify Token</strong> provided below.</li>
                      <li>Click Manage and subscribe exclusively to the <strong className="text-white">messages</strong> webhook events.</li>
                    </ol>

                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#25D366]/20 mb-6 shadow-[0_0_15px_rgba(37,211,102,0.05)] transform-gpu">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Webhook Callback URL</span>
                          <button onClick={() => copyToClipboard("https://clawlink-six.vercel.app/api/webhook/whatsapp")} className="text-gray-500 hover:text-white transition-colors duration-200"><Copy className="w-3 h-3"/></button>
                        </div>
                        <code className="block bg-black text-[#25D366] text-[10px] sm:text-xs p-2 rounded border border-white/5 select-all truncate">https://clawlink-six.vercel.app/api/webhook/whatsapp</code>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verify Token</span>
                          <button onClick={() => copyToClipboard("ClawLinkMeta2026")} className="text-gray-500 hover:text-white transition-colors duration-200"><Copy className="w-3 h-3"/></button>
                        </div>
                        <code className="block bg-black text-white text-xs p-2 rounded border border-white/5 select-all">ClawLinkMeta2026</code>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 shadow-inner transform-gpu">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Permanent API Token</label>
                      <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="EAABwzL..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366] mb-6 text-white font-mono transition-colors" />
                      
                      <button onClick={handleSaveToken} className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-gray-200 uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform duration-200 hover:scale-105 transform-gpu">
                        SAVE AND PROCEED
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:flex md:w-1/2 bg-black/40 items-center justify-center p-10 border-l border-white/5 relative transform-gpu">
                 <div className="w-[320px] h-[600px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-[#0A0A0B] flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transform-gpu">
                    <div className="absolute top-0 inset-x-0 h-7 bg-[#1A1A1A] rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
                      <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                    </div>
                    
                    <div className="bg-[#111]/90 backdrop-blur-md p-4 pt-10 flex items-center gap-3 border-b border-white/5 z-10 transform-gpu">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${activeChannel === 'telegram' ? 'bg-[#2AABEE]' : 'bg-[#25D366]'}`}>
                        {activeChannel === 'telegram' ? <Telegram_Icon size={22} /> : <WhatsApp_Icon size={22} />}
                      </div>
                      <div>
                        {activeChannel === 'telegram' ? (
                          <>
                            <p className="text-white text-sm font-bold flex items-center gap-1">BotFather <CheckCircle2 className="w-3 h-3 text-blue-400"/></p>
                            <p className="text-gray-400 text-[10px] font-mono tracking-wider">Verified System Bot</p>
                          </>
                        ) : (
                          <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity duration-200">
                            <p className="text-white text-sm font-bold flex items-center gap-1">Meta Developer <ExternalLink className="w-3 h-3 text-green-400"/></p>
                            <p className="text-gray-400 text-[10px] font-mono tracking-wider">API Configuration Module</p>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 pt-6 flex-1 flex flex-col justify-end space-y-3 opacity-95 text-[11px] font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] overflow-y-auto custom-scrollbar pr-1 transform-gpu">
                      {activeChannel === 'telegram' ? (
                        <>
                          <ChatBubble isUser text="/newbot" delay={0.1} />
                          <ChatBubble text="Alright, a new bot. How are we going to call it? Please choose a name." delay={0.2} />
                          <ChatBubble isUser text="ClawLink Support" delay={0.3} />
                          <ChatBubble text="Good. Now let's choose a username..." delay={0.4} />
                          <ChatBubble isUser text="ClawSupport_bot" delay={0.5} />
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.2, ease: "easeOut" }} className="bg-[#1A1A1A] border border-[#2AABEE]/30 p-3 rounded-2xl rounded-tl-sm text-gray-200 self-start max-w-[90%] shadow-[0_0_15px_rgba(42,171,238,0.15)] leading-relaxed transform-gpu">
                            Done! Congratulations on your new bot.<br/><br/>
                            <span className="text-gray-400">Use this token to access the HTTP API:</span><br/>
                            <span className="text-[#2AABEE] font-mono break-all mt-1 block font-bold">1234567890:AAH8ABCdefGhI...</span>
                          </motion.div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3 font-sans h-full justify-start pb-4 transform-gpu">
                           <GuideStep delay={0.1} step="1" title="Create App" desc="Select Business Type in Meta Developer Console." />
                           <GuideStep delay={0.2} step="2" title="Add Number" desc="Register your physical phone number in API Setup." />
                           <GuideStep delay={0.3} step="3" title="Generate Token" desc="Create a System User & acquire a Permanent Access Token." />
                           <GuideStep delay={0.4} step="4" title="Link Webhook" desc="Enter Webhook URL & Verify Token." />
                           <GuideStep delay={0.5} step="5" title="Subscribe" desc="Enable the 'messages' webhook subscription module." />
                           
                           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.2, ease: "easeOut" }} className="mt-4 bg-[#25D366]/10 border border-[#25D366]/30 p-3 rounded-xl text-center shadow-[0_0_15px_rgba(37,211,102,0.1)] mx-auto w-[90%] transform-gpu">
                             <span className="text-[#25D366] font-bold text-xs flex items-center justify-center gap-2"><Zap className="w-3 h-3"/> Infrastructure Linked</span>
                           </motion.div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1.5 bg-[#333] rounded-full w-32 mx-auto z-20"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Popup Flow */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 transform-gpu">
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.15, ease: "easeOut" }} className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[2rem] w-full max-w-4xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative max-h-[95vh] overflow-y-auto custom-scrollbar transform-gpu">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors duration-200">✕</button>}
              
              <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">
                {activeModel === 'omni' ? "OMNIAGENT ENTERPRISE PLANS" : "SELECT YOUR DEPLOYMENT PLAN"}
              </h2>
              <p className="text-gray-400 text-base mb-10 max-w-2xl mx-auto">
                {activeModel === 'omni' 
                  ? "Currently, the OmniAgent plan includes a 3x AI Fallback (GPT, Claude, Gemini) to guarantee 0% downtime. Llama 4 is launching soon. You will only be billed for the active 3 models." 
                  : "Select a subscription tier below to securely initialize and link your designated AI engine."}
              </p>
              
              {/* Dynamic Grid Layout */}
              {activeModel === "omni" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 text-left max-w-2xl mx-auto transform-gpu">
                  <div onClick={() => !isDeploying && setSelectedTier("monthly")} className={`relative p-8 rounded-2xl border transition-all duration-200 ease-out transform-gpu ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "monthly" ? "bg-[#1A1A1A] border-[#00BFFF] shadow-[0_0_30px_rgba(0,191,255,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"}`}>
                    <h3 className="text-[#00BFFF] font-bold uppercase text-xs mb-2 tracking-widest">Monthly Enterprise</h3>
                    <div className="text-4xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("monthly")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">3x Smart AI Fallback Matrix. Billed per calendar month.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("yearly")} className={`relative p-8 rounded-2xl border transition-all duration-200 ease-out transform-gpu ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "yearly" ? "bg-[#1A1A1A] border-[#0052D4] shadow-[0_0_30px_rgba(0,82,212,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0052D4] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">Save 16%</div>
                    <h3 className="text-[#0052D4] font-bold uppercase text-xs mb-2 tracking-widest">Yearly Enterprise</h3>
                    <div className="text-4xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("yearly")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Maximum value package for production scale operations.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 text-left transform-gpu">
                  <div onClick={() => !isDeploying && setSelectedTier("starter")} className={`relative p-6 rounded-2xl border transition-all duration-200 ease-out transform-gpu ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "starter" ? "bg-[#1A1A1A] border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"}`}>
                    <h3 className="text-gray-400 font-bold uppercase text-xs mb-2 tracking-widest">Starter</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("starter")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Entry level token allotment for private use.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("pro")} className={`relative p-6 rounded-2xl border transition-all duration-200 ease-out transform-gpu ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "pro" ? "bg-[#1A1A1A] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">Popular</div>
                    <h3 className="text-blue-400 font-bold uppercase text-xs mb-2 tracking-widest">Professional</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("pro")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Expanded usage capacities and standard priority routing.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("max")} className={`relative p-6 rounded-2xl border transition-all duration-200 ease-out transform-gpu ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "max" ? "bg-[#1A1A1A] border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]"}`}>
                    <h3 className="text-orange-400 font-bold uppercase text-xs mb-2 tracking-widest">Maximum</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("max")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Uncapped limits ensuring highest potential speeds.</p>
                  </div>
                </div>
              )}

              <button 
                onClick={triggerRazorpayPayment} 
                disabled={isDeploying || !selectedTier} 
                className={`w-full max-w-sm mx-auto font-black py-4 rounded-xl uppercase tracking-widest flex justify-center items-center gap-2 shadow-xl transition-transform duration-200 ease-out transform-gpu ${!selectedTier ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : activeModel === 'omni' ? 'bg-gradient-to-r from-[#0052D4] to-[#00BFFF] text-white hover:scale-105 hover:shadow-[0_0_25px_rgba(0,198,255,0.5)]' : 'bg-white text-black hover:bg-gray-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`}
              >
                {isDeploying ? "Deploying Infrastructure..." : !selectedTier ? "SELECT A TIER" : `INITIALIZE PAYMENT FOR ${currencySymbol}${getCurrentPrice()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Help */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end transform-gpu">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.9 }} 
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-[#111] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-2xl w-80 p-5 mb-4 overflow-hidden relative transform-gpu"
            >
              <button onClick={() => setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors duration-200">
                <X className="w-4 h-4" />
              </button>
              
              {helpStatus === "sent" ? (
                <div className="py-8 text-center flex flex-col items-center justify-center transform-gpu">
                  <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">Inquiry Submitted</h4>
                  <p className="text-xs text-gray-400">Our engineering support team will review this shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5 transform-gpu">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">ClawLink Operations</h4>
                      <p className="text-[10px] text-gray-400">Standard SLA applies based on tier.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 transform-gpu">
                    <input 
                      type="email" 
                      placeholder="Authorized Email Address" 
                      value={helpEmail}
                      onChange={(e) => setHelpEmail(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
                    />
                    <textarea 
                      placeholder="Detail your request..." 
                      rows={3}
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors duration-200 resize-none"
                    ></textarea>
                    
                    <button 
                      onClick={handleSendHelpRequest}
                      disabled={helpStatus === "sending"}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transform-gpu"
                    >
                      {helpStatus === "sending" ? "Transmitting..." : <><Send className="w-3 h-3" /> Transmit Request</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center hover:shadow-[0_0_35px_rgba(59,130,246,0.8)] transition-all duration-200 transform-gpu"
        >
          {isHelpOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.button>
      </div>

    </div>
  );
}