"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic Pricing Logic based on AI Model
const MODEL_PRICING = {
  gemini: { price: 29, name: "Gemini 3.1 Flash" },
  gpt: { price: 49, name: "GPT-5.4" },
  claude: { price: 69, name: "Claude 4.6 Opus" }
};

export default function Home() {
  const { data: session, status } = useSession();
  
  // Selections
  const [selectedModel, setSelectedModel] = useState<"gemini" | "gpt" | "claude">("claude");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  
  // Flow States
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [botLink, setBotLink] = useState("");

  const currentPrice = MODEL_PRICING[selectedModel].price;

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const triggerRazorpayPayment = async () => {
    setIsDeploying(true);
    try {
      // Create order based on selected model's price
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: currentPrice * 100, currency: "USD" }), 
      });
      const order = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "ClawLink Premium",
        description: `Deploying ${MODEL_PRICING[selectedModel].name}`,
        order_id: order.id,
        handler: async function (response: any) {
          setShowPricingPopup(false); // Close popup on success
          // AUTO DEPLOY AFTER PAYMENT
          const configRes = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session?.user?.email,
              selectedModel,
              selectedChannel,
              telegramToken
            })
          });
          const configData = await configRes.json();
          if (configData.success && configData.botLink) {
            setBotLink(configData.botLink); // Show success UI
          } else {
            alert("Deployment failed after payment: " + configData.error);
          }
        },
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#ffffff" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         setIsDeploying(false);
         alert("Payment Failed");
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans selection:bg-white/20 relative overflow-x-hidden pb-20">
      
      {/* Background Stars (Locked ClawLink Design) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      {/* NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-widest font-mono text-white">clawlink.com</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <button className="flex items-center gap-2 border border-white/20 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all">
            <span className="w-2 h-2 bg-white rounded-full"></span> Contact Support
          </button>
        </div>
      </nav>

      {/* MAIN ENGINE SECTION */}
      <section className="relative z-10 flex flex-col items-center pt-6 px-4">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[3.5rem] md:text-[4.5rem] font-bold tracking-tighter leading-tight mb-4 text-white">
            Deploy ClawLink under <br/> <span className="text-gray-300">1 MINUTE</span>
          </h1>
          <p className="text-[15px] text-gray-400 max-w-lg mx-auto leading-relaxed">
            Avoid all technical complexity and one-click deploy your own 24/7 active ClawLink instance under 1 minute.
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-[#0f0f0f] border border-[#222] rounded-[24px] p-8 w-full max-w-[600px] shadow-2xl relative">
          
          {/* Step 1: Model Selection */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-white mb-4">Which model do you want as default?</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setSelectedModel("claude")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-[13px] font-medium transition-all ${selectedModel === "claude" ? 'border-[#ff6b4a]/50 bg-[#ff6b4a]/10 text-white' : 'border-[#333] text-[#888] hover:bg-[#1a1a1a]'}`}>
                <span className="text-[#ff6b4a]">✺</span> Claude 4.6 Opus {selectedModel === "claude" && "✓"}
              </button>
              <button onClick={() => setSelectedModel("gpt")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-[13px] font-medium transition-all ${selectedModel === "gpt" ? 'border-white/50 bg-white/10 text-white' : 'border-[#333] text-[#888] hover:bg-[#1a1a1a]'}`}>
                <span className="text-white">⚙️</span> GPT-5.4 {selectedModel === "gpt" && "✓"}
              </button>
              <button onClick={() => setSelectedModel("gemini")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-[13px] font-medium transition-all ${selectedModel === "gemini" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-[#333] text-[#888] hover:bg-[#1a1a1a]'}`}>
                <span className="text-blue-400">✧</span> Gemini 3.1 Flash {selectedModel === "gemini" && "✓"}
              </button>
            </div>
          </div>

          {/* Step 2: Channel Selection */}
          <div className="mb-10">
            <h2 className="text-[15px] font-semibold text-white mb-4">Which channel for messages?</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setSelectedChannel("telegram")} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all text-[13px] font-medium ${selectedChannel === "telegram" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-[#333] text-[#888] hover:bg-[#1a1a1a]'}`}>
                <span className="text-[#2AABEE]">✈️</span> Telegram {selectedChannel === "telegram" && "✓"}
              </button>
              <button disabled className="flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-transparent bg-[#111] text-[#555] cursor-not-allowed text-[13px] font-medium">
                <span className="text-[#5865F2] opacity-50">👾</span> Discord <span className="text-[10px] uppercase opacity-50 ml-1">Soon</span>
              </button>
              <button disabled className="flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-transparent bg-[#111] text-[#555] cursor-not-allowed text-[13px] font-medium">
                <span className="text-[#25D366] opacity-50">💬</span> WhatsApp <span className="text-[10px] uppercase opacity-50 ml-1">Soon</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FLOW AREA (Auth -> Profile -> Token -> Deploy -> Success) */}
          <div className="pt-4 border-t border-[#222]">
            {botLink ? (
              /* FINAL SUCCESS STATE */
              <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center">
                 <h3 className="text-lg font-bold text-white mb-2">ClawLink is Live! 🚀</h3>
                 <p className="text-gray-400 text-sm mb-6">Your AI instance is fully deployed and ready.</p>
                 <a href={botLink} target="_blank" className="bg-white text-black font-bold px-8 py-3 rounded-full text-sm inline-block hover:bg-gray-200">
                   Open Telegram Bot
                 </a>
              </div>
            ) : status === "unauthenticated" ? (
              /* UNAUTHENTICATED STATE */
              <button onClick={() => signIn("google")} className="w-full bg-white text-black font-semibold py-3.5 rounded-full flex items-center justify-center gap-3 text-[14px] hover:bg-[#e5e5e5] transition-all">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" /> Sign in with Google
              </button>
            ) : (
              /* AUTHENTICATED STATE */
              <div className="space-y-4">
                 {/* The Profile Box */}
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141414] border border-[#222]">
                   <div className="flex items-center gap-3">
                     <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Claw"} alt="User" className="w-10 h-10 rounded-full border border-[#333]" />
                     <div>
                       <p className="font-semibold text-[13px] text-white flex items-center gap-2">
                         {session?.user?.name}
                         <button onClick={() => signOut()} title="Logout" className="text-[#888] hover:text-white">↪</button>
                       </p>
                       <p className="text-[#888] text-[12px]">{session?.user?.email}</p>
                     </div>
                   </div>
                 </div>

                 {/* Action Button based on Token State */}
                 {!isTokenSaved ? (
                   <button onClick={() => setIsTelegramModalOpen(true)} className="w-full bg-white text-black font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 text-[14px] hover:bg-[#e5e5e5] transition-all">
                     <span className="text-black">⚡</span> CONNECT TELEGRAM TO CONTINUE
                   </button>
                 ) : (
                   <div>
                     <button onClick={() => setShowPricingPopup(true)} className="w-full bg-white text-black font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 text-[14px] hover:bg-[#e5e5e5] transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                       <span className="text-black">⚡</span> Deploy ClawLink
                     </button>
                     <p className="text-[12px] text-[#888] mt-4 leading-relaxed text-center">
                       <strong className="text-white">${currentPrice} per month.</strong> Includes unlimited credits for {MODEL_PRICING[selectedModel].name}. <span className="text-blue-500">Limited cloud servers — only 11 left</span>
                     </p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* 🚀 1. TELEGRAM SPLIT-SCREEN MODAL (WITH PHONE UI) */}
      {/* ========================================= */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-[#0a0a0a] border border-[#222] rounded-[24px] w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
              
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-4 right-4 z-20 text-[#888] hover:text-white bg-black/50 p-2 rounded-full">✕</button>

              {/* LEFT: Instructions & Token */}
              <div className="w-full md:w-[45%] p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#2AABEE] flex items-center justify-center text-white text-sm">✈️</div>
                  <h2 className="text-[18px] font-semibold text-white">Connect Telegram</h2>
                </div>

                <h3 className="text-[14px] font-semibold text-white mb-4">How to get your bot token?</h3>
                <ol className="space-y-4 text-[13px] text-[#888] list-decimal pl-4 mb-8">
                  <li>Open Telegram and go to <a href="https://t.me/BotFather" target="_blank" className="text-white underline decoration-[#555] hover:decoration-white underline-offset-4">@BotFather</a>.</li>
                  <li>Start a chat and type <code className="bg-[#222] text-[#ccc] px-1.5 py-0.5 rounded">/newbot</code>.</li>
                  <li>Follow the prompts to name your bot and choose a username.</li>
                  <li>BotFather will send you a message with your bot token. Copy the entire token.</li>
                  <li>Paste the token below and click Save.</li>
                </ol>

                <div>
                  <label className="block text-[12px] font-semibold text-[#888] mb-2 uppercase tracking-wide">Enter bot token</label>
                  <input 
                    type="password" 
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="1234567890:ABCdefGhI..."
                    className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-[12px] px-4 py-3.5 text-[14px] focus:outline-none focus:border-white transition-all mb-4 font-mono placeholder-[#555]"
                  />
                  <button 
                    onClick={() => { if(telegramToken.length > 20) { setIsTokenSaved(true); setIsTelegramModalOpen(false); } else alert("Invalid token structure. Please copy exactly from BotFather."); }} 
                    className="w-full bg-white text-black font-semibold py-3.5 rounded-full text-[14px] hover:bg-[#e5e5e5] transition-all"
                  >
                    Save & Connect ✓
                  </button>
                </div>
              </div>

              {/* RIGHT: Phone Video/Chat Mockup */}
              <div className="hidden md:flex md:w-[55%] bg-[#111] items-center justify-center p-8 border-l border-[#222]">
                 <div className="w-[280px] h-[580px] border-[6px] border-[#222] rounded-[2.5rem] bg-black relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 inset-x-0 h-6 bg-[#222] rounded-b-xl w-32 mx-auto z-20"></div>
                    
                    <div className="bg-[#1a1a1a] p-4 pt-8 flex items-center gap-3 border-b border-[#222] z-10 relative">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🤖</div>
                      <div>
                        <p className="text-white text-sm font-semibold">BotFather <span className="text-blue-400 text-xs">✓</span></p>
                        <p className="text-gray-500 text-[10px]">bot</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-4 text-[11px] h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">/newbot</div>
                       <div className="bg-[#222] text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">
                         Alright, a new bot. How are we going to call it? Please choose a name for your bot.
                       </div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink AI</div>
                       <div className="bg-[#222] text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">
                         Good. Now let's choose a username for your bot.
                       </div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink_bot</div>
                       <div className="bg-[#222] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-blue-500/20">
                         Done! Congratulations on your new bot.<br/><br/>
                         Use this token to access the HTTP API:<br/>
                         <span className="font-mono text-blue-400 break-all select-all animate-pulse">1234567890:AAH8...kL9pP_Q</span>
                       </div>
                    </div>
                    <div className="absolute bottom-2 inset-x-0 h-1 bg-[#333] rounded-full w-24 mx-auto z-20"></div>
                 </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================= */}
      {/* 🚀 2. PRICING / PAYMENT POPUP MODAL */}
      {/* ========================================= */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#0f0f0f] border border-[#333] p-10 rounded-[24px] w-full max-w-md shadow-2xl relative text-center">
              <button onClick={() => setShowPricingPopup(false)} className="absolute top-4 right-6 text-gray-500 hover:text-white text-lg">✕</button>
              
              <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6">✨</div>
              <h2 className="text-xl font-semibold mb-2">Subscribe to ClawLink</h2>
              <div className="text-[2.5rem] font-bold mb-2">
                US${currentPrice}.00 <span className="text-sm text-gray-500 font-normal">per month</span>
              </div>
              <p className="text-[#888] text-[13px] mb-8 leading-relaxed">
                Avoid all technical complexity and one-click deploy your own 24/7 active {MODEL_PRICING[selectedModel].name} instance under 1 minute.
              </p>

              <button onClick={triggerRazorpayPayment} disabled={isDeploying} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                {isDeploying ? (
                   <>
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...
                   </>
                ) : (
                   "Pay Securely & Deploy"
                )}
              </button>
              <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest">Secured by Razorpay</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}