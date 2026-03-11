"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 🚀 NAYA LOGIC: Dynamic Pricing
const MODEL_PRICING = {
  gemini: { price: 29, name: "Gemini 3 Flash" },
  gpt: { price: 49, name: "GPT-5.4" },
  claude: { price: 69, name: "Opus 4.6" }
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

  // Load Razorpay
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const triggerRazorpayPayment = async () => {
    setIsDeploying(true);
    try {
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
        name: "ClawLink Setup",
        description: `Deploying ${MODEL_PRICING[selectedModel].name}`,
        order_id: order.id,
        handler: async function (response: any) {
          setShowPricingPopup(false);
          // PAYMENT SUCCESS -> AUTO DEPLOY
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
      });
      rzp.open();
    } catch (error) {
      alert("Payment gateway error.");
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-white/20 relative overflow-x-hidden">
      
      {/* Background Stars (Aapka Design) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

      {/* NAVBAR (Aapka Design) */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-widest font-mono">clawlink.com</div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <button className="flex items-center gap-2 border border-white/20 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all">
            <span className="w-2 h-2 bg-white rounded-full"></span> Contact Support
          </button>
        </div>
      </nav>

      {/* HERO SECTION (Aapka Design) */}
      <section className="relative z-10 text-center pt-16 pb-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-[3.5rem] md:text-[5rem] font-bold tracking-tighter leading-tight mb-6">
          Deploy ClawLink under <br/> <span className="text-gray-300">30 SECONDS</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Avoid all technical complexity and one-click<br/>deploy your own 24/7 active ClawLink instance under 1 minute.
        </p>
      </section>

      {/* CONFIGURATOR ENGINE (Aapka Design) */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center">
        
        {/* Model Selection */}
        <div className="mb-10 w-full text-center">
          <h2 className="text-lg font-bold mb-6">Choose a model to use as your default</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setSelectedModel("gpt")} className={`flex items-center gap-3 px-8 py-4 rounded-full border transition-all font-bold ${selectedModel === "gpt" ? 'bg-white text-black border-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>
              <span className="text-green-500">⚙️</span> GPT-5.4
            </button>
            <button onClick={() => setSelectedModel("claude")} className={`flex items-center gap-3 px-8 py-4 rounded-full border transition-all font-bold ${selectedModel === "claude" ? 'bg-white text-black border-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>
              <span className="text-orange-500">✴️</span> Opus 4.6
            </button>
            <button onClick={() => setSelectedModel("gemini")} className={`flex items-center gap-3 px-8 py-4 rounded-full border transition-all font-bold ${selectedModel === "gemini" ? 'bg-white text-black border-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>
              <span className="text-blue-400">✨</span> Gemini 3 Flash
            </button>
            <button disabled className="flex items-center gap-3 px-8 py-4 rounded-full border border-white/5 bg-black/50 text-gray-600 cursor-not-allowed font-bold">
              <span>🦙</span> Llama 3 (Soon)
            </button>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="mb-12 w-full text-center">
          <h2 className="text-lg font-bold mb-6">Select a channel for sending messages</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setSelectedChannel("telegram")} className={`flex items-center gap-3 px-10 py-5 rounded-2xl border transition-all font-bold ${selectedChannel === "telegram" ? 'bg-white text-black border-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}>
              <span className="text-blue-500 text-xl">✈️</span> Telegram
            </button>
            <button disabled className="flex items-center gap-3 px-10 py-5 rounded-2xl border border-white/5 bg-[#111] text-gray-300 font-bold opacity-60">
              <span className="text-green-500 text-xl">💬</span> WhatsApp
            </button>
            <button disabled className="flex flex-col items-center justify-center px-8 py-4 rounded-2xl border border-white/5 bg-[#111] text-gray-400 font-bold opacity-50">
              <div className="flex items-center gap-2"><span className="text-indigo-500">👾</span> Discord</div>
              <span className="text-[10px] uppercase mt-1">Soon</span>
            </button>
            <button disabled className="flex flex-col items-center justify-center px-8 py-4 rounded-2xl border border-white/5 bg-[#111] text-gray-400 font-bold opacity-50">
              <div className="flex items-center gap-2"><span className="text-pink-500">📸</span> Instagram</div>
              <span className="text-[10px] uppercase mt-1">Soon</span>
            </button>
          </div>
        </div>

        {/* 🚀 DYNAMIC ACTION AREA (Aapka UI + Naya Flow) */}
        <div className="w-full max-w-lg mb-20 text-center">
          {botLink ? (
             <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl text-center backdrop-blur-md">
               <h3 className="text-2xl font-black text-white mb-2">ClawLink is Live! 🚀</h3>
               <p className="text-gray-400 mb-6">Your AI agent is deployed and ready to use.</p>
               <a href={botLink} target="_blank" className="bg-white text-black font-black px-10 py-4 rounded-xl uppercase tracking-widest text-sm inline-block hover:bg-gray-200">
                 Open Telegram Bot
               </a>
             </div>
          ) : status === "unauthenticated" ? (
            <div>
              <button onClick={() => signIn("google")} className="w-full bg-white text-black font-black py-5 rounded-2xl text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <span className="text-xl mr-2">G</span> Login with Google & Quick Deploy
              </button>
              <p className="mt-4 text-sm text-gray-400">Connect Telegram to continue. <span className="text-green-500 font-bold">Limited cloud servers — only 7 left.</span></p>
            </div>
          ) : !isTokenSaved ? (
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              {/* Aapka banaya Profile Box */}
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white overflow-hidden">
                     <img src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Claw"} alt="User" />
                   </div>
                   <div className="text-left">
                     <p className="font-bold text-sm">{session?.user?.name}</p>
                     <p className="text-xs text-gray-500">{session?.user?.email}</p>
                   </div>
                 </div>
                 <button onClick={() => signOut()} className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-white">Logout</button>
              </div>
              <button onClick={() => setIsTelegramModalOpen(true)} className="w-full bg-[#222] text-white border border-white/20 font-black py-4 rounded-xl hover:bg-white hover:text-black transition-all">
                CONNECT TELEGRAM TO CONTINUE
              </button>
              <p className="mt-4 text-xs text-gray-400">Connect Telegram to continue. <span className="text-green-500 font-bold">Limited cloud servers — only 7 left.</span></p>
            </div>
          ) : (
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
              <button onClick={() => setShowPricingPopup(true)} className="w-full bg-white text-black font-black py-5 rounded-2xl text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                Deploy ClawLink
              </button>
              <p className="mt-4 text-xs text-gray-400">
                <strong className="text-white">${currentPrice} per month.</strong> Includes {MODEL_PRICING[selectedModel].name} credits. <span className="text-green-500 font-bold">Servers ready.</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* USE CASES SECTION (Aapka Design) */}
      <section className="relative z-10 text-center py-20 border-t border-white/5 max-w-5xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-4">Unleash thousands of use cases</h2>
        <p className="text-gray-400 mb-12">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        
        <div className="flex flex-wrap justify-center gap-4 opacity-70">
           {['Notify before a meeting', 'Read & summarize email', 'Draft replies', 'Take meeting notes', 'Sync across time zones', 'Do your taxes', 'Compare product specs', 'Run payroll calculations', 'Negotiate refunds', 'Research competitors', 'Screen leads', 'Generate invoices'].map((task, i) => (
             <div key={i} className="px-6 py-3 rounded-full border border-white/10 text-sm font-bold text-gray-300 flex items-center gap-2">
               <span className="w-4 h-4 rounded-full border border-gray-500 flex items-center justify-center text-[8px]">✓</span> {task}
             </div>
           ))}
        </div>
      </section>

      {/* COMPARISON SECTION (Aapka Design) */}
      <section className="relative z-10 py-20 border-t border-white/5 max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Comparison</p>
          <h2 className="text-4xl font-bold">Traditional Method vs. ClawLink</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
          {/* Old Way Table */}
          <div className="w-full md:w-1/2 space-y-4">
            {[
              ['Purchasing local virtual machine', '15 min'],
              ['Creating SSH keys and storing securely', '10 min'],
              ['Connecting to the server via SSH', '5 min'],
              ['Installing Node.js and NPM', '5 min'],
              ['Installing OpenClaw/Dependencies', '7 min'],
              ['Setting up Environment', '10 min']
            ].map(([task, time], i) => (
              <div key={i} className="flex justify-between border-b border-white/5 pb-4 text-sm font-bold text-gray-300">
                <span>{task}</span> <span className="text-gray-500 font-mono">{time}</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 text-lg font-black text-white">
              <span>Total Time</span> <span className="text-red-500">60 MINUTES</span>
            </div>
          </div>

          {/* ClawLink Way Card */}
          <div className="w-full md:w-1/3 bg-[#111] border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
             <h3 className="text-3xl font-bold mb-2">ClawLink</h3>
             <p className="text-3xl font-black text-green-500 mb-6">&lt;30 Seconds</p>
             <p className="text-sm text-gray-400 font-medium leading-relaxed">
               Pick a model, connect Telegram, deploy — done under 1 minute. Servers, SSH, and the entire environment are pre-configured and waiting for you.
             </p>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION (Aapka Design) */}
      <section className="relative z-10 py-24 border-t border-white/5 max-w-5xl mx-auto px-4">
         <h2 className="text-5xl font-bold mb-6">Deploy. Automate. Relax.</h2>
         <p className="text-gray-400 max-w-xl mb-10 text-lg">
           ClawLink enhances every interaction with precision speed. By bridging top-tier LLMs with your daily apps, we create a fluid automated experience.
         </p>
         <button className="bg-[#FFA47A] text-black font-black px-8 py-4 rounded-xl flex items-center gap-2 hover:bg-[#ff9361] transition-colors">
           Learn More <span>›</span>
         </button>
         <p className="mt-20 text-xs text-gray-600 uppercase tracking-widest font-bold">
           © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
         </p>
      </section>

      {/* ========================================= */}
      {/* 🚀 TELEGRAM SPLIT-SCREEN MODAL (WITH VIDEO/PHONE UI) */}
      {/* ========================================= */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
              
              <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-4 right-4 z-20 text-[#888] hover:text-white bg-black/50 p-2 rounded-full">✕</button>

              {/* LEFT: Instructions & Token */}
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
                  <input 
                    type="password" 
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    placeholder="e.g. 1234567890:ABCdefGhI..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-white transition-all mb-4 font-mono text-white"
                  />
                  <button 
                    onClick={() => { if(telegramToken.length > 20) { setIsTokenSaved(true); setIsTelegramModalOpen(false); } else alert("Please enter a valid token"); }} 
                    className="w-full bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest"
                  >
                    Save & Proceed ✓
                  </button>
                </div>
              </div>

              {/* RIGHT: Phone Video/Chat Mockup */}
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

                    <div className="p-4 space-y-4 text-[11px] h-full font-mono">
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">/newbot</div>
                       <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">
                         Alright, a new bot. How are we going to call it?
                       </div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink AI</div>
                       <div className="bg-[#111] border border-white/5 text-gray-300 p-2.5 rounded-xl rounded-tl-sm w-[85%] shadow-sm">
                         Good. Now let's choose a username.
                       </div>
                       <div className="bg-blue-600 text-white p-2.5 rounded-xl rounded-tr-sm w-fit ml-auto shadow-sm">ClawLink_bot</div>
                       <div className="bg-[#111] text-gray-300 p-3 rounded-xl rounded-tl-sm w-[90%] shadow-sm border border-blue-500/20">
                         Done! Congratulations.<br/><br/>
                         Use this token:<br/>
                         <span className="text-blue-400 break-all select-all animate-pulse">1234567890:AAH8...kL9pP_Q</span>
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
      {/* 🚀 DYNAMIC PRICING / PAYMENT POPUP MODAL */}
      {/* ========================================= */}
      <AnimatePresence>
        {showPricingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#111] border border-white/10 p-10 rounded-3xl w-full max-w-md shadow-2xl relative text-center">
              <button onClick={() => setShowPricingPopup(false)} className="absolute top-4 right-6 text-gray-500 hover:text-white text-lg">✕</button>
              
              <div className="w-16 h-16 bg-[#222] border border-white/10 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner">✨</div>
              <h2 className="text-xl font-bold mb-2">Subscribe to ClawLink</h2>
              <div className="text-[2.5rem] font-black mb-2 text-white">
                US${currentPrice}.00 <span className="text-sm text-gray-500 font-normal">per month</span>
              </div>
              <p className="text-gray-400 text-[13px] mb-8 leading-relaxed font-medium">
                Avoid all technical complexity and one-click deploy your own 24/7 active <span className="text-white font-bold">{MODEL_PRICING[selectedModel].name}</span> instance under 1 minute.
              </p>

              <button onClick={triggerRazorpayPayment} disabled={isDeploying} className="w-full bg-white text-black hover:bg-gray-200 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isDeploying ? "Processing..." : "Pay Securely & Deploy"}
              </button>
              <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secured by Razorpay</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}