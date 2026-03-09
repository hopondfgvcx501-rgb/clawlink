"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StarBackground from "../../components/StarBackground";

const loadScript = (src: string) => {
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
  
  // States for Configuration
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [selectedChannel, setSelectedChannel] = useState("telegram");
  const [telegramToken, setTelegramToken] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [geminiKey, setGeminiKey] = useState("");

  // States for Billing
  const [tokensUsed, setTokensUsed] = useState(0);
  const [hasConfig, setHasConfig] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Load existing user data from database
  useEffect(() => {
    const fetchUserConfig = async () => {
      if (session?.user?.email) {
        const res = await fetch(`/api/config?email=${session.user.email}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTelegramToken(data.data.telegramToken || "");
          setGeminiKey(data.data.geminiKey || "");
          setTokensUsed(data.data.tokensUsed || 0);
          setHasConfig(true);
        }
      }
    };
    if (status === "authenticated") fetchUserConfig();
  }, [status, session]);

  const handleSave = async () => {
    setIsDeploying(true);
    const res = await fetch("/api/config", {
      method: "POST",
      body: JSON.stringify({
        email: session?.user?.email,
        selectedModel,
        selectedChannel,
        telegramToken,
        geminiKey,
        systemPrompt
      })
    });
    if (res.ok) {
      setHasConfig(true);
      alert("Deployment Active!");
    }
    setIsDeploying(false);
  };

  const handlePayment = async () => {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) return alert("Razorpay SDK failed to load");

    const orderRes = await fetch("/api/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ email: session?.user?.email, amount: 999, currency: "INR" })
    });
    const { order } = await orderRes.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "ClawLink Infrastructure",
      order_id: order.id,
      handler: () => alert("Payment Successful!"),
      prefill: { email: session?.user?.email }
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (status === "loading") return <div className="text-white text-center mt-20">Loading ClawLink...</div>;

  return (
    <main className="min-h-screen p-10 bg-[#0A0A0A] text-white font-sans relative">
      <StarBackground />
      <div className="max-w-4xl mx-auto z-10 relative">
        <h1 className="text-3xl font-bold mb-2">ClawLink Workspace</h1>
        <p className="text-gray-500 mb-8">{session?.user?.email} • {hasConfig ? "System Online" : "Configuration Needed"}</p>

        {/* 1. Usage Tracker */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-medium">AI Compute Usage</h2>
            <p className="text-2xl font-bold">{tokensUsed.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ 50,000 Words</span></p>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${(tokensUsed / 50000) * 100}%` }}></div>
          </div>
          <button onClick={handlePayment} className="mt-4 text-blue-400 text-sm hover:underline">Upgrade Limits (₹999) →</button>
        </div>

        {/* 2. Configuration */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <label className="text-xs uppercase text-gray-500 font-bold">AI Model</label>
            <select className="w-full bg-transparent border-b border-white/20 py-2 mt-2 outline-none" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option value="gemini">Google Gemini</option>
              <option value="gpt-4">OpenAI GPT-4</option>
            </select>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <label className="text-xs uppercase text-gray-500 font-bold">Channel</label>
            <select className="w-full bg-transparent border-b border-white/20 py-2 mt-2 outline-none" value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}>
              <option value="telegram">Telegram Bot</option>
              <option value="whatsapp">WhatsApp (Beta)</option>
            </select>
          </div>
        </div>

        {/* 3. Credentials */}
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <label className="text-xs uppercase text-gray-500 font-bold">Telegram Bot Token</label>
            <input type="password" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="00000:AAAAA..." className="w-full bg-transparent border-b border-white/20 py-2 mt-2 outline-none" />
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <label className="text-xs uppercase text-gray-500 font-bold">AI Personality</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} className="w-full bg-transparent border border-white/10 p-2 mt-2 rounded outline-none" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-white text-black font-bold py-4 rounded-xl mt-10 hover:bg-gray-200 transition-all">
          {isDeploying ? "Deploying..." : "Deploy Configuration"}
        </button>
      </div>
    </main>
  );
}