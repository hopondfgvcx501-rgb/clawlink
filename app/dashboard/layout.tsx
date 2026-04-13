"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MessageSquare, BarChart3, LogOut, Loader2, Cpu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  // 🚀 MASTER NAVIGATION MENU (Cleaned up as per CEO orders)
  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live CRM Inbox", href: "/dashboard/crm", icon: MessageSquare },
    { name: "Data Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white font-sans overflow-hidden">
      
      {/* 🚀 THE SIDEBAR (Visible on Desktop) */}
      <aside className="w-72 bg-[#111] border-r border-white/10 flex flex-col hidden md:flex shrink-0 relative z-20 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-black tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-8 h-8 text-blue-500"/>
            clawlink<span className="text-blue-500">.</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">Enterprise Tools</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={session?.user?.image || ""} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20"/>
            <div className="truncate">
              <p className="text-sm font-bold truncate text-white">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate font-mono">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all font-bold text-sm uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT AREA (Dynamically loads the pages) */}
      <main className="flex-1 overflow-y-auto relative bg-[#0A0A0B]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#111]">
          <h1 className="text-lg font-black font-mono">clawlink<span className="text-blue-500">.</span></h1>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="text-red-400 p-2"><LogOut className="w-5 h-5"/></button>
        </div>
        
        <div className="pb-20 md:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 flex justify-around p-2 z-50">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`p-3 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[8px] uppercase font-bold">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </main>

    </div>
  );
}