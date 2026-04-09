import { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Zap, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

// 🚀 1. ULTIMATE SEO METADATA FOR GOOGLE RANKING
export const metadata: Metadata = {
  title: "WhatsApp AI Bot Builder & Auto Reply Agent in 30s | ClawLink",
  description: "Create an autonomous WhatsApp AI Bot powered by GPT-4o, Claude, and Gemini. Automate customer support, lead generation, and sales in under 30 seconds. Zero coding required.",
  keywords: [
    "WhatsApp AI Bot", "WhatsApp Auto Reply", "WhatsApp automation SaaS", 
    "Create WhatsApp chatbot", "AI customer support WhatsApp", "ManyChat alternative WhatsApp",
    "GPT-4 WhatsApp integration", "WhatsApp business API AI"
  ],
  alternates: {
    canonical: "https://www.clawlinkai.com/whatsapp-ai-bot",
  }
};

export default function WhatsAppSeoPage() {
  // 🚀 2. THE SECRET WEAPON: JSON-LD STRUCTURED DATA
  // Ye Google ko batata hai ki ye ek premium Software hai, isse ranking boost hoti hai.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ClawLink WhatsApp AI Bot Builder",
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
      "ratingCount": "1024"
    }
  };

  return (
    <div className="bg-[#07070A] min-h-screen text-[#E8E8EC] font-sans selection:bg-[#25D366]/30 overflow-x-hidden">
      {/* Inject JSON-LD into the head */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ══ MINIMALIST SEO NAV ══ */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
        <Link href="/" className="font-black text-white text-lg tracking-widest flex items-center gap-2">
           <Zap className="w-5 h-5 text-orange-500"/> CLAWLINK
        </Link>
        <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
          Back to Home
        </Link>
      </nav>

      {/* ══ TARGETED HERO SECTION ══ */}
      <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[.1em] text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20">
          <MessageCircle className="w-3.5 h-3.5" /> OFFICIAL WHATSAPP CLOUD API INTEGRATION
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
          The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-[#128C7E]">WhatsApp AI Bot</span><br/> Built for Enterprise.
        </h1>
        
        <p className="text-gray-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop losing customers to slow replies. Deploy an autonomous WhatsApp AI Agent powered by Omni-Fallback (GPT-4o, Claude, Gemini) in under 30 seconds. <strong>No code. No servers. Just conversions.</strong>
        </p>

        <Link href="/#hero" className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl text-sm hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(37,211,102,0.3)]">
          Deploy WhatsApp Bot Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ══ KEYWORD RICH FEATURES ══ */}
      <section className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
        <h2 className="text-2xl font-black text-center text-white mb-12 uppercase tracking-widest">Why ClawLink Beats The Competition</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">0% Downtime Omni-Engine</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Unlike ManyChat or Make.com, ClawLink uses a 3x Fallback Matrix. If GPT-4o goes down, your WhatsApp bot instantly switches to Claude or Gemini. Never miss a lead.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Instant RAG Memory</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Upload your PDFs, FAQs, and product catalogs. Your WhatsApp AI agent will read them and answer customer queries with 100% factual accuracy. Zero hallucinations.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
              <Shield className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">AES-256 Bank-Grade Security</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Your WhatsApp Cloud API tokens and customer data are encrypted. We maintain zero data retention of your chat histories on our active inference servers.</p>
          </div>
        </div>
      </section>

      {/* ══ SEO TEXT BLOCK (For Googlebot Content Density) ══ */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">The Best Alternative to OpenClaw and ManyChat for WhatsApp</h2>
        <div className="prose prose-invert prose-sm text-gray-400">
          <p className="mb-4">
            Setting up a <strong>WhatsApp Auto Message AI Agent</strong> usually requires buying local virtual machines, generating SSH keys, and writing complex Node.js scripts. Solutions like OpenClaw require heavy technical knowledge and constant server maintenance.
          </p>
          <p className="mb-4">
            ClawLink simplifies this. As the premier <strong>no-code AI bot builder</strong>, we handle the entire infrastructure. Whether you need a WhatsApp bot for e-commerce, real estate lead generation, or a 24/7 customer support AI, our platform spins up a dedicated, highly-available instance in under 30 seconds.
          </p>
          <ul className="list-none space-y-2 mt-6">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#25D366]"/> Voice note transcription via Whisper AI</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#25D366]"/> Human handoff capabilities for live CRM</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#25D366]"/> Unlimited scaling with Meta Cloud API</li>
          </ul>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-10 text-center border-t border-white/5 mt-10">
        <p className="text-xs text-gray-600 font-mono">© 2026 CLAWLINK INC. WHATSAPP AUTOMATION INFRASTRUCTURE.</p>
      </footer>
    </div>
  );
}