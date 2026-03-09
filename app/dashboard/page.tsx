"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarBackground from "../../components/StarBackground"; // Aapka star background zinda hai!

export default function ClawLinkDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 1. Configuration Selections
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedChannel, setSelectedChannel] = useState("telegram");

  // 2. All Possible API Keys
  const [telegramToken, setTelegramToken] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const [isDeploying, setIsDeploying] = useState(false); 
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Live Token Validation State
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Telegram Token Regex Validator
  useEffect(() => {
    const telegramRegex = /^\d{8,10}:[a-zA-Z0-9_-]{35}$/;
    if (telegramToken.length === 0) {
      setIsValidToken(null);
    } else if (telegramRegex.test(telegramToken)) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, [telegramToken]);

  // Security Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch Existing Config on Load (Aapka original Supabase logic)
  useEffect(() => {
    const fetchConfig = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/config?email=${session.user.email}`);
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.selectedModel) setSelectedModel(data.data.selectedModel);
            if (data.data.selectedChannel) setSelectedChannel(data.data.selectedChannel);
            
            if (data.data.telegramToken) setTelegramToken(data.data.telegramToken);
            if (data.data.whatsappToken) setWhatsappToken(data.data.whatsappToken);
            if (data.data.whatsappPhoneId) setWhatsappPhoneId(data.data.whatsappPhoneId);
            if (data.data.openAIKey) setOpenAIKey(data.data.openAIKey);
            if (data.data.anthropicKey) setAnthropicKey(data.data.anthropicKey);
            if (data.data.geminiKey) setGeminiKey(data.data.geminiKey);
            
            setHasExistingConfig(true);
          }
        } catch (error) {
          console.error("Failed to load config");
        } finally {
          setIsFetching(false);
        }
      }
    };
    if (status === "authenticated") fetchConfig();
  }, [status, session]);

  if (status === "loading" || isFetching) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white font-mono">Loading ClawLink Space...</div>;
  }

  // Save Function to Supabase
  const handleStartServer = async () => {
    if (selectedChannel === "telegram" && !isValidToken) return;

    setIsDeploying(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          selectedModel,
          selectedChannel,
          telegramToken,
          whatsappToken,
          whatsappPhoneId,
          openAIKey,
          anthropicKey,
          geminiKey
        }),
      });
      const data = await response.json();
      if (data.success) {
        setHasExistingConfig(true);
      } else {
        alert("Failed to save keys. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Check your connection.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 px-4 relative font-sans pb-20 bg-[#0A0A0A]">
      <StarBackground />

      <div className="w-full max-w-4xl bg-[#111214]/90 backdrop-blur-md border border-white/10 rounded-3xl p-10 relative z-10 shadow-2xl">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
              ClawLink Terminal
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Operator: {session?.user?.name} {hasExistingConfig ? " | Status: Active" : " | Status: Setup Required"}
            </p>
          </div>
          <button 
            onClick={() => {
              import("next-auth/react").then((m) => m.signOut({ callbackUrl: '/' }));
            }} 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>

        {hasExistingConfig ? (
          // --- ACTIVE SERVER VIEW ---
          <div className="space-y-6 animate-fade-in">
            <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl flex items-center gap-6">
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-green-500 animate-ping absolute"></div>
                <div className="w-6 h-6 rounded-full bg-green-500 relative"></div>
              </div>
              <div>
                <h2 className="text-green-400 font-bold text-2xl">ClawLink Agent is Live 🚀</h2>
                <p className="text-gray-300 mt-1 text-lg">Your {selectedModel} AI is actively routed via {selectedChannel}.</p>
                <p className="text-gray-500 text-sm mt-2">All systems operating nominally.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setHasExistingConfig(false)}
              className="mt-6 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
            >
              Reconfigure Agents / Update Keys
            </button>
          </div>
        ) : (
          // --- CONFIGURATION VIEW ---
          <div className="space-y-10 animate-fade-in">
            
            {/* Platform Selection */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Models */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">1. Select AI Engine</label>
                <div className="flex flex-col gap-3">
                  <div onClick={() => setSelectedModel("gemini")} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === "gemini" ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700 bg-black"}`}>
                    <div className="font-bold text-white flex justify-between"><span>✨ Gemini Pro</span> {selectedModel === "gemini" && <span className="text-blue-400">✓</span>}</div>
                  </div>
                  <div onClick={() => setSelectedModel("gpt-5.2")} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === "gpt-5.2" ? "border-green-500 bg-green-500/10" : "border-gray-800 hover:border-gray-700 bg-black"}`}>
                    <div className="font-bold text-white flex justify-between"><span>⚡ GPT-4o</span> {selectedModel === "gpt-5.2" && <span className="text-green-400">✓</span>}</div>
                  </div>
                  <div onClick={() => setSelectedModel("claude")} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedModel === "claude" ? "border-orange-500 bg-orange-500/10" : "border-gray-800 hover:border-gray-700 bg-black"}`}>
                    <div className="font-bold text-white flex justify-between"><span>🧠 Claude 3.5</span> {selectedModel === "claude" && <span className="text-orange-400">✓</span>}</div>
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">2. Select Deployment App</label>
                <div className="flex flex-col gap-3">
                  <div onClick={() => setSelectedChannel("telegram")} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${selectedChannel === "telegram" ? "border-[#2AABEE] bg-[#2AABEE]/10" : "border-gray-800 hover:border-gray-700 bg-black"}`}>
                    <div className="text-2xl">✈️</div>
                    <div className="font-bold text-white">Telegram Bot</div>
                  </div>
                  <div onClick={() => setSelectedChannel("whatsapp")} className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 border-gray-800 bg-black opacity-50 cursor-not-allowed`}>
                    <div className="text-2xl">💬</div>
                    <div>
                      <div className="font-bold text-white">WhatsApp</div>
                      <div className="text-xs text-green-400">Coming Soon</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Key Config */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">API Configuration</h2>
              
              {selectedModel === "gpt-5.2" && (
                <input type="password" placeholder="OpenAI Key (sk-proj-...)" value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none" />
              )}
              {selectedModel === "claude" && (
                <input type="password" placeholder="Anthropic Key (sk-ant-...)" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-orange-500 outline-none" />
              )}
              {selectedModel === "gemini" && (
                <input type="password" placeholder="Google Gemini Key (AIza...)" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              )}
            </div>

            {/* Telegram App Config with Live Validation & Magic Button */}
            {selectedChannel === "telegram" && (
              <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-blue-300">Telegram Bot Setup</h2>
                  <a href="https://t.me/BotFather?start=newbot" target="_blank" rel="noopener noreferrer" className="bg-[#2AABEE] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#2298D6]">
                    Get Token in 1-Click 🚀
                  </a>
                </div>
                
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Paste Telegram Bot Token here..."
                    value={telegramToken} 
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className={`w-full bg-black border-2 rounded-lg px-4 py-3 text-white outline-none transition-all ${
                      isValidToken === true ? "border-green-500" : 
                      isValidToken === false ? "border-red-500" : 
                      "border-gray-700 focus:border-[#2AABEE]"
                    }`}
                  />
                  {isValidToken === true && <span className="absolute right-4 top-3.5 text-green-500 font-bold">✅ Valid</span>}
                  {isValidToken === false && <span className="absolute right-4 top-3.5 text-red-500 font-bold">❌ Invalid Format</span>}
                </div>
              </div>
            )}

            {/* Deploy Action */}
            <div className="pt-4">
              <button 
                onClick={handleStartServer}
                disabled={isDeploying || (selectedChannel === "telegram" && !isValidToken)}
                className={`w-full font-bold text-lg py-4 rounded-xl transition-all ${
                  isDeploying 
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                    : (selectedChannel === "telegram" && !isValidToken) 
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-lg shadow-purple-500/25"
                }`}
              >
                {isDeploying ? "Deploying ClawLink..." : "Launch Advanced Agent ⚡"}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}