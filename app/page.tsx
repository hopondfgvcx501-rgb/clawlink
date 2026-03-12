"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingUI from "../components/LandingUI";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Zap, Activity, Globe, Database, Mic, Shield, MessageSquare } from "lucide-react";

const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 9, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 },
  claude: { name: "Opus 4.6", starter: 29, pro: 59 }
};
const MAX_PLAN_PRICE = 89;

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleOpenIntegration = (model: string, channel: string) => {
    setActiveModel(model);
    setActiveChannel(channel);
    setIsTelegramModalOpen(true);
  };

  const handleOpenPricing = (model: string, channel: string) => {
    setActiveModel(model);
    setActiveChannel(channel);
    setShowPricingPopup(true);
  };

  const getCurrentPrice = (tier = selectedTier) => {
    const basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter" | "pro"] || 39);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            console.log(response); // Keep Razorpay response log for debugging
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', function (response: any) {
        console.error(response.error);
        setIsDeploying(false);
        alert("Payment failed or cancelled.");
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  // --- RENDER ACTION AREA (Passed to LandingUI) ---
  const renderDynamicButtons = (selectedModel: string, selectedChannel: string) => {
    if (botLink) {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-md bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-2">Your OpenClaw is Live! 🚀</h3>
          <p className="text-sm text-gray-400 mb-6">
            {selectedChannel === "whatsapp"
              ? "Your WhatsApp AI agent is now connected to the Meta Cloud."
              : "Your Telegram webhook is fully connected and processing data."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a href={botLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-white text-black font-black px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center">
              {selectedChannel === "whatsapp" ? "Open WhatsApp Bot" : "Open Telegram Bot"}
            </a>
            <button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto bg-[#1A1A1A] border border-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              Access Dashboard
            </button>
          </div>
        </motion.div>
      );
    }

    if (status === "unauthenticated") {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="w-full flex flex-col items-center">
          <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.98 }} onClick={() => signIn("google")} className="w-full max-w-md bg-white text-black py-4 rounded-xl flex items-center justify-center gap-3 text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all uppercase">
            <svg width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" /><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" /><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" /><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" /></svg>
            Login with Google to Deploy
          </motion.button>
          <p className="mt-5 text-xs text-gray-500 font-mono">Connect {selectedChannel} to continue. <span className="text-green-500 font-bold">Servers Online.</span></p>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-md space-y-4">
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar" />
            <div className="text-left">
              <p className="text-sm font-bold text-white">{session?.user?.name}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors">Logout</button>
        </div>

        {!isTokenSaved ? (
          <button onClick={() => handleOpenIntegration(selectedModel, selectedChannel)} className="w-full bg-[#1A1A1A] border border-white/10 hover:border-white/30 text-white py-4 rounded-xl text-sm font-bold tracking-widest hover:bg-white/5 transition-all mt-2 uppercase">
            Connect {selectedChannel}
          </button>
        ) : (
          <button onClick={() => handleOpenPricing(selectedModel, selectedChannel)} className="w-full bg-white text-black py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-all flex justify-center items-center gap-2">
            <Zap className="w-4 h-4" /> Deploy OpenClaw
          </button>
        )}
      </motion.div>
    );
  };

  const themeColor = activeChannel === "telegram" ? "rgba(42, 171, 238, 0.15)" : "rgba(37, 211, 102, 0.15)";
  const borderColor = activeChannel === "telegram" ? "border-blue-500/30" : "border-green-500/30";

  if (!isMounted) return null;

  return (
    <div className="bg-[#0A0A0B] min-h-screen relative text-[#EDEDED] font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden">

      {/* 🚀 1. The Functional Hero Area (LandingUI) */}
      <div className="flex-1 relative z-10">
        <LandingUI renderActionArea={renderDynamicButtons} isLocked={isTokenSaved || isDeploying} />
      </div>

      {/* 🚀 2. Choose Model Section (NEW - from image_5.png) */}
      <section className="py-16 bg-[#0A0A0B] relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-medium text-white mb-10 tracking-tight">
            Choose a model to use as your default !
          </h2>
          <div className="flex flex-wrap justify-center gap-4 items-center">
            {/* GPT-5.2 Pill */}
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-full px-6 py-3 flex items-center gap-3 shadow-lg cursor-pointer">
              <Image src="/image_6.png" alt="OpenAI" width={24} height={24} className="w-6 h-6" />
              <span className="text-[#10A37F] font-semibold text-lg">gpt-5.2</span>
            </motion.div>

            {/* Claude Pill */}
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-full px-6 py-3 flex items-center gap-3 shadow-lg cursor-pointer">
              <Image src="/image_7.png" alt="Claude" width={24} height={24} className="w-6 h-6" />
              <div className="text-left leading-tight">
                <span className="text-[#D97757] font-semibold text-lg block">Claude</span>
                <span className="text-[#D97757] text-xs font-medium">Opus 4.6</span>
              </div>
            </motion.div>

            {/* Gemini Pill */}
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white rounded-full px-6 py-3 flex items-center gap-3 shadow-lg cursor-pointer">
              <Image src="/image_8.png" alt="Gemini" width={24} height={24} className="w-6 h-6" />
              <span className="text-[#4E7CFF] font-semibold text-lg">Gemini 3 flash</span>
            </motion.div>

            {/* Soon Pill */}
            <motion.div className="bg-white rounded-full px-8 py-4 flex items-center gap-2 shadow-lg opacity-80 cursor-not-allowed">
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">soon</span>
            </motion.div>
          </div>
        </div>
      </section>


      {/* 🚀 3. Traditional vs ClawLink Comparison Section (NEW - from image_4.png) */}
      <section className="py-24 bg-[#1A1A1A] relative z-0 border-y border-white/5 font-mono">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-16">
            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Comparison</h3>
            <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight">Traditional Method vs clawlink</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            {/* Left Side: Traditional Method List */}
            <div className="w-full md:w-2/3">
              <ul className="space-y-6 text-gray-300 text-sm md:text-base">
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Purchasing local virtual machine</div>
                  <span className="font-bold">15 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Creating SSH keys and storing securely</div>
                  <span className="font-bold">10 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to the server via SSH</div>
                  <span className="font-bold">5 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing Node.js and NPM</div>
                  <span className="font-bold">5 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Installing OpenClaw</div>
                  <span className="font-bold">7 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Setting up OpenClaw</div>
                  <span className="font-bold">10 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Connecting to AI provider</div>
                  <span className="font-bold">4 min</span>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>Pairing with Telegram</div>
                  <span className="font-bold">4 min</span>
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-lg text-white">
                <span className="font-bold text-gray-400">total</span>
                <span className="font-bold">60 MINUTES</span>
              </div>
            </div>

            {/* Right Side: Clawlink Highlight */}
            <div className="w-full md:w-1/3 flex flex-col justify-center items-center text-center md:py-20">
              <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">clawlink</h3>
              <div className="text-5xl font-black text-white mb-6 tracking-tighter">&lt;30 sec</div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[250px]">
                Pick a model, connect Telegram, deploy — done under 1 minute. Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned. Simple, secure and fast connection to your bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 4. Enterprise Capabilities Section (Existing) */}
      <section id="architecture" className="py-24 border-t border-white/5 bg-[#000000] relative z-0">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center justify-center md:justify-start gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Enterprise Capabilities
            </h2>
            <p className="text-gray-500 text-sm">Everything you need to automate your business globally.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <Globe className="w-6 h-6 text-gray-500 mb-6 group-hover:text-blue-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Omnichannel Routing</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Connect your bot to Telegram, WhatsApp Cloud API, or embed our Chat Widget on any website instantly.</p>
            </div>

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <Mic className="w-6 h-6 text-gray-500 mb-6 group-hover:text-purple-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Audio Intelligence</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Natively integrated with OpenAI Whisper. Your bot understands customer voice notes and responds contextually.</p>
            </div>

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <Database className="w-6 h-6 text-gray-500 mb-6 group-hover:text-green-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Enterprise RAG Database</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Inject your business documents and FAQs. The AI searches this Vector DB to provide highly accurate answers.</p>
            </div>

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <Zap className="w-6 h-6 text-gray-500 mb-6 group-hover:text-orange-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Actionable AI</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Enable function calling. The AI can dynamically execute backend actions like checking order statuses or booking appointments.</p>
            </div>

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <MessageSquare className="w-6 h-6 text-gray-500 mb-6 group-hover:text-yellow-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Live CRM & Broadcast Hub</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Monitor conversations, take over manually, and blast marketing campaigns to captured leads directly from the dashboard.</p>
            </div>

            <div className="bg-[#0A0A0B] p-8 hover:bg-[#111] transition-colors group">
              <Shield className="w-6 h-6 text-gray-500 mb-6 group-hover:text-red-500 transition-colors" />
              <h3 className="text-lg font-bold mb-2">Immortal Fallback Engine</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Zero downtime. If GPT-5.4 fails, the system automatically routes to Claude or Gemini in milliseconds.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 🚀 5. Footer with New Features */}
      <footer className="border-t border-white/5 bg-[#000] pt-16 pb-12 relative z-0">
        <div className="max-w-6xl mx-auto px-6">

          {/* NEW: 4 God-Tier Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 border-b border-white/10 pb-12">
            <div className="flex items-start gap-3">
              <span className="text-xl">👉</span>
              <div>
                <h4 className="text-white font-bold mb-1">RAG Knowledge Base</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Custom company data injection for accurate AI responses.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👉</span>
              <div>
                <h4 className="text-white font-bold mb-1">CRM & Human Handoff</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Real-time live chat control and conversation monitoring.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👉</span>
              <div>
                <h4 className="text-white font-bold mb-1">Marketing Broadcast</h4>
                <p className="text-gray-500 text-xs leading-relaxed">WhatsApp/Telegram mass messaging campaigns.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👉</span>
              <div>
                <h4 className="text-white font-bold mb-1">Viral Growth Engine</h4>
                <p className="text-gray-500 text-xs leading-relaxed">Built-in affiliate marketing and referral tracking.</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Links */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
            <div className="flex items-center gap-2 opacity-50">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="font-bold tracking-widest font-mono text-white">CLAWLINK<span className="text-blue-500">.</span></span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-gray-400 font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
              <a href="#" className="hover:text-white transition-colors">Help Desk</a>
            </div>

            <p className="text-xs text-gray-600 font-mono opacity-70">
              © 2026 CLAWLINK INC. GLOBAL AI SAAS.
            </p>
          </div>
        </div>
      </footer>

      {/* 🚀 MODALS (Intact Logic, Polished Look, Snappier Animations) */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`bg-[#0A0A0B] border ${borderColor} rounded-3xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden relative shadow-2xl`}
            >
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 z-20 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">✕</button>

              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative z-10">
                {activeChannel === "telegram" ? (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-[#2AABEE]/10 flex items-center justify-center text-[#2AABEE] border border-[#2AABEE]/20">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.661 3.495-1.524 5.83-2.529 7.005-3.02 3.333-1.392 4.025-1.636 4.476-1.636z" /></svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Connect Telegram</h2>
                    </div>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10 font-medium leading-relaxed">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send the command <code className="bg-white/10 px-2 py-1 rounded text-white font-mono text-xs">/newbot</code>.</li>
                      <li>Provide a unique name and username for your agent.</li>
                      <li>Copy the HTTP API token provided by BotFather.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] border border-[#25D366]/20">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Connect WhatsApp</h2>
                    </div>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5 mb-10 font-medium leading-relaxed">
                      <li>Navigate to the <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline font-bold transition-colors">Meta for Developers</a> console.</li>
                      <li>Create an App and add the <strong className="text-white">WhatsApp Product</strong>.</li>
                      <li>Generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Securely paste the token below to authenticate.</li>
                    </ol>
                  </>
                )}

                <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    {activeChannel === "telegram" ? "HTTP API Token" : "Meta Access Token"}
                  </label>
                  <input
                    type="password"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder={activeChannel === "telegram" ? "1234567890:ABCdefGhI..." : "EAABwzL..."}
                    className={`w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all mb-4 font-mono text-white ${activeChannel === "telegram" ? "focus:border-blue-500" : "focus:border-green-500"}`}
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
                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest"
                  >
                    Authenticate
                  </button>
                </div>
              </div>

              <div className="hidden md:flex md:w-1/2 bg-[#050505] items-center justify-center p-10 border-l border-white/5 relative">
                <div className="w-[300px] h-[600px] border-[8px] border-[#1A1A1A] rounded-[3rem] bg-[#0A0A0B] relative overflow-hidden shadow-2xl flex flex-col">
                  <div className="absolute top-0 inset-x-0 h-7 bg-[#1A1A1A] rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
                    <div className="w-12 h-1.5 bg-black/50 rounded-full"></div>
                  </div>

                  <div className="bg-[#111] p-4 pt-10 flex items-center gap-3 border-b border-white/5 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg ${activeChannel === "telegram" ? "bg-[#2AABEE]" : "bg-[#25D366]"}`}>
                      {activeChannel === "telegram" ? "🤖" : "🏢"}
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold flex items-center gap-1">
                        {activeChannel === "telegram" ? "BotFather" : "Meta Cloud"}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono tracking-wider">{activeChannel === "telegram" ? "verified bot" : "system user"}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-5 flex-1 overflow-hidden text-[12px] font-mono bg-black opacity-90 flex flex-col justify-end pb-8">
                    {activeChannel === "telegram" ? (
                      <>
                        <div className="bg-[#2AABEE] text-white p-3 rounded-2xl rounded-tr-sm w-fit ml-auto">/newbot</div>
                        <div className="bg-[#1A1A1A] border border-white/5 text-gray-200 p-3 rounded-2xl rounded-tl-sm w-[85%]">Please choose a name.</div>
                        <div className="bg-[#2AABEE] text-white p-3 rounded-2xl rounded-tr-sm w-fit ml-auto">ClawLink AI</div>
                        <div className="bg-[#1A1A1A] text-gray-300 p-4 rounded-2xl rounded-tl-sm w-[90%] border border-blue-500/20">
                          Done! <br /><br />
                          <span className="text-gray-500">HTTP API Token:</span><br />
                          <span className="text-blue-400 break-all select-all mt-2 block bg-black p-2 rounded-lg border border-white/5">1234567890:AAH8...</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#1A1A1A] border border-white/5 text-gray-200 p-3 rounded-2xl rounded-tl-sm w-[90%]">Meta App Dashboard.</div>
                        <div className="bg-[#25D366] text-black font-medium p-3 rounded-2xl rounded-tr-sm w-fit ml-auto">Generate Token</div>
                        <div className="bg-[#1A1A1A] text-gray-300 p-4 rounded-2xl rounded-tl-sm w-[95%] border border-green-500/20">
                          Success! <br /><br />
                          <span className="text-gray-500">Permanent Token:</span><br />
                          <span className="text-green-400 break-all select-all mt-2 block bg-black p-2 rounded-lg border border-white/5">EAABwzL8x...</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }} className="bg-[#0A0A0B] border border-white/10 p-8 md:p-10 rounded-3xl w-full max-w-4xl shadow-2xl relative text-center my-8">
              {!isDeploying && <button onClick={() => setShowPricingPopup(false)} className="absolute top-6 right-8 text-gray-500 hover:text-white text-xl">✕</button>}

              <h2 className="text-2xl md:text-3xl font-black mb-2 text-white tracking-tight uppercase">Deploy OpenClaw under 30 second.</h2>
              <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
                Avoid technical complexity. Get your 24/7 active AI instance running immediately.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                <div onClick={() => !isDeploying && setSelectedTier("starter")} className={`relative p-6 rounded-2xl border transition-all ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "starter" ? "bg-[#111] border-white scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Starter</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("starter")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">Limited tokens for {MODEL_DETAILS[activeModel]?.name}. Best for personal testing.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex items-center justify-center ml-auto">
                    {selectedTier === "starter" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>

                <div onClick={() => !isDeploying && setSelectedTier("pro")} className={`relative p-6 rounded-2xl border transition-all ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "pro" ? "bg-[#111] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)] scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
                  <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Pro</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("pro")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">Unlimited credits and Priority API Routing for {MODEL_DETAILS[activeModel]?.name}.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center ml-auto">
                    {selectedTier === "pro" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                </div>

                <div onClick={() => !isDeploying && setSelectedTier("max")} className={`relative p-6 rounded-2xl border transition-all ${!isDeploying ? 'cursor-pointer' : ''} ${selectedTier === "max" ? "bg-[#111] border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-105 z-10" : "bg-black border-white/10 hover:border-white/30"}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Ultimate</div>
                  <h3 className="text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">Omni Max</h3>
                  <div className="text-3xl font-black text-white mb-4">
                    {currencySymbol}{getCurrentPrice("max")}<span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">Multi-AI access. Use GPT, Claude, and Gemini simultaneously with Lightning Speed.</p>
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center ml-auto">
                    {selectedTier === "max" && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                  </div>
                </div>
              </div>

              <button
                onClick={triggerRazorpayPayment}
                disabled={isDeploying}
                className="w-full max-w-sm mx-auto bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {isDeploying ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deploying...
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