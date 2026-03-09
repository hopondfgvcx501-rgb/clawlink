"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarBackground from "../../components/StarBackground";

const loadRazorpay = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function ClawLinkDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Configuration States
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  const [telegramToken, setTelegramToken] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are an advanced AI assistant.");

  // Billing & Usage States
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(50000); 
  const [userCurrency, setUserCurrency] = useState("USD");
  const [planPrice, setPlanPrice] = useState(29);

  // UI States
  const [isDeploying, setIsDeploying] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Geo-Pricing Detection
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.country_code === "IN") {
          setUserCurrency("INR");
          setPlanPrice(999);
        } else {
          setUserCurrency("USD");
          setPlanPrice(29);
        }
      } catch (e) { console.warn("Geo-Pricing fallback to USD."); }
    };
    fetchGeo();
  }, []);

  // Sync Workspace Data
  useEffect(() => {
    const syncWorkspace = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/config?email=${session.user.email}`);
          const result = await res.json();
          if (result.success && result.data) {
            setTelegramToken(result.data.telegramToken || "");
            setWhatsappToken(result.data.whatsappToken || "");
            setWhatsappPhoneId(result.data.whatsappPhoneId || "");
            setSystemPrompt(result.data.systemPrompt || "You are an AI assistant.");
            setTokensUsed(result.data.tokensUsed || 0);
            setTokenLimit(result.data.tokenLimit || 50000);
          }
        } catch (err) { console.error("Workspace sync failed."); }
        finally { setIsFetching(false); }
      }
    };
    if (status === "authenticated") syncWorkspace();
  }, [status, session]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          selectedModel,
          selectedChannel,
          telegramToken,
          whatsappToken,
          whatsappPhoneId,
          systemPrompt
        }),
      });
      alert("Deployment Success! Your configuration is live.");
    } catch (e) { alert("Deployment Error."); }
    finally { setIsDeploying(false); }
  };

  const handleUpgrade = async () => {
    const isSDKLoaded = await loadRazorpay("https://checkout.razorpay.com/v1/checkout.js");
    if (!isSDKLoaded) return alert("Payment Gateway failed to load.");

    const orderReq = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session?.user?.email,
        amount: planPrice,
        currency: userCurrency,
        planName: "Business Pro"
      })
    });
    const { order } = await orderReq.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "ClawLink Infrastructure",
      description: "Upgrade Word Quota to 500,000",
      order_id: order.id,
      handler: (response: any) => { alert("Payment Captured! Quota will refresh."); },
      prefill: { email: session?.user?.email },
      theme: { color: "#3B82F6" }
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (status === "loading" || isFetching) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 font-mono tracking-tighter">BOOTING CLAWLINK...</div>;

  const usagePercent = Math.min((tokensUsed / tokenLimit) * 100, 100);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12 relative font-sans">
      <StarBackground />
      <div className="max-w-4xl mx-auto z-10 relative">
        
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">ClawLink Workspace</h1>
            <p className="text-gray-500 text-sm mt-1">{session?.user?.email} • <span className="text-green-500">System Online</span></p>
          </div>
          <button onClick={() => import("next-auth/react").then(m => m.signOut())} className="text-xs text-gray-600 hover:text-white transition-colors uppercase font-bold">Logout</button>
        </div>

        {/* AI Usage Tracker */}
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl shadow-2xl mb-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold">AI Word Consumption</h3>
              <p className="text-gray-500 text-xs">Total tokens used across Telegram and WhatsApp.</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black">{tokensUsed.toLocaleString()}</span>
              <span className="text-gray-600 text-sm ml-2">/ {tokenLimit.toLocaleString()} Words</span>
            </div>
          </div>
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-700 ${usagePercent > 80 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${usagePercent}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Plan: {tokenLimit > 50000 ? 'Business Pro' : 'Starter'}</p>
            <button onClick={handleUpgrade} className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-6 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
              Upgrade Limits ({userCurrency === 'INR' ? '₹' : '$'}{planPrice})
            </button>
          </div>
        </div>

        {/* Config Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
            <label className="text-[10px] font-black text-gray-500 uppercase">AI Model Provider</label>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-3 text-sm outline-none mt-2">
              <option value="gemini">Google Gemini 1.5</option>
              <option value="gpt-4">OpenAI GPT-4o</option>
            </select>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
            <label className="text-[10px] font-black text-gray-500 uppercase">Active Channel</label>
            <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-3 text-sm outline-none mt-2">
              <option value="telegram">Telegram Bot API</option>
              <option value="whatsapp">WhatsApp Business API</option>
            </select>
          </div>
        </div>

        {/* Dynamic Inputs Based on Channel */}
        <div className="bg-[#111] p-8 rounded-2xl border border-white/5 mb-8">
          {selectedChannel === "telegram" ? (
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase">Telegram Bot Token</label>
              <input type="password" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder="0000:AAAAA..." className="w-full bg-transparent border-b border-white/10 py-3 text-sm outline-none mt-2 focus:border-blue-500 transition-all" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase">WhatsApp Access Token</label>
                <input type="password" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} placeholder="EAAG..." className="w-full bg-transparent border-b border-white/10 py-3 text-sm outline-none mt-2 focus:border-blue-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase">Phone Number ID</label>
                <input type="text" value={whatsappPhoneId} onChange={e => setWhatsappPhoneId(e.target.value)} placeholder="105..." className="w-full bg-transparent border-b border-white/10 py-3 text-sm outline-none mt-2 focus:border-blue-500 transition-all" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 mb-10">
          <label className="text-[10px] font-black text-gray-500 uppercase">Global System Prompt</label>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4} className="w-full bg-black/50 border border-white/5 rounded-xl p-4 mt-4 text-sm outline-none focus:border-blue-500/50 resize-none" />
        </div>

        <button onClick={handleDeploy} disabled={isDeploying} className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-sm">
          {isDeploying ? "Deploying Configuration..." : "Synchronize Channels"}
        </button>

      </div>
    </main>
  );
}