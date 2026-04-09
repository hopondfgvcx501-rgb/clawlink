import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Zap, Shield, ArrowRight, CheckCircle2, Instagram } from "lucide-react";

// 🚀 1. ULTIMATE SEO METADATA FOR INSTAGRAM RANKING
export const metadata: Metadata = {
  title: "Create Instagram AI DM Bot & Auto Reply Agent in 30s | ClawLink",
  description: "Automate Instagram DMs, Story replies, and comments with an autonomous AI Agent. Powered by GPT-4o and Claude. The ultimate ManyChat alternative.",
  keywords: [
    "Instagram AI Bot", "Instagram DM automation", "Auto reply to Instagram comments", 
    "Instagram Story AI bot", "ManyChat Instagram alternative", 
    "Create Instagram AI agent", "Instagram business API AI", "No code Instagram bot"
  ],
  alternates: {
    canonical: "https://www.clawlinkai.com/instagram-ai-bot",
  }
};

export default function InstagramSeoPage() {
  // 🚀 2. JSON-LD STRUCTURED DATA FOR GOOGLE RICH RESULTS
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ClawLink Instagram AI Bot Builder",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Cloud",
    "offers": {
      "@type": "Offer",
      "price": "6.00",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1450"
    }
  };

  return (
    <div className="bg-[#07070A] min-h-screen text-[#E8E8EC] font-sans selection:bg-[#E1306C]/30 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══ NAV ══ */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
        <Link href="/" className="font-black text-white text-lg tracking-widest flex items-center gap-2">
           <Zap className="w-5 h-5 text-orange-500"/> CLAWLINK
        </Link>
        <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
          Back to Home
        </Link>
      </nav>

      {/* ══ HERO SECTION (INSTAGRAM THEMED) ══ */}
      <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[.1em] text-[#E1306C] bg-[#E1306C]/10 border border-[#E1306C]/20">
          <Instagram className="w-3.5 h-3.5" /> OFFICIAL INSTAGRAM MESSENGER API
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
          Turn Followers into Customers with an <span className="text-transparent bg-clip-text bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]">Instagram AI Agent</span>.
        </h1>
        
        <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          "Comment LINK to get it in your DMs!" — Automate comments, Story mentions, and DMs instantly. Deploy a hyper-intelligent AI Agent (GPT-4o/Claude) in under 30 seconds. <strong>Zero code. Infinite scale.</strong>
        </p>

        <Link href="/#hero" className="inline-flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl text-sm hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(225,48,108,0.3)] bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]">
          Deploy Instagram Bot Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
        <h2 className="text-2xl font-black text-center text-white mb-12 uppercase tracking-widest">Built for Creators & Brands</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20">
              <MessageSquare className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Auto-Reply to Comments & DMs</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Stop manually replying. ClawLink detects keywords in comments or Reels and instantly sends a personalized DM with your links or offers.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Omni-Fallback Brain</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Your Instagram bot is powered by our 3x AI Matrix. It seamlessly routes between GPT-4o, Claude 3.5, and Gemini to ensure 0% downtime during viral spikes.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Live CRM & Human Handoff</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Monitor every AI conversation in real-time through your dashboard. Jump in and take over the chat whenever a high-ticket lead needs human attention.</p>
          </div>
        </div>
      </section>

      {/* ══ SEO TEXT BLOCK ══ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">The #1 ManyChat Alternative for Instagram Automation</h2>
        <div className="prose prose-invert prose-sm text-gray-400">
          <p className="mb-4">
            If you are tired of complex visual flow builders that break or basic bots that sound robotic, ClawLink is the ultimate upgrade. We don't use rigid decision trees; we deploy genuine <strong>AI Agents</strong> that understand context, read your custom knowledge base, and sell like a top-tier closer.
          </p>
          <p className="mb-4">
            Whether you are a creator handling thousands of Story mentions or an e-commerce brand automating customer support, our <strong>Instagram Auto Reply Bot</strong> setup is unmatched. Just connect your Meta Developer account, paste your token, and your AI is live across your entire Instagram presence in seconds.
          </p>
          <ul className="list-none space-y-2 mt-6">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#E1306C]"/> Connects directly via official Meta API</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#E1306C]"/> Custom RAG integration (Upload PDFs & FAQs)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#E1306C]"/> Flat pricing — no hidden per-message fees on Premium tiers</li>
          </ul>
        </div>
      </section>

      <footer className="py-10 text-center border-t border-white/5 mt-10">
        <p className="text-xs text-gray-600 font-mono">© 2026 CLAWLINK INC. INSTAGRAM AI AUTOMATION.</p>
      </footer>
    </div>
  );
}