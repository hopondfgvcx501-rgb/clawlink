"use client";

import React, { useState, useEffect } from 'react';

interface SpinnerCounterProps {
  text?: string;
}

export default function SpinnerCounter({ text = "INITIALIZING..." }: SpinnerCounterProps) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // Fake loading counter effect matching the video style
    const interval = setInterval(() => {
      setPct(prev => {
        if (prev >= 99) return 99; // Hold at 99% until data actually loads
        const increment = Math.floor(Math.random() * 5) + 1; // Random jump for realistic feel
        return prev + increment > 99 ? 99 : prev + increment;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, []);

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="w-full h-screen bg-[#07070A] flex flex-col items-center justify-center font-mono z-[9999]">
      <div className="relative flex items-center justify-center w-28 h-28 mb-2">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          {/* Background Track */}
          <circle 
            cx="56" cy="56" r={radius} 
            fill="none" 
            stroke="#1A1A24" 
            strokeWidth="6" 
          />
          {/* Animated Progress Ring (Teal/Green) */}
          <circle 
            cx="56" cy="56" r={radius} 
            fill="none" 
            stroke="#2DD4BF" 
            strokeWidth="6" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-200 ease-out"
          />
        </svg>
        {/* Percentage Counter */}
        <span className="text-[#2DD4BF] text-lg font-black">{pct}%</span>
      </div>
      
      {/* Title */}
      <div className="text-gray-300 font-bold tracking-widest uppercase text-xs mb-1">{text}</div>
      {/* Subtitle */}
      <div className="text-gray-600 font-medium text-[10px]">loader.spinner-pct</div>
    </div>
  );
}