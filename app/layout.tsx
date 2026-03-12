import type { Metadata } from "next";

// 🚀 ENTERPRISE SEO & SOCIAL SHARE BANNER CONFIGURATION
export const metadata: Metadata = {
  title: "ClawLink | Global AI SaaS Infrastructure",
  description: "One-click deploy your own 24/7 active AI agent on Telegram and Meta Cloud under 30 seconds. Powered by GPT, Claude, and Gemini.",
  metadataBase: new URL("https://clawlink.com"),
  openGraph: {
    title: "ClawLink Enterprise AI",
    description: "Deploy auto-fallback AI bots on Telegram & WhatsApp instantly.",
    url: "https://clawlink.com",
    siteName: "ClawLink",
    images: [
      {
        // Ye ek futuristic AI server ki premium image hai jo WhatsApp/Twitter par dikhegi
        url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop", 
        width: 1200,
        height: 630,
        alt: "ClawLink AI Engine",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawLink | Enterprise AI",
    description: "One-click deploy your own 24/7 active AI agent under 30 seconds.",
    images: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop"],
  },
};