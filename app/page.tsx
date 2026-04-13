"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE FRONTEND SECURE MODULE
 * ==============================================================================================
 * @file app/page.tsx
 * @version 10.3.0 (Restored Horizontal Layout & Demo Flow)
 * @description Main onboarding interface with strict Product-Led Growth (PLG) routing.
 * FIXED: Restored 5-column horizontal layout for channels and models to prevent text clipping.
 * FIXED: Maintained unlocked pre-login selection (Demo Mode).
 * Integrates KNOX Level-7 Apple-grade security protocol.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Globe, Database, Mic, Zap, MessageSquare, Activity,
  LogOut, Shield, ExternalLink, CheckCircle2, Copy,
  MessageCircle, X, Send, Mail
} from "lucide-react";
import Image from "next/image";

/**
 * ==============================================================================================
 * KNOX ENTERPRISE SECURITY PROTOCOL (FRONTEND DOM PROTECTION)
 * ==============================================================================================
 */
class KnoxSecurityProtocol {
  private static isInitialized = false;
  private static violationCount = 0;

  static initialize() {
    if (typeof window === "undefined" || this.isInitialized) return;
    this.isInitialized = true;
    this.sabotageConsole();
    this.monitorDOMIntegrity();
  }

  private static sabotageConsole() {
    if (process.env.NODE_ENV !== "development") {
      const noOp = () => {};
      console.log = noOp;
      console.info = noOp;
      console.warn = noOp;
      console.error = noOp;
      console.debug = noOp;
      console.trace = noOp;
    }
  }

  private static monitorDOMIntegrity() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === "SCRIPT" && !(node as HTMLScriptElement).src.includes("stripe") && !(node as HTMLScriptElement).src.includes("razorpay")) {
             node.parentNode?.removeChild(node);
             this.registerViolation("Unauthorized Script Injection");
          }
        });
      });
    });
    observer.observe(document, { childList: true, subtree: true });
  }

  private static registerViolation(reason: string) {
    this.violationCount++;
  }
}

const PRICING_DATA: Record<string, any> = {
  "gemini 3.1 Pro": {
    name: "Gemini 3.1 Pro",
    plans: [
      { id: "plus", name: "Plus", usd: 6, inr: 5, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 12, inr: 999, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 24, inr: 1999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 599, inr: 49999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  "gpt-5.4 Pro": { 
    name: "GPT-5.4 Pro",
    plans: [
      { id: "plus", name: "Plus", usd: 8, inr: 5, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 18, inr: 1499, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 36, inr: 2999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 899, inr: 74999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  "Claude Opus 4.6": {
    name: "Claude Opus 4.6",
    plans: [
      { id: "plus", name: "Plus", usd: 10, inr: 5, msgs: "Optimized Speed", desc: "Instant customer conversions & rapid response.", accent: "rgba(255,255,255,.35)", color: "text-gray-400" },
      { id: "pro", name: "Pro", usd: 24, inr: 1999, msgs: "Enterprise Scale", desc: "Complex query mastermind & priority routing.", accent: "#3B82F6", color: "text-blue-400", badge: "Popular" },
      { id: "ultra", name: "Ultra", usd: 48, inr: 3999, msgs: "Peak Execution", desc: "Zero parallel chat limit & max system power.", accent: "#A855F7", color: "text-purple-400" },
      { id: "adv_max", name: "Adv Max", usd: 1199, inr: 99999, msgs: "Unlimited Tier", desc: "Global system dominance & uncapped scaling.", accent: "#F97316", color: "text-orange-400", badge: "Yearly ⭐", isYearly: true }
    ]
  },
  "omni 3 nexus": {
    name: "Omni 3 Nexus",
    plans: [
      { id: "monthly", name: "Pro Bundle", usd: 249, inr: 20916, msgs: "Smart Matrix", desc: "Elite multi-persona integration. 3x Fallback.", accent: "#00BFFF", color: "text-[#00BFFF]" },
      { id: "yearly", name: "Adv Premium", usd: 1799, inr: 149999, msgs: "Zero Downtime", desc: "Ultimate auto-routing & global priority access.", accent: "#BA7517", color: "text-[#BA7517]", badge: "Yearly ⭐", isYearly: true }
    ]
  }
};

const OpenAI_Icon  = ({ size = 26 }: { size?: number }) => <Image src="/logos/openai.svg"  alt="GPT-4o OpenAI Agent Icon"  width={size} height={size} className="transform-gpu" />;
const Claude_Icon  = ({ size = 26 }: { size?: number }) => <Image src="/logos/claude.svg"  alt="Claude 3 Anthropic AI Icon"  width={size} height={size} className="transform-gpu" />;
const Gemini_Icon  = ({ size = 26 }: { size?: number }) => <Image src="/logos/gemini.svg"  alt="Gemini Google AI Bot Icon"  width={size} height={size} className="transform-gpu" />;

const Llama_Icon = ({ size = 26 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 transform-gpu">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const Omni_Icon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#00BFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5C10 4.5 8 5.5 7.5 7.5 6 7.5 4.5 8.5 4.5 10.5 4 11.5 4 13 5 14 4.5 15.5 5.5 17 7 17.5 7.5 19 9 20 10.5 20H12"/>
    <path d="M12 4.5C14 4.5 16 5.5 16.5 7.5 18 7.5 19.5 8.5 19.5 10.5 20 11.5 20 13 19 14 19.5 15.5 18.5 17 17 17.5 16.5 19 15 20 13.5 20H12"/>
    <line x1="12" y1="4.5" x2="12" y2="20"/>
    <circle cx="8.5" cy="10.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="15.5" cy="10.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="7.5" cy="14.5" r="1" fill="#00BFFF" stroke="none"/>
    <circle cx="16.5" cy="14.5" r="1" fill="#00BFFF" stroke="none"/>
    <line x1="8.5" y1="10.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="15.5" y1="10.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="7.5" y1="14.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
    <line x1="16.5" y1="14.5" x2="12" y2="12.5" strokeWidth="1" strokeOpacity=".5"/>
  </svg>
);

const Telegram_Icon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform-gpu">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#2AABEE"/>
    <path d="M5.425 11.871L16.48 7.61c.526-.196 1.006.124.819.86l-1.892 8.92c-.167.755-.615.939-1.242.593L10.73 15.45l-1.657 1.588c-.183.183-.338.338-.692.338l.245-3.528 6.425-5.8c.28-.249-.06-.388-.435-.138L6.68 12.89l-3.417-1.066c-.744-.233-.759-.745.155-1.103z" fill="#fff"/>
  </svg>
);

const WhatsApp_Icon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="transform-gpu">
    <rect width="100" height="100" rx="24" fill="#25D366"/>
    <path fill="#ffffff" d="M50 15c-19.3 0-35 15.7-35 35 0 6.2 1.6 12.2 4.7 17.5L15 85l17.5-4.7c5.3 3.1 11.3 4.7 17.5 4.7 19.3 0 35-15.7 35-35S69.3 15 50 15zm0 63.8c-5.2 0-10.4-1.4-15-4.1l-1.1-.6-11.1 2.9 2.9-10.8-.7-1.1c-2.9-4.7-4.5-10.1-4.5-15.6 0-16.2 13.2-29.4 29.4-29.4s29.4 13.2 29.4 29.4-13.2 29.4-29.4 29.4z"/>
    <path fill="#ffffff" d="M42 34h9.5c5.5 0 8.5 2.5 8.5 5.5s-2.8 4.2-5.5 4.8c4 1 7 3.5 7 7.5 0 5.5-5.5 7.2-10 7.2H42V34zm5 5.5v7h4c2 0 4-1 4-3.5s-2-3.5-4-3.5h-4zm0 11v8h4.5c3 0 4.5-1.5 4.5-4s-2-4-4.5-4H47z"/>
  </svg>
);

const Discord_Icon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#5865F2" className="transform-gpu">
    <path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4z"/>
  </svg>
);

const Instagram_Icon = ({ size = 22 }: { size?: number }) => (
  <div className={`w-[${size}px] h-[${size}px] rounded-lg bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transform-gpu shrink-0`}>
    <div className="w-[60%] h-[60%] border-[2px] border-white rounded-[4px] flex items-center justify-center">
      <div className="w-[35%] h-[35%] bg-white rounded-full"/>
    </div>
  </div>
);

const Google_Icon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="transform-gpu">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
  </svg>
);

const ChatBubble = ({ text, delay, isUser }: { text: string; delay: number; isUser?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay, duration: 0.12, ease: "easeOut" }}
    className={`p-3 rounded-2xl max-w-[85%] text-[11px] shadow-md leading-relaxed transform-gpu
      ${isUser ? "bg-[#2AABEE] text-white self-end rounded-tr-sm" : "bg-[#1A1A1A] border border-white/5 text-gray-200 self-start rounded-tl-sm"}`}
  >
    {text}
  </motion.div>
);

const GuideStep = ({ step, title, desc, delay }: { step: string; title: string; desc: string; delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, x: 16 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ delay, duration: 0.12, ease: "easeOut" }}
    className="flex gap-3 bg-[#1A1A1A] border border-white/5 p-3 rounded-xl shadow-md w-[90%] self-center mx-auto items-start transform-gpu"
  >
    <div className="w-5 h-5 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
      {step}
    </div>
    <div className="flex flex-col">
      <span className="text-white font-bold mb-1 text-[11px]">{title}</span>
      <span className="text-gray-400 text-[9px] leading-relaxed">{desc}</span>
    </div>
  </motion.div>
);

const MarqueeRow = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => (
  <div className="flex whitespace-nowrap overflow-hidden py-2.5 w-full">
    <motion.div 
      className="flex gap-5 w-max will-change-transform" 
      style={{ transform: "translateZ(0)" }} 
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} 
      transition={{ ease: "linear", duration: 45, repeat: Infinity }}
    >
      {[...items, ...items, ...items, ...items].map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2.5 text-[12px] text-gray-300 font-medium bg-white/[0.04] px-5 py-2.5 rounded-full border border-white/[0.08] whitespace-nowrap hover:border-orange-500/50 hover:text-white hover:bg-white/[0.08] transition-colors duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500/80 shrink-0"/>{item}
        </span>
      ))}
    </motion.div>
  </div>
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  
  const [telegramToken, setTelegramToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [botLink, setBotLink] = useState("");
  
  const [activeModel, setActiveModel] = useState("gpt-5.4 Pro");
  const [activeChannel, setActiveChannel] = useState("telegram");
  
  const [currency, setCurrency] = useState<"USD"|"INR">("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpEmail, setHelpEmail] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpStatus, setHelpStatus] = useState<"idle"|"sending"|"sent">("idle");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("clawlink_model");
      const savedChannel = localStorage.getItem("clawlink_channel");
      if (savedModel) setActiveModel(savedModel);
      if (savedChannel && savedChannel !== "widget" && savedChannel !== "broadcast" && savedChannel !== "partner") setActiveChannel(savedChannel);
    }
  }, []);

  const handleModelSelect = (modelId: string) => {
    if (!isTokenSaved) {
      setActiveModel(modelId);
      if (typeof window !== "undefined") {
        localStorage.setItem("clawlink_model", modelId);
      }
    }
  };

  const handleChannelSelect = (channelId: string) => {
    if (!isTokenSaved) {
      setActiveChannel(channelId);
      if (typeof window !== "undefined") {
        localStorage.setItem("clawlink_channel", channelId);
      }
    }
  };

  const handleLoginOrDeploy = () => {
    if (status !== "authenticated") {
        signIn("google");
    } else {
        handleOpenIntegration(activeChannel);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    KnoxSecurityProtocol.initialize();

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lang = navigator.language || "";
      if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("Asia/Colombo") || lang.includes("-IN") || lang === "hi") { 
        setCurrency("INR"); 
        setCurrencySymbol("₹"); 
      } else {
        setCurrency("USD");
        setCurrencySymbol("$");
      }
    } catch (e) {}

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { 
        if (e.isIntersecting) e.target.classList.add('sr-vis'); 
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    setTimeout(() => {
      document.querySelectorAll('.sr-up, .sr-left, .sr-rght').forEach((el) => io.observe(el));

      const fio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const cards = e.target.querySelectorAll('.fi-card');
            cards.forEach((c: any, i: number) => {
              c.style.transition = 'opacity .25s ' + (0.02 + i * 0.05) + 's cubic-bezier(.16,1,.3,1), transform .25s ' + (0.02 + i * 0.05) + 's cubic-bezier(.16,1,.3,1)';
              c.style.opacity = '1';
              c.style.transform = 'none';
            });
            fio.unobserve(e.target);
          }
        });
      }, { threshold: 0.02 });

      document.querySelectorAll('.fi-card').forEach((el: any) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(12px)';
      });

      document.querySelectorAll('section, div[class*="sec"]').forEach((g) => {
        if (g.querySelector('.fi-card')) fio.observe(g);
      });
    }, 50);

    const handleScroll = () => {
      const nav = document.getElementById('clnav');
      if (nav) nav.style.background = window.scrollY > 30 ? 'rgba(7,7,10,0.92)' : 'rgba(7,7,10,0.4)';
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const cg = document.createElement('div');
    cg.className = 'cg-dot';
    document.body.appendChild(cg);
    let mx2 = 0, my2 = 0, cgx = 0, cgy = 0;
    const onMM = (e: MouseEvent) => { mx2 = e.clientX; my2 = e.clientY; };
    document.addEventListener('mousemove', onMM, { passive: true });
    let cgRaf: number;
    const animCG = () => {
      cgx += (mx2 - cgx) * 0.09;
      cgy += (my2 - cgy) * 0.09;
      cg.style.left = cgx + 'px';
      cg.style.top  = cgy + 'px';
      cgRaf = requestAnimationFrame(animCG);
    };
    cgRaf = requestAnimationFrame(animCG);

    const onRippleClick = (e: MouseEvent) => {
      const t = e.currentTarget as HTMLElement;
      const r = t.getBoundingClientRect();
      const d = document.createElement('span');
      d.className = 'rpl-wave';
      const sz = Math.max(r.width, r.height) * 2.4;
      d.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px;position:absolute`;
      t.appendChild(d);
      setTimeout(() => d.remove(), 650);
    };
    document.querySelectorAll('[data-ripple]').forEach(el => {
      el.addEventListener('click', onRippleClick as EventListener);
    });

    const onSpringClick = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      t.classList.remove('spr-play');
      void t.offsetWidth;
      t.classList.add('spr-play');
      setTimeout(() => t.classList.remove('spr-play'), 420);
    };
    document.querySelectorAll('[data-spring]').forEach(el => {
      el.addEventListener('click', onSpringClick);
    });

    document.querySelectorAll('.tilt-el').forEach(el => {
      const e2 = el as HTMLElement;
      e2.addEventListener('mousemove', (ev: any) => {
        const r  = e2.getBoundingClientRect();
        const x  = (ev.clientX - r.left) / r.width  - 0.5;
        const y  = (ev.clientY - r.top)  / r.height - 0.5;
        e2.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
      });
      e2.addEventListener('mouseleave', () => {
        e2.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
      });
    });

    document.querySelectorAll('.mag-el').forEach(el => {
      const span = el.querySelector('.mt');
      if (!span) return;
      const e2 = el as HTMLElement;
      e2.addEventListener('mousemove', (ev: any) => {
        const r = e2.getBoundingClientRect();
        const x = (ev.clientX - r.left - r.width  / 2) * 0.28;
        const y = (ev.clientY - r.top  - r.height / 2) * 0.28;
        (span as HTMLElement).style.transform = `translate(${x}px,${y}px)`;
      });
      e2.addEventListener('mouseleave', () => {
        (span as HTMLElement).style.transform = 'translate(0,0)';
      });
    });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', onMM);
      cancelAnimationFrame(cgRaf);
      if (cg.parentNode) cg.parentNode.removeChild(cg);
    };
  }, []);

  const handleOpenIntegration = (ch: string) => {
    if (ch === "discord" || ch === "slack") return;
    handleChannelSelect(ch); 
    setIsTelegramModalOpen(true);
  };
  
  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const payload = {
        email: session?.user?.email,
        selectedModel: activeModel,
        selectedChannel: activeChannel,
        telegramToken: activeChannel === "telegram" ? telegramToken : "",
        waPhoneId: (activeChannel === "whatsapp" || activeChannel === "instagram") ? waPhoneId : "",
        waPhoneNumber: activeChannel === "whatsapp" ? waPhoneNumber : "",
        plan: "free",
        plan_status: "Inactive",
        bot_status: "Sleeping"
      };

      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("clawlink_model");
            localStorage.removeItem("clawlink_channel");
        }
        router.push("/dashboard"); 
      } else {
        alert("Configuration Error: " + data.error);
      }
    } catch (error) {
      console.error("Deployment Error:", error);
      alert("Network exception encountered.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSaveToken = async () => {
    if (activeChannel === "telegram" && !telegramToken.trim()) {
      alert("Please supply a valid structured Telegram API Token."); return;
    }
    if ((activeChannel === "whatsapp" || activeChannel === "instagram") && (!telegramToken.trim() || !waPhoneId.trim())) {
      alert("Verification requires both an API Token and corresponding Account ID."); return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/verify-token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: activeChannel, token: telegramToken, phoneId: waPhoneId, phoneNumber: waPhoneNumber }),
      });
      const data = await res.json();
      if (data.success) { 
        setIsTokenSaved(true); 
        setIsTelegramModalOpen(false); 
      }
      else alert("❌ VERIFICATION REJECTED: " + data.error);
    } catch { alert("Network integrity lost during verification handshake."); }
    finally { setIsVerifying(false); }
  };

  const handleSendHelpRequest = () => {
    if (!helpEmail.trim() || !helpMessage.trim()) { alert("Please complete all necessary input fields."); return; }
    setHelpStatus("sending");
    setTimeout(() => {
      setHelpStatus("sent");
      setTimeout(() => { setIsHelpOpen(false); setHelpStatus("idle"); setHelpMessage(""); }, 1500);
    }, 800);
  };

  const openLiveBotHandler = () => {
    if (activeChannel === "whatsapp") {
      if (waPhoneNumber) { 
        window.open(`https://api.whatsapp.com/send?phone=${waPhoneNumber.replace(/\D/g, '')}`, "_blank"); 
      } else if (botLink && botLink.includes('wa.me')) { 
        window.open(botLink.replace('wa.me/', 'api.whatsapp.com/send?phone='), "_blank"); 
      } else { 
        window.open("https://api.whatsapp.com/", "_blank"); 
      }
    } else if (activeChannel === "instagram") {
        window.open("https://www.instagram.com/", "_blank"); 
    } else { 
      window.open(botLink || "https://t.me/BotFather", "_blank"); 
    }
  };

  const copyToClipboard = (t: string) => { 
    navigator.clipboard.writeText(t); 
    alert("Copied to system clipboard."); 
  };

  const row1 = ["📅 Productivity & Meetings", "🤖 Create WhatsApp AI Agent", "📊 Create presentations", "💬 Instagram DM Automation", "🛒 Shopping & Research", "👥 Team & Monitoring"];
  const row2 = ["📅 Schedule meetings", "🧠 OpenClaw Alternative", "💰 Do your taxes with AI", "🎯 Telegram Crypto Bot", "🧾 Track expenses", "👔 Write job descriptions"];
  const row3 = ["✉️ Email & Documents", "📨 Read & summarize emails", "🤖 No-Code AI Bot Builder", "🏷️ Find coupons automatically", "📈 Track OKRs & KPIs", "💬 WhatsApp Customer Support"];
  const row4 = ["⏰ Notify before meetings", "🌍 Sync time zones", "🚀 GPT-4o Bot Creator", "🔍 Compare product specs", "🕵️ Research competitors", "⚡ Omni-Fallback Engine"];
  const row5 = ["📅 Plan your week", "📝 Take meeting notes", "🤖 Claude 3 Bot Integration", "📢 Draft social media posts", "📈 Sales, Marketing & Hiring", "🤖 Auto Message AI"];

  if (!isMounted) return null;

  const btn = "transition-all duration-[120ms] ease-out active:scale-[0.93] transform-gpu will-change-transform";

  // 🚀 FIXED: Restored grid-cols-5 to keep 5 items in a single row
  const pillBase = [
    "bg-white border-2 border-transparent cursor-pointer overflow-hidden",
    btn,
    "shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
    "hover:shadow-[0_8px_20px_rgba(0,0,0,0.22)] hover:-translate-y-[2px]",
    "flex-col h-[60px] px-[4px] py-[8px] gap-[4px] justify-center items-center rounded-[10px]",
  ].join(" ");

  const modelActive = (id: string) => activeModel === id && !(isTokenSaved && activeModel !== id);
  const chanActive  = (id: string) => activeChannel === id && !(isTokenSaved && activeChannel !== id);

  return (
    <div className="bg-[#07070A] min-h-screen text-[#E8E8EC] font-sans selection:bg-orange-500/30 overflow-x-hidden">

      <style dangerouslySetInnerHTML={{__html:`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        .nsb::-webkit-scrollbar{display:none}.nsb{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes bpulse{0%,100%{opacity:1}50%{opacity:.18}}
        .bpulse{animation:bpulse 1.8s ease-in-out infinite}
        @keyframes hsd{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hsu{from{opacity:0;transform:translateY(20px);filter:blur(8px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}
        .anim-badge{animation:hsd .32s cubic-bezier(.16,1,.3,1) both}
        .anim-h1   {animation:hsu .38s .06s cubic-bezier(.16,1,.3,1) both}
        .anim-sub  {animation:hsu .38s .12s cubic-bezier(.16,1,.3,1) both}
        .anim-card {animation:hsu .38s .18s cubic-bezier(.16,1,.3,1) both}
        .anim-stats{animation:hsu .38s .24s cubic-bezier(.16,1,.3,1) both}
        .sr-up  {opacity:0;transform:translateY(20px);transition:opacity .32s cubic-bezier(.16,1,.3,1),transform .32s cubic-bezier(.16,1,.3,1)}
        .sr-left{opacity:0;transform:translateX(-20px);transition:opacity .32s cubic-bezier(.16,1,.3,1),transform .32s cubic-bezier(.16,1,.3,1)}
        .sr-rght{opacity:0;transform:translateX(20px);transition:opacity .32s cubic-bezier(.16,1,.3,1),transform .32s cubic-bezier(.16,1,.3,1)}
        .sr-vis {opacity:1!important;transform:none!important}
        .cg-dot{
          position:fixed;width:380px;height:380px;border-radius:50%;
          pointer-events:none;z-index:1;
          background:radial-gradient(circle,rgba(249,115,22,0.055) 0%,transparent 65%);
          transform:translate(-50%,-50%);will-change:left,top;
        }
        .rpl-wave{
          position:absolute;border-radius:50%;
          background:rgba(0,0,0,0.13);transform:scale(0);
          animation:rplA .6s linear forwards;pointer-events:none;
        }
        @keyframes rplA{to{transform:scale(7);opacity:0}}
        @keyframes spr{
          0%  {transform:scale(1)}
          30% {transform:scale(.85)}
          65% {transform:scale(1.07)}
          82% {transform:scale(.97)}
          100%{transform:scale(1)}
        }
        .spr-play{animation:spr .4s cubic-bezier(.34,1.56,.64,1)!important}
        .tilt-el{will-change:transform;transition:transform .08s ease-out}
        .mt{display:block;transition:transform .22s cubic-bezier(.34,1.56,.64,1);pointer-events:none}
        @keyframes grs{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .grad-text{
          background:linear-gradient(135deg,#f97316 0%,#fb923c 35%,#fbbf24 60%,#f97316 100%)!important;
          background-size:250% 250%!important;
          animation:grs 2.8s ease infinite!important;
          -webkit-background-clip:text!important;
          -webkit-text-fill-color:transparent!important;
          background-clip:text!important;
        }
        @keyframes fo1{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-26px) translateX(12px)}}
        @keyframes fo2{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(20px) translateX(-16px)}}
        @keyframes fo3{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        .float-a{animation:fo1 7s ease-in-out infinite}
        .float-b{animation:fo2 9s ease-in-out infinite 1.5s}
        .float-c{animation:fo3 6s ease-in-out infinite 3s}
        .card-shimmer::before{
          content:'';position:absolute;top:0;left:15%;right:15%;height:1px;
          background:linear-gradient(90deg,transparent,rgba(249,115,22,.55),transparent)
        }
        .fi-card{position:relative;overflow:hidden}
        .fi-card::after{
          content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(249,115,22,0),transparent);
          transition:background .15s
        }
        .fi-card:hover::after{background:linear-gradient(90deg,transparent,rgba(249,115,22,.85) 50%,transparent)}
        @keyframes pring{0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}100%{box-shadow:0 0 0 10px rgba(249,115,22,0)}}
        .pulse-ring{animation:pring 2s ease-out infinite}
        .stat-hover{transition:transform .22s cubic-bezier(.16,1,.3,1)}
        .stat-hover:hover{transform:scale(1.04)}
        .icon-lift{transition:transform .2s cubic-bezier(.34,1.56,.64,1)}
        .icon-lift:hover{transform:scale(1.12) rotate(-4deg)}
        
        .ptx-name{font-size:11px;font-weight:900;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;width:100%}
        .ptx-sub {font-size:8px;font-weight:700;opacity:.8;white-space:nowrap;text-align:center;width:100%}
        .ptx-soon{font-size:8px;font-weight:800;color:#3b82f6;text-transform:uppercase;text-align:center;width:100%}
        
        .orange-glow{box-shadow:0 0 28px rgba(249,115,22,.48)}
        .orange-glow:hover{box-shadow:0 0 48px rgba(249,115,22,.65)}
      `}}/>

      <div className="fixed top-[-20%] right-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0 float-a"
           style={{background:"radial-gradient(circle,rgba(249,115,22,0.18) 0%,transparent 65%)",transform:"translateZ(0)"}}/>
      <div className="fixed bottom-[-20%] left-[-8%] w-[800px] h-[800px] rounded-full pointer-events-none z-0 float-b"
           style={{background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 65%)",transform:"translateZ(0)"}}/>
      <div className="fixed top-[30%] left-[40%] w-[500px] h-[500px] rounded-full pointer-events-none z-0 float-c"
           style={{background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)"}}/>

      <nav id="clnav" aria-label="Main Navigation"
        className="fixed top-0 left-0 right-0 z-[100] h-[64px] flex items-center justify-between px-6 md:px-12 transition-colors duration-200"
        style={{backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                background:"rgba(7,7,10,0.4)",borderBottom:"1px solid rgba(255,255,255,0.055)"}}>

        <svg aria-label="ClawLink Home" width="140" height="24" viewBox="0 0 152 26" fill="none" className="shrink-0 cursor-pointer transition-transform hover:scale-105" onClick={() => router.push("/")}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff"/><stop offset="1" stopColor="rgba(255,255,255,.65)"/>
            </linearGradient>
          </defs>
          <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="rgba(255,255,255,.1)" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="url(#cg)" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
          <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
          <text x="30" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="#fff">LAWLINK</text>
          <text x="116" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="9.5" fontWeight="700" letterSpacing=".7" fill="#f97316">.COM</text>
        </svg>

        <div className="flex items-center gap-4 md:gap-6">
          {status === "authenticated" && (
            <div className="hidden md:flex items-center gap-3">
              <img src={session?.user?.image || "https://ui-avatars.com/api/?name=User&background=random"} className="w-8 h-8 rounded-full border border-white/20 ring-1 ring-white/10" alt="User Avatar"/>
              <button aria-label="Sign out of ClawLink" onClick={()=>signOut()}
                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-white ${btn}`}>
                <LogOut className="w-4 h-4"/> Logout
              </button>
            </div>
          )}
          <button aria-label="Contact ClawLink Support" data-spring onClick={()=>setIsSupportModalOpen(true)}
            className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 transition-all ${btn}`}>
            <MessageSquare className="w-4 h-4 text-orange-500"/>
            <span className="hidden sm:inline">Support</span>
          </button>
        </div>
      </nav>

      <section id="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center">
        <div className="anim-badge inline-flex items-center gap-2 mb-6 px-6 py-2.5 rounded-full text-[11px] font-black tracking-[.15em] text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          style={{background:"rgba(249,115,22,0.09)",border:"1px solid rgba(249,115,22,0.26)"}}>
          <span className="w-2 h-2 rounded-full bg-orange-400 bpulse pulse-ring"/>
          LIVE NOW &nbsp;·&nbsp; 30-SECOND DEPLOY
        </div>

        <h1 className="anim-h1 text-[clamp(2.8rem,7vw,6rem)] font-black leading-[1.05] tracking-[-0.04em] mb-6 text-white max-w-[1000px]">
          Deploy <span className="grad-text">OpenClaw AI Assistance</span><br/>Under 30 Seconds
        </h1>

        <p className="anim-sub text-gray-300 text-[16px] md:text-[18px] max-w-[600px] mb-10 leading-[1.8]">
          Avoid all technical complexity — one-click deploy your own 24/7 active Personal AI Assistant for WhatsApp, Telegram & Instagram. No code. No servers. Just results.
        </p>

        {/* 🚀 FIXED: Restored 5-column grid layout for Selection UI */}
        <div className="anim-card card-shimmer tilt-el relative w-full max-w-[650px] rounded-[24px] p-6 md:p-8 mb-8 overflow-hidden"
          style={{background:"rgba(255,255,255,0.028)",border:"1px solid rgba(255,255,255,0.08)",
                  boxShadow:"0 0 80px rgba(249,115,22,0.08),0 40px 80px rgba(0,0,0,0.6)"}}>
          
            <p className="text-[10px] font-black tracking-[.2em] uppercase text-gray-400 text-left flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <span className="w-4 h-4 text-[9px] rounded bg-white/10 flex items-center justify-center text-white">1</span>
              Choose Your AI Model
            </p>
            <div className="grid grid-cols-5 gap-[6px] mb-6">
              <button aria-label="Select GPT-5.4 Pro Model" data-spring onClick={() => handleModelSelect("gpt-5.4 Pro")} disabled={isTokenSaved && activeModel!=="gpt-5.4 Pro"}
                className={[pillBase, modelActive("gpt-5.4 Pro") ? "!border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeModel!=="gpt-5.4 Pro" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center shrink-0 bg-[#f0fdf4]"><OpenAI_Icon size={20}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name" style={{color:"#10a37f"}}>GPT-5.4</span><span className="ptx-sub" style={{color:"#10a37f"}}>Pro</span></div>
              </button>

              <button aria-label="Select Claude 3 Model" data-spring onClick={() => handleModelSelect("Claude Opus 4.6")} disabled={isTokenSaved && activeModel!=="Claude Opus 4.6"}
                className={[pillBase, modelActive("Claude Opus 4.6") ? "!border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeModel!=="Claude Opus 4.6" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center shrink-0 bg-[#fdf5f2]"><Claude_Icon size={20}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name" style={{color:"#d97757"}}>Claude</span><span className="ptx-sub" style={{color:"#d97757"}}>Opus 4.6</span></div>
              </button>

              <button aria-label="Select Gemini Model" data-spring onClick={() => handleModelSelect("gemini 3.1 Pro")} disabled={isTokenSaved && activeModel!=="gemini 3.1 Pro"}
                className={[pillBase, modelActive("gemini 3.1 Pro") ? "!border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeModel!=="gemini 3.1 Pro" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center shrink-0 bg-[#eff2ff]"><Gemini_Icon size={20}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name" style={{color:"#648af5"}}>Gemini</span><span className="ptx-sub" style={{color:"#648af5"}}>3.1 Pro</span></div>
              </button>

              <button aria-label="Select OmniAgent Fallback Model" data-spring onClick={() => handleModelSelect("omni 3 nexus")} disabled={isTokenSaved && activeModel!=="omni 3 nexus"}
                className={[pillBase, modelActive("omni 3 nexus") ? "!border-[#00bfff] shadow-[0_0_0_3px_rgba(0,191,255,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeModel!=="omni 3 nexus" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center shrink-0 bg-[#e8f9ff]"><Omni_Icon size={18}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name" style={{color:"#0369a1"}}>Omni 3</span><span className="ptx-sub" style={{color:"#00bfff"}}>Nexus</span></div>
              </button>

              <div aria-label="Llama 4 coming soon" className={[pillBase, "opacity-30 cursor-not-allowed bg-[#111] border-white/5 pointer-events-none"].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center shrink-0 bg-gray-100"><Llama_Icon size={18}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-400">Llama 4</span><span className="ptx-soon" style={{animation:"bpulse 1.8s ease-in-out infinite"}}>SOON</span></div>
              </div>
            </div>

            <p className="text-[10px] font-black tracking-[.2em] uppercase text-gray-400 text-left flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <span className="w-4 h-4 text-[9px] rounded bg-white/10 flex items-center justify-center text-white">2</span>
              Select Your Channel
            </p>
            <div className="grid grid-cols-5 gap-[6px] mb-6">
              <button aria-label="Connect Telegram AI Bot" data-spring onClick={()=>handleChannelSelect("telegram")} disabled={isTokenSaved && activeChannel!=="telegram"}
                className={[pillBase, chanActive("telegram") ? "!border-[#2aabee] shadow-[0_0_0_3px_rgba(42,171,238,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeChannel!=="telegram" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"><Telegram_Icon size={24}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-200">Telegram</span></div>
              </button>

              <button aria-label="Connect WhatsApp AI Agent" data-spring onClick={()=>handleChannelSelect("whatsapp")} disabled={isTokenSaved && activeChannel!=="whatsapp"}
                className={[pillBase, chanActive("whatsapp") ? "!border-[#25d366] shadow-[0_0_0_3px_rgba(37,211,102,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeChannel!=="whatsapp" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"><WhatsApp_Icon size={24}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-200">WhatsApp</span></div>
              </button>
              
              <button aria-label="Connect Instagram Auto Reply Bot" data-spring onClick={()=>handleChannelSelect("instagram")} disabled={isTokenSaved && activeChannel!=="instagram"}
                className={[pillBase, chanActive("instagram") ? "!border-[#e6683c] shadow-[0_0_0_3px_rgba(230,104,60,0.2),0_2px_8px_rgba(0,0,0,0.12)]" : "bg-[#111] border-white/5", isTokenSaved && activeChannel!=="instagram" ? "opacity-25 pointer-events-none" : ""].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"><Instagram_Icon size={24}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-200">Instagram</span></div>
              </button>

              <div aria-label="Discord Bot Coming Soon" className={[pillBase, isTokenSaved?"opacity-20":"opacity-35", "bg-[#111] border-white/5 cursor-not-allowed pointer-events-none"].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"><Discord_Icon size={20}/></div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-400">Discord</span><span className="ptx-soon">SOON</span></div>
              </div>

              <div aria-label="Slack Bot Coming Soon" className={[pillBase, isTokenSaved?"opacity-20":"opacity-35", "bg-[#111] border-white/5 cursor-not-allowed pointer-events-none"].join(" ")}>
                <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 bg-[#4a154b]">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M5.04 15.44a2.52 2.52 0 01-5.04 0 2.52 2.52 0 012.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 015.04 0v6.3a2.52 2.52 0 01-5.04 0v-6.3zM8.56 5.04a2.52 2.52 0 010-5.04 2.52 2.52 0 012.52 2.52v2.52H8.56zm0 1.26a2.52 2.52 0 010 5.04H2.26a2.52 2.52 0 010-5.04h6.3z"/></svg>
                </div>
                <div className="flex flex-col min-w-0 items-center w-full"><span className="ptx-name text-gray-400">Slack</span><span className="ptx-soon">SOON</span></div>
              </div>
            </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center w-full">
            <AnimatePresence mode="wait">
              {botLink ? (
                <motion.div key="success" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.12,ease:"easeOut"}}
                  className="rounded-2xl p-6 text-center w-full"
                  style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)"}}>
                  <p className="text-[16px] font-bold text-white mb-5">🚀 Your Bot is Live!</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button aria-label="Open Live Bot" data-ripple data-spring onClick={openLiveBotHandler}
                      className={`relative overflow-hidden bg-white text-black font-black uppercase tracking-widest px-8 py-3.5 rounded-xl text-[13px] ${btn} hover:scale-[1.03] shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>
                      <span className="mt">Open Live Bot</span>
                    </button>
                    <button aria-label="Go to Dashboard" data-spring onClick={()=>router.push("/dashboard")}
                      className={`flex items-center justify-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl text-[13px] ${btn} hover:scale-[1.03]`}
                      style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)"}}>
                      <Activity className="w-5 h-5"/> Live Dashboard
                    </button>
                  </div>
                </motion.div>

              ) : (
                <motion.div key="login" id="login-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.12}} className="w-full flex flex-col items-center">
                  <button aria-label="Login with Google" data-ripple data-spring onClick={handleLoginOrDeploy}
                    className={`relative overflow-hidden w-full bg-white text-black py-4 rounded-[16px] flex items-center justify-center gap-3 text-[15px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.15)] ${btn} hover:scale-[1.03]`}>
                    <Google_Icon/> {status === "authenticated" ? "Finalize Deployment" : "Login via Google & Deploy"}
                  </button>
                  <p className="mt-4 text-[13px] text-gray-400 text-center leading-relaxed">
                    Deploying <strong className="text-white">{PRICING_DATA[activeModel].name}</strong> to <strong className="text-white capitalize">{activeChannel}</strong>.{" "}
                    <br/><span className="text-[#34A853] font-semibold text-[13px]">Limited enterprise servers available.</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="anim-stats grid grid-cols-3 w-full max-w-[650px] border border-white/[0.07] rounded-[22px] overflow-hidden bg-[#0A0A0D]/50 backdrop-blur-sm shadow-xl">
          {[["30s","Deploy time"],["5+","AI models"],["24/7","Always active"]].map(([n,l]) => (
            <div key={n} className="stat-hover flex flex-col items-center py-7 px-3 transition-colors duration-150 hover:bg-white/[0.04]"
              style={{background:"rgba(255,255,255,0.015)",borderRight:"1px solid rgba(255,255,255,0.04)"}}>
              <span className="text-[2.2rem] lg:text-[2.6rem] font-black leading-none grad-text">{n}</span>
              <span className="text-[11px] lg:text-[12px] font-bold tracking-widest uppercase text-gray-500 mt-2 text-center">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="relative z-10 py-28 px-6 md:px-12" style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div className="max-w-[1200px] mx-auto">
          <div className="sr-up text-center mb-20">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">How It Works</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] text-white mb-4">4 steps to go live</h2>
            <p className="text-gray-400 text-[16px] max-w-[500px] mx-auto leading-relaxed">Zero to live AI agent in 30 seconds. No tech expertise needed.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px" style={{background:"linear-gradient(90deg,transparent,rgba(249,115,22,.25) 30%,rgba(249,115,22,.25) 70%,transparent)"}}/>
            {[
              {n:"01",e:"🔑",t:"Login with Google",  d:"One tap. No passwords, no friction."},
              {n:"02",e:"🤖",t:"Choose Model & Channel",d:"Pick AI model + Telegram or WhatsApp."},
              {n:"03",e:"✅",t:"Token Verify",          d:"Paste token. Verified & secured instantly."},
              {n:"04",e:"🚀",t:"Go Live",               d:"Enterprise infra spins up. 24/7, zero maintenance."},
            ].map(({n,e,t,d},i)=>(
              <div key={n} className={`sr-up sd${i+1} flex flex-col items-center text-center px-4 relative z-10`}>
                <div className="icon-lift w-[70px] h-[70px] lg:w-[80px] lg:h-[80px] rounded-full flex items-center justify-center font-black text-[22px] lg:text-[26px] text-orange-500 mb-6 z-10 shadow-[0_0_30px_rgba(249,115,22,0.1)]"
                  style={{background:"#07070A",border:"2px solid rgba(249,115,22,0.25)",transition:"all .2s"}}
                  onMouseEnter={e2=>{(e2.target as HTMLElement).style.background="rgba(249,115,22,0.1)";(e2.target as HTMLElement).style.boxShadow="0 0 40px rgba(249,115,22,0.3)"}}
                  onMouseLeave={e2=>{(e2.target as HTMLElement).style.background="#07070A";(e2.target as HTMLElement).style.boxShadow="0 0 30px rgba(249,115,22,0.1)"}}>
                  {n}
                </div>
                <div className="text-[26px] mb-3">{e}</div>
                <div className="text-[15px] font-black text-white mb-2">{t}</div>
                <div className="text-[13px] text-gray-500 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="relative z-10 py-28 px-6 md:px-12" style={{background:"#0A0A0D",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div className="max-w-[1200px] mx-auto">
          <div className="sr-up text-center mb-16">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">Features</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] text-white mb-4">Enterprise power, zero complexity</h2>
            <p className="text-gray-400 text-[16px] max-w-[500px] mx-auto leading-relaxed">Built in, battle-tested, ready on day one.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[1px] rounded-t-[28px] overflow-hidden bg-white/[0.05] border border-white/[0.06] border-b-0">
            {[
              {bg:"rgba(59,130,246,.09)", e:"🌐",t:"Omnichannel Deployment",  d:"Deploy an AI Agent across Telegram, WhatsApp, and Instagram simultaneously. Switch channels in seconds.",tag:"Multi-platform"},
              {bg:"rgba(168,85,247,.09)",e:"🎙️",t:"Voice Intelligence",      d:"Whisper AI transcribes voice notes and replies naturally in real-time.",tag:"Whisper AI"},
              {bg:"rgba(234,179,8,.09)", e:"🚀",t:"Ultra Low Latency",         d:"Global edge network ensures sub-second response times worldwide.",tag:"Fast Response"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card bg-[#0A0A0D] p-8 md:p-10 hover:bg-[#111116] transition-colors duration-150">
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black text-white mb-3">{t}</h3>
                <p className="text-[13px] text-gray-400 leading-[1.8] mb-5">{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-[1px] bg-white/[0.05] border border-white/[0.06] border-t-0 border-b-0">
            {[
              {bg:"rgba(34,197,94,.09)", e:"🗃️",t:"Enterprise RAG Memory",      d:"Inject catalog, FAQs, brand voice into Vector DB. Your agent knows your business inside out.",tag:"Vector DB"},
              {bg:"rgba(0,191,255,.09)", e:"🧠",t:"OmniAgent — 3x AI Fallback", d:"Routes between GPT-5.4, Claude Opus 4.6, and Gemini 3.1 in real-time. 0% downtime. The ultimate OpenClaw alternative.",tag:"0% Downtime"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card bg-[#0A0A0D] p-8 md:p-10 hover:bg-[#111116] transition-colors duration-150">
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black text-white mb-3">{t}</h3>
                <p className="text-[13px] text-gray-400 leading-[1.8] mb-5">{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] rounded-b-[28px] overflow-hidden bg-white/[0.05] border border-white/[0.06] border-t-0">
            {[
              {bg:"rgba(249,115,22,.09)",e:"⚡",t:"AI Interceptor",      d:"Check orders, book slots, trigger webhooks, update CRMs — fully autonomous.",tag:"API Triggers"},
              {bg:"rgba(236,72,153,.09)",e:"💬",t:"Live CRM & Handoff",  d:"Monitor all conversations. One click to take over from AI seamlessly.",tag:"Real-time CRM"},
              {bg:"rgba(16,185,129,.09)",e:"🔒",t:"Enterprise Security", d:"AES-256 encryption. SOC 2 compliant. Zero data retention on our servers.",tag:"AES-256"},
            ].map(({bg,e,t,d,tag})=>(
              <div key={t} className="fi-card bg-[#0A0A0D] p-8 md:p-10 hover:bg-[#111116] transition-colors duration-150">
                <div className="icon-lift w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 text-[24px]" style={{background:bg}}>{e}</div>
                <h3 className="text-[16px] font-black text-white mb-3">{t}</h3>
                <p className="text-[13px] text-gray-400 leading-[1.8] mb-5">{d}</p>
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-[.1em]" style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)"}}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ══ */}
      <section id="features" className="relative z-10 py-28 px-6 md:px-12" style={{background:"#0D0D10",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div className="max-w-[1200px] mx-auto">
          <div className="sr-up text-center mb-16">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">Comparison</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] text-white">Traditional Setup vs ClawLink</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 lg:gap-10">
            <div className="sr-left rounded-[24px] overflow-hidden bg-[#0A0A0D]" style={{border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 10px 40px rgba(0,0,0,0.5)"}}>
              <div className="px-6 py-5 text-[11px] font-black uppercase tracking-[.2em] text-gray-500" style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
                Traditional Setup — Step by Step
              </div>
              {[
                ["Purchasing local virtual machine","15 min"],["Creating SSH keys and storing securely","10 min"],
                ["Connecting to the server via SSH","5 min"],["Installing Node.js and NPM","5 min"],
                ["Installing OpenClaw manually","7 min"],["Setting up OpenClaw database","10 min"],
                ["Connecting to AI provider","4 min"],["Pairing with Telegram / WhatsApp API","4 min"],
              ].map(([l,t])=>(
                <div key={l} className="flex justify-between items-center px-6 py-4 transition-colors duration-150 hover:bg-white/[0.02]" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span className="text-[14px] text-gray-300 font-medium">{l}</span>
                  <span className="text-[11px] text-white font-bold bg-white/[0.06] px-3 py-1.5 rounded-lg whitespace-nowrap ml-4 border border-white/10">{t}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-6 py-5 font-black text-[15px]" style={{background:"rgba(255,255,255,0.03)",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                <span className="text-white tracking-wide">Total Time</span><span className="text-red-400 bg-red-400/10 px-4 py-1.5 rounded-xl border border-red-400/20">60 MINUTES</span>
              </div>
            </div>

            <div className="sr-rght rounded-[24px] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden" style={{border:"2px solid rgba(249,115,22,0.25)",background:"linear-gradient(160deg,rgba(249,115,22,0.08),#0A0A0D 60%)",boxShadow:"0 20px 60px rgba(249,115,22,0.15)"}}>
              <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-4">With ClawLink</p>
              <p className="font-black leading-none mb-2 text-[4rem] lg:text-[4.5rem] grad-text drop-shadow-lg" style={{letterSpacing:"-.05em"}}>ClawLink</p>
              <p className="text-[3rem] lg:text-[3.5rem] font-black text-white leading-none mb-6 drop-shadow-md" style={{letterSpacing:"-.04em"}}>&lt;30 sec</p>
              <p className="text-[14px] text-gray-400 max-w-[260px] leading-[1.8]">Pick a model, connect your channel, deploy. All infrastructure handled for you.</p>
              <button aria-label="Start Building Free Now" data-ripple data-spring onClick={()=>document.getElementById("hero")?.scrollIntoView({behavior:"smooth"})}
                className={`mag-el relative overflow-hidden mt-10 px-10 py-4 rounded-xl text-[14px] font-black text-white uppercase tracking-widest ${btn} hover:scale-[1.05] orange-glow`}
                style={{background:"linear-gradient(135deg,#f97316,#ea6a00)"}}>
                <span className="mt">Start Free Now →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      <section className="relative z-10 py-28 overflow-hidden" style={{background:"#07070A",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div className="sr-up text-center mb-16 px-4">
          <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">50+ AI Use Cases</p>
          <h2 className="text-[clamp(2.4rem,6vw,4.2rem)] font-black tracking-[-0.04em] text-white">Thousands of Use Cases</h2>
          <p className="text-gray-400 font-medium text-[16px] mt-4">Your agent handles complex tasks around the clock.</p>
        </div>
        <div className="flex flex-col gap-4 relative w-full">
          {[row1,row2,row3,row4,row5].map((r,i)=><MarqueeRow key={i} items={r} reverse={i%2===1}/>)}
          <div className="absolute inset-0 pointer-events-none" style={{background:"linear-gradient(90deg,#07070A 0%,transparent 20%,transparent 80%,#07070A 100%)"}}/>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative z-10 pt-28 pb-14 px-6 md:px-16" style={{background:"#040405",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <h2 className="sr-up text-[clamp(2.8rem,6vw,4.8rem)] font-black tracking-[-0.04em] mb-8 text-white" style={{fontFamily:"Georgia,serif",lineHeight:1.06}}>Deploy. Automate. Relax.</h2>
        <button aria-label="Get Started with ClawLink" data-ripple data-spring onClick={()=>document.getElementById("hero")?.scrollIntoView({behavior:"smooth"})}
          className={`mag-el sr-up relative overflow-hidden px-12 py-5 rounded-[16px] text-[15px] font-black text-black mb-24 uppercase tracking-widest ${btn} hover:scale-[1.05] orange-glow`}
          style={{background:"linear-gradient(135deg,#FFA87A,#F97316)"}}>
          <span className="mt">Get Started Free →</span>
        </button>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-gray-500 pt-10" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <span className="font-medium">© 2026 ClawLink Inc. All rights reserved.</span>
          <span className="hidden md:block uppercase tracking-[.15em] text-[10px] font-bold">© 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.</span>
          <div className="flex flex-wrap justify-center gap-6 font-medium">
            {[["Privacy Policy","/privacy"], ["Terms of Service","/terms"], ["Refund Policy", "/refund"], ["Documentation","/docs"]].map(([l,h])=>(
              <a key={h} href={h} className="hover:text-white transition-colors duration-200">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ══ MODALS ══ */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-[20px] p-4">
            <motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}} transition={{duration:.12,ease:"easeOut"}}
              className="w-full max-w-[500px] p-8 rounded-[2rem] relative"
              style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 0 80px rgba(0,0,0,0.8)"}}>
              <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{background:"linear-gradient(90deg,transparent,rgba(249,115,22,0.4),transparent)"}}/>
              <button aria-label="Close Support Modal" data-spring onClick={()=>setIsSupportModalOpen(false)}
                className={`absolute top-6 right-6 p-2.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors ${btn}`}>
                <X className="w-5 h-5"/>
              </button>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)"}}>
                  <MessageSquare className="w-6 h-6 text-blue-400"/>
                </div>
                <h2 className="text-[1.5rem] font-black text-white">Contact Support</h2>
              </div>
              <p className="text-[14px] text-gray-400 mb-8">Our enterprise engineering team is available 24/7.</p>
              <div className="space-y-4">
                {[
                  {icon:<Mail className="w-5 h-5 text-orange-400"/>,title:"Direct Email",content:<a href="mailto:clawlink.help@gmail.com" className="text-blue-400 hover:text-blue-300 text-[14px] font-mono tracking-wide mt-1 block">clawlink.help@gmail.com</a>},
                  {icon:<Shield className="w-5 h-5 text-green-400"/>,title:"Enterprise SLAs",content:<p className="text-[13px] text-gray-400 mt-2 leading-relaxed">Pro and Max tier users get priority &lt;1hr guaranteed engineering response.</p>},
                ].map(({icon,title,content},i)=>(
                  <div key={i} className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="flex items-center gap-3 mb-2">{icon}<span className="text-[14px] font-bold text-white uppercase tracking-widest">{title}</span></div>
                    {content}
                  </div>
                ))}
              </div>
              <button aria-label="Close Support Modal" data-ripple data-spring onClick={()=>setIsSupportModalOpen(false)}
                className={`relative overflow-hidden w-full mt-8 bg-white text-black font-black py-4 rounded-xl text-[14px] uppercase tracking-widest ${btn} hover:bg-gray-200 shadow-[0_4px_15px_rgba(255,255,255,0.15)]`}>
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-[20px] p-4">
            <motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}} transition={{duration:.12,ease:"easeOut"}}
              className="w-full max-w-[1100px] flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] relative"
              style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 0 100px rgba(0,0,0,0.9)",maxHeight:"92vh"}}>
              <div className="absolute top-0 left-[20%] right-[20%] h-px" style={{background:"linear-gradient(90deg,transparent,rgba(249,115,22,0.4),transparent)"}}/>
              <button aria-label="Close Connect Modal" data-spring onClick={()=>setIsTelegramModalOpen(false)} className={`absolute top-5 right-5 z-20 p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors ${btn}`}>
                <X className="w-5 h-5"/>
              </button>

              <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-start overflow-y-auto nsb">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)"}}>
                    {activeChannel==="telegram" ? <Telegram_Icon size={32}/> : activeChannel==="whatsapp" ? <WhatsApp_Icon size={32}/> : <Instagram_Icon size={32}/>}
                  </div>
                  <h2 className="text-[1.6rem] font-black text-white">Connect {activeChannel==="telegram"?"Telegram":activeChannel==="whatsapp"?"WhatsApp":"Instagram"}</h2>
                </div>

                {activeChannel==="telegram" ? (
                  <>
                    <ol className="space-y-4 text-[14px] text-gray-400 list-decimal pl-6 mb-8 leading-[1.8] font-medium">
                      <li>Open Telegram → search <strong className="text-white">@BotFather</strong></li>
                      <li>Send <code className="rounded-md px-2.5 py-1 text-white font-mono text-[12px] border border-white/10" style={{background:"rgba(255,255,255,0.05)"}}>/newbot</code></li>
                      <li>Set <strong className="text-white">Name</strong> and <strong className="text-white">Username</strong></li>
                      <li>Copy the <strong className="text-white">HTTP API Token</strong></li>
                      <li>Paste below to secure connection</li>
                    </ol>
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 mb-8 px-6 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest w-fit ${btn} text-[#2AABEE]`}
                      style={{background:"rgba(42,171,238,0.08)",border:"1px solid rgba(42,171,238,0.25)",boxShadow:"0 0 20px rgba(42,171,238,0.1)"}}>
                      <ExternalLink className="w-4 h-4"/> Open @BotFather Directly
                    </a>
                    <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">API Access Token</label>
                      <input aria-label="Enter Telegram Token" type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="Enter Verification Token…"
                        className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-6 outline-none transition-colors duration-200 placeholder-gray-600"
                        style={{background:"#07070A",border:"1px solid rgba(255,255,255,0.09)"}}
                        onFocus={e=>(e.target.style.borderColor="rgba(249,115,22,0.5)")}
                        onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.09)")}/>
                      <button aria-label="Verify API Token" data-ripple data-spring onClick={handleSaveToken} disabled={isVerifying}
                        className={`relative overflow-hidden w-full font-black py-4 rounded-xl text-[14px] uppercase tracking-widest ${btn} hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_15px_rgba(255,255,255,0.15)]`}
                        style={{background:isVerifying?"rgba(255,255,255,0.1)":"#fff",color:isVerifying?"#666":"#000"}}>
                        {isVerifying?"Verifying API Status…":"Verify & Save Token"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ol className="space-y-3.5 text-[14px] text-gray-400 list-decimal pl-6 mb-8 leading-[1.8] font-medium">
                      <li>Log in to <strong className="text-white">Meta Developer Console</strong></li>
                      <li>Create <strong className="text-white">Business App</strong> → activate <strong className="text-white">{activeChannel === "whatsapp" ? "WhatsApp" : "Messenger"} Module</strong></li>
                      <li>Register & verify account in <strong className="text-white">API Setup</strong></li>
                      <li><strong className="text-white">System Users</strong> → generate <strong className="text-white">Permanent Access Token</strong></li>
                      <li>Set Webhook URL under <strong className="text-white">Configuration</strong></li>
                      <li>Enter Callback URL + Verify Token below</li>
                    </ol>
                    <div className="flex gap-4 mb-8">
                      <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest w-fit ${btn} ${activeChannel==="whatsapp"?"text-[#25D366]":"text-[#e6683c]"}`}
                        style={{background:activeChannel==="whatsapp"?"rgba(37,211,102,0.08)":"rgba(230,104,60,0.08)",border:`1px solid ${activeChannel==="whatsapp"?"rgba(37,211,102,0.25)":"rgba(230,104,60,0.25)"}`,boxShadow:activeChannel==="whatsapp"?"0 0 20px rgba(37,211,102,0.1)":"0 0 20px rgba(230,104,60,0.1)"}}>
                        <ExternalLink className="w-4 h-4"/> Open Meta Developer
                      </a>
                    </div>
                    <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      
                      <div className="mb-8 p-5 rounded-xl" style={{background:"rgba(0,0,0,0.4)", border:`1px dashed ${activeChannel==="whatsapp"?"rgba(37,211,102,0.4)":"rgba(230,104,60,0.4)"}`}}>
                        <p className={`text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${activeChannel==="whatsapp"?"text-[#25D366]":"text-[#e6683c]"}`}>
                          🔗 Step 1: Copy to Meta Webhook
                        </p>
                        
                        <div className="mb-4">
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Webhook URL</label>
                          <div className="flex items-center gap-2">
                            <input aria-label="Webhook URL" readOnly value={`https://www.clawlinkai.com/api/webhook/${activeChannel}`} className="w-full bg-black/60 text-gray-300 p-3.5 rounded-lg text-[12px] border border-white/10 outline-none font-mono" />
                            <button aria-label="Copy Webhook URL" type="button" onClick={() => copyToClipboard(`https://www.clawlinkai.com/api/webhook/${activeChannel}`)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-lg text-[12px] font-bold transition-all border border-white/10">Copy</button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Verify Token</label>
                          <div className="flex items-center gap-2">
                            <input aria-label="Verify Token" readOnly value="clawlinkmeta2026" className="w-full bg-black/60 text-gray-300 p-3.5 rounded-lg text-[12px] border border-white/10 outline-none font-mono" />
                            <button aria-label="Copy Verify Token" type="button" onClick={() => copyToClipboard("clawlinkmeta2026")} className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-lg text-[12px] font-bold transition-all border border-white/10">Copy</button>
                          </div>
                        </div>
                      </div>

                      <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">{activeChannel==="whatsapp"?"Phone Number ID":"Instagram Account ID"}</label>
                      <input aria-label="Phone or Account ID" type="text" value={waPhoneId} onChange={e=>setWaPhoneId(e.target.value)} placeholder="e.g. 1044727838716942"
                        className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-5 outline-none transition-colors duration-200 placeholder-gray-600"
                        style={{background:"#07070A",border:"1px solid rgba(255,255,255,0.09)"}}
                        onFocus={e=>(e.target.style.borderColor=activeChannel==="whatsapp"?"rgba(37,211,102,0.5)":"rgba(230,104,60,0.5)")}
                        onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.09)")}/>
                      
                      {activeChannel === "whatsapp" && (
                          <>
                              <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">WhatsApp Number (For Direct Open)</label>
                              <input aria-label="WhatsApp Number" type="text" value={waPhoneNumber} onChange={e=>setWaPhoneNumber(e.target.value)} placeholder="+1 234 567 890"
                                className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-5 outline-none transition-colors duration-200 placeholder-gray-600"
                                style={{background:"#07070A",border:"1px solid rgba(255,255,255,0.09)"}}
                                onFocus={e=>(e.target.style.borderColor="rgba(37,211,102,0.5)")}
                                onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.09)")}/>
                          </>
                      )}

                      <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">Permanent API Token</label>
                      <input aria-label="API Access Token" type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="EAABwzL…"
                        className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-6 outline-none transition-colors duration-200 placeholder-gray-600"
                        style={{background:"#07070A",border:"1px solid rgba(255,255,255,0.09)"}}
                        onFocus={e=>(e.target.style.borderColor=activeChannel==="whatsapp"?"rgba(37,211,102,0.5)":"rgba(230,104,60,0.5)")}
                        onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.09)")}/>
                      <button aria-label="Verify and Save API Token" data-ripple data-spring onClick={handleSaveToken} disabled={isVerifying}
                        className={`relative overflow-hidden w-full font-black py-4 rounded-xl text-[14px] uppercase tracking-widest ${btn} hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_15px_rgba(255,255,255,0.15)]`}
                        style={{background:isVerifying?"rgba(255,255,255,0.1)":"#fff",color:isVerifying?"#666":"#000"}}>
                        {isVerifying?"Verifying API Status…":"Verify & Save Configuration"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:flex md:w-[45%] items-center justify-center p-12 relative" style={{background:"rgba(0,0,0,0.35)",borderLeft:"1px solid rgba(255,255,255,0.04)"}}>
                <div className="w-[320px] h-[640px] rounded-[3rem] flex flex-col relative overflow-hidden bg-[#07070A]" style={{border:"8px solid #1A1A1A",boxShadow:"0 0 80px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)"}}>
                  <div className="absolute top-0 inset-x-0 h-7 rounded-b-[24px] z-20 flex justify-center items-end pb-1.5" style={{background:"#1A1A1A"}}>
                    <div className="w-12 h-1.5 rounded-full bg-black/60"/>
                  </div>
                  <div className="p-5 pt-10 flex items-center gap-4 z-10" style={{background:"rgba(15,15,18,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeChannel==="telegram"?"bg-[#2AABEE]":activeChannel==="whatsapp"?"bg-[#25D366]":""}`} style={{background:activeChannel==="instagram"?"linear-gradient(135deg,#f09433,#bc1888)":undefined}}>
                      {activeChannel==="telegram"?<Telegram_Icon size={22}/>:activeChannel==="whatsapp"?<WhatsApp_Icon size={22}/>:<Instagram_Icon size={22}/>}
                    </div>
                    <div>
                      <p className="text-white text-[14px] font-bold flex items-center gap-1.5">
                        {activeChannel==="telegram"?"BotFather":"Meta Developer"}
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400"/>
                      </p>
                      <p className="text-gray-400 text-[10px] font-mono mt-0.5">{activeChannel==="telegram"?"Verified System Bot":"API Configuration"}</p>
                    </div>
                  </div>
                  <div className="p-5 pt-6 flex-1 flex flex-col justify-end space-y-3 overflow-y-auto nsb bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                    {activeChannel==="telegram" ? (
                      <>
                        <ChatBubble isUser text="/newbot" delay={.1}/>
                        <ChatBubble text="Alright, a new bot. How are we going to call it?" delay={.2}/>
                        <ChatBubble isUser text="ClawLink Support" delay={.3}/>
                        <ChatBubble text="Good. Now let's choose a username…" delay={.4}/>
                        <ChatBubble isUser text="ClawSupport_bot" delay={.5}/>
                        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.6,duration:.18}}
                          className="p-4 rounded-2xl rounded-tl-sm text-gray-200 self-start max-w-[92%] text-[12px] leading-relaxed shadow-lg"
                          style={{background:"#1A1A1A",border:"1px solid rgba(42,171,238,0.25)"}}>
                          Done! Here is your token:<br/>
                          <span className="text-[#2AABEE] font-mono font-bold break-all mt-2 block bg-black/30 p-2 rounded-lg border border-white/5">1234567890:AAH8ABC…</span>
                        </motion.div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3.5 h-full justify-start pb-4">
                        <GuideStep delay={.1} step="1" title="Create App" desc={`Select Business Type in Meta Developer Console for ${activeChannel}.`}/>
                        <GuideStep delay={.2} step="2" title="Link Account" desc={`Register your ${activeChannel} account in API Setup.`}/>
                        <GuideStep delay={.3} step="3" title="Generate Token" desc="Create System User & get Permanent Access Token."/>
                        <GuideStep delay={.4} step="4" title="Link Webhook" desc="Enter Webhook URL & Verify Token."/>
                        <GuideStep delay={.5} step="5" title="Subscribe" desc="Enable 'messages' webhook subscription."/>
                        <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.6,duration:.18}}
                          className="mt-4 p-4 rounded-xl text-center mx-auto w-[90%] shadow-lg" style={{background:activeChannel==="whatsapp"?"rgba(37,211,102,0.08)":"rgba(230,104,60,0.08)",border:`1px solid ${activeChannel==="whatsapp"?"rgba(37,211,102,0.25)":"rgba(230,104,60,0.25)"}`}}>
                          <span className={`font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 ${activeChannel==="whatsapp"?"text-[#25D366]":"text-[#e6683c]"}`}>
                            <Zap className="w-4 h-4"/> Infrastructure Linked
                          </span>
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 inset-x-0 h-1.5 rounded-full w-32 mx-auto z-20 bg-[#333]"/>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[130] flex flex-col items-end">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div initial={{opacity:0,y:14,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:14,scale:.92}} transition={{duration:.12,ease:"easeOut"}}
              className="w-80 md:w-96 p-6 rounded-[1.5rem] mb-4 relative" style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 10px 50px rgba(0,0,0,0.9)"}}>
              <div className="absolute top-0 left-[15%] right-[15%] h-px" style={{background:"linear-gradient(90deg,transparent,rgba(249,115,22,0.4),transparent)"}}/>
              <button aria-label="Close Help Chat" data-spring onClick={()=>setIsHelpOpen(false)} className={`absolute top-4 right-4 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors ${btn}`}><X className="w-4 h-4"/></button>
              {helpStatus==="sent" ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.2)"}}><CheckCircle2 className="w-7 h-7 text-green-400"/></div>
                  <h4 className="text-white font-black text-[18px] mb-2">Request Submitted!</h4>
                  <p className="text-[13px] text-gray-400">Our engineering team will review shortly.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-5 pb-5" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.2)"}}><MessageSquare className="w-5 h-5 text-blue-400"/></div>
                    <div>
                      <h4 className="text-white font-black text-[15px]">ClawLink Support</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">Standard SLA per tier.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <input aria-label="Your Email" type="email" placeholder="Your email address" value={helpEmail} onChange={e=>setHelpEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-[13px] text-white outline-none transition-colors duration-200 placeholder-gray-600"
                      style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}
                      onFocus={e=>(e.target.style.borderColor="rgba(59,130,246,0.5)")} onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
                    <textarea aria-label="Your Message" placeholder="How can we assist you today?" rows={4} value={helpMessage} onChange={e=>setHelpMessage(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl text-[13px] text-white outline-none resize-none transition-colors duration-200 placeholder-gray-600"
                      style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}
                      onFocus={e=>(e.target.style.borderColor="rgba(59,130,246,0.5)")} onBlur={e =>(e.target.style.borderColor="rgba(255,255,255,0.08)")}/>
                    <button aria-label="Send Message" data-ripple data-spring onClick={handleSendHelpRequest} disabled={helpStatus==="sending"}
                      className={`relative overflow-hidden w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.3)] ${btn}`}>
                      {helpStatus==="sending"?"Transmitting…":<><Send className="w-4 h-4"/>Send Message</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button aria-label="Toggle Help Widget" whileHover={{scale:1.05}} whileTap={{scale:.95}} onClick={()=>setIsHelpOpen(!isHelpOpen)}
          className="w-16 h-16 text-white rounded-full flex items-center justify-center transition-all duration-200 transform-gpu"
          style={{background:"linear-gradient(135deg,#3B82F6,#7C3AED)",boxShadow:"0 10px 30px rgba(59,130,246,0.4)"}}>
          {isHelpOpen ? <X className="w-7 h-7"/> : <MessageCircle className="w-7 h-7"/>}
        </motion.button>
      </div>
    </div>
  );
}