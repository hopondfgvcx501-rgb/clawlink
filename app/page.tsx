"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE FRONTEND SECURE MODULE
 * ==============================================================================================
 * @file app/page.tsx
 * @version 17.0.0 (Seamless Theme Adaptation - No Harsh Border Cuts)
 * @description Main onboarding interface with strict Product-Led Growth (PLG) routing.
 * 🚀 FIXED: Removed harsh border lines and fixed background contrast across light/dark modes.
 * 🛡️ SMART DEMO: Region-aware (India vs Global) real AI fallback without fake duplicates.
 * 📱 UX FIX: Pure seamless section flow without visual jumping.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  Zap, MessageSquare, Activity,
  LogOut, Shield, ExternalLink, CheckCircle2,
  MessageCircle, X, Send, Mail, User, LayoutDashboard,
  Sun, Moon, Monitor, Loader2, Check, ArrowRight, Bot, Verified, Sparkles
} from "lucide-react";
import Image from "next/image";
import TelegramDemoWidget from "@/components/TelegramDemoWidget";
import TrustAndFAQ from "@/components/TrustAndFAQ";

class KnoxSecurityProtocol {
  private static isInitialized = false;
  private static violationCount = 0;

  static initialize() {
    if (typeof window === "undefined" || this.isInitialized) return;
    this.isInitialized = true;
    this.sabotageConsole();
    this.monitorDOMIntegrity();
    this.preventTampering();
    this.preventClickjacking();
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
      
      setInterval(() => {
        (function () { return false; }['constructor']('debugger')());
      }, 500);
    }
  }

  private static preventTampering() {
    if (process.env.NODE_ENV !== "development") {
        document.addEventListener('contextmenu', event => event.preventDefault());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
               (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
               (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });
    }
  }

  private static preventClickjacking() {
    if (process.env.NODE_ENV !== "development") {
        try {
            if (window.top && window.top !== window.self) {
                window.top.location.href = window.self.location.href;
            }
        } catch (e) {
            console.error("Anti-iframe protection engaged securely.");
        }
    }
  }

  private static monitorDOMIntegrity() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === "SCRIPT" && !(node as HTMLScriptElement).src.includes("stripe") && !(node as HTMLScriptElement).src.includes("razorpay")) {
             node.parentNode?.removeChild(node);
             this.registerViolation("Unauthorized Script Injection Detected and Neutralized");
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

function hexA(hex: string, a: number) {
  const c = hex.replace("#", "");
  const n = parseInt(c, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function Meter({ level, accent }: { level: number, accent: string }) {
  return (
    <div className="flex gap-[3px]">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-[3px] w-4 rounded-full"
          style={{
            background: i <= level ? accent : "rgba(128,128,128,0.2)",
            boxShadow: i <= level ? `0 0 8px ${hexA(accent, 0.7)}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "br" }) {
  const base = "absolute w-3 h-3 opacity-40";
  const styles = {
    tl: "top-3 left-3 border-t border-l",
    br: "bottom-3 right-3 border-b border-r",
  };
  return <span className={`${base} ${styles[pos]}`} style={{ borderColor: "rgba(128,128,128,0.4)" }} />;
}

const PRICING_DATA: Record<string, any> = {
  "GPT-5.5 Pro": { 
    name: "GPT-5.5 Pro",
    plans: [
      { id: "free", name: "Free", usd: 0, inr: 0, msgs: "Try Before You Trust", desc: "See what your AI can do.", accent: "#8A93A6", level: 1, isYearly: false, features: ["1 AI Agent", "1 channel", "Limited AI usage", "Basic memory", "Core automations", "Test your first workflow", "No credit card"] },
      { id: "pro", name: "Pro Engine", usd: 18, inr: 1499, yearlyUsd: 14.40, yearlyInr: 1199, yearlyTotalUsd: 172.80, yearlyTotalInr: 14388, msgs: "Turn AI into a 24/7 employee.", desc: "Automate repetitive customer conversations for less than the cost of one coffee.", accent: "#3B82F6", badge: "BEST VALUE", level: 2, isYearly: false, features: ["WhatsApp, Telegram & IG", "Advanced AI memory", "Voice message automation", "AI tool calling", "CRM integrations", "Automated customer replies", "Webhooks & workflows", "Analytics", "Priority support"] },
      { id: "nexus", name: "Omni Nexus", usd: 89, inr: 7499, yearlyUsd: 71.20, yearlyInr: 5999, yearlyTotalUsd: 854.40, yearlyTotalInr: 71988, msgs: "Never let one AI failure stop your business.", desc: "4 AI engines. One intelligent system. GPT + Claude + Gemini + Llama.", accent: "#F97316", badge: "MOST POPULAR 🔥", level: 3, isYearly: false, features: ["Omni-Fallback routing", "Multi-channel deployment", "Advanced RAG memory", "Unlimited* AI automation", "Live CRM", "Human handoff", "Payment integrations", "Advanced analytics", "Priority infrastructure", "24/7 engineering support"] },
      { id: "enterprise", name: "Enterprise", usd: "Custom", inr: "Custom", msgs: "Global system dominance.", desc: "Tailored for massive scale and compliance.", accent: "#A855F7", level: 4, isYearly: false, features: ["Fully uncapped scaling", "Dedicated server IP", "White-glove setup", "Custom SLAs", "Dedicated account manager"] }
    ]
  },
  "Claude Opus 4.7": {
    name: "Claude Opus 4.7",
    plans: [
      { id: "free", name: "Free", usd: 0, inr: 0, msgs: "Try Before You Trust", desc: "See what your AI can do.", accent: "#8A93A6", level: 1, isYearly: false, features: ["1 AI Agent", "1 channel", "Limited AI usage", "Basic memory", "Core automations", "Test your first workflow", "No credit card"] },
      { id: "pro", name: "Pro Engine", usd: 24, inr: 1999, yearlyUsd: 19.20, yearlyInr: 1599, yearlyTotalUsd: 230.40, yearlyTotalInr: 19188, msgs: "Long context window master.", desc: "Automate repetitive customer conversations for less than the cost of one coffee.", accent: "#e6683c", badge: "BEST VALUE", level: 2, isYearly: false, features: ["WhatsApp, Telegram & IG", "Advanced AI memory", "200k Context Window", "AI tool calling", "CRM integrations", "Automated customer replies", "Webhooks & workflows", "Analytics", "Priority support"] },
      { id: "nexus", name: "Omni Nexus", usd: 119, inr: 9999, yearlyUsd: 95.20, yearlyInr: 7999, yearlyTotalUsd: 1142.40, yearlyTotalInr: 95988, msgs: "Never let one AI failure stop your business.", desc: "4 AI engines. One intelligent system. GPT + Claude + Gemini + Llama.", accent: "#F97316", badge: "MOST POPULAR 🔥", level: 3, isYearly: false, features: ["Omni-Fallback routing", "Multi-channel deployment", "Advanced RAG memory", "Unlimited* AI automation", "Live CRM", "Human handoff", "Payment integrations", "Advanced analytics", "Priority infrastructure", "24/7 engineering support"] },
      { id: "enterprise", name: "Enterprise", usd: "Custom", inr: "Custom", msgs: "Global system dominance.", desc: "Tailored for massive scale and compliance.", accent: "#A855F7", level: 4, isYearly: false, features: ["Fully uncapped scaling", "Dedicated server IP", "White-glove setup", "Custom SLAs", "Dedicated account manager"] }
    ]
  },
  "Gemini 3.1 Pro": {
    name: "Gemini 3.1 Pro",
    plans: [
      { id: "free", name: "Free", usd: 0, inr: 0, msgs: "Try Before You Trust", desc: "See what your AI can do.", accent: "#8A93A6", level: 1, isYearly: false, features: ["1 AI Agent", "1 channel", "Limited AI usage", "Basic memory", "Core automations", "Test your first workflow", "No credit card"] },
      { id: "pro", name: "Pro Engine", usd: 12, inr: 999, yearlyUsd: 9.60, yearlyInr: 799, yearlyTotalUsd: 115.20, yearlyTotalInr: 9588, msgs: "Fast text generation for basic bots.", desc: "Automate repetitive customer conversations for less than the cost of one coffee.", accent: "#60a5fa", badge: "BEST VALUE", level: 2, isYearly: false, features: ["WhatsApp, Telegram & IG", "Advanced AI memory", "Voice message automation", "AI tool calling", "CRM integrations", "Automated customer replies", "Webhooks & workflows", "Analytics", "Priority support"] },
      { id: "nexus", name: "Omni Nexus", usd: 89, inr: 7499, yearlyUsd: 71.20, yearlyInr: 5999, yearlyTotalUsd: 854.40, yearlyTotalInr: 71988, msgs: "Never let one AI failure stop your business.", desc: "4 AI engines. One intelligent system. GPT + Claude + Gemini + Llama.", accent: "#F97316", badge: "MOST POPULAR 🔥", level: 3, isYearly: false, features: ["Omni-Fallback routing", "Multi-channel deployment", "Advanced RAG memory", "Unlimited* AI automation", "Live CRM", "Human handoff", "Payment integrations", "Advanced analytics", "Priority infrastructure", "24/7 engineering support"] },
      { id: "enterprise", name: "Enterprise", usd: "Custom", inr: "Custom", msgs: "Global system dominance.", desc: "Tailored for massive scale and compliance.", accent: "#A855F7", level: 4, isYearly: false, features: ["Fully uncapped scaling", "Dedicated server IP", "White-glove setup", "Custom SLAs", "Dedicated account manager"] }
    ]
  }
};
const MODEL_NAMES = Object.keys(PRICING_DATA);

const ICON_SIZE = 28;

const OpenAI_Icon  = ({ size = ICON_SIZE }: { size?: number }) => <Image src="/logos/openai.svg"  alt="GPT-4o OpenAI Agent Icon"  width={size} height={size} className="transform-gpu shrink-0" />;
const Claude_Icon  = ({ size = ICON_SIZE }: { size?: number }) => <Image src="/logos/claude.svg"  alt="Claude 3 Anthropic AI Icon"  width={size} height={size} className="transform-gpu shrink-0" />;
const Gemini_Icon  = ({ size = ICON_SIZE }: { size?: number }) => <Image src="/logos/gemini.svg"  alt="Gemini Google AI Bot Icon"  width={size} height={size} className="transform-gpu shrink-0" />;

const Omni_Icon = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#00BFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transform-gpu" aria-hidden="true">
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

const Telegram_Icon = ({ size = ICON_SIZE }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform-gpu shrink-0" aria-hidden="true">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#2AABEE"/>
    <path d="M5.425 11.871L16.48 7.61c.526-.196 1.006.124.819.86l-1.892 8.92c-.167.755-.615.939-1.242.593L10.73 15.45l-1.657 1.588c-.183.183-.338.338-.692.338l.245-3.528 6.425-5.8c.28-.249-.06-.388-.435-.138L6.68 12.89l-3.417-1.066c-.744-.233-.759-.745.155-1.103z" fill="#fff"/>
  </svg>
);

const WhatsApp_Icon = ({ size = ICON_SIZE }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="transform-gpu shrink-0" aria-hidden="true">
    <rect width="100" height="100" rx="24" fill="#25D366"/>
    <path fill="#ffffff" d="M50 15c-19.3 0-35 15.7-35 35 0 6.2 1.6 12.2 4.7 17.5L15 85l17.5-4.7c5.3 3.1 11.3 4.7 17.5 4.7 19.3 0 35-15.7 35-35S69.3 15 50 15zm0 63.8c-5.2 0-10.4-1.4-15-4.1l-1.1-.6-11.1 2.9 2.9-10.8-.7-1.1c-2.9-4.7-4.5-10.1-4.5-15.6 0-16.2 13.2-29.4 29.4-29.4s29.4 13.2 29.4 29.4-13.2 29.4-29.4 29.4z"/>
    <path fill="#ffffff" d="M42 34h9.5c5.5 0 8.5 2.5 8.5 5.5s-2.8 4.2-5.5 4.8c4 1 7 3.5 7 7.5 0 5.5-5.5 7.2-10 7.2H42V34zm5 5.5v7h4c2 0 4-1 4-3.5s-2-3.5-4-3.5h-4zm0 11v8h4.5c3 0 4.5-1.5 4.5-4s-2-4-4.5-4H47z"/>
  </svg>
);

const Discord_Icon = ({ size = ICON_SIZE }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#5865F2" className="transform-gpu shrink-0" aria-hidden="true">
    <path d="M20.3 5.4c-1.6-.7-3.4-1.2-5.2-1.5-.2.4-.4.9-.6 1.3-1.9-.3-3.8-.3-5.7 0-.2-.4-.4-.9-.6-1.3-1.8.3-3.6.8-5.2 1.5-3.3 4.9-4.2 9.7-3.3 14.4 2.2 1.6 4.3 2.6 6.4 3.2.5-.7 1-1.5 1.4-2.3-1.2-.5-2.4-1.1-3.5-1.8.3-.2.6-.4.9-.7 4.6 2.1 9.7 2.1 14.3 0 .3.2.6.5.9.7-1.1.7-2.3 1.3-3.5 1.8.4.8.9 1.6 1.4 2.3 2.1-.6 4.2-1.6 6.4-3.2 1-5.1.1-10-3.2-14.4z"/>
  </svg>
);

const Instagram_Icon = ({ size = ICON_SIZE }: { size?: number }) => (
  <div style={{ width: size, height: size }} className="rounded-[6px] bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center transform-gpu shrink-0" aria-hidden="true">
    <div className="w-[60%] h-[60%] border-[1.5px] border-white rounded-[4px] flex items-center justify-center">
      <div className="w-[30%] h-[30%] bg-white rounded-full"/>
    </div>
  </div>
);

const Google_Icon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" className="transform-gpu shrink-0" aria-hidden="true">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 01-6.723-4.823l-4.04 3.067A11.965 11.965 0 0012 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 000 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
  </svg>
);

const IG_DEMO_CHAT = [
  { user: true, text: "Do you have the black hoodie in size M?" },
  { user: false, text: "Yes! 🖤 We have 3 left in stock. Should I reserve one for you?" },
  { user: true, text: "Yes please, how do I pay?" },
  { user: false, text: "Here is your secure checkout link: https://pay.clawlink.com/hoodie. Shipped in 24h! 🚀" }
];

const MarqueeRow = ({ items, reverse = false }: { items: string[]; reverse?: boolean }) => (
  <div className="flex whitespace-nowrap overflow-hidden py-2.5 w-full">
    <motion.div 
      className="flex gap-5 w-max will-change-transform" 
      style={{ transform: "translateZ(0)" }} 
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} 
      transition={{ ease: "linear", duration: 45, repeat: Infinity }}
    >
      {[...items, ...items, ...items, ...items].map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2.5 text-[12px] font-medium px-5 py-2.5 rounded-full border border-white/[0.08] whitespace-nowrap hover:border-orange-500/50 hover:text-orange-500 transition-colors duration-200" style={{ color: "var(--text-muted)", backgroundColor: "rgba(128, 128, 128, 0.05)" }}>
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
  const [theme, setTheme] = useState("dark");

  const [demoChat, setDemoChat] = useState([{ role: "bot", text: "Hi! I am ClawLink's Omni-Fallback AI. Send me a message to test my latency! ⚡" }]);
  const [demoInput, setDemoInput] = useState("");
  const [isDemoTyping, setIsDemoTyping] = useState(false);
  const [, setDemoChatCount] = useState(0);
  
  const apiChatRef = useRef<HTMLDivElement>(null);
  const igChatRef = useRef<HTMLDivElement>(null);

  const [igChat, setIgChat] = useState<{user: boolean, text: string}[]>([]);
  const [pricingModel, setPricingModel] = useState<string>("GPT-5.5 Pro");
  const [isYearlyBilling, setIsYearlyBilling] = useState<boolean>(true);
  
  const [telegramToken, setTelegramToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [botLink] = useState("");
  
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  
  const [currency, setCurrency] = useState<"USD"|"INR">("USD");

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpEmail, setHelpEmail] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpStatus, setHelpStatus] = useState<"idle"|"sending"|"sent">("idle");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const [hasDeployedBefore, setHasDeployedBefore] = useState(false);
  const [metaAuthTab, setMetaAuthTab] = useState<"1click" | "manual">("1click");

  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMounted(true);
      if (typeof window !== "undefined") {
        const savedModel = localStorage.getItem("clawlink_model");
        const savedChannel = localStorage.getItem("clawlink_channel");
        if (savedModel) setActiveModel(savedModel);
        if (savedChannel && savedChannel !== "widget" && savedChannel !== "broadcast" && savedChannel !== "partner") {
          setActiveChannel(savedChannel);
        }

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const lang = navigator.language || "";
        if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.includes("Asia/Colombo") || lang.includes("-IN") || lang === "hi") { 
          setCurrency("INR"); 
        } else {
          setCurrency("USD");
        }

        const savedTheme = localStorage.getItem("clawlink_theme") || "dark";
        setTheme(savedTheme);
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        if (savedTheme === "light" || (savedTheme === "system" && prefersLight)) {
           document.documentElement.classList.add("light-theme-active");
        }

        const savedCount = parseInt(localStorage.getItem("clawlink_demo_chats") || "0");
        setDemoChatCount(savedCount);

        let timeoutIds: NodeJS.Timeout[] = [];
        IG_DEMO_CHAT.forEach((msg, idx) => {
          const id = setTimeout(() => {
            setIgChat(prev => [...prev, msg]);
          }, (idx + 1) * 2000);
          timeoutIds.push(id);
        });

        return () => timeoutIds.forEach(clearTimeout);
      }
    });
    
    KnoxSecurityProtocol.initialize();

    const verifyDeployment = async () => {
      if (status !== "authenticated" || !session?.user?.email) return;
      try {
        const res = await fetch(`/api/user?email=${encodeURIComponent(session.user.email)}`);
        const data = await res.json();
        if (data.success && data.data && (data.data.telegram_token || data.data.whatsapp_phone_id || data.data.instagram_account_id || data.data.instagram_token)) {
            setHasDeployedBefore(true);
        }
      } catch (e) {
        console.error("Status check verification failed safely");
      }
    };

    if (status === "authenticated") {
        verifyDeployment().catch(console.error);
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (apiChatRef.current) {
        apiChatRef.current.scrollTop = apiChatRef.current.scrollHeight;
    }
  }, [demoChat, isDemoTyping]);

  useEffect(() => {
    if (igChatRef.current) {
        igChatRef.current.scrollTop = igChatRef.current.scrollHeight;
    }
  }, [igChat]);

  const cycleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("clawlink_theme", nextTheme);
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      if (nextTheme === "light" || (nextTheme === "system" && prefersLight)) {
        document.documentElement.classList.add("light-theme-active");
      } else {
        document.documentElement.classList.remove("light-theme-active");
      }
    }
  };

  const handleDemoSubmit = async (e: any) => {
    e.preventDefault();
    if (!demoInput.trim() || isDemoTyping) return;

    const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Guest";
    const currentCount = parseInt(localStorage.getItem("clawlink_demo_chats") || "0");
    
    const userLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
    const isIndian = userLang.includes("hi") || userLang.includes("in");

    if (currentCount >= 3) {
       const limitMsg = isIndian 
         ? `🔒 Demo limit reached (3/3). ${userName}, speed test done! Apna AI agent deploy karne ke liye niche login karein.`
         : `🔒 Demo limit reached (3/3). ${userName}, you've experienced the speed! Now, login below to deploy your own AI.`;
       setDemoChat(p => [...p, { role: "user", text: demoInput }, { role: "bot", text: limitMsg }]);
       setDemoInput("");
       return;
    }

    const userMsg = demoInput.trim();
    setDemoChat(p => [...p, { role: "user", text: userMsg }]);
    setDemoInput("");
    setIsDemoTyping(true);

    try {
      const res = await fetch("/api/omni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, source: "landing_playground", user: userName }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setDemoChat(p => [...p, { role: "bot", text: data.reply }]);
      } else {
        throw new Error(data.error || "Omni-Engine Connection Failed");
      }
    } catch (error: any) {
      setDemoChat(p => [...p, { role: "bot", text: `⚠️ Backend Error: ${error.message}` }]);
      fetch("/api/tg-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `🚨 [Playground Live Test Error]: ${error.message} (User: ${userName})` })
      }).catch(() => {});
    } finally {
      setIsDemoTyping(false);
      const newCount = currentCount + 1;
      localStorage.setItem("clawlink_demo_chats", newCount.toString());
      setDemoChatCount(newCount);

      if (newCount === 3) {
          setTimeout(() => {
              const pitchMsg = isIndian 
                ? `🚨 ${userName}, aapke 3 free test messages khatam ho gaye! Apna AI bot live karne ke liye 'Login & Deploy' par click karein.`
                : `🚨 ${userName}, you've used your 3 free test messages! Click 'Login to Deploy' to automate your business!`;
              setDemoChat(p => [...p, { role: "bot", text: pitchMsg }]);
          }, 1500);
      }
    }
  };

  const handleModelSelect = (modelId: string) => {
    if (!isTokenSaved && !hasDeployedBefore) {
      setActiveModel(modelId);
      if (typeof window !== "undefined") {
        localStorage.setItem("clawlink_model", modelId);
      }
    }
  };

  const handleChannelSelect = (channelId: string) => {
    if (!isTokenSaved && !hasDeployedBefore) {
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
        if(hasDeployedBefore) {
            router.push("/dashboard");
            return;
        }
        if(!activeChannel || !activeModel) {
            alert("Please select a Model and a Channel first.");
            return;
        }
        handleOpenIntegration(activeChannel);
    }
  };

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
        selectedModel: activeModel || "GPT-5.5 Pro",
        selectedChannel: activeChannel || "telegram",
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
        setIsDeploying(false);
      }
    } catch (error) {
      alert("Network exception encountered.");
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
        handleDeploy();
      } else {
        alert("VERIFICATION REJECTED: " + data.error);
        setIsVerifying(false);
      }
    } catch { 
      alert("Network integrity lost during verification handshake."); 
      setIsVerifying(false);
    }
  };

  const handleEmbeddedFacebookLogin = () => {
    if (typeof window === "undefined" || !(window as any).FB) {
      alert("System optimizing connection... Please try again or disable Ad-Blockers.");
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsVerifying(false);
      alert("⚠️ Meta Login Timeout or Pop-up Blocked! Please allow pop-ups in your browser or try Manual Setup.");
    }, 15000); 

    try {
      if (!(window as any).fbInitialized) {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
          autoLogAppEvents: true,
          xfbml: true,
          version: process.env.NEXT_PUBLIC_META_API_VERSION || 'v20.0'
        });
        (window as any).fbInitialized = true;
      }
    } catch (initError) {
      console.warn("FB SDK Init handled silently.");
    }
    
    setIsVerifying(true); 
    
    try {
      (window as any).FB.login((response: any) => {
        clearTimeout(timeoutId); 
        if (response.authResponse) {
          const tempToken = response.authResponse.accessToken;
          fetch("/api/whatsapp/embedded", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session?.user?.email,
              accessToken: tempToken,
              channel: activeChannel
            }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
               alert("Infrastructure Linked Successfully!");
               router.push("/dashboard");
            } else {
               alert(`Verification Failed: ${data.error || "Please verify your Meta Business account."}`);
               setIsVerifying(false);
            }
          })
          .catch(() => {
            alert("Network timeout. Please check your connection and try again.");
            setIsVerifying(false);
          });
        } else {
          alert("Login Cancelled. Please complete the Meta login to deploy.");
          setIsVerifying(false);
        }
      }, {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} }
      });
    } catch (error: any) {
        clearTimeout(timeoutId);
        alert("Connection temporarily unavailable. Please try Manual Setup.");
        setIsVerifying(false);
    }
  };
  
  const handleSendHelpRequest = () => {
    if (!helpEmail.trim() || !helpMessage.trim()) { alert("Please complete all necessary input fields."); return; }
    setHelpStatus("sending");
    setTimeout(() => {
      setHelpStatus("sent");
      setTimeout(() => { setIsHelpOpen(false); setHelpStatus("idle"); setHelpMessage(""); }, 1500);
    }, 800);
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

  const btn = "transition-all duration-[120ms] ease-out hover:-translate-y-1 hover:shadow-lg transform-gpu will-change-transform";

  const getButtonClass = (isActive: boolean, categorySelected: boolean, activeStyles: string, hoverStyles: string) => {
      let classes = `border-2 cursor-pointer overflow-hidden ${btn} flex flex-row h-[60px] w-full px-[16px] gap-[12px] justify-start items-center rounded-[14px] transition-all duration-300`;
      if (isActive) {
          classes += ` border-solid ${activeStyles} scale-[1.02] bg-opacity-10`; 
      } else {
          classes += ` border-transparent ${hoverStyles} bg-gray-500/5 dark:bg-white/5`;
      }
      if (status === "authenticated" && categorySelected && !isActive) {
          classes += " opacity-40 grayscale transition-opacity duration-300";
      }
      return classes;
  };

  const modelActive = (id: string) => activeModel === id && !(isTokenSaved && activeModel !== id);
  const chanActive  = (id: string) => activeChannel === id && !(isTokenSaved && activeChannel !== id);

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500/30 overflow-x-hidden transition-colors duration-300" style={{ backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}>

      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="lazyOnload" />

      <div className="particle-bg"><div className="stars"></div></div>

      <nav id="clnav" aria-label="Main Navigation"
        className="fixed top-0 left-0 right-0 z-[100] h-[64px] flex items-center justify-between px-6 md:px-12 transition-colors duration-300"
        style={{backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
                background:"var(--bg-main)", borderBottom:"1px solid var(--border-color)"}}>

        <svg aria-label="ClawLink Home" width="168" height="24" viewBox="0 0 176 26" fill="none" className="shrink-0 cursor-pointer transition-transform hover:scale-105" onClick={() => router.push("/")}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="currentColor"/><stop offset="1" stopColor="currentColor" stopOpacity="0.65"/>
            </linearGradient>
          </defs>
          <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="currentColor" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" fill="none"/>
          <path d="M22 3C18 .5 10 .5 7 4.5S3.5 18 7 22.5 18 26 22 23" stroke="url(#cg)" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
          <line x1="7.5" y1="3" x2="14.5" y2="11.5" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="12.5" y1="1.5" x2="19.5" y2="10" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="17.5" y1="2.5" x2="24" y2="10.5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
          <text x="30" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="14.5" fontWeight="800" letterSpacing="1.4" fill="currentColor">LAWLINK Ai</text>
          <text x="139" y="18" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="9.5" fontWeight="700" letterSpacing=".7" fill="#f97316">.COM</text>
        </svg>

        <div className="hidden lg:flex items-center gap-8 ml-auto mr-8 font-bold text-[12px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-orange-400 transition-colors">FAQs</a>
          <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             Systems Operational
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={cycleTheme}
            aria-label="Toggle System Theme"
            title={`Theme: ${theme.toUpperCase()}`}
            className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:bg-black/10 transition-all duration-300 group overflow-hidden"
            style={{ backgroundColor: "rgba(128, 128, 128, 0.1)" }}
          >
            <AnimatePresence mode="wait">
              {theme === "dark" && (
                <motion.div key="dark" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Moon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </motion.div>
              )}
              {theme === "light" && (
                <motion.div key="light" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Sun className="w-5 h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                </motion.div>
              )}
              {theme === "system" && (
                <motion.div key="system" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Monitor className="w-4 h-4 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          {status === "authenticated" ? (
            <div className="hidden md:flex items-center gap-3">
              <img src={session?.user?.image || "https://ui-avatars.com/api/?name=User&background=random"} className="w-8 h-8 rounded-full border border-white/20 ring-1 ring-white/10" alt="User Avatar"/>
              <button aria-label="Sign out of ClawLink" title="Sign out of ClawLink" onClick={()=>signOut()}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-all duration-150">
                <LogOut className="w-4 h-4"/> Logout
              </button>
              {hasDeployedBefore && (
                  <button aria-label="Go to Dashboard" title="Go to Dashboard" onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 transition-all ml-2 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                      <LayoutDashboard className="w-4 h-4"/> Dashboard
                  </button>
              )}
            </div>
          ) : (
            <button aria-label="Login with Google" title="Login" onClick={() => signIn("google")}
              className="hidden md:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border hover:border-orange-500 transition-all"
              style={{ color: "var(--text-main)", borderColor: "var(--border-color)", backgroundColor: "rgba(128, 128, 128, 0.1)" }}>
              <Google_Icon/> Login
            </button>
          )}

          <button aria-label="Contact ClawLink Support" title="Contact Support" onClick={()=>setIsSupportModalOpen(true)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border hover:border-orange-500 transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ color: "var(--text-muted)", borderColor: "var(--border-color)", backgroundColor: "rgba(128, 128, 128, 0.05)" }}>
            <MessageSquare className="w-4 h-4 text-orange-500"/>
            <span className="hidden sm:inline">Support</span>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-28 pb-16 px-4 md:px-8 text-center overflow-hidden">
        <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{duration:0.6}} 
             className="inline-flex items-center gap-2 mb-6 px-6 py-2.5 rounded-full text-[11px] font-black tracking-[.15em] text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
             style={{background:"rgba(249,115,22,0.09)",border:"1px solid rgba(249,115,22,0.26)"}}>
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"/>
          LIVE NOW &nbsp;·&nbsp; 30-SECOND DEPLOY
        </motion.div>

        <motion.h1 initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{duration:0.6, delay:0.1}} 
             className="text-[clamp(2.5rem,5vw,5.5rem)] font-black leading-[1.1] tracking-[-0.04em] w-full px-4 mb-2" style={{ color: "var(--text-main)" }}>
          Deploy <span className="color-flow-text">ClawLink Multi-AI Workspace</span>
        </motion.h1>
        
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.6, delay:0.2}} 
             className="font-black text-[20px] md:text-[28px] mb-8 uppercase tracking-wide" style={{ color: "var(--text-main)" }}>
          FASTEST SERVER 1-CLICK DEPLOY
        </motion.p>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.6, delay:0.3}} 
             className="font-medium text-[15px] md:text-[18px] max-w-[650px] mb-12 leading-[1.8]" style={{ color: "var(--text-muted)" }}>
          Avoid all technical complexity — one-click deploy your own 24/7 active Personal AI Assistant for WhatsApp, Telegram & Instagram. No code. No servers. Just results.
        </motion.p>

        {/* WIDE DEPLOYMENT CARD */}
        <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:0.4}}
             className="relative w-full max-w-[900px] rounded-[24px] p-6 md:p-10 mb-8 transition-all duration-300 shadow-xl mx-auto"
             style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", backdropFilter: "blur(20px)" }}>
          
          <p className="text-[11px] font-black tracking-[.2em] uppercase text-left flex items-center gap-3 pb-4 mb-6" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
            <span className="w-5 h-5 text-[10px] rounded flex items-center justify-center" style={{ backgroundColor: "rgba(128, 128, 128, 0.2)", color: "var(--text-main)" }}>1</span>
            Choose Your AI Model
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-10">
            
            <button aria-label="Select GPT-5.5 Pro Model" onClick={() => handleModelSelect("GPT-5.5 Pro")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeModel!=="GPT-5.5 Pro"}
              className={getButtonClass(modelActive("GPT-5.5 Pro"), activeModel !== null, "border-green-500 bg-green-500/10", "hover:border-green-400")}>
              <OpenAI_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: modelActive("GPT-5.5 Pro") ? "#22c55e" : "var(--text-main)" }}>GPT-5.5 Pro</span>
            </button>

            <button aria-label="Select Claude Opus 4.7 Model" onClick={() => handleModelSelect("Claude Opus 4.7")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeModel!=="Claude Opus 4.7"}
              className={getButtonClass(modelActive("Claude Opus 4.7"), activeModel !== null, "border-[#e6683c] bg-[#e6683c]/10", "hover:border-[#e6683c]")}>
              <Claude_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: modelActive("Claude Opus 4.7") ? "#e6683c" : "var(--text-main)" }}>Claude Opus 4.7</span>
            </button>

            <button aria-label="Select Gemini 3.1 Pro Model" onClick={() => handleModelSelect("Gemini 3.1 Pro")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeModel!=="Gemini 3.1 Pro"}
              className={getButtonClass(modelActive("Gemini 3.1 Pro"), activeModel !== null, "border-blue-400 bg-blue-400/10", "hover:border-blue-400")}>
              <Gemini_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: modelActive("Gemini 3.1 Pro") ? "#60a5fa" : "var(--text-main)" }}>Gemini 3.1 Pro</span>
            </button>

            <button aria-label="Select Omni 3 Nexus Fallback Model" onClick={() => handleModelSelect("Omni 3 Nexus")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeModel!=="Omni 3 Nexus"}
              className={getButtonClass(modelActive("Omni 3 Nexus"), activeModel !== null, "border-[#00BFFF] bg-[#00BFFF]/10", "hover:border-[#00BFFF]")}>
              <Omni_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: modelActive("Omni 3 Nexus") ? "#00BFFF" : "var(--text-main)" }}>Omni 3 Nexus</span>
            </button>
          </div>

          <p className="text-[11px] font-black tracking-[.2em] uppercase text-left flex items-center gap-3 pb-4 mb-6" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)" }}>
            <span className="w-5 h-5 text-[10px] rounded flex items-center justify-center" style={{ backgroundColor: "rgba(128, 128, 128, 0.2)", color: "var(--text-main)" }}>2</span>
            Select Your Channel
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-10">
            
            <button aria-label="Connect Telegram Channel" onClick={()=>handleChannelSelect("telegram")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeChannel!=="telegram"}
              className={getButtonClass(chanActive("telegram"), activeChannel !== null, "border-[#2AABEE] bg-[#2AABEE]/10", "hover:border-[#2AABEE]")}>
              <Telegram_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: chanActive("telegram") ? "#2AABEE" : "var(--text-main)" }}>Telegram</span>
            </button>

            <button aria-label="Connect WhatsApp Channel" onClick={()=>handleChannelSelect("whatsapp")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeChannel!=="whatsapp"}
              className={getButtonClass(chanActive("whatsapp"), activeChannel !== null, "border-[#25D366] bg-[#25D366]/10", "hover:border-[#25D366]")}>
              <WhatsApp_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: chanActive("whatsapp") ? "#25D366" : "var(--text-main)" }}>WhatsApp</span>
            </button>
            
            <button aria-label="Connect Instagram Channel" onClick={()=>handleChannelSelect("instagram")} 
              disabled={(isTokenSaved || hasDeployedBefore) && activeChannel!=="instagram"}
              className={getButtonClass(chanActive("instagram"), activeChannel !== null, "border-pink-500 bg-pink-500/10", "hover:border-pink-500")}>
              <Instagram_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: chanActive("instagram") ? "#ec4899" : "var(--text-main)" }}>Instagram</span>
            </button>

            <div className="overflow-hidden opacity-40 cursor-not-allowed pointer-events-none flex flex-row h-[60px] w-full px-[16px] gap-[12px] justify-start items-center rounded-[14px]"
                 style={{ backgroundColor: "rgba(128, 128, 128, 0.05)", border: "1px solid var(--border-color)" }}>
              <Discord_Icon size={ICON_SIZE}/>
              <span className="ptx-name" style={{ color: "var(--text-muted)" }}>Discord</span>
              <span className="ptx-soon">SOON</span>
            </div>
          </div>
        
          <div className="pt-6 flex flex-col items-center w-full" style={{ borderTop: "1px solid var(--border-color)" }}>
            <div className="w-full flex flex-col items-center justify-center mb-8">
                <div className="px-6 py-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center shadow-lg w-full max-w-[600px]"
                     style={{ 
                         backgroundColor: "var(--bg-section)", 
                         borderColor: (activeModel && activeChannel) ? "rgba(249,115,22,0.5)" : "transparent" 
                     }}>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Current Configuration</span>
                     <p className="text-[15px] md:text-[17px] font-medium" style={{ color: "var(--text-main)" }}>
                         Deploying <strong className="font-black tracking-wide" style={{ color: "var(--text-main)" }}>{activeModel || "GPT-5.5 Pro"}</strong> to <strong className="capitalize font-black tracking-wide" style={{ color: "var(--text-main)" }}>{activeChannel || "Telegram"}</strong>
                     </p>
                </div>
            </div>

            <AnimatePresence mode="wait">
              {botLink ? (
                <motion.div key="success" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  className="rounded-[20px] p-8 text-center w-full"
                  style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)"}}>
                  <p className="text-[18px] font-bold mb-6" style={{ color: "var(--text-main)" }}>🚀 Your Bot is Live!</p>
                  <button aria-label="Navigate to Command Center Dashboard" onClick={()=>router.push("/dashboard")}
                    className="flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl text-[14px] mx-auto"
                    style={{ color: "var(--text-main)", background:"rgba(128, 128, 128, 0.1)", border:"1px solid var(--border-color)"}}>
                    <Activity className="w-5 h-5"/> Live Dashboard
                  </button>
                </motion.div>
              ) : (
                <motion.div key="login" id="login-section" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full flex flex-col items-center">
                  {status === "authenticated" && session?.user?.email && (
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="mb-5 flex items-center gap-2 px-5 py-2 rounded-full" style={{ backgroundColor: "rgba(128, 128, 128, 0.1)", border: "1px solid var(--border-color)" }}>
                      <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span className="text-[13px] font-mono tracking-wide" style={{ color: "var(--text-muted)" }}>Logged in as: <span className="font-bold" style={{ color: "var(--text-main)" }}>{session.user.email}</span></span>
                    </motion.div>
                  )}
                  
                  {hasDeployedBefore ? (
                      <button aria-label="Open Command Center Dashboard" onClick={() => router.push("/dashboard")}
                        className="w-full max-w-[600px] bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 md:py-6 rounded-[16px] flex items-center justify-center gap-3 text-[16px] md:text-[18px] font-black tracking-[0.1em] transition-all duration-150 uppercase shadow-lg">
                        <LayoutDashboard className="w-5 h-5" /> OPEN COMMAND CENTER
                      </button>
                  ) : (
                      <button aria-label="Login with Google to Deploy Bot" onClick={handleLoginOrDeploy} disabled={isDeploying}
                        className={`w-full max-w-[600px] ${isDeploying ? 'cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] shadow-xl'} py-5 md:py-6 rounded-[16px] flex items-center justify-center gap-3 text-[16px] md:text-[18px] font-black tracking-[0.05em] transition-all duration-150`}>
                        {isDeploying ? (
                          <span className="flex items-center gap-3 font-mono tracking-widest text-[14px] uppercase">
                             <Loader2 className="animate-spin w-5 h-5"/> DEPLOYING TO SECURE SERVER
                          </span>
                        ) : (
                          <>
                            <Google_Icon/> {status === "authenticated" ? "Finalize Deployment" : "Login & Deploy"}
                          </>
                        )}
                      </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* DUAL CHAT MOCKUPS */}
        <motion.div initial={{opacity:0, y:30}} animate={{opacity:1, y:0}} transition={{duration:0.6, delay:0.6}} 
            className="w-full max-w-[1050px] flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10 mx-auto px-2 mb-16">
            
            {/* LEFT: INSTAGRAM MOCKUP */}
            <div className="flex flex-col w-full md:w-1/2 h-[500px] rounded-[32px] overflow-hidden shadow-2xl relative transition-all duration-300 border-[8px] bg-[#000]"
                 style={{ borderColor: "#1A1A1A" }}>
                 <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
                    <div className="w-28 h-full bg-[#1A1A1A] rounded-b-[12px] shadow-sm flex items-center justify-center gap-2 pb-1">
                       <div className="w-10 h-1.5 rounded-full bg-black"></div>
                       <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
                    </div>
                 </div>
                 
                 <div className="h-16 pt-5 px-5 flex items-center gap-3 border-b border-white/10 bg-[#000] z-10 shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-[#111]">
                       <Instagram_Icon size={20}/>
                    </div>
                    <div>
                       <h3 className="text-white text-[14px] font-bold tracking-wide flex items-center gap-1.5">
                           ClawStore AI <Verified className="w-4 h-4 text-[#0095F6]" />
                       </h3>
                       <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">Instagram Auto-Reply</div>
                    </div>
                 </div>

                 <div ref={igChatRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative bg-[#000]">
                    <AnimatePresence>
                      {igChat.map((msg, idx) => (
                         <motion.div key={idx} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex ${msg.user?"justify-end":"justify-start"}`}>
                            {!msg.user && (
                                <div className="w-6 h-6 rounded-full bg-[#111] mr-2 shrink-0 flex items-center justify-center mt-auto mb-1 overflow-hidden border border-white/10">
                                    <Instagram_Icon size={14}/>
                                </div>
                            )}
                            <div className={`p-3.5 max-w-[80%] text-[13px] leading-relaxed shadow-sm ${msg.user ? "bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white rounded-[20px] rounded-br-sm font-medium" : "bg-[#262626] text-gray-100 rounded-[20px] rounded-bl-sm border border-white/5"}`}>
                               {msg.text}
                            </div>
                         </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
            </div>

            {/* RIGHT: LIVE API TEST */}
            <div className="flex flex-col w-full md:w-1/2 h-[500px] rounded-[32px] overflow-hidden shadow-2xl relative transition-all duration-300 border-[8px] bg-[#000]"
                 style={{ borderColor: "#1A1A1A" }}>
                 <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20 pointer-events-none">
                    <div className="w-28 h-full bg-[#1A1A1A] rounded-b-[12px] shadow-sm flex items-center justify-center gap-2 pb-1">
                       <div className="w-10 h-1.5 rounded-full bg-black"></div>
                       <div className="w-2 h-2 rounded-full bg-blue-900/40"></div>
                    </div>
                 </div>
                 
                 <div className="h-16 pt-5 px-5 flex items-center gap-3 border-b border-white/10 bg-[#111] z-10 shrink-0">
                    <div className="w-8 h-8 rounded-full border border-orange-500/40 flex items-center justify-center p-[2px]">
                       <div className="w-full h-full bg-black rounded-full flex items-center justify-center"><Zap className="w-4 h-4 text-orange-500"/></div>
                    </div>
                    <div>
                       <h3 className="text-white text-[14px] font-bold tracking-wide">ClawLink Live API</h3>
                       <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-mono font-bold mt-0.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Operational</div>
                    </div>
                 </div>

                 <div ref={apiChatRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4 relative bg-[#07070A]">
                    <AnimatePresence>
                      {demoChat.map((msg, idx) => (
                         <motion.div key={idx} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                            <div className={`p-4 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-lg ${msg.role==="user" ? "bg-orange-500 text-white rounded-br-sm font-medium" : "bg-[#1A1A1A] text-gray-200 border border-white/10 rounded-bl-sm"}`}>
                               {msg.text}
                            </div>
                         </motion.div>
                      ))}
                      {isDemoTyping && (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
                            <div className="p-3 bg-[#1A1A1A] border border-white/10 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.2s"}}></div>
                               <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:"0.4s"}}></div>
                            </div>
                         </motion.div>
                      )}
                    </AnimatePresence>
                 </div>

                 <div className="p-4 border-t border-white/10 bg-[#0A0A0A] shrink-0">
                    <form onSubmit={handleDemoSubmit} className="relative flex items-center">
                       <input type="text" value={demoInput} onChange={e=>setDemoInput(e.target.value)} placeholder="Type a message..." 
                              className="w-full bg-[#1A1A1A] border border-white/10 text-white text-[13px] rounded-full pl-4 pr-12 py-3.5 outline-none focus:border-orange-500/80 transition-colors" />
                       <button type="submit" disabled={!demoInput.trim() || isDemoTyping} className="absolute right-1.5 w-8 h-8 bg-[#333] hover:bg-orange-500 rounded-full flex items-center justify-center text-white transition-colors">
                          <ArrowRight className="w-4 h-4" />
                       </button>
                    </form>
                 </div>
            </div>

        </motion.div>
      </section>

      {/* SEAMLESS PRICING SECTION (NO HARSH LAKIREIN) */}
      <section id="pricing" className="relative z-10 py-24 px-6 overflow-hidden" style={{ backgroundColor: "var(--bg-section)" }}>
        <div className="max-w-[1300px] mx-auto relative z-10">
          
          <div className="flex justify-center mb-6">
            <div className="font-mono text-[10.5px] tracking-[0.35em] uppercase text-orange-500 flex items-center gap-3">
              <span className="w-6 h-px bg-orange-500/40" />
              Choose Your AI Workforce
              <span className="w-6 h-px bg-orange-500/40" />
            </div>
          </div>

          <h2 className="text-center text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.035em] mb-4 leading-tight" style={{ color: "var(--text-main)" }}>
            Start small.<br className="md:hidden" /> Scale when your business grows.
          </h2>
          <p className="text-center text-[15px] mb-8 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            Your AI. Your Channels. Your Growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            {/* Model Switcher */}
            <div className="relative flex flex-wrap justify-center rounded-[24px] p-1.5 border gap-1 w-fit" style={{ backgroundColor: "rgba(128,128,128,0.05)", borderColor: "var(--border-color)" }}>
              {MODEL_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => setPricingModel(name)}
                  className={`relative z-10 px-5 py-2.5 rounded-full font-mono text-[11.5px] font-bold tracking-wider transition-all duration-300 ${pricingModel === name ? "bg-orange-500 text-white shadow-md scale-105" : "text-gray-400 hover:text-white bg-transparent"}`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Billing Toggle */}
             <div className="flex items-center gap-3">
                <span className={`text-[12px] font-bold ${!isYearlyBilling ? 'text-orange-500' : 'text-gray-400'}`}>Monthly</span>
                <button 
                  onClick={() => setIsYearlyBilling(!isYearlyBilling)}
                  className="w-12 h-6 bg-white/10 rounded-full relative transition-colors duration-300 border border-white/20"
                >
                  <div className={`w-4 h-4 bg-orange-500 rounded-full absolute top-1 transition-all duration-300 ${isYearlyBilling ? 'left-7' : 'left-1'}`} />
                </button>
                <div className="flex flex-col items-start">
                    <span className={`text-[12px] font-bold ${isYearlyBilling ? 'text-orange-500' : 'text-gray-400'}`}>Annually</span>
                    <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-1.5 rounded-sm">Save 20%</span>
                </div>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-0 rounded-full border overflow-hidden font-mono text-[10.5px] font-bold tracking-widest h-fit" style={{ borderColor: "var(--border-color)", backgroundColor: "rgba(128,128,128,0.05)" }}>
              {["USD", "INR"].map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur as "USD"|"INR")}
                  className="px-6 py-2.5 transition-colors duration-200"
                  style={{ background: currency === cur ? "rgba(249,115,22,0.2)" : "transparent", color: currency === cur ? "#f97316" : "var(--text-muted)" }}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="flex flex-wrap justify-center gap-6">
            {PRICING_DATA[pricingModel || "GPT-5.5 Pro"]?.plans.map((plan: any) => {
              const isBase = plan.level === 1;
              const isCustom = plan.usd === "Custom";
              
              let mainPrice = "Custom";
              let altPrice = "";
              let unit = "";

              if (!isCustom) {
                  unit = "/mo";
                  if (currency === "USD") {
                      mainPrice = isYearlyBilling && plan.yearlyUsd ? `$${plan.yearlyUsd.toFixed(2)}` : `$${plan.usd}`;
                      altPrice = isYearlyBilling && plan.yearlyTotalUsd ? `Billed $${plan.yearlyTotalUsd.toFixed(2)} yearly` : `₹${plan.inr.toLocaleString("en-IN")}/mo equivalent`;
                  } else {
                      mainPrice = isYearlyBilling && plan.yearlyInr ? `₹${plan.yearlyInr.toLocaleString("en-IN")}` : `₹${plan.inr.toLocaleString("en-IN")}`;
                      altPrice = isYearlyBilling && plan.yearlyTotalInr ? `Billed ₹${plan.yearlyTotalInr.toLocaleString("en-IN")} yearly` : `$${plan.usd}/mo equivalent`;
                  }
              }

              return (
                <div key={plan.id} className={`relative w-[300px] flex flex-col rounded-[24px] p-7 transition-all duration-300 hover:-translate-y-2 ${isBase || isCustom ? 'opacity-90' : 'scale-105 z-10 shadow-2xl'}`}
                     style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${isBase || isCustom ? "var(--border-color)" : hexA(plan.accent, 0.5)}` }}>
                  
                  <Corner pos="tl" />
                  <Corner pos="br" />

                  <Meter level={plan.level} accent={plan.accent} />

                  <div className="flex items-center justify-between mt-5 mb-1">
                    <span className="text-[18px] font-black tracking-tight" style={{ color: "var(--text-main)" }}>{plan.name}</span>
                    {plan.badge && (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: plan.accent, background: hexA(plan.accent, 0.15), border: `1px solid ${hexA(plan.accent, 0.35)}` }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[10px] font-bold tracking-widest mb-6 min-h-[30px]" style={{ color: hexA(plan.accent, 0.9) }}>
                    {plan.msgs.toUpperCase()}
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[42px] font-black leading-none tracking-tighter" style={{ color: "var(--text-main)" }}>{mainPrice}</span>
                    {!isCustom && <span className="text-[13px] font-bold" style={{ color: "var(--text-muted)" }}>{unit}</span>}
                  </div>
                  <div className="font-mono text-[11px] font-semibold mb-6 h-[16px]" style={{ color: "var(--text-muted)" }}>
                      {!isCustom && altPrice}
                  </div>

                  <p className="text-[13px] leading-relaxed pb-6 mb-6 border-b min-h-[70px]" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>
                    {plan.desc}
                  </p>

                  <ul className="flex-grow space-y-3 mb-8">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-3 text-[12px] font-bold tracking-wide" style={{ color: "var(--text-main)" }}>
                        <Check size={14} strokeWidth={3} className="flex-shrink-0 mt-[2px]" style={{ color: plan.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                        if (status !== "authenticated") {
                            signIn("google");
                        } else {
                            if(!isCustom){
                                handleModelSelect(pricingModel || "GPT-5.5 Pro");
                                document.getElementById("hero")?.scrollIntoView({behavior:"smooth"});
                            } else {
                                setIsSupportModalOpen(true);
                            }
                        }
                    }}
                    className="w-full py-4 rounded-xl font-mono text-[11.5px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                    style={{ background: (isBase || isCustom) ? "rgba(128,128,128,0.1)" : plan.accent, color: (isBase || isCustom) ? "var(--text-main)" : "#fff", border: (isBase || isCustom) ? "1px solid var(--border-color)" : "none" }}
                  >
                    {isCustom ? "Contact Sales" : (isBase ? "Start Free →" : `Deploy ${plan.name} →`)}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
              <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>No setup fees. No servers to manage. No technical expertise required. Cancel anytime.</p>
              <p className="text-[11px] mt-2 opacity-70" style={{ color: "var(--text-muted)" }}>AI usage is subject to fair-use limits. Third-party provider charges may apply where applicable.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 py-28 px-6 md:px-12 transition-colors duration-300" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">How It Works</p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black tracking-[-0.035em] mb-4" style={{ color: "var(--text-main)" }}>4 steps to go live</h2>
            <p className="text-[16px] max-w-[500px] mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>Zero to live AI agent in 30 seconds. No tech expertise needed.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14 relative">
            {[
              {n:"01",e:"🔑",t:"Login with Google",  d:"One tap. No passwords, no friction."},
              {n:"02",e:"🤖",t:"Choose Model & Channel",d:"Pick AI model + Telegram or WhatsApp."},
              {n:"03",e:"✅",t:"Token Verify",         d:"Paste token. Verified & secured instantly."},
              {n:"04",e:"🚀",t:"Go Live",              d:"Enterprise infra spins up. 24/7, zero maintenance."},
            ].map(({n,e,t,d})=>(
              <div key={n} className="flex flex-col items-center text-center px-4 relative z-10">
                <div className="w-[70px] h-[70px] lg:w-[80px] lg:h-[80px] rounded-full flex items-center justify-center font-black text-[22px] lg:text-[26px] text-orange-500 mb-6 z-10 shadow-md"
                  style={{backgroundColor:"var(--bg-card)",border:"2px solid rgba(249,115,22,0.25)"}}>
                  {n}
                </div>
                <div className="text-[26px] mb-3">{e}</div>
                <div className="text-[15px] font-black mb-2" style={{ color: "var(--text-main)" }}>{t}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative z-10 py-28 overflow-hidden transition-colors duration-300" style={{ backgroundColor: "var(--bg-section)" }}>
        <div className="text-center mb-16 px-4">
          <p className="text-[11px] font-black tracking-[.2em] uppercase text-orange-500 mb-3">50+ AI Use Cases</p>
          <h2 className="text-[clamp(2.4rem,6vw,4.2rem)] font-black tracking-[-0.04em]" style={{ color: "var(--text-main)" }}>Thousands of Use Cases</h2>
          <p className="font-medium text-[16px] mt-4" style={{ color: "var(--text-muted)" }}>Your agent handles complex tasks around the clock.</p>
        </div>
        <div className="flex flex-col gap-4 relative w-full">
          {[row1,row2,row3,row4,row5].map((r,i)=><MarqueeRow key={i} items={r} reverse={i%2===1}/>)}
        </div>
      </section>

      <TrustAndFAQ />

      {/* FOOTER */}
      <footer className="relative z-10 pt-28 pb-14 px-6 md:px-16 transition-colors duration-300" style={{ backgroundColor: "var(--bg-main)" }}>
        <h2 className="text-[clamp(2.8rem,6vw,4.8rem)] font-black tracking-[-0.04em] mb-8" style={{ fontFamily: "Georgia,serif", lineHeight: 1.06, color: "var(--text-main)" }}>Deploy. Automate. Relax.</h2>
        <button aria-label="Get Started with ClawLink" onClick={()=>document.getElementById("hero")?.scrollIntoView({behavior:"smooth"})}
          className="px-12 py-5 rounded-[16px] text-[15px] font-black text-black mb-24 uppercase tracking-widest hover:-translate-y-1 hover:shadow-lg transition-transform duration-150 shadow-lg"
          style={{background:"linear-gradient(135deg,#FFA87A,#F97316)"}}>
          Get Started Free →
        </button>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] pt-10 border-t" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }}>
          <span className="font-medium">© 2026 ClawLink Inc. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-6 font-medium">
            {[["Privacy Policy","/privacy"], ["Terms of Service","/terms"], ["Refund Policy", "/refund"], ["Documentation","/docs"]].map(([l,h])=>(
              <a key={h} href={h} className="transition-colors duration-200 hover:text-orange-500">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* HELP MODAL */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-[20px] p-4">
            <motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}}
              className="w-full max-w-[500px] p-8 rounded-[2rem] relative"
              style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 0 80px rgba(0,0,0,0.8)"}}>
              <button aria-label="Close Support Modal" onClick={()=>setIsSupportModalOpen(false)}
                className="absolute top-6 right-6 p-2.5 rounded-full text-gray-500 hover:text-white transition-colors">
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
                  {icon:<Mail className="w-5 h-5 text-orange-400"/>,title:"Direct Email",content:<a href="mailto:clawlink.help@gmail.com" className="text-blue-400 text-[14px] font-mono tracking-wide mt-1 block">clawlink.help@gmail.com</a>},
                  {icon:<Shield className="w-5 h-5 text-green-400"/>,title:"Enterprise SLAs",content:<p className="text-[13px] text-gray-400 mt-2 leading-relaxed">Pro and Max tier users get priority &lt;1hr guaranteed engineering response.</p>},
                ].map(({icon,title,content},i)=>(
                  <div key={i} className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div className="flex items-center gap-3 mb-2">{icon}<span className="text-[14px] font-bold text-white uppercase tracking-widest">{title}</span></div>
                    {content}
                  </div>
                ))}
              </div>
              <button aria-label="Close Support Panel" onClick={()=>setIsSupportModalOpen(false)}
                className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl text-[14px] uppercase tracking-widest hover:bg-gray-200">
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONNECT INTEGRATION MODAL */}
      <AnimatePresence>
        {isTelegramModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-[20px] p-4">
            <motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}}
              className="w-full max-w-[1100px] flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] relative"
              style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 0 100px rgba(0,0,0,0.9)",maxHeight:"92vh"}}>
              <button aria-label="Close Connect Modal" onClick={()=>setIsTelegramModalOpen(false)} className="absolute top-5 right-5 z-20 p-2.5 rounded-full text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>

              <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-start overflow-y-auto custom-scrollbar">
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
                    <a href="https://t.me/BotFather?text=%2Fnewbot" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 mb-8 px-6 py-3.5 rounded-xl text-[13px] font-black uppercase tracking-widest w-fit text-[#2AABEE]"
                      style={{background:"rgba(42,171,238,0.08)",border:"1px solid rgba(42,171,238,0.25)"}}>
                      <ExternalLink className="w-4 h-4"/> Open @BotFather Directly
                    </a>
                    <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <label htmlFor="telegram-token" className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">API Access Token</label>
                      <input id="telegram-token" type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="Enter Verification Token…"
                        className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-6 outline-none transition-colors duration-200 placeholder-gray-600"
                        style={{background:"#07070A",border:"1px solid rgba(255,255,255,0.09)"}}/>
                      <button aria-label="Verify API Token" onClick={handleSaveToken} disabled={isVerifying}
                        className="w-full font-black py-4 rounded-xl text-[14px] uppercase tracking-widest disabled:opacity-50"
                        style={{background:isVerifying?"rgba(255,255,255,0.1)":"#fff",color:isVerifying?"#666":"#000"}}>
                        {isVerifying?"Verifying API Status…":"Verify & Save Token"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col h-full w-full">
                    <div className="flex border-b border-white/10 mb-6 w-full shrink-0">
                        <button
                            onClick={() => setMetaAuthTab("1click")}
                            className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-all ${metaAuthTab === "1click" ? (activeChannel === "whatsapp" ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-[#e6683c] border-b-2 border-[#e6683c]") : "text-gray-500 hover:text-gray-300"}`}
                        >
                            🚀 1-Click Auto
                        </button>
                        <button
                            onClick={() => setMetaAuthTab("manual")}
                            className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-widest transition-all ${metaAuthTab === "manual" ? "text-white border-b-2 border-white" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            ⚙️ Manual Setup
                        </button>
                    </div>

                    {metaAuthTab === "1click" ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-6 px-4">
                            <div className={`w-24 h-24 rounded-full mb-6 flex items-center justify-center shadow-lg ${activeChannel === "whatsapp" ? "bg-[#25D366]" : "bg-[#e6683c]"}`}>
                                <MessageCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-3">Deploy in 30 Seconds</h3>
                            <p className="text-[13px] text-gray-400 mb-10 max-w-sm leading-relaxed">Connect securely via official Facebook login and our Omni-Fallback engine will handle the rest.</p>
                            
                            <button
                                onClick={handleEmbeddedFacebookLogin}
                                disabled={isVerifying}
                                className="w-full font-black py-4 rounded-xl text-[14px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[#1877F2] text-white hover:bg-[#166FE5]"
                            >
                                {isVerifying ? <Loader2 className="animate-spin w-5 h-5" /> : "Continue with Facebook"}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-y-auto custom-scrollbar pr-2 pb-4">
                            <div className="p-6 rounded-2xl" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)"}}>
                              <div className="mb-8 p-5 rounded-xl border border-dashed border-white/20">
                                <p className="text-[12px] font-black uppercase tracking-widest mb-4 text-orange-500">🔗 Webhook Config</p>
                                <div className="mb-4">
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Webhook URL</label>
                                  <div className="flex items-center gap-2">
                                    <input readOnly value={`https://www.clawlinkai.com/api/webhook/${activeChannel}`} className="w-full bg-black/60 text-gray-300 p-3.5 rounded-lg text-[12px] border border-white/10 outline-none font-mono" />
                                    <button type="button" onClick={() => copyToClipboard(`https://www.clawlinkai.com/api/webhook/${activeChannel}`)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-3.5 rounded-lg text-[12px] font-bold">Copy</button>
                                  </div>
                                </div>
                              </div>

                              <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">{activeChannel==="whatsapp"?"Phone Number ID":"Instagram Account ID"}</label>
                              <input type="text" value={waPhoneId} onChange={e=>setWaPhoneId(e.target.value)} placeholder="e.g. 1044727838716942"
                                className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-5 outline-none bg-[#07070A] border border-white/10"/>
                              
                              <label className="block text-[10px] font-black uppercase tracking-[.2em] text-gray-500 mb-3">Permanent API Token</label>
                              <input type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="EAABwzL…"
                                className="w-full px-5 py-4 rounded-xl text-[14px] text-white font-mono mb-6 outline-none bg-[#07070A] border border-white/10"/>
                              <button onClick={handleSaveToken} disabled={isVerifying}
                                className="w-full font-black py-4 rounded-xl text-[14px] uppercase tracking-widest bg-white text-black hover:bg-gray-200">
                                {isVerifying?"Verifying API Status…":"Verify & Save Configuration"}
                              </button>
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-[130] flex flex-col items-end">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div initial={{opacity:0,y:14,scale:.92}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:14,scale:.92}}
              className="w-80 md:w-96 p-6 rounded-[1.5rem] mb-4 relative shadow-2xl" style={{background:"#0F0F12",border:"1px solid rgba(255,255,255,0.09)"}}>
              <button onClick={()=>setIsHelpOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white p-1.5 rounded-full"><X className="w-4 h-4"/></button>
              {helpStatus==="sent" ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mb-2"/>
                  <h4 className="text-white font-black text-[18px]">Submitted!</h4>
                </div>
              ) : (
                <>
                  <h4 className="text-white font-black text-[15px] mb-4">ClawLink Support</h4>
                  <div className="space-y-4">
                    <input type="email" placeholder="Your email address" value={helpEmail} onChange={e=>setHelpEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none bg-white/5 border border-white/10"/>
                    <textarea placeholder="How can we assist you today?" rows={3} value={helpMessage} onChange={e=>setHelpMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none resize-none bg-white/5 border border-white/10"/>
                    <button onClick={handleSendHelpRequest} disabled={helpStatus==="sending"}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2">
                      <Send className="w-4 h-4"/>Send Message
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button 
          whileHover={{scale:1.05}} 
          whileTap={{scale:.95}} 
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-16 h-16 text-white rounded-full flex items-center justify-center shadow-lg"
          style={{background:"linear-gradient(135deg,#3B82F6,#7C3AED)"}}
        >
          {isHelpOpen ? <X className="w-7 h-7"/> : <MessageCircle className="w-7 h-7"/>}
        </motion.button>
      </div>

      <TelegramDemoWidget />

    </div>
  );
}