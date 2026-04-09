import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Zap, Shield, ArrowRight, CheckCircle2, Send } from "lucide-react";

// 🚀 1. ULTIMATE SEO METADATA FOR TELEGRAM RANKING
export const metadata: Metadata = {
  title: "Create Telegram AI Bot & Crypto Agent in 30s | ClawLink",
  description: "Deploy an autonomous Telegram AI Agent using GPT-4o, Claude, and Gemini. Perfect for Crypto communities, customer support, and SaaS. 1-click deploy.",
  keywords: [
    "Telegram AI Bot", "Telegram Crypto Bot", "Automate Telegram group", 
    "Create Telegram AI Agent", "Telegram customer support bot", 
    "GPT-4 Telegram integration", "Telegram bot no code", "OpenClaw Telegram"
  ],
  alternates: {
    canonical: "https://www.clawlinkai.com/telegram-ai-bot",
  }
};

export default function TelegramSeoPage() {
  // 🚀 2. JSON-LD STRUCTURED DATA
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ClawLink Telegram AI Bot Builder",
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
      "ratingCount": "890"
    }
  };

  return (
    <div className="bg-[#07070A] min-h-screen text-[#E8E8EC] font-sans selection:bg-[#2AABEE]/30 overflow-x-hidden">
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

      {/* ══ HERO SECTION ══ */}
      <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[.1em] text-[#2AABEE] bg-[#2AABEE]/10 border border-[#2AABEE]/20">
          <Send className="w-3.5 h-3.5" /> OFFICIAL TELEGRAM BOT API INTEGRATION
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
          The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2AABEE] to-[#0088cc]">Telegram AI Agent</span><br/> Built for Scale.
        </h1>
        
        <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Manage communities, handle support, and automate sales with an AI Agent powered by Omni-Fallback (GPT-4o, Claude, Gemini) in under 30 seconds. <strong>Just paste your @BotFather token. We handle the rest.</strong>
        </p>

        <Link href="/#hero" className="inline-flex items-center justify-center gap-2 bg-[#2AABEE] text-white font-black uppercase tracking-widest px-8 py-4 rounded-xl text-sm hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(42,171,238,0.3)]">
          Deploy Telegram Bot Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
        <h2 className="text-2xl font-black text-center text-white mb-12 uppercase tracking-widest">Engineered for Telegram Communities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Omni-Engine Reliability</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Crypto markets never sleep, neither should your bot. Our 3x AI Fallback guarantees 0% downtime even if OpenAI or Anthropic servers crash.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-[#2AABEE]/10 rounded-xl flex items-center justify-center mb-6 border border-[#2AABEE]/20">
              <MessageSquare className="w-6 h-6 text-[#2AABEE]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Whisper Voice Processing</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Telegram users love voice notes. ClawLink automatically transcribes incoming voice messages using Whisper AI and replies instantly.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Enterprise Data Privacy</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Your Telegram Bot API token is encrypted with AES-256. We keep zero retention logs of your private community chats.</p>
          </div>
        </div>
      </section>

      {/* ══ SEO TEXT BLOCK ══ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">The Fastest Way to Build a Telegram AI Bot</h2>
        <div className="prose prose-invert prose-sm text-gray-400">
          <p className="mb-4">
            Creating a custom <strong>Telegram AI Bot</strong> from scratch usually means managing webhooks, dealing with rate limits, and paying for expensive AWS/Vercel servers. 
          </p>
          <p className="mb-4">
            ClawLink acts as your ultimate AI infrastructure. Whether you are building a <strong>Telegram Crypto Bot</strong> to track prices, or an automated community manager, our platform lets you bypass the code. Get your token from <strong>@BotFather</strong>, paste it into ClawLink, and your AI agent goes live instantly across global edge networks.
          </p>
          <ul className="list-none space-y-2 mt-6">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2AABEE]"/> Vector DB integrated for custom RAG knowledge</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2AABEE]"/> Live Dashboard to monitor user queries</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2AABEE]"/> Seamless integration with Next.js architecture</li>
          </ul>
        </div>
      </section>

      <footer className="py-10 text-center border-t border-white/5 mt-10">
        <p className="text-xs text-gray-600 font-mono">© 2026 CLAWLINK INC. TELEGRAM AUTOMATION INFRASTRUCTURE.</p>
      </footer>
    </div>
  );
}