"use client";

import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfService() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#07070A] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto mt-10">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight flex items-center gap-4">
          <FileText className="w-10 h-10 text-orange-500" />
          Terms of Service
        </h1>
        <p className="text-gray-500 text-sm mb-12 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          Last Updated: May 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ClawLink&apos;s Enterprise AI Infrastructure, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. These terms apply to all tiers, including the Nexus Tier and our custom API solutions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Platform & Channel Compliance</h2>
            <p>ClawLink provides deployment bridges to external platforms including Meta (WhatsApp Cloud, Instagram) and Telegram. You are strictly responsible for complying with the respective commerce and messaging policies of these platforms. ClawLink reserves the right to terminate your workspace if your automated agents violate third-party terms of service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Service Uptime & Omni-Fallback Matrix</h2>
            <p>ClawLink ensures high availability through our proprietary 4x Omni-Fallback Engine (routing across Claude, OpenAI, Gemini, and Llama). While we strive for 99.99% uptime, we are not liable for extended, simultaneous outages caused by these upstream AI providers or downstream channel APIs (e.g., Meta Graph API disruptions).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Privacy, RAG, and Vector Storage</h2>
            <p>Any proprietary business data injected into the Custom Knowledge Base (RAG) is converted into vector embeddings. This data is strictly partitioned using Row-Level Security (RLS) in our database. We do not use your private vector data to train our foundational models, and you retain the right to execute a full memory wipe of your workspace at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Fair Use & Network Security</h2>
            <p>While Premium and Nexus tiers offer robust infrastructure capacity, fair use policies apply to prevent network abuse or DDoS vectors. We monitor inbound webhook traffic and actively rate-limit excessive payloads that threaten the stability of our primary routing matrix.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Billing, Upgrades & Cancellations</h2>
            <p>Subscription plans are billed proactively via our secure payment partners (Razorpay/Stripe). Access to premium features requires an &apos;Active&apos; plan status. Refunds for unused portions of a billing cycle are strictly subject to review by our administrative team. For billing disputes, please contact <strong className="text-blue-400">clawlink.help@gmail.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}