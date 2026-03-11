"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import StarBackground from "./StarBackground";

interface ModelType {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface ChannelType {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface LandingUIProps {
  renderActionArea: (selectedModel: string, selectedChannel: string) => React.ReactNode;
  isLocked?: boolean; 
}

export default function LandingUI({ renderActionArea, isLocked = false }: LandingUIProps) {
  // 🚀 FIXED: States define kar di hain taaki click kaam kare
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.2");
  const [selectedChannel, setSelectedChannel] = useState<string>("telegram");

  const models: ModelType[] = [
    { id: "gpt-5.2", name: "GPT-5.2", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#10A37F" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zM13.2599 22.0627a4.123 4.123 0 0 1-3.565-2.0076l1.3268-1.3268a2.128 2.128 0 0 0 3.0073 0l5.881-5.881a4.123 4.123 0 0 1-6.65 9.2154zM5.9847 19.1627a4.123 4.123 0 0 1-2.0076-3.565l1.3268 1.3268a2.128 2.128 0 0 0 0-3.0073l-5.881-5.881a4.123 4.123 0 0 1 6.5618 11.1265zM2.0076 9.8211A4.123 4.123 0 0 1 5.5726 7.8135L4.2458 9.1403a2.128 2.128 0 0 0 0 3.0073l5.881 5.881a4.123 4.123 0 0 1-8.1192-8.2075zM9.8211 2.0076a4.123 4.123 0 0 1 3.565 2.0076L12.0593 5.342a2.128 2.128 0 0 0-3.0073 0l-5.881 5.881a4.123 4.123 0 0 1 6.65-9.2154zM18.0153 4.8373a4.123 4.123 0 0 1 2.0076 3.565l-1.3268-1.3268a2.128 2.128 0 0 0 0 3.0073l5.881 5.881a4.123 4.123 0 0 1-6.5618-11.1265zM21.9924 14.1789a4.123 4.123 0 0 1-3.565 2.0076l1.3268-1.3268a2.128 2.128 0 0 0 0-3.0073l-5.881-5.881a4.123 4.123 0 0 1 8.1192 8.2075zM12 14.128A2.128 2.128 0 1 1 12 9.872a2.128 2.128 0 0 1 0 4.256z"/></svg> },
    { id: "claude", name: "Opus 4.6", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#D97757" d="M12 0l2.3 8.3c.2.6.7 1.1 1.3 1.3L24 12l-8.4 2.4c-.6.2-1.1.7-1.3 1.3L12 24l-2.3-8.3c-.2-.6-.7-1.1-1.3-1.3L0 12l8.4-2.4c.6-.2 1.1-.7 1.3-1.3L12 0z"/></svg> },
    { id: "gemini", name: "Gemini 3 Flash", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#8AB4F8" d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/></svg> },
    { id: "llama", name: "Llama 3 (Soon)", icon: <span className="text-lg">🦙</span>, disabled: true },
  ];

  const channels: ChannelType[] = [
    { id: "telegram", name: "Telegram", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#2AABEE" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.661 3.495-1.524 5.83-2.529 7.005-3.02 3.333-1.392 4.025-1.636 4.476-1.636z"/></svg> },
    { id: "whatsapp", name: "WhatsApp", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> },
  ];

  const row1 = ["Read & summarize email", "Draft replies and follow-ups", "Translate messages in real time", "Organize your inbox", "Notify before a meeting"];
  const row2 = ["Remind you of deadlines", "Plan your week", "Take meeting notes", "Sync across time zones", "Do your taxes", "Track expenses"];
  const row3 = ["Run payroll calculations", "Negotiate refunds", "Find best prices online", "Find discount codes", "Compare product specs"];
  const row4 = ["Write contracts and NDAs", "Research competitors", "Screen leads", "Generate invoices", "Monitor news and alerts"];

  return (
    <main className="min-h-screen flex flex-col items-center pt-8 pb-20 px-4 relative overflow-x-hidden">
      {/* Background Star Effect */}
      <div className="fixed inset-0 z-[-1]">
         <StarBackground />
      </div>

      <nav className="w-full max-w-6xl flex justify-between items-center mb-20 px-6">
        <div className="text-xl font-medium tracking-wider font-mono text-white">clawlink.com</div>
        <div className="flex gap-8 items-center text-sm tracking-widest uppercase font-semibold text-gray-400">
          <span className="cursor-pointer hover:text-white transition">Home</span>
          <span className="cursor-pointer hover:text-white transition">Features</span>
          <button className="flex items-center gap-2 border border-white/20 px-4 py-2 rounded-md hover:bg-white/10 transition text-white">
            <span className="w-4 h-4 bg-white rounded-full block"></span> Contact Support
          </button>
        </div>
      </nav>

      <div className="text-center max-w-3xl mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Deploy ClawLink under 30 SECONDS</h1>
        <p className="text-gray-400 text-lg md:text-xl font-normal leading-relaxed">Avoid all technical complexity and one-click<br/>deploy your own 24/7 active ClawLink instance under 30 seconds.</p>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-12">
        {/* Model Selection Row */}
        <div className="flex flex-col items-center gap-5">
          <p className="text-xl font-semibold tracking-tight text-white">
            {isLocked ? "Your selected AI Model" : "Choose a model to use as your default"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {models.map((model) => (
              <motion.button
                key={model.id}
                whileHover={model.disabled || isLocked ? {} : { scale: 1.05 }}
                whileTap={model.disabled || isLocked ? {} : { scale: 0.95 }}
                onClick={() => !model.disabled && !isLocked && setSelectedModel(model.id)}
                className={`px-6 py-3 rounded-full flex items-center gap-3 text-base font-medium transition-all duration-200 border ${
                  selectedModel === model.id 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                    : "bg-[#1A1A1A]/60 text-gray-300 border-white/10 hover:bg-[#2A2A2A] hover:border-white/30"
                } ${model.disabled ? "opacity-50 cursor-not-allowed" : ""} ${isLocked && selectedModel !== model.id ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                {model.icon} {model.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Channel Selection Row */}
        <div className="flex flex-col items-center gap-5">
          <p className="text-xl font-semibold tracking-tight text-white">
            {isLocked ? "Your selected channel" : "Select a channel for sending messages"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {channels.map((channel) => (
              <motion.button
                key={channel.id}
                whileHover={channel.disabled || isLocked ? {} : { scale: 1.05 }}
                whileTap={channel.disabled || isLocked ? {} : { scale: 0.95 }}
                onClick={() => !channel.disabled && !isLocked && setSelectedChannel(channel.id)}
                className={`px-6 py-4 rounded-xl flex items-center gap-3 text-base font-medium transition-all duration-200 border ${
                  selectedChannel === channel.id 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                    : "bg-[#1A1A1A]/60 text-gray-300 border-white/10 hover:bg-[#2A2A2A] hover:border-white/30"
                } ${channel.disabled ? "opacity-50 cursor-not-allowed flex-col py-3" : ""} ${isLocked && selectedChannel !== channel.id ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                {channel.icon} 
                <span className={channel.disabled ? "text-xs" : ""}>{channel.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center mt-8 min-h-[120px]">
          {renderActionArea(selectedModel, selectedChannel)}
        </div>
      </div>

      {/* Marquee Section */}
      <div className="w-full mt-40 mb-24 overflow-hidden relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">Unleash thousands of use cases</h2>
          <p className="text-gray-400 text-lg">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        </div>
        
        {/* Row Animations */}
        <div className="space-y-4">
            <div className="flex w-max animate-marquee gap-4">
            {[...row1, ...row1].map((text, i) => (
                <div key={`r1-${i}`} className="flex-shrink-0 border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-gray-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-500" /> {text}
                </div>
            ))}
            </div>
            <div className="flex w-max animate-marquee-reverse gap-4">
            {[...row2, ...row2].map((text, i) => (
                <div key={`r2-${i}`} className="flex-shrink-0 border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-gray-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-500" /> {text}
                </div>
            ))}
            </div>
        </div>

        {/* Gradient Fades for Marquee */}
        <div className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-[#0A0A0B] to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-[#0A0A0B] to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Comparison Section */}
      <div className="w-full max-w-5xl mt-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight text-white">Traditional Method vs. ClawLink</h2>
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-12 text-left border-b border-white/10 pb-16">
          <div className="w-full md:w-1/2 space-y-5 text-gray-300 text-base font-medium">
             {["Purchasing virtual machine", "SSH key setup", "Installing Node.js", "Installing Custom Bot", "Environment Setup"].map((item, idx) => (
                 <div key={idx} className="flex justify-between border-b border-white/5 pb-3">
                    <span>{item}</span>
                    <span className="font-mono text-gray-500">~15 min</span>
                 </div>
             ))}
            <div className="flex justify-between font-bold text-lg text-white pt-4"><span>Total Time</span> <span className="text-red-400">60 MINUTES</span></div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md p-10 rounded-2xl relative overflow-hidden shadow-2xl">
            <h3 className="text-4xl font-bold mb-2 text-white font-mono">ClawLink</h3>
            <p className="text-3xl font-extrabold mb-6 text-green-400">&lt;30 Seconds</p>
            <p className="text-base text-center text-gray-300 font-medium">Done under 30 seconds. Pre-configured environment ready for you.</p>
          </div>
        </div>
      </div>

      <footer className="w-full max-w-5xl mt-32 flex flex-col items-start px-6 border-t border-white/10 pt-16 pb-10">
        <h2 className="text-4xl font-bold mb-6 text-white">Deploy. Automate. Relax.</h2>
        <button className="bg-[#FFA07A] text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#FF8C61] transition-colors">
          Learn More <ChevronRight className="w-5 h-5" />
        </button>
        <div className="w-full mt-20 pt-8 border-t border-white/10 text-xs text-gray-500 uppercase tracking-wider">
          <p>© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</p>
        </div>
      </footer>
    </main>
  );
}