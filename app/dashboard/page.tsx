"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClawLinkDeployer() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Selections
  const [selectedModel, setSelectedModel] = useState("gemini");
  
  // States for Integrations
  const [telegramToken, setTelegramToken] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState({ telegram: false, whatsapp: false });
  const [botLinks, setBotLinks] = useState({ telegram: "", whatsapp: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  const handleGlobalDeploy = async () => {
    if (!telegramToken && !whatsappToken) {
      alert("Please provide at least one Token (Telegram or WhatsApp) to deploy.");
      return;
    }

    setIsDeploying(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          selectedModel,
          telegramToken,
          whatsappToken,
          whatsappPhoneId,
          selectedChannel: "dual" // Both channels active
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setDeploymentStatus({ 
          telegram: !!telegramToken, 
          whatsapp: !!whatsappToken 
        });
        // Assuming API returns links if generated
        if(data.botLink) setBotLinks(prev => ({...prev, telegram: data.botLink}));
        
        // Custom Success UI Trigger
        const successMsg = document.getElementById("success-banner");
        if(successMsg) {
          successMsg.classList.remove("translate-y-[-100%]", "opacity-0");
          setTimeout(() => successMsg.classList.add("translate-y-[-100%]", "opacity-0"), 5000);
        }
      } else {
        alert("Deployment failed: " + data.error);
      }
    } catch (e) {
      alert("System Error in dual deployment.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-mono uppercase tracking-widest">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        Booting Infrastructure...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      
      {/* 🚀 HIDDEN SUCCESS BANNER */}
      <div id="success-banner" className="fixed top-0 left-0 w-full bg-green-500 text-black font-black text-center py-3 uppercase tracking-widest transform translate-y-[-100%] opacity-0 transition-all duration-500 z-50 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
        CLAWLINK ENGINES DEPLOYED SUCCESSFULLY!
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-blue-500">ClawLink Workspace</h1>
          <div className="text-right flex items-center gap-3">
             <div className="hidden md:block">
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-right">Active Identity</p>
               <p className="text-sm font-bold truncate max-w-[150px]">{session?.user?.email}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                {session?.user?.email?.charAt(0).toUpperCase() || "U"}
             </div>
          </div>
        </div>

        {/* AI Model Selection */}
        <section className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl mb-8 shadow-xl">
          <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white">1</span> Select AI Brain
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['gemini', 'gpt', 'claude'].map((m) => (
              <button key={m} onClick={() => setSelectedModel(m)} className={`py-4 rounded-2xl border transition-all uppercase text-xs font-black tracking-widest ${selectedModel === m ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] scale-[1.02]' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}>
                {m === 'gemini' ? '✨ Gemini 3.1' : m === 'gpt' ? '🤖 GPT-5.4' : '✴️ Claude 4.6'}
              </button>
            ))}
          </div>
        </section>

        {/* Multi-Channel Integration */}
        <section className="grid md:grid-cols-2 gap-8 mb-10">
          
          {/* Telegram Box */}
          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl relative overflow-hidden shadow-xl transition-all hover:border-blue-500/30">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-2">
                 <span className="text-blue-500">✈️</span> Telegram API
               </h2>
               {deploymentStatus.telegram && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-black border border-blue-500/50 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span> SYNCED</span>}
            </div>
            
            {!deploymentStatus.telegram ? (
              <input 
                type="password" 
                value={telegramToken} 
                onChange={e => setTelegramToken(e.target.value)}
                placeholder="Enter Bot Token..." 
                className="w-full bg-black border-b border-white/10 py-3 text-sm outline-none focus:border-blue-500 transition-all font-mono"
              />
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-3">Bot is successfully connected to ClawLink.</p>
                {botLinks.telegram && (
                   <a href={botLinks.telegram} target="_blank" className="inline-block bg-blue-600 text-white font-bold text-xs px-6 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-500 transition-colors">
                     Open Bot
                   </a>
                )}
                <button onClick={() => setDeploymentStatus(prev => ({...prev, telegram: false}))} className="block w-full mt-3 text-[10px] text-gray-500 hover:text-white underline">Change Token</button>
              </div>
            )}
          </div>

          {/* WhatsApp Box */}
          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-3xl relative overflow-hidden shadow-xl transition-all hover:border-green-500/30">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-2">
                 <span className="text-green-500">💬</span> WhatsApp API
               </h2>
               {deploymentStatus.whatsapp && <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-black border border-green-500/50 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> SYNCED</span>}
            </div>
            
            {!deploymentStatus.whatsapp ? (
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={whatsappToken} 
                  onChange={e => setWhatsappToken(e.target.value)}
                  placeholder="Access Token (EAAG...)" 
                  className="w-full bg-black border-b border-white/10 py-3 text-sm outline-none focus:border-green-500 transition-all font-mono"
                />
                <input 
                  type="text" 
                  value={whatsappPhoneId} 
                  onChange={e => setWhatsappPhoneId(e.target.value)}
                  placeholder="Phone Number ID" 
                  className="w-full bg-black border-b border-white/10 py-3 text-sm outline-none focus:border-green-500 transition-all font-mono"
                />
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-3">WhatsApp Number is successfully connected.</p>
                <button onClick={() => setDeploymentStatus(prev => ({...prev, whatsapp: false}))} className="block w-full mt-3 text-[10px] text-gray-500 hover:text-white underline">Update Credentials</button>
              </div>
            )}
          </div>

        </section>

        {/* Global Deploy Button */}
        <button 
          onClick={handleGlobalDeploy} 
          disabled={isDeploying || (deploymentStatus.telegram && deploymentStatus.whatsapp)}
          className={`w-full font-black py-6 rounded-3xl transition-all uppercase tracking-[0.3em] text-sm shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 ${
             (deploymentStatus.telegram && deploymentStatus.whatsapp) 
             ? "bg-white/10 text-gray-500 cursor-not-allowed"
             : "bg-white text-black hover:bg-gray-200 active:scale-[0.98]"
          }`}
        >
          {isDeploying ? (
            <>
               <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
               Deploying Infrastructure...
            </>
          ) : (deploymentStatus.telegram && deploymentStatus.whatsapp) ? "All Channels Synced ✓" : "Sync & Launch ClawLink 🚀"}
        </button>

      </div>
    </main>
  );
}