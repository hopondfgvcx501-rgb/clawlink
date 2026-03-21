"use client";

import { ArrowLeft, FileText } from "lucide-react";
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
        <p className="text-gray-500 text-sm mb-12">Last Updated: March 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using ClawLink's Enterprise AI Infrastructure, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. API Usage & Fair Use Policy</h2>
            <p>While our Premium tiers offer unlimited infrastructure usage, fair use policies apply to prevent network abuse or DDoS vectors. We reserve the right to throttle traffic that threatens the stability of our routing matrix.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Service Uptime (SLA)</h2>
            <p>ClawLink's OmniAgent architecture guarantees a 99.99% uptime by utilizing a 3x Fallback Matrix. However, we are not liable for downtime caused by upstream providers (OpenAI, Anthropic, Google, Meta, or Telegram).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Refunds & Cancellations</h2>
            <p>Subscription plans are billed proactively. Refunds for unused portions of a billing cycle are subject to review by our support team at <strong className="text-blue-400">clawlink.help@gmail.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}