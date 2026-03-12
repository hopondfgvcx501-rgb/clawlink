"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Zap, Globe, Mic, Database, Users, Megaphone, Cpu, CheckCircle2 } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Globe className="w-6 h-6 text-blue-500" />,
      title: "Omnichannel Deployment",
      desc: "Deploy your AI agent across Telegram, WhatsApp Cloud, and your own website with a single click."
    },
    {
      icon: <Database className="w-6 h-6 text-green-500" />,
      title: "Enterprise RAG Memory",
      desc: "Inject your business FAQs, return policies, and product details into the AI's Vector DB Brain."
    },
    {
      icon: <Mic className="w-6 h-6 text-purple-500" />,
      title: "Voice Note Intelligence",
      desc: "Native integration with OpenAI Whisper. Your bot listens to customer voice notes and replies contextually."
    },
    {
      icon: <Cpu className="w-6 h-6 text-orange-500" />,
      title: "Actionable AI Interceptor",
      desc: "AI doesn't just talk; it acts. Automatically trigger APIs to check order status or book meetings."
    },
    {
      icon: <Users className="w-6 h-6 text-pink-500" />,
      title: "Live CRM & Human Handoff",
      desc: "Monitor AI conversations in real-time and instantly take over manually when a human touch is needed."
    },
    {
      icon: <Megaphone className="w-6 h-6 text-yellow-500" />,
      title: "Marketing Broadcast Engine",
      desc: "Blast promotional offers and updates to thousands of captured leads with zero extra marketing cost."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 🚀 NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-8 h-8 text-blue-500"/>
            clawlink<span className="text-blue-500">.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/api/auth/signin" className="text-sm font-bold text-gray-300 hover:text-white transition-colors hidden md:block">
              Sign In
            </Link>
            <Link href="/dashboard" className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black tracking-widest uppercase hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* 🚀 HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col justify-center items-center text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            ClawLink Engine v2.0 Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            Deploy Autonomous <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              AI Support Agents.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop losing customers while you sleep. Instantly inject your business data into our Universal Fallback AI and deploy it across Telegram, WhatsApp, and your Website in 60 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2">
              <Zap className="w-5 h-5"/> Start Building Free
            </Link>
            <a href="#features" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2">
              View Enterprise Features <ArrowRight className="w-4 h-4"/>
            </a>
          </div>
        </motion.div>
      </section>

      {/* 🚀 FEATURES GRID */}
      <section id="features" className="py-24 bg-[#111] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Beyond a Simple Chatbot.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">ClawLink replaces multiple tools. It's your CRM, Marketing Hub, and Customer Support Agent all packed into one god-tier platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black/40 border border-white/10 p-8 rounded-3xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 ARCHITECTURE HIGHLIGHT */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              The Immortal <br/>
              <span className="text-blue-500">Universal Fallback.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Never experience downtime. If GPT-5.4 fails, we instantly route to GPT-4. If OpenAI goes down entirely, we fallback to Claude or Gemini natively. Your business never sleeps.
            </p>
            <ul className="space-y-4">
              {['Zero Downtime Guarantee', 'Smart Token Economics', 'Secure PGVector DB Integration'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-green-500"/> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-[100px] rounded-full"></div>
            <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl font-mono text-xs md:text-sm text-blue-300 overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10 text-gray-500">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2">fallback-engine.ts</span>
              </div>
              <code>
                <span className="text-pink-400">try</span> {'{\n'}
                {'  '}await executeLatestModel();<br/>
                {'}'} <span className="text-pink-400">catch</span> (err) {'{\n'}
                {'  '}<span className="text-gray-500">// Seamlessly switch to backup model</span><br/>
                {'  '}console.log(<span className="text-green-400">'Wake up fallback...'</span>);<br/>
                {'  '}await triggerImmortalChain();<br/>
                {'}'}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 CTA FOOTER */}
      <footer className="border-t border-white/10 bg-[#0A0A0B] pt-20 pb-10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-black mb-6">Ready to automate your growth?</h2>
          <p className="text-gray-400 mb-10">Join the elite businesses using ClawLink to convert leads and support customers 24/7.</p>
          <Link href="/dashboard" className="inline-block bg-white text-black px-10 py-5 rounded-full text-sm font-black tracking-widest uppercase hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-20">
            Launch Your AI Agent Now
          </Link>
          
          <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-10 text-xs text-gray-600 font-mono">
            <p>© 2026 ClawLink Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}