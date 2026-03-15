"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Globe, Database, Mic, Zap, MessageSquare, Activity, LogOut, Shield, ExternalLink, CheckCircle2, Copy, MessageCircle, X, Send, Mail } from "lucide-react";
import Image from "next/image";

// --- PRICING DETAILS ---
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 1.2, pro: 19 }, 
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 }
};
const MAX_PLAN_PRICE = 89; 

// 🚀 OMNIAGENT NEXUS PRICING (Calculated for 3 Models: GPT + Claude + Gemini)
const OMNI_PRICING = { monthly: 79, yearly: 790 };

// --- ICONS FROM PUBLIC FOLDER ---
const OpenAI_Icon = () => <Image src="/logos/openai.svg" alt="OpenAI" width={24} height={24} />;
const Claude_Icon = () => <Image src="/logos/claude.svg" alt="Claude" width={24} height={24} />;
const Gemini_Icon = () => <Image src="/logos/gemini.svg" alt="Gemini" width={24} height={24} />;

// 🚀 Llama 4 Maverick & Omni Icons
const Llama_Icon = () => <img src="/logos/llama 4 maverick.svg" alt="Llama 4 Maverick" className="w-5 h-5 object-contain" />; 
const Omni_Icon = () => <img src="/logos/omniagentnexus.svg" alt="OmniAgent Nexus" className="w-6 h-6 object-contain drop-shadow-[0_0_5px_rgba(0,198,255,0.4)]" />;

// 🚀 Dynamic Sizes for Channel Icons
const Telegram_Icon = ({ size = 28 }: { size?: number }) => <Image src="/logos/Telegram.svg" alt="Telegram" width={size} height={size} />;
const WhatsApp_Icon = ({ size = 28 }: { size?: number }) => <Image src="/logos/WhatsApp.svg" alt="WhatsApp" width={size} height={size} />;

const Discord_Icon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="#5865F2"><path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4zm-11.7 11c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6zm6.8 0c-1.3 0-2.4-1.2-2.4-2.6s1.1-2.6 2.4-2.6 2.4 1.2 2.4 2.6-1.1 2.6-2.4 2.6z"/></svg>;
const Instagram_Icon = () => <div className="w-[22px] h-[22px] rounded-md bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center"><div className="w-[16px] h-[16px] border-[2px] border-white rounded-[4px] flex items-center justify-center"><div className="w-[6px] h-[6px] bg-white rounded-full"></div></div></div>;
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

  const handleSaveToken = () => {
    if (!telegramToken || telegramToken.trim() === "") {
      alert("Please enter a valid API Token/Webhook URL to continue.");
      return;
    }
    setIsTokenSaved(true); 
    setIsTelegramModalOpen(false);
  };

  const handleSendHelpRequest = () => {
    if (!helpEmail.trim() || !helpMessage.trim()) {
      alert("Please fill in your email and message.");
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
      alert("Please select a plan to proceed with payment.");
      return;
    }

    if (typeof window === "undefined" || !(window as any).Razorpay) {
      alert("Payment gateway is loading. Please disable Adblocker.");
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
        alert("Order Error: " + order.error);
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
            alert("An error occurred during deployment.");
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const row1 = ["📅 Productivity & Meetings", "📄 Write contracts & NDAs", "📊 Create presentations", "🔄 Negotiate refunds", "🛒 Shopping & Research", "👥 Team & Monitoring"];
  const row2 = ["📅 Schedule meetings from chat", "💼 Finance, Tax & Payroll", "💰 Do your taxes with AI", "🎯 Screen & prioritize leads", "🧾 Track expenses", "👔 Write job descriptions"];
  const row3 = ["✉️ Email & Documents", "📨 Read & summarize emails", "🧮 Run payroll calculations", "🏷️ Find coupons automatically", "📈 Track OKRs & KPIs", "📰 Monitor news & smart alerts"];
  const row4 = ["⏰ Notify before a meeting", "🌍 Sync across time zones", "📄 Generate invoices instantly", "🔍 Compare product specs", "🕵️ Research competitors", "🚫 Filter cold outreach & spam"];
  const row5 = ["📅 Plan your week automatically", "📝 Take meeting notes", "📅 Productivity & Meetings", "🔍 Find best prices online", "📢 Draft social media posts", "📈 Sales, Marketing & Hiring"];

  const MarqueeRow = ({ items, reverse = false }: { items: string[], reverse?: boolean }) => (
    <div className="flex whitespace-nowrap overflow-hidden py-3">
      <motion.div className="flex gap-6" animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
            {item}
          </div>
        ))}
        {items.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );

  const ChatBubble = ({ text, delay, isUser }: { text: string, delay: number, isUser?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.15, ease: "easeOut" }} className={`p-3 rounded-2xl max-w-[85%] text-[11px] shadow-md leading-relaxed ${isUser ? 'bg-[#2AABEE] text-white self-end rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/5 text-gray-200 self-start rounded-tl-sm'}`}>
      {text}
    </motion.div>
  );

  const GuideStep = ({ step, title, desc, delay }: { step: string, title: string, desc: string, delay: number }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.15, ease: "easeOut" }} className="flex gap-3 bg-[#1A1A1A] border border-white/5 p-3 rounded-xl shadow-md w-[90%] self-center mx-auto items-start">
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
      
      {/* 🚀 CSS for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* 🚀 TOP NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-[1600px] mx-auto">
        <div className="text-xl md:text-2xl font-black tracking-widest uppercase text-white font-sans">CLAWLINK.COM</div>
        <div className="flex items-center gap-6">
          {status === "authenticated" && (
             <div className="hidden md:flex items-center gap-3">
               <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar"/>
               <button onClick={() => signOut()} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors duration-100"><LogOut className="w-3 h-3"/> Logout</button>
             </div>
          )}
          <button onClick={() => setIsSupportModalOpen(true)} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 hover:text-white transition-colors duration-100 uppercase tracking-widest">
            <MessageSquare className="w-4 h-4"/> CONTACT SUPPORT
          </button>
        </div>
      </nav>

      {/* 🚀 MAIN HERO SPLIT SECTION */}
      <section className="relative z-10 max-w-[1600px] mx-auto px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          
          {/* LEFT: Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl">
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4"><Globe className="w-5 h-5 text-blue-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Omnichannel Deployment</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Deploy your AI agent across Telegram, WhatsApp Cloud, and your own website with a single click.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><Database className="w-5 h-5 text-green-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Enterprise RAG Memory</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4"><Mic className="w-5 h-5 text-purple-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Voice Note Intelligence</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-orange-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Actionable AI Interceptor</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center mb-4"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Live CRM & Human Handoff</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Monitor AI conversations in real-time and instantly take over manually when a human touch is needed.</p>
            </div>
            <div className="bg-[#18181A] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors duration-100">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4"><Activity className="w-5 h-5 text-yellow-500" /></div>
              <h3 className="text-white font-bold mb-2 text-sm">Marketing Broadcast Engine</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed">Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center lg:pt-8 w-full">
            <h1 className="text-3xl md:text-[3.2rem] text-white mb-2 font-serif tracking-tight leading-tight">
              Deploy OpenClaw under 30 SECOND
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-12 font-serif max-w-lg mx-auto leading-snug">
              Avoid all technical complexity and one-click<br/>deploy your own 24/7 active OpenClaw instance under 30 second.
            </p>

            <h3 className="text-white text-xl md:text-2xl mb-4 font-serif tracking-tight">Choose a model to use as your default !</h3>
            
            {/* 🚀 5 SUPER FAST & GLOWING BUTTONS */}
            <div className="flex flex-nowrap justify-start lg:justify-center items-center gap-2 md:gap-3 mb-10 w-full max-w-[900px] px-2 py-2 overflow-x-auto no-scrollbar snap-x">
              
              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("gpt-5.2"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-xl transition-all duration-100 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] snap-center ${activeModel === 'gpt-5.2' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : ''} ${isTokenSaved && activeModel !== 'gpt-5.2' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <OpenAI_Icon />
                <span className="text-[#10A37F] font-bold text-sm md:text-[15px] tracking-tight">GPT-5.2</span>
              </button>

              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("claude"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-xl transition-all duration-100 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] snap-center ${activeModel === 'claude' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : ''} ${isTokenSaved && activeModel !== 'claude' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Claude_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#D97757] font-bold text-sm md:text-[15px] tracking-tight">Claude</span>
                  <span className="text-[#D97757] text-[9px] md:text-[10px] font-bold mt-0.5">Opus 4.6</span>
                </div>
              </button>

              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("gemini"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-xl transition-all duration-100 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] snap-center ${activeModel === 'gemini' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : ''} ${isTokenSaved && activeModel !== 'gemini' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Gemini_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#648AF5] font-bold text-sm md:text-[15px] tracking-tight">Gemini</span>
                  <span className="text-[#648AF5] text-[9px] md:text-[10px] font-bold mt-0.5">3 Flash</span>
                </div>
              </button>

              {/* 🚀 THE OMNIAGENT NEXUS BUTTON (Black Text, Cyan Glow) */}
              <button 
                onClick={() => { if(!isTokenSaved) { setActiveModel("omni"); setSelectedTier(null); } }} 
                className={`shrink-0 bg-white border border-[#00BFFF]/50 rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,198,255,0.3)] transition-all duration-100 hover:scale-110 hover:shadow-[0_0_35px_rgba(0,198,255,0.8)] snap-center ${activeModel === 'omni' ? 'ring-[3px] ring-[#00BFFF] shadow-[0_0_35px_rgba(0,198,255,0.8)] scale-110' : ''} ${isTokenSaved && activeModel !== 'omni' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Omni_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-[#000000] font-black text-sm md:text-[15px] tracking-wide">OmniAgent</span>
                  <span className="text-[#00BFFF] text-[9px] md:text-[10px] font-bold mt-0.5 tracking-widest uppercase">Nexus</span>
                </div>
              </button>

              {/* 🚀 THE LLAMA 4 MAVERICK BUTTON (Disabled / Visual Only) */}
              <div className="shrink-0 bg-white/90 rounded-full px-4 py-2 flex items-center justify-center gap-2 shadow-xl cursor-not-allowed opacity-60 snap-center transition-all duration-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Llama_Icon />
                <div className="text-left flex flex-col justify-center leading-none">
                  <span className="text-gray-800 font-bold text-sm md:text-[15px] tracking-tight">Llama 4</span>
                  <span className="text-blue-600 text-[9px] md:text-[10px] font-bold mt-0.5 tracking-widest uppercase animate-pulse">Soon</span>
                </div>
              </div>

            </div>

            <h3 className="text-white text-xl md:text-2xl mb-4 font-serif tracking-tight">Select a channel for sending messages !</h3>
            <div className="flex flex-wrap justify-center items-center gap-3 mb-10 w-full max-w-2xl px-2">
              <button 
                onClick={() => !isTokenSaved && setActiveChannel("telegram")} 
                className={`bg-white rounded px-6 py-3 flex items-center justify-center gap-3 shadow-md transition-all duration-100 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] min-w-[140px] ${activeChannel === 'telegram' ? 'ring-[3px] ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' : ''} ${isTokenSaved && activeChannel !== 'telegram' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <Telegram_Icon size={28} />
                <span className="text-base text-gray-700 font-bold">Telegram</span>
              </button>
              <button 
                onClick={() => !isTokenSaved && setActiveChannel("whatsapp")} 
                className={`bg-white rounded px-6 py-3 flex items-center justify-center gap-3 shadow-md transition-all duration-100 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] min-w-[140px] ${activeChannel === 'whatsapp' ? 'ring-[3px] ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-110' : ''} ${isTokenSaved && activeChannel !== 'whatsapp' ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <WhatsApp_Icon size={28} />
                <span className="text-base text-gray-700 font-bold">WhatsApp</span>
              </button>
              <button className={`bg-white rounded px-4 py-2 flex items-center justify-center gap-3 shadow-md cursor-not-allowed min-w-[140px] ${isTokenSaved ? 'opacity-20' : ''}`}>
                <Discord_Icon/>
                <div className="text-left flex flex-col leading-tight">
                  <span className="text-base text-gray-700 font-bold">Discord</span>
                  <span className="text-[11px] text-gray-500">coming soon</span>
                </div>
              </button>
              <button className={`bg-white rounded px-4 py-2 flex items-center justify-center gap-3 shadow-md cursor-not-allowed min-w-[140px] ${isTokenSaved ? 'opacity-20' : ''}`}>
                <Instagram_Icon/>
                 <div className="text-left flex flex-col leading-tight">
                   <span className="text-base text-gray-700 font-bold">Instagram</span>
                   <span className="text-[11px] text-gray-500">coming soon</span>
                 </div>
              </button>
            </div>

            <div className="w-full max-w-[600px] min-h-[120px] flex flex-col justify-center items-center">
              <AnimatePresence mode="wait">
                {botLink ? (
                  <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.1, ease: "easeOut" }} className="w-full bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
                    <h3 className="text-xl font-bold text-white mb-4">OpenClaw is Live! 🚀</h3>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                      <a href={botLink} target="_blank" rel="noopener noreferrer" className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm transition-transform duration-100 hover:scale-110 w-full sm:w-auto text-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Open Live Bot
                      </a>
                      <button onClick={() => router.push('/dashboard')} className="bg-[#1A1A1A] border border-white/20 text-white font-bold px-8 py-4 rounded-xl text-sm transition-colors duration-100 hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2 hover:scale-105">
                        <Activity className="w-4 h-4"/> Dashboard
                      </button>
                    </div>
                  </motion.div>
                ) : status === "unauthenticated" ? (
                  <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: "easeOut" }} className="w-full flex flex-col items-center">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.05 }} onClick={() => signIn("google")} className="w-full bg-white text-[#4B6B8A] py-4 rounded-[2rem] flex items-center justify-center gap-4 text-[22px] font-serif tracking-tight shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                      <Google_Icon /> loogin google & quick deploy
                    </motion.button>
                    <p className="mt-5 text-sm font-serif text-white tracking-wide">
                      connect WhatsApp to continue . <span className="text-[#34A853]">limited cloud servers--only 7left</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                    <div className="w-full flex items-center justify-between bg-[#111] border border-white/10 p-3 px-4 rounded-[2rem] shadow-lg">
                      <div className="flex items-center gap-3">
                        <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar"/>
                        <div className="text-left">
                          <p className="text-sm font-bold text-white">{session?.user?.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{session?.user?.email}</p>
                        </div>
                      </div>
                      <button onClick={() => signOut()} className="text-xs font-bold text-gray-500 hover:text-red-400 transition-colors duration-100 uppercase tracking-widest flex items-center gap-1">
                        <LogOut className="w-4 h-4"/> Logout
                      </button>
                    </div>

                    {!isTokenSaved ? (
                      <button onClick={() => handleOpenIntegration(activeChannel)} className="w-full bg-white text-black font-bold py-4 rounded-[2rem] text-[18px] shadow-xl uppercase tracking-widest transition-transform duration-100 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        CONNECT {activeChannel} TO CONTINUE
                      </button>
                    ) : (
                      <button onClick={() => handleOpenPricing(activeChannel)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-[2rem] text-[18px] shadow-[0_0_30px_rgba(37,99,235,0.4)] uppercase tracking-widest transition-transform duration-100 hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] flex justify-center items-center gap-3">
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

      {/* 🚀 COMPARISON SECTION */}
      <section id="features" className="py-24 relative z-10 border-t border-white/5 bg-[#1C1D21]">
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <h3 className="text-white text-2xl font-serif inline-block border-b-2 border-[#D95B30] pb-1 mb-2">Comparison</h3>
            <h2 className="text-4xl md:text-[3.5rem] text-white tracking-tight font-serif">Traditional Method vs clawlink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-12 font-serif pb-8 relative pt-4">
            <div className="w-full md:w-[60%] border-t-4 border-white pt-6">
              <ul className="space-y-5 text-gray-300 text-lg md:text-xl">
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Purchasing local virtual machine</div>
                  <span>15 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Creating SSH keys and storing securely</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Connecting to the server via SSH</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Installing Node.js and NPM</div>
                  <span>5 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Installing OpenClaw</div>
                  <span>7 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Setting up OpenClaw</div>
                  <span>10 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Connecting to AI provider</div>
                  <span>4 min</span>
                </li>
                <li className="flex justify-between items-center pr-10">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-white rounded-full"></div>Pairing with Telegram</div>
                  <span>4 min</span>
                </li>
              </ul>
              
              <div className="border-t-[3px] border-white mt-6 pt-2 flex justify-between items-center pr-10">
                <span className="text-xl">total</span>
                <span className="text-xl">60 MINUTES</span>
              </div>
            </div>

            <div className="w-full md:w-[40%] flex flex-col items-center text-center pb-12">
              <h3 className="text-[4rem] font-serif text-white leading-none">clawlink</h3>
              <div className="text-[3.5rem] font-serif text-white mb-4 leading-none">&lt;30 sec</div>
              <p className="text-[12px] text-gray-300 leading-tight font-serif max-w-[320px]">
                Pick a model, connect Telegram, deploy — done under 1 minute.<br/>
                Servers, SSH and OpenClaw Environment are already set up,<br/>
                waiting to get assigned. Simple, secure and fast connection to your bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 5 ROW USE CASES (MARQUEE) */}
      <section className="py-24 relative z-10 bg-[#161618] overflow-hidden border-b border-white/5">
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl md:text-[4rem] font-black text-white tracking-tighter mb-4">unleash thousands of use cases</h2>
          <p className="text-[#D95B30] font-serif text-sm md:text-lg italic">your clawlink agent handle complex cognitive tasks instantly</p>
        </div>

        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 relative">
          <MarqueeRow items={row1} />
          <MarqueeRow items={row2} reverse />
          <MarqueeRow items={row3} />
          <MarqueeRow items={row4} reverse />
          <MarqueeRow items={row5} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161618] via-transparent to-[#161618] pointer-events-none"></div>
        </div>
      </section>

      {/* 🚀 FOOTER */}
      <footer className="pt-24 pb-12 relative z-10 bg-[#141414]">
        <div className="max-w-6xl mx-auto px-10 text-left mb-24">
          <h2 className="text-4xl md:text-[3.5rem] text-white mb-8 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>Deploy. Automate. Relax.</h2>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#FFA87A] hover:bg-[#FF905A] text-black font-bold px-10 py-3 rounded text-lg transition-colors duration-100 shadow-lg font-serif hover:scale-105">
            learn more
          </button>
        </div>

        <div className="border-t border-white/10 px-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 font-serif relative z-10">
          <p>© 2026 ClawLink Inc. All rights reserved.</p>
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[11px] text-gray-500 font-sans">
            © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 font-serif">
            <a href="/privacy" className="hover:text-white transition-colors duration-100">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors duration-100">Terms of Service</a>
            <a href="/docs" className="hover:text-white transition-colors duration-100">Documentation</a>
          </div>
        </div>
      </footer>

      {/* 🚀 FAST IN-PAGE CONTACT SUPPORT MODAL */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="bg-[#111] border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setIsSupportModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors duration-100">
                <X className="w-5 h-5"/>
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white font-serif">Contact Support</h2>
              </div>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">Need help with your OpenClaw instance? We're here for you 24/7.</p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors duration-100">
                   <div className="flex items-center gap-3 mb-2">
                     <Mail className="w-5 h-5 text-orange-500" />
                     <span className="text-white font-bold text-sm">Direct Email</span>
                   </div>
                   <a href="mailto:support@clawlink.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-100 text-sm font-mono break-all">support@clawlink.com</a>
                </div>

                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors duration-100">
                   <div className="flex items-center gap-3 mb-2">
                     <Shield className="w-5 h-5 text-green-500" />
                     <span className="text-white font-bold text-sm">Enterprise SLAs</span>
                   </div>
                   <p className="text-gray-400 text-xs leading-relaxed">Pro & Max tier customers receive priority routing with &lt;1hr response times guaranteed by our core team.</p>
                </div>
              </div>
              
              <button onClick={() => setIsSupportModalOpen(false)} className="w-full mt-8 bg-white text-black font-bold py-3.5 rounded-xl text-sm transition-transform duration-100 hover:scale-[1.05] shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 TELEGRAM / WHATSAPP INTEGRATION MODAL */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.1, ease: "easeOut" }} className={`bg-[#111] border border-white/10 rounded-3xl w-full max-w-[1000px] flex flex-col md:flex-row overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.8)]`}>
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all duration-100">✕</button>
              
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-10 overflow-y-auto max-h-[85vh] md:max-h-none custom-scrollbar">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10">
                    {activeChannel === 'telegram' ? <Telegram_Icon /> : <WhatsApp_Icon />}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Connect {activeChannel === 'telegram' ? 'Telegram' : 'WhatsApp'}</h2>
                </div>
                
                {activeChannel === "telegram" ? (
                  <>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-6 leading-relaxed">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send the command <code className="bg-white/10 px-2 py-1 rounded text-white font-mono text-xs">/newbot</code> to start.</li>
                      <li>Enter a custom <strong className="text-white">Name</strong> and <strong className="text-white">Username</strong>.</li>
                      <li>BotFather will generate an <strong className="text-white">HTTP API Access Token</strong>.</li>
                      <li>Copy that exact token and paste it securely below.</li>
                    </ol>
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 mb-8 bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20 border border-[#2AABEE]/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors duration-100 w-fit">
                      <ExternalLink className="w-3 h-3" /> Open @BotFather Directly
                    </a>

                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 shadow-inner">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">API Access Token</label>
                      <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Enter Token..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none mb-6 text-white font-mono" />
                      <button onClick={handleSaveToken} className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-gray-200 uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform duration-100 hover:scale-[1.05]">
                        SAVE AND CONTINUE
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ol className="space-y-3 text-[13px] text-gray-400 list-decimal pl-5 mb-6 leading-relaxed">
                      <li>Go to <strong className="text-white">Meta Developer Console</strong>.</li>
                      <li>Create a <strong className="text-white">Business App</strong> and add the <strong className="text-white">WhatsApp Product</strong>.</li>
                      <li>In <strong className="text-white">API Setup</strong>, add your real phone number and verify it.</li>
                      <li>Go to <strong className="text-white">System Users</strong>, generate a <strong className="text-white">Permanent Token</strong>.</li>
                      <li>Go to <strong className="text-white">Configuration</strong>, click Edit to set your Webhook.</li>
                      <li>Paste the exact <strong className="text-white">Callback URL</strong> and <strong className="text-white">Verify Token</strong> below.</li>
                      <li>Click Manage and Subscribe to the <strong className="text-white">messages</strong> webhook field.</li>
                    </ol>

                    <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#25D366]/20 mb-6 shadow-[0_0_15px_rgba(37,211,102,0.05)]">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Webhook Callback URL</span>
                          <button onClick={() => copyToClipboard("https://clawlink-six.vercel.app/api/webhook/whatsapp")} className="text-gray-500 hover:text-white transition-colors duration-100"><Copy className="w-3 h-3"/></button>
                        </div>
                        <code className="block bg-black text-[#25D366] text-[10px] sm:text-xs p-2 rounded border border-white/5 select-all truncate">https://clawlink-six.vercel.app/api/webhook/whatsapp</code>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verify Token</span>
                          <button onClick={() => copyToClipboard("ClawLinkMeta2026")} className="text-gray-500 hover:text-white transition-colors duration-100"><Copy className="w-3 h-3"/></button>
                        </div>
                        <code className="block bg-black text-white text-xs p-2 rounded border border-white/5 select-all">ClawLinkMeta2026</code>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 shadow-inner">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Permanent API Token</label>
                      <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="EAABwzL..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366] mb-6 text-white font-mono transition-colors" />
                      
                      <button onClick={handleSaveToken} className="w-full bg-white text-black font-bold py-4 rounded-xl text-sm hover:bg-gray-200 uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform duration-100 hover:scale-[1.05]">
                        SAVE AND CONTINUE
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:flex md:w-1/2 bg-black/40 items-center justify-center p-10 border-l border-white/5 relative">
                 <div className="w-[320px] h-[600px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-[#0A0A0B] flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-7 bg-[#1A1A1A] rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
                      <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                    </div>
                    
                    <div className="bg-[#111]/90 backdrop-blur-md p-4 pt-10 flex items-center gap-3 border-b border-white/5 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${activeChannel === 'telegram' ? 'bg-[#2AABEE]' : 'bg-[#25D366]'}`}>
                        {activeChannel === 'telegram' ? <Telegram_Icon /> : <WhatsApp_Icon />}
                      </div>
                      <div>
                        {activeChannel === 'telegram' ? (
                          <>
                            <p className="text-white text-sm font-bold flex items-center gap-1">BotFather <CheckCircle2 className="w-3 h-3 text-blue-400"/></p>
                            <p className="text-gray-400 text-[10px] font-mono tracking-wider">verified bot</p>
                          </>
                        ) : (
                          <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity duration-100">
                            <p className="text-white text-sm font-bold flex items-center gap-1">Meta Developer <ExternalLink className="w-3 h-3 text-green-400"/></p>
                            <p className="text-gray-400 text-[10px] font-mono tracking-wider">API Configuration</p>
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 pt-6 flex-1 flex flex-col justify-end space-y-3 opacity-95 text-[11px] font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] overflow-y-auto custom-scrollbar pr-1">
                      {activeChannel === 'telegram' ? (
                        <>
                          <ChatBubble isUser text="/newbot" delay={0.1} />
                          <ChatBubble text="Alright, a new bot. How are we going to call it? Please choose a name." delay={0.3} />
                          <ChatBubble isUser text="ClawLink Support" delay={0.5} />
                          <ChatBubble text="Good. Now let's choose a username..." delay={0.7} />
                          <ChatBubble isUser text="ClawSupport_bot" delay={0.9} />
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.15, ease: "easeOut" }} className="bg-[#1A1A1A] border border-[#2AABEE]/30 p-3 rounded-2xl rounded-tl-sm text-gray-200 self-start max-w-[90%] shadow-[0_0_15px_rgba(42,171,238,0.15)] leading-relaxed">
                            Done! Congratulations on your new bot.<br/><br/>
                            <span className="text-gray-400">Use this token to access the HTTP API:</span><br/>
                            <span className="text-[#2AABEE] font-mono break-all mt-1 block font-bold">1234567890:AAH8ABCdefGhI...</span>
                          </motion.div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3 font-sans h-full justify-start pb-4">
                           <GuideStep delay={0.1} step="1" title="Create App" desc="Select Business type in Meta Developer Console." />
                           <GuideStep delay={0.3} step="2" title="Add Number" desc="Add & verify your real phone number in API Setup." />
                           <GuideStep delay={0.5} step="3" title="Generate Token" desc="Create a System User & get a Permanent Access Token." />
                           <GuideStep delay={0.7} step="4" title="Link Webhook" desc="Paste Webhook URL & Verify Token." />
                           <GuideStep delay={0.9} step="5" title="Subscribe" desc="Subscribe to the 'messages' webhook field." />
                           
                           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, duration: 0.15, ease: "easeOut" }} className="mt-4 bg-[#25D366]/10 border border-[#25D366]/30 p-3 rounded-xl text-center shadow-[0_0_15px_rgba(37,211,102,0.1)] mx-auto w-[90%]">
                             <span className="text-[#25D366] font-bold text-xs flex items-center justify-center gap-2"><Zap className="w-3 h-3"/> Dashboard Connected</span>
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

      {/* 🚀 DYNAMIC PRICING / PLAN POPUP */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.1, ease: "easeOut" }} className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-[2rem] w-full max-w-4xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative max-h-[95vh] overflow-y-auto custom-scrollbar">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors duration-100">✕</button>}
              
              <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">
                {activeModel === 'omni' ? "OMNIAGENT ENTERPRISE PLANS" : "CHOOSE PLAN AND LINK AI AGENT"}
              </h2>
              <p className="text-gray-400 text-base mb-10 max-w-2xl mx-auto">
                {/* 🚀 TEXT CLEARLY EXPLAINS LLAMA 4 PRICING LOGIC */}
                {activeModel === 'omni' 
                  ? "Abhi 3 models (GPT, Claude, Gemini) par fallback chalega, Llama 4 isme aane wala hai (Soon). Isliye Llama ka koi charge nahi kat raha hai." 
                  : "Select a subscription tier to activate your AI engine and link it to your chosen channel."}
              </p>
              
              {/* 🚀 CONDITIONAL PRICING GRID */}
              {activeModel === "omni" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10 text-left max-w-2xl mx-auto">
                  <div onClick={() => !isDeploying && setSelectedTier("monthly")} className={`relative p-8 rounded-2xl border transition-all duration-100 ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "monthly" ? "bg-[#1A1A1A] border-[#00BFFF] shadow-[0_0_30px_rgba(0,191,255,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"}`}>
                    <h3 className="text-[#00BFFF] font-bold uppercase text-xs mb-2 tracking-widest">Monthly Enterprise</h3>
                    <div className="text-4xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("monthly")}</div>
                    {/* 🚀 TEXT RE-CONFIRMS 3x FALLBACK */}
                    <p className="text-sm text-gray-400 leading-relaxed">3x AI Fallback Engine. Billed monthly.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("yearly")} className={`relative p-8 rounded-2xl border transition-all duration-100 ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "yearly" ? "bg-[#1A1A1A] border-[#0052D4] shadow-[0_0_30px_rgba(0,82,212,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0052D4] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">Save 16%</div>
                    <h3 className="text-[#0052D4] font-bold uppercase text-xs mb-2 tracking-widest">Yearly Enterprise</h3>
                    <div className="text-4xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("yearly")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Best value for large scale operations. Billed yearly.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 text-left">
                  <div onClick={() => !isDeploying && setSelectedTier("starter")} className={`relative p-6 rounded-2xl border transition-all duration-100 ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "starter" ? "bg-[#1A1A1A] border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"}`}>
                    <h3 className="text-gray-400 font-bold uppercase text-xs mb-2 tracking-widest">Starter</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("starter")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Limited tokens for personal use.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("pro")} className={`relative p-6 rounded-2xl border transition-all duration-100 ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "pro" ? "bg-[#1A1A1A] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">Popular</div>
                    <h3 className="text-blue-400 font-bold uppercase text-xs mb-2 tracking-widest">Pro</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("pro")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Unlimited credits and Priority Routing.</p>
                  </div>
                  <div onClick={() => !isDeploying && setSelectedTier("max")} className={`relative p-6 rounded-2xl border transition-all duration-100 ${!isDeploying ? 'cursor-pointer hover:scale-105' : ''} ${selectedTier === "max" ? "bg-[#1A1A1A] border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)] scale-105" : "bg-[#0A0A0B] border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]"}`}>
                    <h3 className="text-orange-400 font-bold uppercase text-xs mb-2 tracking-widest">Max</h3>
                    <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("max")}</div>
                    <p className="text-sm text-gray-400 leading-relaxed">Multi-AI access with maximum speed.</p>
                  </div>
                </div>
              )}

              <button 
                onClick={triggerRazorpayPayment} 
                disabled={isDeploying || !selectedTier} 
                className={`w-full max-w-sm mx-auto font-black py-4 rounded-xl uppercase tracking-widest flex justify-center items-center gap-2 shadow-xl transition-all duration-100 ${!selectedTier ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : activeModel === 'omni' ? 'bg-gradient-to-r from-[#0052D4] to-[#00BFFF] text-white hover:scale-110 hover:shadow-[0_0_25px_rgba(0,198,255,0.5)]' : 'bg-white text-black hover:bg-gray-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`}
              >
                {isDeploying ? "Deploying Database..." : !selectedTier ? "SELECT A PLAN" : `PROCESS PAY AND DEPLOY ${currencySymbol}${getCurrentPrice()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 FLOATING HELP WIDGET */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.9 }} 
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="bg-[#111] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-2xl w-80 p-5 mb-4 overflow-hidden relative"
            >
              <button onClick={() => setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors duration-100">
                <X className="w-4 h-4" />
              </button>
              
              {helpStatus === "sent" ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">Message Sent!</h4>
                  <p className="text-xs text-gray-400">Our support team will get back to you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">ClawLink Support</h4>
                      <p className="text-[10px] text-gray-400">We typically reply in minutes.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Your Email Address" 
                      value={helpEmail}
                      onChange={(e) => setHelpEmail(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors duration-100"
                    />
                    <textarea 
                      placeholder="How can we help you?" 
                      rows={3}
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors duration-100 resize-none"
                    ></textarea>
                    {/* 🚀 THE FIXED BUTTON WITHOUT BAD CHARACTERS */}
                    <button 
                      onClick={handleSendHelpRequest}
                      disabled={helpStatus === "sending"}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-100 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    >
                      {helpStatus === "sending" ? "Sending..." : <><Send className="w-3 h-3" /> Send Message</>}
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
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center hover:shadow-[0_0_35px_rgba(59,130,246,0.8)] transition-all duration-100"
        >
          {isHelpOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.button>
      </div>

    </div>
  );
}