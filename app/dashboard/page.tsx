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
  
  // Loading State for API Call
  const [isDeploying, setIsDeploying] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Deployment API Logic
  const handleDeployAndPay = async () => {
    if (!isTokenSaved || !telegramToken) {
      alert("Please connect and save your Telegram token first!");
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      alert("Session expired or email not found. Please log in again.");
      return;
    }

    setIsDeploying(true);

    try {
      // Calling our internal Next.js API route to save to Supabase
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
        alert("🔥 BOOM! Your ClawLink instance is successfully deployed! Check your Telegram bot.");
      } else {
        alert("Deployment failed: " + data.error);
      }
    } catch (error) {
      console.error("Deployment System Error:", error);
      alert("A critical system error occurred during deployment. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  // Loading Screen
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-500 tracking-widest font-mono">
        LOADING CLAWLINK...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-500/30">
      
      {/* Header Section */}
      <div className="text-center mb-10 mt-10">
        <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight">Deploy ClawLink under 1 minute</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Avoid all technical complexity and one-click deploy your own 24/7 active ClawLink instance under 1 minute.
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 md:p-10 w-full max-w-3xl shadow-2xl relative z-10">
        
        {/* Step 1: Model Selection */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Which model do you want as default?</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setSelectedModel("claude")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "claude" ? 'border-orange-500/50 bg-orange-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <span className="text-orange-400">✴️</span> Claude 4.6 Opus {selectedModel === "claude" && "✓"}
            </button>
            <button 
              onClick={() => setSelectedModel("gpt")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "gpt" ? 'border-green-500/50 bg-green-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <span className="text-green-400">🤖</span> GPT-5.4 {selectedModel === "gpt" && "✓"}
            </button>
            <button 
              onClick={() => setSelectedModel("gemini")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${selectedModel === "gemini" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <span className="text-blue-400">✨</span> Gemini 3.1 Flash {selectedModel === "gemini" && "✓"}
            </button>
          </div>
        </div>

        {/* Step 2: Channel Selection */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Which channel do you want to use for sending messages?</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setSelectedChannel("telegram")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all ${selectedChannel === "telegram" ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
            >
              <span className="text-blue-400">✈️</span> Telegram {selectedChannel === "telegram" && "✓"}
            </button>
            <button disabled className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/5 text-gray-600 cursor-not-allowed bg-black/50">
              <span className="text-indigo-500 opacity-50">👾</span> Discord <span className="text-[10px] ml-1">Coming soon</span>
            </button>
            <button disabled className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/5 text-gray-600 cursor-not-allowed bg-black/50">
              <span className="text-green-500 opacity-50">💬</span> WhatsApp <span className="text-[10px] ml-1">Coming soon</span>
            </button>
          </div>
        </div>

        {/* Step 3: User Profile */}
        <div className="flex items-center gap-4 mb-10 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
             {session?.user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <p className="font-semibold text-sm flex items-center gap-1">
              {session?.user?.name || "ClawLink User"} <span className="text-gray-500 text-xs">↪</span>
            </p>
            <p className="text-gray-500 text-xs">{session?.user?.email || "user@clawlink.com"}</p>
          </div>
        </div>

        {/* Step 4: Action Button Logic */}
        {!isTokenSaved ? (
          <div>
            <button 
              onClick={() => setIsTelegramModalOpen(true)}
              className="w-full md:w-auto px-8 py-4 bg-[#222] text-white font-semibold rounded-xl border border-white/10 hover:bg-[#333] transition-all"
            >
              ⚡ Connect Telegram to continue
            </button>
            <p className="text-sm text-gray-500 mt-4">Connect Telegram to continue. <span className="text-blue-400">Limited cloud servers — only 11 left</span></p>
          </div>
        ) : (
          <div>
            <button 
              onClick={handleDeployAndPay}
              disabled={isDeploying}
              className={`w-full md:w-auto px-10 py-4 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] ${
                isDeploying 
                  ? "bg-gray-400 text-gray-800 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {isDeploying ? "Deploying Instance..." : "⚡ Deploy ClawLink"}
            </button>
            <p className="text-sm text-gray-400 mt-4">
              <strong className="text-white">Active Plan Selected.</strong> Ready for instant deployment.
            </p>
          </div>
        )}

      </div>

      {/* ========================================= */}
      {/* TELEGRAM TUTORIAL & TOKEN MODAL (POPUP) */}
      {/* ========================================= */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsTelegramModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>

            {/* Left Side: Tutorial Steps */}
            <div className="p-8 md:p-10 md:w-1/2 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-blue-400 text-3xl">✈️</span> Connect Telegram
              </h2>
              
              <h3 className="text-lg font-semibold mb-4 text-gray-200">How to get your bot token?</h3>
              <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5">
                <li>Open Telegram and go to <strong className="text-blue-400 cursor-pointer">@BotFather</strong>.</li>
                <li>Start a chat and type <code className="bg-white/10 px-1 py-0.5 rounded text-white">/newbot</code>.</li>
                <li>Follow the prompts to name your bot and choose a username.</li>
                <li>BotFather will send you a message with your bot token. Copy the entire token (it looks like a long string of numbers and letters).</li>
                <li>Paste the token in the field below and click Save & Connect.</li>
              </ol>

              <div className="mt-8">
                <label className="block text-sm text-gray-400 mb-2">Enter bot token</label>
                <input 
                  type="password" 
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIJklMnOPq..." 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all mb-4"
                />
                <button 
                  onClick={() => {
                    if (telegramToken.length > 20) {
                      setIsTokenSaved(true);
                      setIsTelegramModalOpen(false);
                    } else {
                      alert("Please enter a valid Telegram token.");
                    }
                  }}
                  className="w-full bg-[#222] hover:bg-white hover:text-black text-white font-semibold py-3 rounded-xl border border-white/10 transition-all"
                >
                  Save & Connect ✓
                </button>
              </div>
            </div>

            {/* Right Side: Mock Phone Image */}
            <div className="hidden md:flex md:w-1/2 bg-[#0A0A0A] border-l border-white/10 items-center justify-center p-8">
               <div className="w-[280px] h-[580px] border-4 border-[#333] rounded-[40px] bg-black p-4 relative shadow-2xl">
                  {/* Phone Notch */}
                  <div className="w-32 h-6 bg-[#333] rounded-b-3xl absolute top-0 left-1/2 -translate-x-1/2"></div>
                  
                  {/* Mock Chat UI */}
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">BF</div>
                      <div className="text-xs text-white font-bold">BotFather <span className="text-blue-400">✓</span></div>
                    </div>
                    
                    <div className="bg-[#222] rounded-2xl rounded-tr-none p-3 text-[10px] text-white self-end ml-10 w-fit float-right">
                      /newbot
                    </div>
                    <div className="clear-both"></div>
                    
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-tl-none p-3 text-[10px] text-gray-300 mr-4">
                      Alright, a new bot. How are we going to call it? Please choose a name for your bot.
                    </div>

                    <div className="bg-[#1a1a1a] rounded-2xl rounded-tl-none p-3 text-[10px] text-gray-300 mr-4 border border-blue-500/30">
                      Done! Congratulations on your new bot...<br/><br/>
                      Use this token to access the HTTP API:<br/>
                      <span className="text-blue-400 font-mono text-[9px] break-all">1234567890:ABCdefGHIJklMnOPq</span><br/>
                      Keep your token secure and store it safely!
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