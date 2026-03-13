"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Globe, Database, Mic, Shield, MessageSquare, Zap, Activity } from "lucide-react";

// ... (MODEL_DETAILS, constants same as before)
const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 9, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 } 
};
const MAX_PLAN_PRICE = 89; 

export default function Home() {
  // ... (All hooks and state same as before)
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
    // ... (Razorpay logic same as before)
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
        handler: async function (response: any) {
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
      rzp.on('payment.failed', function (response: any) {
        setIsDeploying(false); 
        alert("Payment failed or cancelled.");
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  // ... (Use Cases array same as before)
  const useCases = [
    { text: "Productivity & Meetings", icon: "📅", top: "10%" },
    { text: "Write contracts & NDAs", icon: "📄", top: "20%" },
    { text: "Create presentations from bullet points", icon: "📊", top: "35%" },
    { text: "Negotiate refunds automatically", icon: "🔄", top: "50%" },
    { text: "Shopping & Research", icon: "🛒", top: "65%" },
    { text: "Team & Monitoring", icon: "👥", top: "85%" },
    { text: "Schedule meetings from chat", icon: "📅", top: "5%" },
    { text: "Finance, Tax & Payroll", icon: "💼", top: "25%" },
    { text: "Do your taxes with AI", icon: "💰", top: "40%" },
    { text: "Screen & prioritize leads", icon: "🎯", top: "60%" },
    { text: "Track expenses & receipts", icon: "🧾", top: "75%" },
    { text: "Email & Documents", icon: "✉️", top: "15%" },
    { text: "Read & summarize emails", icon: "📨", top: "30%" },
    { text: "Run payroll calculations", icon: "🧮", top: "45%" },
    { text: "Find coupons automatically", icon: "🏷️", top: "55%" },
    { text: "Write job descriptions", icon: "👔", top: "70%" },
    { text: "Track OKRs & KPIs", icon: "📈", top: "85%" },
    { text: "Notify before a meeting", icon: "⏰", top: "10%" },
    { text: "Sync across time zones", icon: "🌍", top: "25%" },
    { text: "Generate invoices instantly", icon: "📄", top: "50%" },
    { text: "Compare product specifications", icon: "🔍", top: "65%" },
    { text: "Plan your week automatically", icon: "📅", top: "15%" },
    { text: "Take meeting notes", icon: "📝", top: "35%" },
    { text: "Find best prices online", icon: "🔍", top: "55%" },
    { text: "Draft social media posts", icon: "📢", top: "70%" },
    { text: "Sales, Marketing & Hiring", icon: "📈", top: "85%" },
  ];

  if (!isMounted) return null;

  return (
    <div className="bg-[#0A0A0B] min-h-screen relative text-[#EDEDED] font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🌇 CINEMATIC SUNSET GLOW EFFECTS */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* 🚀 NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto">
        <div className="text-xl font-black tracking-widest uppercase text-white">CLAWLINK.COM</div>
        <a href="#" className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
          <MessageSquare className="w-4 h-4"/> Contact Support
        </a>
      </nav>

      {/* 🚀 HERO SPLIT SECTION (Features Left | Deploy Right) */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 pt-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">
          
          {/* LEFT: The 6 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ... (Features same as before) */}
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Globe className="w-5 h-5 text-blue-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Omnichannel Deployment</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Deploy your AI agent across Telegram, WhatsApp Cloud, and your own website with a single click.</p>
            </div>
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Database className="w-5 h-5 text-green-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Enterprise RAG Memory</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain.</p>
            </div>
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Mic className="w-5 h-5 text-purple-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Voice Note Intelligence</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually.</p>
            </div>
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Zap className="w-5 h-5 text-orange-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Actionable AI Interceptor</h3>
              <p className="text-xs text-gray-500 leading-relaxed">AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings.</p>
            </div>
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <MessageSquare className="w-5 h-5 text-pink-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Live CRM & Human Handoff</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Monitor AI conversations in real-time and instantly take over manually when a human touch is needed.</p>
            </div>
            <div className="bg-[#111111]/80 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <Activity className="w-5 h-5 text-yellow-500 mb-4" />
              <h3 className="text-white font-bold mb-2 text-sm">Marketing Broadcast Engine</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost.</p>
            </div>
          </div>

          {/* RIGHT: The Deploy Engine (Exactly matching the Canva layout) */}
          <div className="flex flex-col items-center text-center lg:pt-8">
            <h1 className="text-4xl md:text-5xl text-white tracking-tight mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Deploy OpenClaw under 30 SECOND
            </h1>
            <p className="text-gray-400 text-sm mb-12">
              Avoid all technical complexity and one-click<br/>deploy your own 24/7 active OpenClaw instance under 30 second.
            </p>

            {/* 🛠️ FIXED MODEL SELECTOR (White Buttons, Original Colors) */}
            <h3 className="text-white text-xl md:text-2xl tracking-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
              Choose a model to use as your default !
            </h3>
            <div className="flex flex-wrap justify-center gap-3 items-center mb-12">
              
              {/* GPT: White button, Green text, Original logo */}
              <button onClick={() => setActiveModel("gpt-5.2")} className={`bg-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg transition-all duration-200 ${activeModel === 'gpt-5.2' ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105'}`}>
                {/* Ensure /gpt-logo.png is the GREEN version in /public */}
                <Image src="/gpt-logo.png" alt="GPT" width={20} height={20} className="w-5 h-5 rounded-full" style={{ objectFit: 'contain' }} />
                <span className="text-[#10A37F] font-bold text-sm">gpt-5.2</span>
              </button>

              {/* Claude: White button, Orange text, Original logo */}
              <button onClick={() => setActiveModel("claude")} className={`bg-white rounded-full px-5 py-2 flex items-center gap-2 shadow-lg transition-all duration-200 ${activeModel === 'claude' ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105'}`}>
                {/* Ensure /claude-logo.png is the ORANGE version in /public */}
                <Image src="/claude-logo.png" alt="Claude" width={20} height={20} className="w-5 h-5 rounded-full" style={{ objectFit: 'contain' }}/>
                <div className="text-left leading-none flex items-center gap-1">
                  <span className="text-[#D97757] font-bold text-sm">Claude</span>
                  <span className="text-[#D97757] text-[8px] font-bold leading-tight pt-1">Opus<br/>4.6</span>
                </div>
              </button>

              {/* Gemini: White button, Blue text, Original logo */}
              <button onClick={() => setActiveModel("gemini")} className={`bg-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg transition-all duration-200 ${activeModel === 'gemini' ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105'}`}>
                 {/* Ensure /gemini-logo.png is the BLUE version in /public */}
                <Image src="/gemini-logo.png" alt="Gemini" width={20} height={20} className="w-5 h-5 rounded-full" style={{ objectFit: 'contain' }}/>
                <span className="text-[#4E7CFF] font-bold text-sm">Gemini 3 flash</span>
              </button>

              <div className="bg-white rounded-full px-6 py-2.5 flex items-center shadow-lg opacity-80 cursor-not-allowed">
                <span className="font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-yellow-500 to-pink-500">soon</span>
              </div>
            </div>

            {/* Channel Selector (White Buttons, Colored Icons) */}
            <h3 className="text-white text-xl md:text-2xl tracking-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
              Select a channel for sending messages !
            </h3>
            <div className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-xl">
              <button onClick={() => setActiveChannel("telegram")} className={`flex-1 min-w-[120px] bg-white text-black py-3 px-4 flex items-center justify-center gap-2 transition-all ${activeChannel === 'telegram' ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-105'}`}>
                <div className="w-6 h-6 rounded-full bg-[#2AABEE] flex items-center justify-center"><svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.661 3.495-1.524 5.83-2.529 7.005-3.02 3.333-1.392 4.025-1.636 4.476-1.636z"/></svg></div>
                <span className="text-sm font-medium">Telegram</span>
              </button>
              <button onClick={() => setActiveChannel("whatsapp")} className={`flex-1 min-w-[120px] bg-white text-black py-3 px-4 flex items-center justify-center gap-2 transition-all ${activeChannel === 'whatsapp' ? 'ring-4 ring-green-500 scale-105' : 'hover:scale-105'}`}>
                <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center"><svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></div>
                <span className="text-sm font-medium">whatsapp</span>
              </button>
              <button className="flex-1 min-w-[120px] bg-white text-black py-2 px-4 flex flex-col items-center justify-center cursor-not-allowed opacity-80">
                <span className="text-sm font-medium flex items-center gap-1"><Shield className="w-3 h-3 text-[#5865F2]"/> discord</span>
                <span className="text-[10px] text-gray-500">coming soon</span>
              </button>
              <button className="flex-1 min-w-[120px] bg-white text-black py-2 px-4 flex flex-col items-center justify-center cursor-not-allowed opacity-80">
                <span className="text-sm font-medium flex items-center gap-1"><span className="w-3 h-3 rounded bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"></span> instagram</span>
                <span className="text-[10px] text-gray-500">coming soon</span>
              </button>
            </div>

            {/* Auth / Deploy Action (White Buttons) */}
            <div className="w-full max-w-xl">
              {botLink ? (
                <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
                  <h3 className="text-xl font-bold text-white mb-4">Your OpenClaw is Live! 🚀</h3>
                  <div className="flex justify-center gap-4">
                    <a href={botLink} target="_blank" rel="noopener noreferrer" className="bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-gray-200 transition-colors text-sm">
                      Open Bot
                    </a>
                    <button onClick={() => router.push('/dashboard')} className="bg-[#1A1A1A] border border-white/20 text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 transition-colors text-sm">
                      Dashboard
                    </button>
                  </div>
                </div>
              ) : status === "unauthenticated" ? (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => signIn("google")} className="w-full bg-white text-black py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>
                    Login with Google & Quick Deploy
                  </motion.button>
                  <p className="mt-4 text-sm font-serif">connect {activeChannel} to continue . <span className="text-green-500">limited cloud servers--only 7left</span></p>
                </>
              ) : !isTokenSaved ? (
                <button onClick={() => handleOpenIntegration(activeChannel)} className="w-full bg-white text-black py-4 rounded-2xl font-bold tracking-widest hover:bg-gray-200 transition-all uppercase shadow-lg">
                  CONNECT {activeChannel} TO CONTINUE
                </button>
              ) : (
                <button onClick={() => handleOpenPricing(activeChannel)} className="w-full bg-white text-black py-4 rounded-2xl font-black tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all uppercase">
                  Deploy OpenClaw
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 🚀 USE CASES CLOUD SECTION */}
      <section className="py-24 relative z-10 border-t border-white/5 overflow-hidden">
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">unleash thousands of use cases</h2>
          <p className="text-orange-500/80 font-serif italic text-sm md:text-lg">your clawlink agent handle complex cognitive tasks instantly</p>
        </div>

        <div className="relative w-full max-w-6xl mx-auto h-[400px] flex flex-wrap justify-center content-start gap-x-8 gap-y-6 px-4">
          {useCases.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0.8, y: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, repeatType: "mirror" }}
              className="flex items-center gap-2 text-xs md:text-sm text-gray-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 cursor-default shadow-lg"
              style={{ marginTop: `${Math.random() * 40}px` }}
            >
              <span>{item.icon}</span> {item.text}
            </motion.div>
          ))}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-white/30"></div>
        </div>
      </section>

      {/* 🚀 FOOTER CTA */}
      <footer className="pt-24 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-10 text-left">
          <h2 className="text-3xl md:text-5xl text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>Deploy. Automate. Relax.</h2>
          <button className="bg-orange-400 hover:bg-orange-500 text-black font-bold px-8 py-3 rounded text-sm transition-colors mb-24">
            learn more
          </button>
        </div>

        <div className="border-t border-white/10 px-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-serif">
          <p>© 2026 ClawLink Inc. All rights reserved.</p>
          <div className="text-center md:text-center absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[10px]">
            © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Documentation</a>
          </div>
        </div>
      </footer>

      {/* 🚀 MODALS (Same as before) */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`bg-[#0A0A0B] border border-white/10 rounded-3xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden relative shadow-2xl`}>
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">✕</button>
              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative z-10">
                {activeChannel === "telegram" ? (
                  <>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Connect Telegram</h2>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10">
                      <li>Search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send <code className="bg-white/10 px-2 py-1 rounded text-white">/newbot</code>.</li>
                      <li>Copy the HTTP API token.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Connect WhatsApp</h2>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10">
                      <li>Go to Meta for Developers.</li>
                      <li>Generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Paste token below.</li>
                    </ol>
                  </>
                )}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                  <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Enter Token..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none mb-4 text-white" />
                  <button onClick={() => { setIsTokenSaved(true); setIsTelegramModalOpen(false); }} className="w-full bg-white text-black font-bold py-3 rounded-xl text-sm hover:bg-gray-200 uppercase">Authenticate</button>
                </div>
              </div>
              <div className="hidden md:flex md:w-1/2 bg-[#050505] items-center justify-center p-10 border-l border-white/5">
                 <div className="w-[300px] h-[500px] border border-white/10 rounded-3xl bg-[#0A0A0B] flex flex-col justify-end p-4">
                   <span className="text-green-400 break-all bg-black p-2 rounded-lg text-xs font-mono">Token linked securely.</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#0A0A0B] border border-white/10 p-8 rounded-3xl w-full max-w-4xl text-center">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white">✕</button>}
              <h2 className="text-2xl font-black mb-2 text-white uppercase">Deploy OpenClaw under 30 seconds.</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 text-left">
                <div onClick={() => !isDeploying && setSelectedTier("starter")} className="relative p-6 rounded-2xl border bg-[#111] border-white cursor-pointer hover:scale-105 transition-all">
                  <h3 className="text-gray-400 font-bold uppercase text-xs mb-2">Starter</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("starter")}</div>
                  <p className="text-sm text-gray-300">Limited tokens.</p>
                </div>
                <div onClick={() => !isDeploying && setSelectedTier("pro")} className="relative p-6 rounded-2xl border bg-[#111] border-blue-500 cursor-pointer scale-105 transition-all">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">Popular</div>
                  <h3 className="text-blue-400 font-bold uppercase text-xs mb-2">Pro</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("pro")}</div>
                  <p className="text-sm text-gray-300">Unlimited credits.</p>
                </div>
                <div onClick={() => !isDeploying && setSelectedTier("max")} className="relative p-6 rounded-2xl border bg-[#111] border-orange-500 cursor-pointer hover:scale-105 transition-all">
                  <h3 className="text-orange-400 font-bold uppercase text-xs mb-2">Max</h3>
                  <div className="text-3xl font-black text-white mb-4">{currencySymbol}{getCurrentPrice("max")}</div>
                  <p className="text-sm text-gray-300">Multi-AI access.</p>
                </div>
              </div>
              <button onClick={triggerRazorpayPayment} disabled={isDeploying} className="w-full max-w-sm mx-auto bg-white text-black font-bold py-4 rounded-xl uppercase flex justify-center items-center gap-2">
                {isDeploying ? "Deploying..." : `Deploy OpenClaw ${currencySymbol}${getCurrentPrice()}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}