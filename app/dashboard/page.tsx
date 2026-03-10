"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClawLinkDeployer() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Configuration Selections
  const [selectedModel, setSelectedModel] = useState("claude");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  
  // States for Telegram Integration
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [botLink, setBotLink] = useState(""); // 🚀 Store the generated t.me link
  
  // Loading State for API Call
  const [isDeploying, setIsDeploying] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Deployment & Automation Logic
  const handleDeployAndPay = async () => {
    if (!isTokenSaved || !telegramToken) {
      alert("Please connect and save your Telegram token first!");
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      alert("Session expired. Please log in again.");
      return;
    }

    setIsDeploying(true);

    try {
      // Calling internal API which now handles Auto-Webhook and Bot Link Generation
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          selectedModel: selectedModel,
          selectedChannel: selectedChannel,
          telegramToken: telegramToken
        })
      });

      const data = await response.json();

      if (data.success) {
        // 🚀 Set the bot link and keep isTokenSaved true to show the Success UI
        setBotLink(data.botLink); 
      } else {
        alert("Deployment failed: " + data.error);
      }
    } catch (error) {
      console.error("Deployment Error:", error);
      alert("A system error occurred. Please check your connection.");
    } finally {
      setIsDeploying(false);
    }
  };

  // Loading Screen
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-500 tracking-widest font-mono uppercase">
        Booting ClawLink Infrastructure...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500/30">
      
      {/* Header Section */}
      <div className="text-center mb-10 mt-10">
        <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">Deploy ClawLink under 1 minute</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Avoid all technical complexity and one-click deploy your own 24/7 active ClawLink instance.
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 w-full max-w-3xl shadow-2xl relative z-10">
        
        {/* SUCCESS STATE UI (SimpleClaw Style) */}
        {isTokenSaved && botLink ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
              <span className="text-3xl text-white">🚀</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">ClawLink is Live!</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">
              Your AI agent has been successfully deployed and is ready to answer messages 24/7.
            </p>
            
            <a 
              href={botLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block w-full md:w-auto bg-white text-black font-black px-12 py-5 rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-sm shadow-xl"
            >
              Open Your Telegram Bot
            </a>
            
            <button 
              onClick={() => { setBotLink(""); setIsTokenSaved(false); }} 
              className="block mx-auto mt-8 text-[10px] text-gray-600 hover:text-white underline font-bold uppercase tracking-widest transition-colors"
            >
              Update Configuration
            </button>
          </div>
        ) : (
          /* CONFIGURATION FORM UI */
          <>
            {/* Step 1: Model Selection */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Which model do you want as default?</h2>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedModel("claude")}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "claude" ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
                >
                  <span className="text-orange-400">✴️</span> Claude 4.6 Opus {selectedModel === "claude" && "✓"}
                </button>
                <button 
                  onClick={() => setSelectedModel("gpt")}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "gpt" ? 'border-green-500/50 bg-green-500/10 text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
                >
                  <span className="text-green-400">🤖</span> GPT-5.4 {selectedModel === "gpt" && "✓"}
                </button>
                <button 
                  onClick={() => setSelectedModel("gemini")}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "gemini" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
                >
                  <span className="text-blue-400">✨</span> Gemini 3.1 Flash {selectedModel === "gemini" && "✓"}
                </button>
              </div>
            </div>

            {/* Step 2: Channel Selection */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 text-gray-200">Which channel for messages?</h2>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedChannel("telegram")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all ${selectedChannel === "telegram" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
                >
                  <span className="text-blue-400">✈️</span> Telegram {selectedChannel === "telegram" && "✓"}
                </button>
                <button disabled className="opacity-40 flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/5 text-gray-600 cursor-not-allowed bg-black/50">
                   WhatsApp <span className="text-[10px] ml-1 uppercase">Soon</span>
                </button>
              </div>
            </div>

            {/* Step 3: User Identity */}
            <div className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-lg text-white">
                 {session?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{session?.user?.name || "ClawLink User"}</p>
                <p className="text-gray-500 text-xs truncate">{session?.user?.email}</p>
              </div>
            </div>

            {/* Step 4: Final Action Button */}
            {!isTokenSaved ? (
              <button 
                onClick={() => setIsTelegramModalOpen(true)}
                className="w-full md:w-auto px-8 py-4 bg-[#111] text-white font-bold rounded-xl border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl uppercase text-xs tracking-widest"
              >
                ⚡ Connect Telegram to continue
              </button>
            ) : (
              <button 
                onClick={handleDeployAndPay}
                disabled={isDeploying}
                className={`w-full md:w-auto px-10 py-4 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] uppercase text-xs tracking-widest ${
                  isDeploying 
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                    : "bg-white text-black hover:bg-gray-200 active:scale-95"
                }`}
              >
                {isDeploying ? "Provisioning Engine..." : "⚡ Deploy ClawLink Now"}
              </button>
            )}
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* TELEGRAM MODAL POPUP                      */}
      {/* ========================================= */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] max-w-4xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
            <button onClick={() => setIsTelegramModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white text-xl">✕</button>

            {/* Left Side: Tutorial */}
            <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-blue-400 text-3xl">✈️</span> Connect Bot
              </h2>
              <ol className="space-y-4 text-xs text-gray-400 list-decimal pl-5 leading-relaxed">
                <li>Search <strong className="text-blue-400">@BotFather</strong> on Telegram.</li>
                <li>Send <code className="bg-white/5 px-1.5 py-0.5 rounded text-white">/newbot</code> command.</li>
                <li>Give your bot a name and a unique username.</li>
                <li>BotFather will provide an **API Token**. Copy it carefully.</li>
                <li>Paste it below to sync your ClawLink brain.</li>
              </ol>

              <div className="mt-10">
                <label className="block text-[10px] font-black text-gray-600 uppercase mb-3 tracking-widest">HTTP API Token</label>
                <input 
                  type="password" 
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="Paste token here..." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 transition-all mb-4 font-mono"
                />
                <button 
                  onClick={() => {
                    if (telegramToken.length > 20) {
                      setIsTokenSaved(true);
                      setIsTelegramModalOpen(false);
                    } else {
                      alert("Invalid token format.");
                    }
                  }}
                  className="w-full bg-white text-black font-black py-4 rounded-xl border border-white/10 transition-all uppercase text-xs tracking-widest shadow-lg"
                >
                  Verify & Sync Bot ✓
                </button>
              </div>
            </div>

            {/* Right Side: Phone Visual */}
            <div className="hidden md:flex md:w-1/2 bg-[#050505] items-center justify-center p-12 border-l border-white/5">
               <div className="w-[260px] h-[520px] border-[6px] border-[#1a1a1a] rounded-[3rem] bg-black p-4 relative shadow-2xl ring-1 ring-white/5">
                  <div className="w-24 h-5 bg-[#1a1a1a] rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2"></div>
                  <div className="mt-10 space-y-4 opacity-80">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">BF</div>
                      <div className="text-[10px] text-white font-bold tracking-tight">BotFather ✓</div>
                    </div>
                    <div className="bg-[#222] rounded-2xl rounded-tr-none p-3 text-[9px] text-white w-fit float-right ml-10">/newbot</div>
                    <div className="clear-both"></div>
                    <div className="bg-[#111] rounded-2xl rounded-tl-none p-3 text-[9px] text-gray-400 mr-4 leading-relaxed">
                      Alright! Choose a name for your bot.
                    </div>
                    <div className="bg-[#111] rounded-2xl rounded-tl-none p-3 text-[9px] text-gray-400 mr-4 border border-blue-600/30 leading-relaxed">
                      Done! API Token:<br/>
                      <span className="text-blue-400 font-mono text-[8px] break-all">1234567890:ABCdef...</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}