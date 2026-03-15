"use client";

export default function Footer() {
  return (
    <footer className="pt-24 pb-12 relative z-10 bg-[#141414]">
      <div className="max-w-6xl mx-auto px-10 text-left mb-24">
        <h2 className="text-4xl md:text-[3.5rem] text-white mb-8 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>Deploy. Automate. Relax.</h2>
        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="bg-[#FFA87A] hover:bg-[#FF905A] text-black font-bold px-10 py-3 rounded text-lg transition-colors duration-150 shadow-lg font-serif">
          learn more
        </button>
      </div>

      <div className="border-t border-white/10 px-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 font-serif relative z-10">
        <p>© 2026 ClawLink Inc. All rights reserved.</p>
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 uppercase tracking-widest text-[11px] text-gray-500 font-sans">
          © 2026 CLAWLINK INC. GLOBAL AI SAAS INFRASTRUCTURE.
        </div>
        <div className="flex gap-6 mt-4 md:mt-0 font-serif">
          <a href="/privacy" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
          <a href="/terms" className="hover:text-white transition-colors duration-150">Terms of Service</a>
          <a href="/docs" className="hover:text-white transition-colors duration-150">Documentation</a>
        </div>
      </div>
    </footer>
  );
}