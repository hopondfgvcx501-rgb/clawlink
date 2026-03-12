import React from "react";

export const metadata = {
  title: "Refund Policy | ClawLink AI",
  description: "Cancellation and refund policies for ClawLink subscriptions.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-300 py-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-[#111] p-10 md:p-16 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Refund & Cancellation Policy</h1>
        <p className="mb-6 text-sm text-gray-500 font-mono">Last Updated: March 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Non-Refundable SaaS</h2>
            <p>Due to the nature of digital API provisioning and immediate cloud resource allocation, all ClawLink subscription payments are strictly <strong>non-refundable</strong> once a successful deployment has occurred.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Cancellation</h2>
            <p>You may cancel your monthly subscription at any time via your Dashboard. Your bot instances will remain active until the end of your current 30-day billing cycle. Auto-renewals will be halted immediately upon cancellation.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Deployment Failures</h2>
            <p>If our system fails to deploy your bot due to an internal server error or edge network failure, and our support team cannot resolve the issue within 48 hours, a full 100% refund will be issued to your original payment method via Razorpay.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <a href="/" className="text-blue-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs">← Return to Home</a>
        </div>
      </div>
    </div>
  );
}