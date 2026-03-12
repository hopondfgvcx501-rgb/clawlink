"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, HelpCircle, X, Send } from "lucide-react";
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
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.2");
  const [selectedChannel, setSelectedChannel] = useState<string>("telegram");

  // Support Modal State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportType, setSupportType] = useState("Technical Issue");
  const [supportDesc, setSupportDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const models: ModelType[] = [
    { id: "gpt-5.2", name: "GPT-5.2", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#10A37F" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zM13.2599 22.0627a4.123 4.123 0 0 1-3.565-2.0076l1.3268-1.3268a2.128 2.128 0 0 0 3.0073 0l5.881-5.881a4.123 4.123 0 0 1-6.65 9.2154zM5.9847 19.1627a4.123 4.123 0 0 1-2.0076-3.565l1.3268 1.3268a2.128 2.128 0 0 0 0-3.0073l-5.881-5.881a4.123 4.123 0 0 1 6.5618 11.1265zM2.0076 9.8211A4.123 4.123 0 0 1 5.5726 7.8135L4.2458 9.1403a2.128 2.128 0 0 0 0 3.0073l5.881 5.881a4.123 4.123 0 0 1-8.1192-8.2075zM9.8211 2.0076a4.123 4.123 0 0 1 3.565 2.0076L12.0593 5.342a2.128 2.128 0 0 0-3.0073 0l-5.881 5.881a4.123 4.123 0 0 1 6.65-9.2154zM18.0153 4.8373a4.123 4.123 0 0 1 2.0076 3.565l-1.3268-1.3268a2.128 2.128 0 0 0 0 3.0073l5.881 5.881a4.123 4.123 0 0 1-6.5618-11.1265zM21.9924 14.1789a4.123 4.123 0 0 1-3.565 2.0076l1.3268-1.3268a2.128 2.128 0 0 0 0-3.0073l-5.881-5.881a4.123 4.123 0 0 1 8.1192 8.2075zM12 14.128A2.128 2.128 0 1 1 12 9.872a2.128 2.128 0 0 1 0 4.256z"/></svg> },
    { id: "claude", name: "Opus 4.6", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#D97757" d="M12 0l2.3 8.3c.2.6.7 1.1 1.3 1.3L24 12l-8.4 2.4c-.6.2-1.1.7-1.3 1.3L12 24l-2.3-8.3c-.2-.6-.7-1.1-1.3-1.3L0 12l8.4-2.4c.6-.2 1.1-.7 1.3-1.3L12 0z"/></svg> },
    { id: "gemini", name: "Gemini 3 Flash", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#8AB4F8" d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/></svg> },
    { id: "llama", name: "Llama 3 (Soon)", icon: <span className="text-lg">🦙</span>, disabled: true },
  ];

  const channels: ChannelType[] = [
    { id: "telegram", name: "Telegram", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#2AABEE" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.661 3.495-1.524 5.83-2.529 7.005-3.02 3.333-1.392 4.025-1.636 4.476-1.636z"/></svg> },
    { id: "whatsapp", name: "WhatsApp", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> },
    { id: "discord", name: "Discord (Soon)", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> },
    { id: "instagram", name: "Instagram (Soon)", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#E1306C" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm3.98-10.395a1.44 1.44 0 1 0 0-2.88 1.44 1.44 0 0 0 0 2.88z"/></svg>, disabled: true },
  ];

  const row1 = ["Read & summarize email", "Draft replies and follow-ups", "Translate messages in real time", "Organize your inbox", "Notify before a meeting"];
  const row2 = ["Remind you of deadlines", "Plan your week", "Take meeting notes", "Sync across time zones", "Do your taxes", "Track expenses"];
  const row3 = ["Run payroll calculations", "Negotiate refunds", "Find best prices online", "Find discount codes", "Compare product specs"];
  const row4 = ["Write contracts and NDAs", "Research competitors", "Screen leads", "Generate invoices", "Monitor news and alerts"];

  const submitSupportTicket = async () => {
    if (!supportEmail || !supportDesc) {
      alert("Please provide your email address and issue description.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: supportEmail, issueType: supportType, description: supportDesc })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("Support ticket created successfully. Our team will review this shortly.");
        setIsSupportOpen(false);
        setSupportDesc("");
      } else {
        alert("Error submitting ticket: " + data.error);
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-8 pb-20 px-4 relative overflow-x-hidden">
      <div className="fixed inset-0 z-[-1]">
         <StarBackground />
      </div>

      <nav className="w-full max-w-6xl flex justify-between items-center mb-20 px-6">
        <div className="text-xl font-medium tracking-wider font-mono text-white">clawlink.com</div>
        <div className="flex gap-8 items-center text-sm tracking-widest uppercase font-semibold text-gray-400">
          <button onClick={() => setIsSupportOpen(true)} className="flex items-center gap-2 border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all text-white group shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <HelpCircle className="w-4 h-4 group-hover:text-black" /> Contact Support
          </button>
        </div>
      </nav>

      {/* 🚀 SUPPORT MODAL */}
      <AnimatePresence>
        {isSupportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-[#0A0A0B] border border-white/20 rounded-3xl w-full max-w-lg p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative"
            >
              <button onClick={() => setIsSupportOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-xl text-white"><HelpCircle className="w-6 h-6"/></div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">ClawLink Support</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Global Technical Desk</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Registered Email Address</label>
                  <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none text-white transition-all"/>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Issue Category</label>
                  <select value={supportType} onChange={(e) => setSupportType(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none text-white transition-all appearance-none cursor-pointer">
                    <option>Technical Issue (Bot Offline)</option>
                    <option>Billing & Subscription</option>
                    <option>Integration Problem</option>
                    <option>General Feedback / Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Describe Your Problem</label>
                  <textarea value={supportDesc} onChange={(e) => setSupportDesc(e.target.value)} placeholder="Please include your Bot ID or specific error messages so our admin team can assist you faster." rows={4} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none text-white transition-all resize-none"></textarea>
                </div>
              </div>

              <button onClick={submitSupportTicket} disabled={isSubmitting} className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl text-sm hover:bg-gray-200 transition-all uppercase tracking-widest flex justify-center items-center gap-2">
                {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4"/> Submit Ticket</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center max-w-3xl mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Deploy ClawLink under 30 SECONDS</h1>
        <p className="text-gray-400 text-lg md:text-xl font-normal leading-relaxed">Avoid all technical complexity and one-click<br/>deploy your own 24/7 active ClawLink instance under 30 seconds.</p>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-12">
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

      <div className="w-full mt-40 mb-24 overflow-hidden relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">Unleash thousands of use cases</h2>
          <p className="text-gray-400 text-lg">Your ClawLink agent handles complex cognitive tasks instantly.</p>
        </div>
        
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
            <div className="flex w-max animate-marquee gap-4">
            {[...row3, ...row3].map((text, i) => (
                <div key={`r3-${i}`} className="flex-shrink-0 border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-gray-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-500" /> {text}
                </div>
            ))}
            </div>
            <div className="flex w-max animate-marquee-reverse gap-4">
            {[...row4, ...row4].map((text, i) => (
                <div key={`r4-${i}`} className="flex-shrink-0 border border-white/10 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium text-gray-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-500" /> {text}
                </div>
            ))}
            </div>
        </div>

        <div className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-[#0A0A0B] to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-[#0A0A0B] to-transparent pointer-events-none z-10"></div>
      </div>

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
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-[#FFA07A] text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#FF8C61] transition-colors mb-16">
          Start Deploying <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/10 pt-8 text-xs text-gray-500 font-medium">
          <p className="uppercase tracking-wider">© 2026 CLAWLINK INC. GLOBAL AI SAAS.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/refund" className="hover:text-white transition-colors">Refund Policy</a>
            <button onClick={() => setIsSupportOpen(true)} className="hover:text-white transition-colors font-bold text-blue-400">Help Desk</button>
          </div>
        </div>
      </footer>
    </main>
  );
}