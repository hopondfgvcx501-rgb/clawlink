"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Key, Shield, Smartphone, Server, CheckCircle, Activity } from "lucide-react";
import TopHeader from "@/components/TopHeader";

export default function SettingsHub() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState({
    telegramToken: "",
    whatsappToken: "",
    whatsappPhoneId: "",
    systemPrompt: ""
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/user?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setConfig({
              telegramToken: data.data.telegram_token || "",
              whatsappToken: data.data.whatsapp_token || "",
              whatsappPhoneId: data.data.whatsapp_phone_id || "",
              systemPrompt: data.data.systemPrompt || ""
            });
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, status]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          telegram_token: config.telegramToken,
          whatsapp_token: config.whatsappToken,
          whatsapp_phone_id: config.whatsappPhoneId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Configuration saved successfully. System secured.");
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (error) {
      alert("Network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-blue-500 font-mono"><Activity className="w-10 h-10 animate-spin mb-4" />LOADING SECURITY MODULE...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-blue-500/30">
      <TopHeader title="System Settings" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-[#111] border border-white/5 p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Shield className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold uppercase tracking-widest text-white">API Integrations</h2>
            </div>
            
            <div className="space-y-6 relative z-10">
              {/* Telegram Config */}
              <div className="bg-black/50 border border-white/5 p-6 rounded-xl">
                <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2"><Server className="w-4 h-4"/> Telegram Configuration</h3>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Bot Token (From BotFather)</label>
                  <input 
                    type="password" 
                    value={config.telegramToken} 
                    onChange={(e) => setConfig({...config, telegramToken: e.target.value})}
                    placeholder="Enter HTTP API Token" 
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp Config */}
              <div className="bg-black/50 border border-white/5 p-6 rounded-xl">
                <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2"><Smartphone className="w-4 h-4"/> WhatsApp Cloud API</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Permanent Access Token</label>
                    <input 
                      type="password" 
                      value={config.whatsappToken} 
                      onChange={(e) => setConfig({...config, whatsappToken: e.target.value})}
                      placeholder="Enter Meta Access Token" 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Phone Number ID</label>
                    <input 
                      type="text" 
                      value={config.whatsappPhoneId} 
                      onChange={(e) => setConfig({...config, whatsappPhoneId: e.target.value})}
                      placeholder="Enter Phone Number ID" 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end relative z-10">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                {isSaving ? "Encrypting..." : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}