"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingUI from "../components/LandingUI";

const MODEL_DETAILS: Record<string, { name: string; starter: number; pro: number }> = {
  gemini: { name: "Gemini 3 Flash", starter: 9, pro: 19 },
  "gpt-5.2": { name: "GPT-5.2", starter: 19, pro: 39 }, 
  claude: { name: "Opus 4.6", starter: 29, pro: 59 } 
};
const MAX_PLAN_PRICE = 89; 

export default function Home() {
  const { data: session, status } = useSession();
  
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
    // 🚀 BULLETPROOF FIX: Check local device timezone directly. NO API. NO CACHE.
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") {
        setCurrency("INR");
        setCurrencySymbol("₹");
      } else {
        setCurrency("USD");
        setCurrencySymbol("$");
      }
    } catch (e) {
      console.log("Timezone error");
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleOpenTelegram = (model: string, channel: string) => {
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
    let basePrice = tier === "max" ? MAX_PLAN_PRICE : (MODEL_DETAILS[activeModel]?.[tier as "starter"|"pro"] || 39);
    return currency === "INR" ? basePrice * EXCHANGE_RATE : basePrice;
  };

  const triggerRazorpayPayment = async () => {
    setIsDeploying(true);
    const finalPrice = getCurrentPrice();
    
    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🚀 Frontend jo bheja wahi backend accept karega (INR ya USD)
        body: JSON.stringify({ amount: finalPrice * 100, currency: currency }), 
      });
      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency, 
        name: "Pay & Link & Finish",
        description: `Plan: ${selectedTier.toUpperCase()} | Model: ${selectedTier === 'max' ? 'ALL' : MODEL_DETAILS[activeModel]?.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          setShowPricingPopup(false);
          const configRes = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, selectedModel: activeModel, selectedChannel: activeChannel, telegramToken, plan: selectedTier })
          });
          const configData = await configRes.json();
          if (configData.success && configData.botLink) setBotLink(configData.botLink);
          else alert("Deployment failed: " + configData.error);
        },
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#ffffff" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () { setIsDeploying(false); });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  const renderDynamicButtons = (selectedModel: string, selectedChannel: string) => {
    if (botLink) {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-2">ClawLink is Live! 🚀</h3>
          <p className="text-sm text-gray-400 mb-6">Your webhook is fully connected and processing data.</p>
          <a href={botLink} target="_blank" className="bg-white text-black font-black px-8 py-3 rounded-xl inline-block hover:bg-gray-200">Open Telegram Bot</a>
        </motion.div>
      );
    }

    if (status === "unauthenticated") {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
          <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,255,255,0.4)" }} whileTap={{ scale: 0.98 }} onClick={() => signIn("google")} className="w-full max-w-md bg-white text-black py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/><path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/><path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/></svg>
            Login with Google & Quick Deploy
          </motion.button>
          <p className="mt-5 text-sm text-gray-400 font-medium">Connect {selectedChannel} to continue. <span className="text-green-400 font-semibold">Limited cloud servers — only 7 left.</span></p>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-4">
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
             <img src={session?.user?.image || ""} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar"/>
             <div className="text-left">
               <p className="text-sm font-bold text-white">{session?.user?.name}</p>
               <p className="text-xs text-gray-500">{session?.user?.email}</p>
             </div>
          </div>
          <button onClick={() => signOut()} className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest">Logout</button>
        </div>

        {!isTokenSaved ? (
          <button onClick={() => handleOpenTelegram(selectedModel, selectedChannel)} className="w-full bg-[#1A1A1A] border border-white/20 text-white py-4 rounded-xl font-bold tracking-wide hover:bg-white hover:text-black transition-all">
            CONNECT TELEGRAM TO CONTINUE
          </button>
        ) : (
          <button onClick={() => handleOpenPricing(selectedModel, selectedChannel)} className="w-full bg-white text-black py-4 rounded-xl font-bold tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all flex justify-center items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41"></path>
            </svg>
            Deploy ClawLink
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="bg-[#0A0A0B] min-h-screen relative text-white">
      
      <LandingUI renderActionArea={renderDynamicButtons} isLocked={isTokenSaved} />

      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-4 right-4 z-20 text-[#888] hover:text-white bg-black/50 p-2 rounded-full">✕</button>

              <div className="w-full md:w-[45%] p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center text-white text-sm">✈️</div>
                  <h2 className="text-[18px] font-bold text-white">Connect Telegram</h2>
                </div>
                <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-4 mb-8 font-medium">
                  <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                  <li>Send the command <code className="bg-black border border-white/10 px-2 py-1 rounded text-white">/newbot</code>.</li>
                  <li>Provide a name and unique username for your AI agent.</li>
                  <li>BotFather will give you a long API token. Copy it.</li>
                </ol>
                <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">HTTP API Token</label>
                  <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="1234567890:ABCdefGhI..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white transition-all mb-4 font-mono text-white" />
                  <button 
                    onClick={() => { 
                      const match = telegramToken.match(/\d{8,10}:[a-zA-Z0-9_-]{35}/);
                      if (match) { 
                        setTelegramToken(match[0]); setIsTokenSaved(true); setIsTelegramModalOpen(false); 
                      } else alert("Invalid token format! Please copy the exact API token from BotFather."); 
                    }} 
                    className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Save & Proceed ✓
                  </button>
                </div>
              </div>

              <div className="hidden md:flex md:w-[55%] bg-black items-center justify-center p-8 border-l border-white/10">
                 <div className="w-[280px] h-[580px] border-[6px] border-[#222] rounded-[2.5rem] bg-[#0A0A0B] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-6 bg-[#222] rounded-b-xl w-32 mx-auto z-20"></div>
                    <div className="bg-[#111] p-4 pt-8 flex items-center gap-3 border-b border-white/5 z-10 relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🤖</div>
                      <div>
                        <p className="text-white text-sm font-bold">BotFather <span className="text-blue-400 text-xs">✓</span></p>
                        <p className="text-gray-500 text-[10px] font-mono">bot</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-4 text-[11px] h-full font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">/newbot</div>
                       <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">Alright, a new bot. How are we going to call it?</div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink AI</div>
                       <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">Good. Now let's choose a username.</div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink_bot</div>
                       <div className="bg-[#111] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-white/10">Done! Congratulations.<br/><br/>Use this token:<br/><span className="text-blue-400 break-all select-all animate-pulse">1234567890:AAH8...kL9pP_Q</span></div>
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1 bg-[#333] rounded-full w-24 mx-auto z-20"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 DYNAMIC API MODAL (Handles both Telegram & WhatsApp) */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-4 right-4 z-20 text-[#888] hover:text-white bg-black/50 p-2 rounded-full">✕</button>

              <div className="w-full md:w-[45%] p-8 flex flex-col justify-center">
                
                {/* 🚀 LOGIC: Check selected channel */}
                {activeChannel === "telegram" ? (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center text-white text-sm">✈️</div>
                      <h2 className="text-[18px] font-bold text-white">Connect Telegram</h2>
                    </div>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-4 mb-8 font-medium">
                      <li>Open Telegram and search for <strong className="text-white">@BotFather</strong>.</li>
                      <li>Send the command <code className="bg-black border border-white/10 px-2 py-1 rounded text-white">/newbot</code>.</li>
                      <li>Provide a name and unique username for your AI agent.</li>
                      <li>BotFather will give you a long API token. Copy it.</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white text-sm">💬</div>
                      <h2 className="text-[18px] font-bold text-white">Connect WhatsApp Cloud</h2>
                    </div>
                    <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-4 mb-8 font-medium">
                      <li>Go to the <strong className="text-white">Meta for Developers</strong> Dashboard.</li>
                      <li>Create an App and add the <strong className="text-white">WhatsApp Product</strong>.</li>
                      <li>Generate a <strong className="text-white">Permanent Access Token</strong>.</li>
                      <li>Copy the Token and paste it below securely.</li>
                    </ol>
                  </>
                )}

                <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    {activeChannel === "telegram" ? "HTTP API Token" : "Meta Access Token"}
                  </label>
                  <input 
                    type="password" 
                    value={telegramToken} 
                    onChange={(e) => setTelegramToken(e.target.value)} 
                    placeholder={activeChannel === "telegram" ? "1234567890:ABCdefGhI..." : "EAABwzL..."} 
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white transition-all mb-4 font-mono text-white" 
                  />
                  <button 
                    onClick={() => { 
                      if (activeChannel === "telegram") {
                        const match = telegramToken.match(/\d{8,10}:[a-zA-Z0-9_-]{35}/);
                        if (match) { 
                          setTelegramToken(match[0]); setIsTokenSaved(true); setIsTelegramModalOpen(false); 
                        } else alert("Invalid token format! Please copy the exact API token from BotFather."); 
                      } else {
                        // WhatsApp token format validation (Starts with EAA)
                        if (telegramToken.startsWith("EAA") && telegramToken.length > 20) {
                          setTelegramToken(telegramToken); setIsTokenSaved(true); setIsTelegramModalOpen(false);
                        } else alert("Invalid Meta Token! WhatsApp tokens usually start with 'EAA'.");
                      }
                    }} 
                    className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Save & Proceed ✓
                  </button>
                </div>
              </div>

              {/* SIDE UI PANEL */}
              <div className="hidden md:flex md:w-[55%] bg-black items-center justify-center p-8 border-l border-white/10">
                 <div className="w-[280px] h-[580px] border-[6px] border-[#222] rounded-[2.5rem] bg-[#0A0A0B] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-6 bg-[#222] rounded-b-xl w-32 mx-auto z-20"></div>
                    <div className="bg-[#111] p-4 pt-8 flex items-center gap-3 border-b border-white/5 z-10 relative">
                      <div className={`w-8 h-8 rounded-full ${activeChannel === "telegram" ? "bg-blue-500/20" : "bg-green-500/20"} flex items-center justify-center text-xl`}>
                        {activeChannel === "telegram" ? "🤖" : "📱"}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">
                          {activeChannel === "telegram" ? "BotFather" : "Meta Cloud"} <span className={`${activeChannel === "telegram" ? "text-blue-400" : "text-green-400"} text-xs`}>✓</span>
                        </p>
                        <p className="text-gray-500 text-[10px] font-mono">{activeChannel === "telegram" ? "bot" : "verified"}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 text-[11px] h-full font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
                       {activeChannel === "telegram" ? (
                         // Telegram Mock UI
                         <>
                           <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">/newbot</div>
                           <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">Alright, a new bot. How are we going to call it?</div>
                           <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink AI</div>
                           <div className="bg-[#111] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-white/10">Done!<br/><br/>Use this token:<br/><span className="text-blue-400 break-all select-all animate-pulse">1234567890:AAH8...</span></div>
                         </>
                       ) : (
                         // WhatsApp Mock UI
                         <>
                           <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[90%] shadow-sm">Welcome to Meta for Developers.</div>
                           <div className="bg-green-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">Create WhatsApp App</div>
                           <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[90%] shadow-sm">Generating System User Token...</div>
                           <div className="bg-[#111] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-green-500/30">Success!<br/><br/>Access Token:<br/><span className="text-green-400 break-all select-all animate-pulse">EAABwzL8x...</span></div>
                         </>
                       )}
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1 bg-[#333] rounded-full w-24 mx-auto z-20"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}