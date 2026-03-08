import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import SessionWrapper from "../components/SessionWrapper";

export const metadata: Metadata = {
  title: "ClawLink | Deploy OpenClaw Fast",
  description: "Deploy your OpenClaw instance in seconds with premium infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans bg-[#111214] text-[#EAEAEA]">
        {/* We wrapped the app in the SessionWrapper so the whole app knows who is logged in */}
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}