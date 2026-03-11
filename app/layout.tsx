import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers"; // 🚀 Naya Provider Import Kiya

export const metadata: Metadata = {
  title: "ClawLink | Global AI SaaS Infrastructure",
  description: "Deploy OpenClaw alternative under 30 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0B] text-white antialiased">
        {/* 🚀 Poori website ko Provider ke andar daal diya */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}