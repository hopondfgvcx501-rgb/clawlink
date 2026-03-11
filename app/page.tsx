"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingUI from "../components/LandingUI";

const MODEL_PRICING: Record<string, { price: number; name: string }> = {
  gemini: { price: 29, name: "Gemini 3 Flash" },
  "gpt-5.2": { price: 49, name: "GPT-5.2" },
  claude: { price: 69, name: "Opus 4.6" }
};

export default function Home() {
  const { data: session, status } = useSession();
  
  // Modals & States
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [botLink, setBotLink] = useState("");
  
  // Track choices for payment
  const [activeModel, setActiveModel] = useState("gpt-5.2");
  const [activeChannel, setActiveChannel] = useState("telegram");

  useEffect(() => {
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

  const triggerRazorpayPayment = async () => {
    setIsDeploying(true);
    const price = MODEL_PRICING[activeModel]?.price || 49;
    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price * 100, currency: "USD" }), 
      });
      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "ClawLink Premium",
        description: `Deploying ${MODEL_PRICING[activeModel]?.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          setShowPricingPopup(false);
          const configRes = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, selectedModel: activeModel, selectedChannel: activeChannel, telegramToken })
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

  // 🚀 YAHAN SE BUTTONS BANKAR LANDING UI ME JAYENGE (Design safe rahega)
  const renderDynamicButtons = (selectedModel: string, selectedChannel: string) => {
    if (botLink) {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-2">ClawLink is Live! 🚀</h3>
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
        {/* Logged in Profile Bar */}
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

        {/* Dynamic Action Button */}
        {!isTokenSaved ? (
          <button onClick={() => handleOpenTelegram(selectedModel, selectedChannel)} className="w-full bg-[#1A1A1A] border border-white/20 text-white py-4 rounded-xl font-bold tracking-wide hover:bg-white hover:text-black transition-all">
            CONNECT TELEGRAM TO CONTINUE
          </button>
        ) : (
          <button onClick={() => handleOpenPricing(selectedModel, selectedChannel)} className="w-full bg-white text-black py-4 rounded-xl font-bold tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all">
            Deploy OpenClaw
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="bg-[#0A0A0B] min-h-screen relative text-white">
      
      {/* 🌟 1. PASSING THE LOGIC INTO YOUR LOCKED UI */}
      <LandingUI renderActionArea={renderDynamicButtons} />

      {/* 🌟 2. TELEGRAM VIDEO MODAL (Rendered strictly above UI) */}
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
                  <button onClick={() => { if(telegramToken.length > 20) { setIsTokenSaved(true); setIsTelegramModalOpen(false); } else alert("Invalid token"); }} className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest">
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
                       <div className="bg-[#111] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-blue-500/20">
                         Done! Congratulations.<br/><br/>Use this token:<br/><span className="text-blue-400 break-all select-all animate-pulse">1234567890:AAH8...kL9pP_Q</span>
                       </div>
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1 bg-[#333] rounded-full w-24 mx-auto z-20"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 3. PRICING POPUP MODAL */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#111] border border-white/10 p-10 rounded-3xl w-full max-w-md shadow-2xl relative text-center">
              <button onClick={() => setShowPricingPopup(false)} className="absolute top-4 right-6 text-gray-500 hover:text-white text-lg">✕</button>
              
              <div className="w-16 h-16 bg-[#222] border border-white/10 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">✨</div>
              <h2 className="text-xl font-bold mb-2 text-white">Subscribe to ClawLink</h2>
              <div className="text-[2.5rem] font-black mb-2 text-white">
                US${MODEL_PRICING[activeModel]?.price}.00 <span className="text-sm text-gray-500 font-normal">per month</span>
              </div>
              <p className="text-gray-400 text-[13px] mb-8 leading-relaxed font-medium">
                Avoid all technical complexity and one-click deploy your own 24/7 active <span className="text-white font-bold">{MODEL_PRICING[activeModel]?.name}</span> instance under 1 minute.
              </p>

              <button onClick={triggerRazorpayPayment} disabled={isDeploying} className="w-full bg-white text-black hover:bg-gray-200 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] flex justify-center items-center gap-2">
                {isDeploying ? <span className="animate-spin text-xl">⚙️</span> : "Pay Securely & Deploy"}
              </button>
              <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secured by Razorpay</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}