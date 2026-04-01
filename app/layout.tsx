import type { Metadata } from "next";
import Providers from "./providers"; // Removed curly brackets {} for default export
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawLink | 1-Click OpenClaw Deploy & 24/7 AI Agent in 30s",
  description: "Launch your 24/7 AI Agent in just 30 seconds. Experience true 1-click OpenClaw deployment powered by our bulletproof Omni-Fallback Engine (Claude 🔄 GPT-4o 🔄 Gemini). Zero downtime, infinite scale.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192x192.png",
  },
  metadataBase: new URL("https://www.clawlinkai.com"),
  verification: {
    google: "QgkpU_LPUkzu-FGEhCXL-kTRLY8_e_FmptmJmj0ddUU", // Google Search Console Verification ID
  },
  openGraph: {
    title: "ClawLink | 1-Click OpenClaw Deploy & 24/7 AI Agent",
    description: "Launch your 24/7 AI Agent in just 30 seconds. Powered by our bulletproof Omni-Fallback Engine (Claude 🔄 GPT-4o 🔄 Gemini).",
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
    description: "Launch your 24/7 AI Agent in just 30 seconds. Powered by our bulletproof Omni-Fallback Engine. Zero downtime, infinite scale.",
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