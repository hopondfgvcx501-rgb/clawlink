"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Database, Zap, Save, 
  Receipt, Download, Smartphone, BrainCircuit, 
  MessageSquare, Search, Bell, ChevronDown, 
  ExternalLink, Bot, Users, ArrowUpRight, Crown,
  Radio, Copy, Check, Globe, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Script from "next/script";
import { loadStripe } from "@stripe/stripe-js"; // 🚀 STRIPE FRONTEND INTEGRATION

/* ─── 🚀 NEW MASTER PRICING CONFIG (FROM LATEST PDF - MARGIN 90%+) ────────── */
const PRICING_DATA: Record<string, any> = {
  gemini: {
    name: "Gemini (Google)",
    plans: [
      { id: "plus", name: "Plus", usd: 27, inr: 2268, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 109, inr: 9156, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 169, inr: 14196, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 2748, inr: 230832, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  "gpt-5.2": { 
    name: "GPT (OpenAI)",
    plans: [
      { id: "plus", name: "Plus", usd: 29, inr: 2436, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 199, inr: 16716, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 379, inr: 31836, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 5988, inr: 502992, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  claude: {
    name: "Claude (Anthropic)",
    plans: [
      { id: "plus", name: "Plus", usd: 47, inr: 3948, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 269, inr: 22596, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 449, inr: 37716, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 6948, inr: 583632, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  omni: {
    name: "OmniAgent Bundle",
    plans: [
      { id: "monthly", name: "Pro Bundle", usd: 249, inr: 20916, msgs: "Smart Matrix", desc: "Elite multi-persona integration. 3x Fallback.", accent: "#00BFFF", color: "text-[#00BFFF]" },
      { id: "yearly", name: "Adv Premium", usd: 4548, inr: 382032, msgs: "Zero Downtime", desc: "Ultimate auto-routing & global priority access.", accent: "#BA7517", color: "text-[#BA7517]", badge: "Yearly ⭐", isYearly: true }
    ]
  }
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false); 
  
  const [selectedChannel, setSelectedChannel] = useState("widget"); 
  const [channelPrompts, setChannelPrompts] = useState({
    widget: "",
    telegram: "",
    whatsapp: ""
  });
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  // 🚀 RENEWAL MODAL STATES
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedRenewalPlan, setSelectedRenewalPlan] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  const [knowledgeText, setKnowledgeText] = useState("");
  const [isInjecting, setIsInjecting] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);

  // CURRENCY LOGIC
  const [currency, setCurrency] = useState<"USD"|"INR">("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    // 🛡️ KNOX CLIENT SECURITY PROTOCOL: Prevent unauthorized devtools sniffing
    if (typeof window !== "undefined") {
      document.addEventListener("contextmenu", (e) => e.preventDefault());
      console.log("%c STOP!", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000;");
      console.log("%c CLAWLINK ENTERPRISE SECURITY: Unauthorized access to backend structure is strictly prohibited.", "color: white; background: red; font-size: 16px; padding: 4px; border-radius: 4px;");
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lang = navigator.language || "";
      if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("Asia/Colombo") || lang.includes("-IN") || lang === "hi") { 
        setCurrency("INR"); 
        setCurrencySymbol("₹"); 
      } else {
        setCurrency("USD");
        setCurrencySymbol("$");
      }
    } catch {}

    if (session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setUserData(data.data);
            const activeChan = data.data.selected_channel || "widget";
            setSelectedChannel(activeChan);
            setChannelPrompts({
              widget: data.data.system_prompt_widget || data.data.system_prompt || "",
              telegram: data.data.system_prompt_telegram || "",
              whatsapp: data.data.system_prompt_whatsapp || ""
            });
            // Set default selected plan in modal to user's current plan
            if (data.data.plan) {
                setSelectedRenewalPlan(data.data.plan.toLowerCase());
            }
          }
        })
        .catch(console.error);

      fetch(`/api/billing?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBillingHistory(data.data);
          }
        })
        .catch(console.error);

      fetch(`/api/analytics?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success) setStats(data.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));

      fetchKnowledge();
    }
  }, [session, status, router]);

  const fetchKnowledge = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await fetch(`/api/knowledge?email=${session.user.email}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setKnowledgeItems(data.data);
    } catch (e) {
      console.error("Failed to fetch knowledge");
    }
  };

  const exactModel = (userData?.selected_model || userData?.ai_provider || "gpt-5.2").toLowerCase();
  
  let pricingKey = "gpt-5.2";
  if (exactModel.includes("omni") || exactModel.includes("multi_model") || exactModel.includes("nexus")) pricingKey = "omni";
  else if (exactModel.includes("claude") || exactModel.includes("anthropic")) pricingKey = "claude";
  else if (exactModel.includes("gemini") || exactModel.includes("google")) pricingKey = "gemini";

  const isOmniActive = pricingKey === "omni";
  const currentPricing = PRICING_DATA[pricingKey] || PRICING_DATA["gpt-5.2"];
  const activePlanObj = currentPricing.plans.find((p: any) => p.id === selectedRenewalPlan) || currentPricing.plans[0];

  const handleRenewalPayment = async () => {
    if (!session?.user?.email) return;
    setIsRenewing(true);

    if (currency === "INR") {
      try {
        const amount = activePlanObj.inr;

        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: session.user.email,
            planName: activePlanObj.id, 
            planType: "RENEWAL", 
            amount: amount,
            currency: currency,
            notes: {
              email: session.user.email,
              plan_name: activePlanObj.id,
              is_renewal: "true",
              telegram_token: userData?.telegram_token || "",
              whatsapp_phone_id: userData?.whatsapp_phone_id || "",
              whatsapp_number: userData?.whatsapp_number || "",
              selected_channel: userData?.selected_channel || "widget"
            }
          }),
        });
        
        const orderData = await res.json();
        
        if (!orderData.orderId && !orderData.id) throw new Error("Order creation failed");
        
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "ClawLink AI",
          description: `Renewing to ${activePlanObj.name.toUpperCase()} Plan`,
          order_id: orderData.orderId || orderData.id,
          handler: function (response: any) {
            alert("Payment Successful! Your AI Agent has been upgraded/renewed.");
            window.location.reload();
          },
          prefill: {
            email: session.user.email,
            name: session.user.name || "Agent",
          },
          theme: { color: "#f97316" },
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setShowPlanModal(false); 
      } catch (error) {
        console.error("Renewal Error:", error);
        alert("Failed to initiate payment. Please check your connection.");
      } finally {
        setIsRenewing(false);
      }
    } else {
      // 🚀 STRIPE PAYMENT FOR GLOBAL USERS WITH ULTIMATE TS BYPASS
      try {
        const res = await fetch("/api/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planTier: activePlanObj.id,
            email: session.user.email,
            amount: activePlanObj.usd,
            currency: currency.toLowerCase(),
            model: exactModel,
            isRenewal: true
          }),
        });
        
        const data = await res.json();
        
        if (data.sessionId) {
          const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
          const stripe = await loadStripe(stripeKey);
          
          if (stripe) {
            // Force bypass any TypeScript errors on redirectToCheckout
            const checkoutStripe = stripe as any;
            const result = await checkoutStripe.redirectToCheckout({ sessionId: data.sessionId });
            if (result && result.error) {
              alert("Stripe Checkout Error: " + result.error.message);
            }
          } else {
            alert("Stripe failed to initialize. Please check your network connection.");
          }
        } else {
          alert("Stripe Error: " + data.error);
        }
      } catch (error) {
        alert("Stripe initialization failed.");
      } finally {
        setIsRenewing(false);
      }
    }
  };

  const handlePromptChange = (e: any) => {
    setChannelPrompts({ ...channelPrompts, [selectedChannel]: e.target.value });
  };

  const handleSavePrompt = async () => {
    if (!session?.user?.email) return;
    setIsSavingPrompt(true);
    
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: session.user.email, 
          systemPrompt: channelPrompts[selectedChannel as keyof typeof channelPrompts],
          channel: selectedChannel,
          telegram_token: userData?.telegram_token,
          whatsapp_phone_id: userData?.whatsapp_phone_id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Bot persona for ${selectedChannel.toUpperCase()} updated successfully!`);
      } else {
        alert("Failed to update persona.");
      }
    } catch (error) {
      alert("Network error while saving persona.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleInjectKnowledge = async () => {
    if (!knowledgeText.trim() || !session?.user?.email) return;
    setIsInjecting(true);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, text: knowledgeText })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Knowledge successfully embedded into AI Brain!");
        setKnowledgeText("");
        fetchKnowledge();
      } else {
        alert("Failed to inject knowledge: " + data.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsInjecting(false);
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice #${invoice.razorpay_order_id || invoice.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #07070A; color: #E8E8EC; padding: 40px; }
            .container { max-width: 650px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; background: #111113; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 24px; }
            .total { font-size: 36px; font-weight: 900; color: #f97316; }
            .details p { margin: 10px 0; color: #9ca3af; font-size: 14px; }
            .details strong { color: #f3f4f6; }
            .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <svg width="150" height="26" viewBox="0 0 152 26" fill="none">
                <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
                <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
                <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
                <text x="30" y="18" font-family="sans-serif" font-size="14.5" font-weight="800" letter-spacing="1.4" fill="#fff">LAWLINK</text>
                <text x="116" y="18" font-family="sans-serif" font-size="9.5" font-weight="700" letter-spacing=".7" fill="#f97316">.COM</text>
              </svg>
              <div style="text-align:right">
                <h2 style="margin:0;font-size:26px;font-weight:900;color:#fff;letter-spacing:1px;">INVOICE</h2>
                <p style="margin:6px 0 0;color:#6b7280;font-size:12px;font-family:monospace;">#${invoice.razorpay_order_id || invoice.id}</p>
              </div>
            </div>
            <div class="details">
              <p><strong>Billed To:</strong> ${invoice.email}</p>
              <p><strong>Date Issued:</strong> ${new Date(invoice.created_at).toLocaleString()}</p>
              <p><strong>Plan Subscribed:</strong> <span style="text-transform:uppercase;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);">${invoice.plan_name?.toUpperCase() || 'UNKNOWN'}</span></p>
              <p><strong>Payment Status:</strong> <span style="color:#22c55e;font-weight:bold;letter-spacing:1px;">${invoice.status?.toUpperCase() || 'PAID'}</span></p>
            </div>
            <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <p style="margin:0;color:#9ca3af;font-size:12px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Total Amount Paid</p>
                <p style="margin:0;color:#6b7280;font-size:11px;">Includes all applicable taxes</p>
              </div>
              <span class="total">${invoice.amount} ${invoice.currency?.toUpperCase() || 'USD'}</span>
            </div>
            <div class="footer">
              <p>Thank you for choosing ClawLink Enterprise AI.</p>
              <p>This is a computer-generated document and requires no signature.</p>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 500); }</script>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const webChatScript = `<script src="https://www.clawlinkai.com/api/widget?id=${session?.user?.email}" defer></script>`;

  const copyToClipboard = (t: string) => { navigator.clipboard.writeText(t); alert("Copied!"); };

  const copyScript = () => {
    navigator.clipboard.writeText(webChatScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  if (isLoading || status === "loading") {
    return (
      <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center text-orange-500 font-mono">
        <Activity className="w-10 h-10 animate-spin mb-4" />
        LOADING COMMAND CENTER...
      </div>
    );
  }

  const currentPlan = userData?.plan?.toLowerCase() || "starter";
  const isPremium = currentPlan === "pro" || currentPlan === "professional" || currentPlan === "max" || currentPlan === "maximum" || currentPlan === "monthly" || currentPlan === "yearly" || currentPlan.includes("ultra") || currentPlan === "adv_max" || currentPlan === "plus";
  const totalMsgs = (stats?.platformStats?.whatsapp || 0) + (stats?.platformStats?.telegram || 0) + (stats?.platformStats?.web || 0);

  const getModelDisplayName = () => {
    if (isOmniActive) return "🌌 Omni 3 Nexus";
    if (pricingKey === "claude") return "Claude 3 (Opus 4.6)";
    if (pricingKey === "gemini") return "Gemini 3 (Flash)";
    if (pricingKey === "gpt-5.2" || exactModel.includes("gpt") || exactModel.includes("openai")) return "GPT-5.2 (Turbo)";
    return "NOT SET";
  };

  // 🚀 STRICT VERIFICATION: Reads EXACT channel user selected in DB
  const exactSelectedChannel = (userData?.selected_channel || "").toLowerCase();
  
  // 🚀 STRICT VERIFICATION: Ensure tokens actually exist (Proof of Setup)
  const hasTgToken = !!userData?.telegram_token && userData?.telegram_token !== "";
  const hasWaId = !!userData?.whatsapp_phone_id && userData?.whatsapp_phone_id !== "";

  const getPrimaryLiveChannel = () => {
      // 1. If user explicitly selected TELEGRAM in setup
      if (exactSelectedChannel === "telegram") {
          return { 
              name: "Telegram Bot", 
              bgLight: "bg-blue-500/5", 
              bgHover: "group-hover:bg-blue-500/10", 
              dot: hasTgToken ? "bg-blue-400 animate-pulse" : "bg-yellow-500", // Yellow if missing setup
              text: "text-blue-400", 
              border: "border-blue-500/20", 
              iconBg: "bg-blue-500/10",
              isLive: hasTgToken
          };
      }
      
      // 2. If user explicitly selected WHATSAPP in setup
      if (exactSelectedChannel === "whatsapp") {
          return { 
              name: "WhatsApp Cloud", 
              bgLight: "bg-green-500/5", 
              bgHover: "group-hover:bg-green-500/10", 
              dot: hasWaId ? "bg-green-500 animate-pulse" : "bg-yellow-500", 
              text: "text-green-500", 
              border: "border-green-500/20", 
              iconBg: "bg-green-500/10",
              isLive: hasWaId
          };
      }

      // 3. If NO channel was selected (Setup completely skipped)
      return { 
          name: "Not Deployed Yet", 
          bgLight: "bg-gray-500/5", 
          bgHover: "group-hover:bg-gray-500/10", 
          dot: "bg-gray-600", 
          text: "text-gray-500", 
          border: "border-gray-500/20", 
          iconBg: "bg-gray-500/10",
          isLive: false
      };
  };
  const primaryChannel = getPrimaryLiveChannel();

  const handleOpenLiveBot = async () => {
    // Navigate based on strict verification
    if (exactSelectedChannel === "telegram" && hasTgToken) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${userData.telegram_token}/getMe`);
        const data = await res.json();
        if (data.ok && data.result.username) {
          window.open(`https://t.me/${data.result.username}`, "_blank");
          return;
        }
      } catch (e) {}
      window.open(`https://t.me/${userData?.tg_username || ""}`, "_blank"); 
    } else if (exactSelectedChannel === "whatsapp" && hasWaId) {
      if (userData?.whatsapp_number) {
        window.open(`https://api.whatsapp.com/send?phone=${userData.whatsapp_number.replace(/\D/g, '')}`, "_blank");
      } else {
        window.open("https://api.whatsapp.com/", "_blank"); 
      }
    } else {
      // If payment/setup pending, alert user or redirect to widget
      alert("⚠️ Your bot is not fully deployed yet. Please complete setup/payment.");
    }
  };

  const btn = "transition-all duration-[120ms] ease-out active:scale-[0.93] transform-gpu will-change-transform";

  return (
    <div className="w-full min-h-screen bg-[#07070A] text-[#E8E8EC] font-sans relative selection:bg-orange-500/30 overflow-y-auto custom-scrollbar flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* 🚀 THE DYNAMIC PLAN SELECTION MODAL */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-8 max-w-5xl w-full relative shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            >
              <button onClick={() => setShowPlanModal(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                  <Globe className="w-6 h-6 text-orange-500"/> SELECT YOUR DEPLOYMENT PLAN
                </h2>
                <p className="text-sm text-gray-400">Select a tier to securely renew or upgrade your <span className="text-white font-bold">{getModelDisplayName()}</span> engine.</p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-${currentPricing.plans.length} gap-6 mb-8 max-w-${isOmniActive ? '2xl' : '5xl'} mx-auto text-left`}>
                {currentPricing.plans.map((plan: any) => {
                  const isActive = activePlanObj?.id === plan.id;
                  return (
                    <div key={plan.id} data-spring onClick={() => !isRenewing && setSelectedRenewalPlan(plan.id)}
                      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-150 ${btn} ${isActive ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                      style={{
                        background: isActive ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isActive ? plan.accent : "rgba(255,255,255,0.07)"}`,
                        boxShadow: isActive ? `0 0 28px ${plan.accent}40` : "none"
                      }}>
                      {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-full tracking-widest" style={{ background: plan.accent }}>{plan.badge}</div>}
                      <h3 className={`font-bold uppercase text-[11px] tracking-widest mb-2 ${plan.color}`}>{plan.name}</h3>
                      <div className="text-[1.9rem] font-black text-white mb-2">{currencySymbol}{currency === "INR" ? plan.inr.toLocaleString() : plan.usd.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}>{plan.isYearly ? "/yr" : "/mo"}</span></div>
                      <p className="text-[11px] text-gray-400 leading-relaxed mb-3 h-8">{plan.desc}</p>
                      <span className="inline-block px-2 py-1 bg-white/5 rounded text-[10px] text-gray-300 border border-white/10">{plan.msgs}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleRenewalPayment} 
                  disabled={isRenewing}
                  className={`bg-white text-black hover:bg-gray-200 px-12 py-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 ${btn}`}
                >
                  {isRenewing ? "PROCESSING..." : `INITIALIZE PAYMENT — ${currencySymbol}${(currency === "INR" ? activePlanObj.inr : activePlanObj.usd).toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed top-[-20%] right-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(249,115,22,0.18) 0%,transparent 65%)",transform:"translateZ(0)"}}/>
      <div className="fixed bottom-[-20%] left-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0" style={{background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 65%)",transform:"translateZ(0)"}}/>

      <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#07070A]/70 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300">
        <div className="flex items-center gap-6">
          <svg width="130" height="22" viewBox="0 0 152 26" fill="none" className="shrink-0 cursor-pointer transition-transform hover:scale-105" onClick={() => router.push("/")}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff"/><stop offset="1" stopColor="rgba(255,255,255,.65)"/>
              </linearGradient>
            </defs>
            <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="rgba(255,255,255,.1)" strokeWidth="8" strokeLinecap="round" fill="none"/>
            <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="url(#cg)" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
            <text x="30" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="#fff">LAWLINK</text>
            <text x="116" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="9.5" fontWeight="700" letterSpacing=".7" fill="#f97316">.COM</text>
          </svg>
          
          <div className="hidden md:block border-l border-white/10 pl-6">
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Command Center</h1>
            <p className="text-xs text-gray-400 mt-1">Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}. Your AI fleet is active.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleOpenLiveBot}
            className={`hidden sm:flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.15)] ${btn}`}>
            <Bot className="w-4 h-4" /> OPEN YOUR LIVE AGENT <ExternalLink className="w-3 h-3 ml-1" />
          </button>
          <div className="hidden md:flex items-center bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search chats..." className="bg-transparent border-none outline-none text-sm ml-2 text-white placeholder-gray-600 w-32 font-mono" />
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full relative z-10 flex-1">
        
        <AnimatePresence>
          {showAppBanner && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{duration:0.2}}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3 text-blue-200 text-sm font-medium">
                <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p>For the optimal experience, click <strong className="text-white">"Add to Home Screen"</strong> in your browser menu to install the ClawLink Web App.</p>
              </div>
              <button onClick={() => setShowAppBanner(false)} className="text-gray-400 hover:text-white flex-shrink-0 bg-white/5 p-2 rounded-full">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl flex justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Current Plan</h3>
              <div className="flex flex-col items-start gap-2 mt-2">
                <p className="text-3xl font-black text-white font-serif uppercase tracking-wide leading-none">{currentPlan}</p>
                {isPremium && (
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded border border-orange-400/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    <Crown className="w-3 h-3"/> UNLIMITED TIER
                  </span>
                )}
                <button 
                  onClick={() => setShowPlanModal(true)} 
                  className={`mt-2 border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 ${btn}`}
                >
                  <Zap className="w-3 h-3"/> Upgrade / Renew
                </button>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 relative z-10">
              <Receipt className="w-6 h-6"/>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl flex justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active AI Brain</h3>
              <p className="text-2xl font-black text-white font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mt-2">
                {getModelDisplayName()}
              </p>
              {isOmniActive ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#00BFFF] rounded-full animate-pulse shadow-[0_0_8px_#00BFFF]"></span>
                  <span className="text-[#00BFFF] text-[9px] font-black tracking-widest uppercase">3x Matrix: GPT • Claude • Gemini</span>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 font-mono mt-1">Single-modal AI Engine</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 relative z-10">
              <BrainCircuit className="w-6 h-6"/>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl flex justify-between items-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className={`absolute top-0 right-0 w-32 h-32 ${primaryChannel.bgLight} rounded-full blur-3xl ${primaryChannel.bgHover} transition-colors`}></div>
            <div className="relative z-10 w-full">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Live Channels</h3>
              <div className="flex flex-col gap-2">
                  <div className={`flex items-center gap-2 text-sm font-bold ${primaryChannel.text === 'text-gray-500' ? 'text-gray-400 italic' : 'text-white'}`}>
                    {primaryChannel.dot && <span className={`w-2 h-2 ${primaryChannel.dot} rounded-full`}></span>} 
                    {primaryChannel.name}
                  </div>
                  {/* 🚀 STRICT VERIFICATION UI: Warns if setup/payment is pending */}
                  {exactSelectedChannel && (
                    <p className={`text-[10px] font-mono mt-1 ${primaryChannel.isLive ? 'text-green-500' : 'text-yellow-500'}`}>
                      {primaryChannel.isLive ? "✓ Verified & Live" : "⚠️ Pending Setup / Payment"}
                    </p>
                  )}
              </div>
            </div>
            <div className={`w-12 h-12 rounded-xl ${primaryChannel.iconBg} flex items-center justify-center ${primaryChannel.text} ${primaryChannel.border} border relative z-10 shrink-0`}>
              <Radio className="w-6 h-6"/>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.3, ease: "easeOut" }} className="bg-gradient-to-r from-[#111113] to-[#0a0a0c] border border-pink-500/20 p-6 md:p-8 rounded-[1.5rem] shadow-[0_0_30px_rgba(236,72,153,0.05)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 relative z-10">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-pink-500" /> Webchat Integration (Live)
            </h3>
            <p className="text-sm text-gray-400">Want this AI on your own website? Copy the script below and paste it just before the <code className="text-pink-400 bg-pink-500/10 px-1 rounded">&lt;/body&gt;</code> tag in your HTML code.</p>
          </div>

          <div className="w-full lg:w-1/2 relative z-10 group">
            <pre className="w-full bg-[#07070A] border border-white/10 p-4 rounded-xl text-xs text-pink-400 font-mono overflow-x-auto custom-scrollbar">
              {webChatScript}
            </pre>
            <button onClick={copyScript} className={`absolute top-2 right-2 p-2 bg-[#1A1A1A] hover:bg-[#222] border border-white/10 rounded-lg ${btn}`}>
              {copiedScript ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.4, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><Zap className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Capacity</span>
            </div>
            <h3 className="text-2xl font-black text-orange-400 relative z-10 mt-1">
              UNLIMITED TIER
            </h3>
            <p className="text-xs text-gray-400 mt-1 relative z-10">
              Enterprise Infrastructure Active
            </p>
            <div className="w-full bg-[#1A1A1A] h-1.5 mt-4 rounded-full overflow-hidden relative z-10">
              <div className={`h-full bg-orange-500/50 w-full`}></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.5, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20"><Users className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Leads</span>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">{stats?.totalLeads?.toLocaleString() || 0}</h3>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1 relative z-10"><ArrowUpRight className="w-3 h-3"/> Captured Automatically</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.6, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20"><MessageSquare className="w-5 h-5"/></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Traffic</span>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">{totalMsgs.toLocaleString()}</h3>
            <p className="text-xs text-gray-400 mt-1 relative z-10">Messages Processed</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.7, ease: "easeOut" }} className="lg:col-span-2 bg-[#111113] border border-white/5 p-6 md:p-8 rounded-[1.5rem] shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">AI Traffic (Last 7 Days)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#07070A', borderColor: '#ffffff20', borderRadius: '12px', fontSize: '12px', color: '#fff' }} itemStyle={{ color: '#f97316', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="messages" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMsgs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.8, ease: "easeOut" }} className="bg-[#111113] border border-white/5 p-6 md:p-8 rounded-[1.5rem] shadow-xl flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">Platform Routing</h3>
            <div className="flex-1 flex flex-col justify-center gap-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> WhatsApp</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.whatsapp || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${((stats?.platformStats?.whatsapp || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Telegram</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.telegram || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${((stats?.platformStats?.telegram || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Web Widget</span>
                  <span className="text-xs text-gray-400 font-mono">{stats?.platformStats?.web || 0} msgs</span>
                </div>
                <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${((stats?.platformStats?.web || 0) / (totalMsgs || 1)) * 100}%` }}></div></div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.9, ease: "easeOut" }} className="bg-[#111113] border border-white/5 rounded-[1.5rem] p-8 shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-2">🤖 AI Persona Configuration</h3>
              <div className="flex bg-[#1A1A1A] border border-white/10 rounded-lg p-1">
                <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md text-white ${selectedChannel === 'telegram' ? 'bg-blue-500' : selectedChannel === 'whatsapp' ? 'bg-green-500' : 'bg-purple-500'}`}>
                  {selectedChannel || 'Widget'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">Define exactly how your AI agent should behave for <span className="text-white font-bold uppercase">{selectedChannel}</span>.</p>
            <textarea rows={6} value={channelPrompts[selectedChannel as keyof typeof channelPrompts]} onChange={handlePromptChange} placeholder={`e.g., You are a friendly customer support agent for ClawLink on ${selectedChannel}...`} className="flex-1 w-full bg-[#07070A] border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] focus:outline-none transition-all resize-none mb-6 font-mono custom-scrollbar" />
            <div className="flex justify-end mt-auto">
              <button onClick={handleSavePrompt} disabled={isSavingPrompt} className={`bg-white text-black px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100 ${btn}`}>
                {isSavingPrompt ? "Saving..." : <><Save className="w-4 h-4"/> Save {selectedChannel} Persona</>}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 1.0, ease: "easeOut" }} className="bg-[#111113] border border-green-500/20 rounded-[1.5rem] p-8 shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><BrainCircuit className="w-32 h-32 text-green-500" /></div>
            <h3 className="text-lg font-black text-green-400 mb-2 tracking-wide flex items-center gap-2 relative z-10">🧠 Custom Knowledge Base (RAG)</h3>
            <p className="text-sm text-gray-400 mb-6 relative z-10">Train your AI with your specific business data. Paste product details, FAQs, or policies below to convert them into vectors.</p>
            
            {/* 🚀 CLAWLINK WEBHOOK COPY SECTION */}
            <div className="mb-6 p-4 rounded-xl relative z-10" style={{background:"rgba(0,0,0,0.3)", border:"1px dashed rgba(37,211,102,0.3)"}}>
              <p className="text-[11px] font-bold text-[#25D366] mb-3 flex items-center gap-2">
                🔗 Step 1: Copy these to Meta Webhook
              </p>
              
              <div className="mb-3">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Webhook URL</label>
                <div className="flex items-center gap-2">
                  <input readOnly value="https://www.clawlinkai.com/api/webhook/whatsapp" className="w-full bg-black/50 text-gray-300 p-2.5 rounded-lg text-[11px] border border-white/10 outline-none font-mono" />
                  <button type="button" onClick={() => copyToClipboard("https://www.clawlinkai.com/api/webhook/whatsapp")} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all">Copy</button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Verify Token</label>
                <div className="flex items-center gap-2">
                  <input readOnly value="clawlinkmeta2026" className="w-full bg-black/50 text-gray-300 p-2.5 rounded-lg text-[11px] border border-white/10 outline-none font-mono" />
                  <button type="button" onClick={() => copyToClipboard("clawlinkmeta2026")} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-[11px] font-bold transition-all">Copy</button>
                </div>
              </div>
            </div>
            {/* 🚀 END CLAWLINK WEBHOOK COPY SECTION */}

            <textarea rows={4} value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)} placeholder="Paste your business information here..." className="w-full bg-[#07070A] border border-green-500/30 rounded-xl p-4 text-sm text-green-100 focus:border-green-400 focus:shadow-[0_0_15px_rgba(34,197,94,0.2)] focus:outline-none transition-all resize-none mb-4 font-mono placeholder:text-green-900/50 relative z-10 custom-scrollbar" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Database className="w-3 h-3"/> Encrypted in Vector DB</p>
              <button onClick={handleInjectKnowledge} disabled={isInjecting || !knowledgeText.trim()} className={`bg-green-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:scale-100 ${btn}`}>
                {isInjecting ? "Injecting..." : <><Zap className="w-4 h-4"/> Inject Knowledge</>}
              </button>
            </div>
            {knowledgeItems.length > 0 && (
              <div className="mt-auto border-t border-white/10 pt-6 relative z-10">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Active Memory Blocks</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                  {knowledgeItems.map((item, idx) => (
                    <div key={item.id} className="bg-[#07070A]/80 border border-white/5 p-3 rounded-lg flex items-start gap-3 hover:border-green-500/30 transition-colors">
                      <span className="text-green-500 text-xs mt-0.5 font-mono">[{idx + 1}]</span>
                      <p className="text-xs text-gray-300 font-mono line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

        </div>

        {/* BILLING & INVOICES */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 1.1, ease: "easeOut" }} className="bg-[#111113] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-[#0A0A0C]">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-white" />
              <h3 className="text-lg font-black text-white tracking-wide">Billing & Invoices</h3>
            </div>
          </div>
          {billingHistory.length === 0 ? (
            <div className="text-center p-12 bg-[#0A0A0C]/50">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"><Receipt className="w-5 h-5 text-gray-500"/></div>
              <p className="text-gray-400 text-sm font-medium">No past payments found. Deploy an agent to generate an invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0A0A0C] text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-white/5">
                  <tr>
                    <th className="p-5 pl-8">Order Date</th>
                    <th className="p-5">Plan Name</th>
                    <th className="p-5">Amount</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 pr-8 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {billingHistory.map((invoice, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-5 pl-8 font-mono text-gray-400">{new Date(invoice.created_at).toLocaleDateString()}</td>
                      <td className="p-5 font-bold text-white uppercase">{invoice.plan_name}</td>
                      <td className="p-5">{invoice.amount} {invoice.currency}</td>
                      <td className="p-5"><span className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{invoice.status}</span></td>
                      <td className="p-5 pr-8 text-right"><button onClick={() => handleDownloadInvoice(invoice)} className={`text-gray-500 hover:text-white flex items-center justify-end gap-2 ml-auto text-xs font-bold uppercase tracking-widest ${btn}`}><Download className="w-4 h-4"/> PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}