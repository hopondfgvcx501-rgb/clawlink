"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarBackground from "../../components/StarBackground";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 1. Configuration Selections
  const [selectedModel, setSelectedModel] = useState("gpt-5.2");
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

  // Security Check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch Existing Config on Load
  useEffect(() => {
    const fetchConfig = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/config?email=${session.user.email}`);
          const data = await res.json();
          if (data.success && data.data) {
            // Restore selections
            if (data.data.selectedModel) setSelectedModel(data.data.selectedModel);
            if (data.data.selectedChannel) setSelectedChannel(data.data.selectedChannel);
            
            // Restore keys
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
    return <div className="min-h-screen flex items-center justify-center text-white font-mono">Loading ClawLink Infrastructure...</div>;
  }

  // Save Function
  const handleStartServer = async () => {
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
    <main className="min-h-screen flex flex-col items-center pt-20 px-4 relative font-sans pb-20">
      <StarBackground />

      <div className="w-full max-w-4xl bg-[#111214] border border-white/10 rounded-2xl p-10 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome, {session?.user?.name}</h1>
            <p className="text-green-400 text-sm font-medium">
              {hasExistingConfig ? "● Server Active & Running" : "● Payment Verified - Server Ready for Configuration"}
            </p>
          </div>
          <button 
            onClick={() => {
              import("next-auth/react").then((m) => m.signOut({ callbackUrl: '/' }));
            }} 
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>

        {hasExistingConfig ? (
          // --- ACTIVE SERVER VIEW ---
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
              <div>
                <h2 className="text-green-400 font-bold text-lg">Agent is Online</h2>
                <p className="text-gray-400 text-sm">Your {selectedModel} model is actively listening on {selectedChannel}.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setHasExistingConfig(false)}
              className="mt-4 text-sm text-gray-400 hover:text-white underline underline-offset-4"
            >
              Update API Keys or Change Platform
            </button>
          </div>
        ) : (
          // --- CONFIGURATION VIEW ---
          <div className="space-y-10">
            
            {/* Platform Selection */}
            <div className="grid md:grid-cols-2 gap-8 p-6 bg-[#1A1A1A]/50 rounded-xl border border-white/5">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Select AI Engine</label>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="gpt-5.2">OpenAI (GPT-5.2 / GPT-4o)</option>
                  <option value="claude">Anthropic (Claude Opus / Sonnet)</option>
                  <option value="gemini">Google (Gemini Flash / Pro)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Select App Channel</label>
                <select 
                  value={selectedChannel} 
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="telegram">Telegram Bot</option>
                  <option value="whatsapp">WhatsApp Business API</option>
                </select>
              </div>
            </div>

            {/* Dynamic AI Keys */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">1. Connect AI Brain ({selectedModel})</h2>
              
              {selectedModel === "gpt-5.2" && (
                <input 
                  type="password" placeholder="OpenAI Key (sk-proj-...)"
                  value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                />
              )}
              
              {selectedModel === "claude" && (
                <input 
                  type="password" placeholder="Anthropic Key (sk-ant-...)"
                  value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                />
              )}

              {selectedModel === "gemini" && (
                <input 
                  type="password" placeholder="Google Gemini Key (AIza...)"
                  value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                />
              )}
            </div>

            {/* Dynamic App Keys */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">2. Connect App Channel ({selectedChannel})</h2>
              
              {selectedChannel === "telegram" && (
                <input 
                  type="password" placeholder="Telegram Bot Token (e.g., 12345:ABCdef...)"
                  value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                />
              )}

              {selectedChannel === "whatsapp" && (
                <div className="space-y-4">
                  <input 
                    type="password" placeholder="WhatsApp Access Token (EAA...)"
                    value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                  />
                  <input 
                    type="text" placeholder="WhatsApp Phone Number ID (e.g., 1029384756)"
                    value={whatsappPhoneId} onChange={(e) => setWhatsappPhoneId(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/20 rounded-lg px-4 py-3 text-white focus:border-green-500 transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="pt-6">
              <button 
                onClick={handleStartServer}
                disabled={isDeploying}
                className={`w-full text-black font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] ${isDeploying ? 'bg-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-200'}`}
              >
                {isDeploying ? "Deploying Server..." : "Start OpenClaw Server"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}