"use client";

import { ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
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
          <Shield className="w-10 h-10 text-green-500" />
          Privacy Policy
        </h1>
        <p className="text-gray-500 text-sm mb-12">Last Updated: March 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>At ClawLink, we collect minimal information necessary to provide our Enterprise AI infrastructure. This includes your account details (via Google OAuth), billing information (processed securely via Razorpay), and API tokens for your selected channels (Telegram/WhatsApp).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your API tokens strictly to route messages between your users and the selected AI models (GPT-5.2, Claude, Gemini). ClawLink operates as a passthrough infrastructure.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Data Security & Storage (Zero Retention)</h2>
            <p>Your privacy is our priority. We employ AES-256 encryption for all stored tokens. <strong className="text-white">We do not store your customers' chat messages on our servers.</strong> Once a message is processed by the AI model, it is instantly purged from our active memory buffers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Contact Us</h2>
            <p>For any privacy-related concerns or data deletion requests, please reach out to our DPO (Data Protection Officer) at <strong className="text-blue-400">clawlink.help@gmail.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}