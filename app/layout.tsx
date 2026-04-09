import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawLink | 1-Click OpenClaw Deploy & 24/7 AI Agent in 30s",
  description: "1-Click deploy your 24/7 OpenClaw Personal AI Assistant globally on WhatsApp, Telegram & Insta in 30s. Zero technical complexity. Customize via dashboard!",
  
  // 🚀 THE ULTIMATE SEO KEYWORD MATRIX
  keywords: [
    // Brand & Core Product
    "ClawLink", "ClawLink AI", "OpenClaw", "OpenClaw deploy", "1-click OpenClaw", "OpenClaw alternative",
    
    // Broad AI Agent Terms
    "AI Agent", "Personal AI Assistant", "Create AI Agent", "Deploy AI Agent", "AI automation SaaS",
    
    // Platform Specific (Super High Search Volume)
    "WhatsApp Bot", "WhatsApp AI Agent", "Automate WhatsApp messages", "WhatsApp customer support bot",
    "Telegram Bot", "Telegram AI Agent", "Telegram crypto bot", "Automate Telegram",
    "Instagram AI Bot", "Instagram DM automation", "Insta auto reply AI",
    
    // Tech & Models
    "No code AI bot", "GPT-4o bot", "Claude 3 bot", "Gemini Flash bot", "Omni fallback AI",
    
    // Competitor Alternative Keywords
    "ManyChat alternative", "AI Chatbot builder", "Custom AI chatbot", "Enterprise AI agent"
  ],
  
  // 🚀 TELLS GOOGLE TO STRICTLY INDEX THIS PAGE
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  authors: [{ name: "ClawLink" }],
  creator: "ClawLink",
  publisher: "ClawLink Inc.",
  
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  metadataBase: new URL("https://www.clawlinkai.com"),
  verification: {
    google: "QgkpU_LPUkzu-FGEhCXL-kTRLY8_e_FmptmJmj0ddUU", // Google Search Console Verification ID
  },
  openGraph: {
    title: "ClawLink | 1-Click OpenClaw Deploy & 24/7 AI Agent",
    description: "1-Click deploy your 24/7 OpenClaw Personal AI Assistant globally on WhatsApp, Telegram & Insta in 30s. Zero technical complexity. Customize via dashboard!",
    url: "https://www.clawlinkai.com",
    siteName: "ClawLink",
    images: [
      {
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
    title: "ClawLink | 1-Click OpenClaw Deploy",
    description: "1-Click deploy your 24/7 OpenClaw Personal AI Assistant globally on WhatsApp, Telegram & Insta in 30s. Zero technical complexity. Customize via dashboard!",
    images: ["https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0B] text-white antialiased selection:bg-blue-500/30">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}