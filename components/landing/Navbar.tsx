"use client";
import { signOut } from "next-auth/react";
import { LogOut, MessageSquare } from "lucide-react";

export default function Navbar({ session, status, onSupportClick }: any) {
  return (
    <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-[1600px] mx-auto">
      <div className="text-xl md:text-2xl font-black tracking-widest uppercase text-white font-sans">CLAWLINK.COM</div>
      <div className="flex items-center gap-6">
        {status === "authenticated" && (
          <div className="hidden md:flex items-center gap-3">
            <img src={session?.user?.image || ""} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar" />
            <button onClick={() => signOut()} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        )}
        <button onClick={onSupportClick} className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-300 hover:text-white transition-colors duration-150 uppercase tracking-widest">
          <MessageSquare className="w-4 h-4" /> CONTACT SUPPORT
        </button>
      </div>
    </nav>
  );
}