"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function GlobalLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Ultra-smooth counter from 0 to 100
    const duration = 1200; // 1.2 seconds total duration
    const intervalTime = 15;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(newProgress);

      if (currentStep >= steps) clearInterval(timer);
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#07070A] flex flex-col items-center justify-center z-[100]">
      <div className="relative flex flex-col items-center">
        {/* Animated Circular Spinner */}
        <div className="relative w-20 h-20 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="6"
            />
            {/* Progress Stroke */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f97316" /* Orange-500 */
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ strokeDasharray: `${(progress / 100) * 251.2} 251.2` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </svg>
        </div>

        {/* Counter */}
        <div className="text-2xl font-black text-white tracking-widest tabular-nums absolute top-[22px]">
          {progress}<span className="text-sm text-orange-500">%</span>
        </div>

        {/* Branding Text */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">
            ClawLink Engine
          </span>
          <span className="text-xs text-orange-500/80 font-mono tracking-widest animate-pulse">
            INITIALIZING WORKSPACE...
          </span>
        </motion.div>
      </div>
    </div>
  );
}