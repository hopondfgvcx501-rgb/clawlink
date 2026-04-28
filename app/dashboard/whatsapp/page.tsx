"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { 
  Settings, CheckCircle2, AlertCircle, Save, 
  Smartphone, Key, ShieldCheck, Zap 
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

export default function WhatsAppConfig() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({ phoneId: '', token: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

  // 1. Fetch existing config on load
  useEffect(() => {
    const fetchConfig = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`);
          const json = await res.json();
          if (json.success && json.data) {
            setFormData({
              phoneId: json.data.whatsapp_phone_id || '',
              token: json.data.whatsapp_token || ''
            });
          }
        } catch (err) {
          console.error("Config fetch error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchConfig();
  }, [session]);

  // 🚀 THE MASTER HANDLER: Verify & Then Save
  const handleVerifyAndSave = async () => {
    if (!formData.phoneId || !formData.token) {
      setStatus({ type: 'error', msg: 'Bhai, dono fields bharna zaroori hai!' });
      return;
    }

    setVerifying(true);
    setStatus({ type: null, msg: '' });

    try {
      // Step A: Verify with Meta API
      const verifyRes = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: 'whatsapp', 
          token: formData.token, 
          phoneId: formData.phoneId 
        })
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error || "Meta Verification Failed");
      }

      // Step B: If Verified, Save to Supabase (Auto-Update)
      const saveRes = await fetch('/api/user/config', { // Ham ek naya dedicated save API use karenge
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email,
          whatsapp_phone_id: formData.phoneId,
          whatsapp_token: formData.token,
          plan_status: 'Active' // Token verify hote hi infrastructure unlock!
        })
      });
      const saveData = await saveRes.json();

      if (saveData.success) {
        setStatus({ type: 'success', msg: '🔥 WhatsApp Connected! Infrastructure is now LIVE.' });
      } else {
        throw new Error("DB Update Failed");
      }

    } catch (err: any) {
      setStatus({ type: 'error', msg: `🚨 Error: ${err.message}` });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <SpinnerCounter text="SECURE CONFIG LOADING..." />;

  return (
    <div className="min-h-screen bg-[#07070A] text-white">
      <TopHeader title="WhatsApp Infrastructure" session={session} />
      
      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-[#0A0A0D] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center border border-[#25D366]/20">
              <Settings className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">WhatsApp Connectivity</h2>
              <p className="text-gray-500 text-sm">Meta Cloud API credentials verification and sync.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Phone ID Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Smartphone className="w-3 h-3" /> WhatsApp Phone ID
              </label>
              <input 
                type="text"
                value={formData.phoneId}
                onChange={(e) => setFormData({...formData, phoneId: e.target.value})}
                placeholder="e.g. 1044727838716942"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-[#25D366]/50 outline-none transition-all font-mono"
              />
            </div>

            {/* Token Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Key className="w-3 h-3" /> System Access Token (Permanent)
              </label>
              <textarea 
                value={formData.token}
                onChange={(e) => setFormData({...formData, token: e.target.value})}
                placeholder="EAAW..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-[#25D366]/50 outline-none transition-all font-mono min-h-[120px] resize-none"
              />
            </div>

            {/* Status Message */}
            {status.type && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-xs font-bold">{status.msg}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex gap-4">
              <button 
                onClick={handleVerifyAndSave}
                disabled={verifying}
                className={`flex-1 bg-white text-black font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${verifying ? 'opacity-50' : 'hover:bg-gray-200'}`}
              >
                {verifying ? <Zap className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
                {verifying ? "Verifying..." : "Verify & Sync Cloud"}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6">
          <h4 className="text-xs font-black uppercase text-blue-400 mb-2">CEO Security Note</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Meta tokens must have <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions. ClawLink strictly verifies credentials before allowing any outgoing API calls to protect your business account reputation.
          </p>
        </div>
      </main>
    </div>
  );
}