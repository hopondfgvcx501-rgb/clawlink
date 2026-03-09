"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarBackground from "../../components/StarBackground";

export default function ClawLinkDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 1. Core Configuration States
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedChannel, setSelectedChannel] = useState("telegram");

  // 2. AI Personality State (The New Feature)
  const [systemPrompt, setSystemPrompt] = useState("You are an advanced AI assistant deployed via ClawLink. Provide helpful, concise, and accurate responses.");

  // 3. API Key States
  const [telegramToken, setTelegramToken] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  // 4. UI & Validation States
  const [isDeploying, setIsDeploying] = useState(false); 
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Telegram Token Format Validation
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

  // Authentication Protection
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch Existing Configuration on Load
  useEffect(() => {
    const fetchConfig = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/config?email=${session.user.email}`);
          const data = await res.json();
          if (data.success && data.data) {
            if (data.data.selectedModel) setSelectedModel(data.data.selectedModel);
            if (data.data.selectedChannel) setSelectedChannel(data.data.selectedChannel);
            if (data.data.systemPrompt) setSystemPrompt(data.data.systemPrompt); // Load Personality
            
            if (data.data.telegramToken) setTelegramToken(data.data.telegramToken);
            if (data.data.whatsappToken) setWhatsappToken(data.data.whatsappToken);
            if (data.data.whatsappPhoneId) setWhatsappPhoneId(data.data.whatsappPhoneId);
            if (data.data.openAIKey) setOpenAIKey(data.data.openAIKey);
            if (data.data.anthropicKey) setAnthropicKey(data.data.anthropicKey);
            if (data.data.geminiKey) setGeminiKey(data.data.geminiKey);
            
            setHasExistingConfig(true);
          }
        } catch (error) {
          console.error("Failed to load existing workspace configuration.");
        } finally {
          setIsFetching(false);
        }
      }
    };
    if (status === "authenticated") fetchConfig();
  }, [status, session]);

  // Loading Screen
  if (status === "loading" || isFetching) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-400 text-sm font-mono tracking-widest uppercase">Initializing Workspace...</div>;
  }

  // Handle Deployment & Save to Supabase
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
          systemPrompt, // Save Personality to Backend
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
        alert("Configuration deployment failed. Please try again.");
      }
    } catch (error) {
      alert("Network error. Please verify your connection.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 px-4 relative font-sans pb-20 bg-[#0A0A0A] text-gray-200">
      <StarBackground />

      <div className="w-full max-w-4xl bg-[#111111]/95 backdrop-blur-md border border-white/5 rounded-2xl p-10 relative z-10 shadow-2xl">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
              ClawLink Workspace
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <span>{session?.user?.email}</span>
              <span className="text-gray-700">•</span>
              <span className={hasExistingConfig ? "text-green-500" : "text-amber-500"}>
                {hasExistingConfig ? "System Online" : "Configuration Required"}
              </span>
            </p>
          </div>
          <button 
            onClick={() => {
              import("next-auth/react").then((m) => m.signOut({ callbackUrl: '/' }));
            }} 
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>

        {hasExistingConfig ? (
          // --- ACTIVE SERVER VIEW ---
          <div className="space-y-6 animate-fade-in">
            <div className="bg-black border border-white/5 p-8 rounded-xl flex items-center gap-6">
              <div className="relative flex items-center justify-center w-10 h-10">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-ping absolute"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 relative"></div>
              </div>
              <div>
                <h2 className="text-white font-medium text-lg tracking-tight">Deployment Active</h2>
                <p className="text-gray-400 text-sm mt-1">Traffic is currently routing to <span className="text-gray-200 font-medium">{selectedModel}</span> via <span className="text-gray-200 font-medium">{selectedChannel}</span>.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setHasExistingConfig(false)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Modify Configuration &rarr;
            </button>
          </div>
        ) : (
          // --- CONFIGURATION VIEW ---
          <div className="space-y-10 animate-fade-in">
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Models */}
              <div className="space-y-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Provider Selection</label>
                <div className="flex flex-col gap-3">
                  <div onClick={() => setSelectedModel("gemini")} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedModel === "gemini" ? "border-gray-400 bg-white/5" : "border-white/5 hover:border-white/10 bg-black"}`}>
                    <div className="font-medium text-sm text-gray-200 flex justify-between"><span>Google Gemini</span> {selectedModel === "gemini" && <span className="text-white">✓</span>}</div>
                  </div>
                  <div onClick={() => setSelectedModel("gpt-5.2")} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedModel === "gpt-5.2" ? "border-gray-400 bg-white/5" : "border-white/5 hover:border-white/10 bg-black"}`}>
                    <div className="font-medium text-sm text-gray-200 flex justify-between"><span>OpenAI GPT-4</span> {selectedModel === "gpt-5.2" && <span className="text-white">✓</span>}</div>
                  </div>
                  <div onClick={() => setSelectedModel("claude")} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedModel === "claude" ? "border-gray-400 bg-white/5" : "border-white/5 hover:border-white/10 bg-black"}`}>
                    <div className="font-medium text-sm text-gray-200 flex justify-between"><span>Anthropic Claude</span> {selectedModel === "claude" && <span className="text-white">✓</span>}</div>
                  </div>
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Integration Channel</label>
                <div className="flex flex-col gap-3">
                  <div onClick={() => setSelectedChannel("telegram")} className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${selectedChannel === "telegram" ? "border-blue-500/50 bg-blue-500/5" : "border-white/5 hover:border-white/10 bg-black"}`}>
                    <div className="font-medium text-sm text-gray-200">Telegram API</div>
                    {selectedChannel === "telegram" && <span className="text-blue-400 text-sm">Active</span>}
                  </div>
                  <div className={`p-4 rounded-lg border transition-all flex justify-between items-center border-white/5 bg-black opacity-40 cursor-not-allowed`}>
                    <div className="font-medium text-sm text-gray-200">WhatsApp Business</div>
                    <span className="text-gray-500 text-xs">Beta</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Key Config */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Provider Credentials</label>
              
              {selectedModel === "gpt-5.2" && (
                <input type="password" placeholder="sk-proj-..." value={openAIKey} onChange={(e) => setOpenAIKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-gray-400 outline-none transition-colors" />
              )}
              {selectedModel === "claude" && (
                <input type="password" placeholder="sk-ant-..." value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-gray-400 outline-none transition-colors" />
              )}
              {selectedModel === "gemini" && (
                <input type="password" placeholder="AIzaSy..." value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-gray-400 outline-none transition-colors" />
              )}
            </div>

            {/* AI Personality Config (New Feature) */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Agent Personality (System Prompt)</label>
              </div>
              <textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="e.g., You are a highly professional customer support agent..."
                rows={3}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-gray-400 outline-none transition-colors resize-none"
              />
              <p className="text-xs text-gray-600">Instruct your AI on how to behave, respond, and its core objectives.</p>
            </div>

            {/* Telegram App Config */}
            {selectedChannel === "telegram" && (
              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bot Token Validation</label>
                  <a href="https://t.me/BotFather?start=newbot" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Generate via BotFather &nearr;
                  </a>
                </div>
                
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Enter Telegram Bot Token"
                    value={telegramToken} 
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className={`w-full bg-black border rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors ${
                      isValidToken === true ? "border-green-500/50" : 
                      isValidToken === false ? "border-red-500/50" : 
                      "border-white/10 focus:border-blue-500/50"
                    }`}
                  />
                  {isValidToken === true && <span className="absolute right-4 top-3.5 text-green-500 text-xs font-medium">Verified</span>}
                  {isValidToken === false && <span className="absolute right-4 top-3.5 text-red-500 text-xs font-medium">Invalid Format</span>}
                </div>
              </div>
            )}

            {/* Deploy Action */}
            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={handleStartServer}
                disabled={isDeploying || (selectedChannel === "telegram" && !isValidToken)}
                className={`w-full font-medium text-sm py-3.5 rounded-lg transition-all ${
                  isDeploying 
                    ? "bg-white/10 text-gray-400 cursor-not-allowed" 
                    : (selectedChannel === "telegram" && !isValidToken) 
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:bg-gray-200"
                }`}
              >
                {isDeploying ? "Initializing Deployment..." : "Deploy Configuration"}
              </button>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}