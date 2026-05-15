"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM LIVE DEMO WIDGET
 * ==============================================================================================
 * @file components/TelegramDemoWidget.tsx
 * @description Floating premium button to redirect users to the live Telegram bot for testing.
 * 🚀 FIXED: Placed on bottom-left to avoid colliding with the Help Chat widget on the right.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

export default function TelegramDemoWidget() {
    // 🔴 TERA BOT USERNAME YAHAN SET HAI
    const botUsername = "clawlinkhelp"; 
    const telegramUrl = `https://t.me/${botUsername}?start=demo`;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.5, delay: 1 }}
            className="fixed bottom-8 left-8 z-[130]" // <-- LEFT SIDE POSITION
        >
            <div className="relative group">
                {/* Ping Animation Effect */}
                <div className="absolute -inset-1 bg-[#2AABEE] rounded-full blur opacity-40 group-hover:opacity-100 animate-pulse transition duration-1000 group-hover:duration-200"></div>
                
                {/* Tooltip Hover */}
                <div className="absolute bottom-full left-0 mb-3 hidden group-hover:flex w-max items-center">
                    <div className="bg-[#0A0A0D] text-white text-[12px] font-bold px-4 py-2 rounded-xl border border-[#2AABEE]/30 shadow-[0_0_15px_rgba(42,171,238,0.2)] whitespace-nowrap">
                        Test Live AI Bot 🔥
                    </div>
                </div>

                {/* The Main Button */}
                <a 
                    href={telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-[#2298D6] to-[#2AABEE] rounded-full shadow-2xl hover:scale-110 transition-transform transform-gpu will-change-transform"
                >
                    <Send className="w-6 h-6 text-white ml-1" />
                </a>
            </div>
        </motion.div>
    );
}