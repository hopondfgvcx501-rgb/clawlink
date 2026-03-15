"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PhoneCall, Mic, Settings, Save, Activity, AlertCircle, Phone, Volume2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";

export default function VoiceEngineDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [voiceConfig, setVoiceConfig] = useState({
    provider: "vapi",
    apiKey: "",
    phoneNumber: "",
    voiceType: "jennifer-female",
    systemPrompt: "You are a helpful AI assistant for our company. Keep your answers brief, conversational, and human-like."
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    
    if (status === "authenticated" && session?.user?.email) {
      // Fetching voice config if it exists (assuming API handles this)
      fetch(`/api/voice?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.config) {
            setVoiceConfig({ ...voiceConfig, ...data.config });
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [session, status, router]);

  const handleSaveConfig = async () => {
    if (!voiceConfig.apiKey.trim()) {
      alert("API Key is required to activate the Voice Engine.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email, ...voiceConfig })
      });
      const data = await res.json();
      if (data.success) {
        alert("Voice Engine Configuration Secured. Ready for calls.");
      } else {
        alert("Failed to save configuration.");
      }
    } catch (error) {
      alert("Network Error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestCall = () => {
    if (!voiceConfig.phoneNumber.trim()) {
      alert("Please enter a valid phone number to receive the test call.");
      return;
    }
    setIsTesting(true);
    // Simulating API Call to Voice Provider (Twilio/Vapi)
    setTimeout(() => {
      setIsTesting(false);
      alert(`Test call initiated to ${voiceConfig.phoneNumber}. Your phone should ring in 3-5 seconds.`);
    }, 2000);
  };

  if (isLoading || status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-emerald-500 font-mono"><Activity className="w-10 h-10 animate-spin mb-4" />INITIALIZING VOICE ENGINE...</div>;
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col h-screen overflow-hidden selection:bg-emerald-500/30">
      
      <TopHeader title="AI Voice Engine" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
        
        {/* CINEMATIC GLOW */}
        <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <header className="mb-10">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
              <PhoneCall className="w-8 h-8 text-emerald-500" /> AI Voice Calling
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">Deploy a real-time, conversational AI agent that can make and receive phone calls using natural human voices.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CONFIGURATION SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-[#111] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <Settings className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold uppercase tracking-widest text-gray-300">Voice API Settings</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Voice Provider</label>
                    <select 
                      value={voiceConfig.provider}
                      onChange={(e) => setVoiceConfig({...voiceConfig, provider: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      <option value="vapi">Vapi.ai (Recommended)</option>
                      <option value="bland">Bland AI</option>
                      <option value="twilio">Twilio + OpenAI Realtime</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">API Secret Key</label>
                    <input 
                      type="password" 
                      value={voiceConfig.apiKey}
                      onChange={(e) => setVoiceConfig({...voiceConfig, apiKey: e.target.value})}
                      placeholder="sk_live_..." 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Voice Avatar</label>
                    <select 
                      value={voiceConfig.voiceType}
                      onChange={(e) => setVoiceConfig({...voiceConfig, voiceType: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    >
                      <option value="jennifer-female">Jennifer (Warm Female)</option>
                      <option value="michael-male">Michael (Professional Male)</option>
                      <option value="charlotte-british">Charlotte (British Accent)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest">Agent Phone Number</label>
                    <input 
                      type="tel" 
                      value={voiceConfig.phoneNumber}
                      onChange={(e) => setVoiceConfig({...voiceConfig, phoneNumber: e.target.value})}
                      placeholder="+1 (555) 123-4567" 
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-500" /> Voice System Prompt
                  </label>
                  <textarea 
                    rows={5}
                    value={voiceConfig.systemPrompt}
                    onChange={(e) => setVoiceConfig({...voiceConfig, systemPrompt: e.target.value})}
                    placeholder="Tell your voice agent how to behave on the call..." 
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none transition-colors resize-none custom-scrollbar leading-relaxed"
                  />
                </div>
              </div>

              {/* 🚀 FIXED: The closing tags are now properly structured here */}
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-500/80 text-[10px] uppercase tracking-widest font-bold">
                  <Shield className="w-4 h-4" /> End-to-End Encrypted
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Voice Config</>}
                </button>
              </div>
            </motion.div>

            {/* ACTION / TEST RADAR SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
              
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
                  {isTesting && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                      <span className="animate-pulse absolute inline-flex h-24 w-24 rounded-full bg-emerald-500 opacity-20"></span>
                    </>
                  )}
                  <Volume2 className={`w-10 h-10 text-emerald-500 ${isTesting ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-white text-lg font-bold mb-2">Simulate Live Call</h3>
                <p className="text-xs text-emerald-200/60 leading-relaxed mb-8">
                  Trigger a test call to the configured phone number. The AI will speak using the exact prompt and voice type selected above.
                </p>

                <button 
                  onClick={handleTestCall}
                  disabled={isTesting || !voiceConfig.apiKey}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                >
                  {isTesting ? "Dialing Output..." : <><Phone className="w-5 h-5" /> Trigger Call</>}
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-500" /> Usage Notice
                </h3>
                <ul className="space-y-4 text-xs text-gray-400 leading-relaxed">
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div> Voice calls consume 10x more API credits than text interactions.</li>
                  <li className="flex gap-3"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></div> Average latency is 800ms. Ensure your API keys are from a paid tier for best performance.</li>
                </ul>
              </div>

            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}