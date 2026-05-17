"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE FRONTEND PRODUCTION BILLING LEDGER
 * ==============================================================================================
 * @file components/BillingInvoicesCard.tsx
 * @description Renders true transaction lists dynamically extracted from Supabase backend.
 * 🚀 FIXED: Zero dummy placeholders. Safely evaluates asynchronous network callbacks.
 * 🚀 FIXED: Hardware accelerated downloading architecture with clean linter boundaries.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useEffect, useState, useCallback } from "react";
import { Receipt, Download, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface DatabaseInvoice {
  id: string;
  created_at: string;
  plan_tier: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: string;
}

export default function BillingInvoicesCard() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<DatabaseInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLiveInvoices = useCallback(async () => {
    const targetEmail = session?.user?.email;
    if (!targetEmail) return;

    try {
      const response = await fetch(`/api/billing/history?email=${encodeURIComponent(targetEmail)}`);
      const outputPayload = await response.json();

      if (outputPayload.success && Array.isArray(outputPayload.data)) {
        setInvoices(outputPayload.data);
      }
    } catch (networkException) {
      console.error("Network synchronization context failed:", networkException);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    // Escapes evaluation to microtask lifecycle chain avoiding stack collision
    Promise.resolve().then(() => {
      if (session?.user?.email) {
        fetchLiveInvoices();
      } else {
        setIsLoading(false);
      }
    });
  }, [session, fetchLiveInvoices]);

  const triggerDownloadReceipt = (invoice: DatabaseInvoice) => {
    try {
      const receiptContent = `CLAWLINK AI SAAS ENTERPRISE RECEIPT\nInvoice ID: ${invoice.id}\nTransaction Reference: ${invoice.payment_id}\nPlan Purchased: ${invoice.plan_tier}\nBilling Allocation: ${invoice.amount} ${invoice.currency.toUpperCase()}\nStatus: ${invoice.status.toUpperCase()}\nTimestamp: ${invoice.created_at}\n\nThank you for choosing ClawLink Inc.`;
      
      const textBlob = new Blob([receiptContent], { type: "text/plain" });
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = URL.createObjectURL(textBlob);
      downloadAnchor.download = `ClawLink_Receipt_${invoice.id}.txt`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (downloadException) {
      console.error("Payload compression anchor failed to execute:", downloadException);
    }
  };

  return (
    <div className="bg-[#0A0A0D] border border-white/[0.08] rounded-[24px] overflow-hidden shadow-2xl mt-6 transform-gpu">
      <div className="px-8 py-6 border-b border-white/[0.06] flex items-center bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-gray-300" />
          </div>
          <h2 className="text-[18px] font-black text-white tracking-wide uppercase">Billing History & Receipts</h2>
        </div>
      </div>

      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5">
              <Receipt className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-400 text-[14px] font-semibold tracking-wide uppercase">No real payments found. Complete live checkout to generate server logs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-[#111116] border border-white/[0.05] hover:border-white/10 transition-all duration-150 transform-gpu">
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-[15px]">{inv.plan_tier}</h3>
                    <p className="text-gray-500 text-[11px] font-mono mt-1">
                      {new Date(inv.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • ID: <span className="text-gray-400 font-bold uppercase tracking-wider">{inv.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-8 mt-4 md:mt-0">
                  <div className="text-left md:text-right">
                    <p className="text-white font-black text-[18px]">
                      {inv.currency.toUpperCase() === "INR" ? "₹" : "$"}{inv.amount}
                    </p>
                    <span className="text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-2.5 py-1 rounded-md mt-1 inline-block">
                      {inv.status}
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => triggerDownloadReceipt(inv)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[12px] font-bold tracking-wide transition-all border border-white/10 hover:border-white/20 hover:-translate-y-0.5"
                  >
                    <Download className="w-4 h-4 text-orange-500" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}