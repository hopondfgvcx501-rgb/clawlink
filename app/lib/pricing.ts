// lib/pricing.ts

export const MASTER_PRICING: Record<string, any> = {
  gemini: {
    name: "Gemini (Google)",
    plans: [
      { id: "plus", name: "Plus", usd: 6, inr: 499, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 12, inr: 999, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 24, inr: 1999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 599, inr: 49999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  "gpt-5.2": { 
    name: "GPT (OpenAI)",
    plans: [
      { id: "plus", name: "Plus", usd: 8, inr: 599, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 18, inr: 1499, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 36, inr: 2999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 899, inr: 74999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  claude: {
    name: "Claude (Anthropic)",
    plans: [
      { id: "plus", name: "Plus", usd: 10, inr: 799, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 24, inr: 1999, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 48, inr: 3999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 1199, inr: 99999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  omni: {
    name: "OmniAgent Bundle",
    plans: [
      { id: "monthly", name: "Pro Bundle", usd: 249, inr: 20916, msgs: "Smart Matrix", desc: "Elite multi-persona integration. 3x Fallback.", accent: "#00BFFF", color: "text-[#00BFFF]" },
      { id: "yearly", name: "Adv Premium", usd: 1799, inr: 149999, msgs: "Zero Downtime", desc: "Ultimate auto-routing & global priority access.", accent: "#BA7517", color: "text-[#BA7517]", badge: "Yearly ⭐", isYearly: true }
    ]
  }
};

// Helper function backend ke liye (secure amount nikalne ke liye)
export const getSecurePrice = (modelKey: string, planId: string, currency: "usd" | "inr" = "usd") => {
    const safeModel = MASTER_PRICING[modelKey] ? modelKey : "gpt-5.2";
    const plans = MASTER_PRICING[safeModel].plans;
    const plan = plans.find((p: any) => p.id === planId);
    
    if (!plan) return 0;
    return currency === "inr" ? plan.inr : plan.usd;
};