"use client";

/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM COMMAND ROUTER
 * ==============================================================================================
 * @file app/dashboard/telegram/command-router/page.tsx
 * @description Advanced UI to manage Telegram Bot Menu Commands. Syncs instantly to the Telegram app.
 * 🚀 SECURED: Strict TS Interfaces and Real DB connection. No dummy data.
 * 🚀 FIXED: Removed unused eslint directive and added aria-labels to fix accessibility errors.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TerminalSquare, Plus, Trash2, Zap, Activity, ShieldCheck, ListOrdered } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import SpinnerCounter from "@/components/SpinnerCounter";

interface BotCommand {
    id: string;
    command: string;
    description: string;
    action: string;
    is_active: boolean;
}

export default function TelegramCommandRouter() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [commands, setCommands] = useState<BotCommand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [newCommand, setNewCommand] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newAction, setNewAction] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/");
    }, [status, router]);

    const fetchCommands = async () => {
        if (status === "authenticated" && session?.user?.email) {
            try {
                const res = await fetch(`/api/telegram/commands?email=${encodeURIComponent(session.user.email)}&t=${Date.now()}`);
                const data = await res.json();
                if (data.success && data.commands) {
                    setCommands(data.commands);
                }
            } catch (error) {
                console.error("Failed to load commands");
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchCommands();
    }, [session, status]);

    const handleSaveCommand = async () => {
        if (!session?.user?.email || !newCommand.trim() || !newDesc.trim() || !newAction.trim()) {
            alert("Please fill all fields!");
            return;
        }

        if (commands.length >= 100) {
            alert("Telegram limit reached! You can only have 100 menu commands.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/telegram/commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    command: newCommand,
                    description: newDesc,
                    action: newAction
                })
            });

            const data = await res.json();
            if (data.success) {
                alert("✨ Command deployed and Synced to Telegram Menu!");
                setNewCommand(""); setNewDesc(""); setNewAction("");
                await fetchCommands();
            } else {
                alert("Failed to save: " + data.error);
            }
        } catch (error) {
            alert("Network error.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCommand = async (id: string) => {
        if(!confirm("Delete this command? It will be removed from your Telegram bot menu.")) return;
        if (!session?.user?.email) return;
        
        setIsLoading(true);
        try {
            await fetch(`/api/telegram/commands?email=${encodeURIComponent(session.user.email)}&id=${id}`, { method: 'DELETE' });
            await fetchCommands();
        } catch (error) {
            console.error("Delete failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || status === "loading") return <SpinnerCounter text="SYNCING COMMAND ROUTER..." />;

    return (
        <div className="flex flex-col h-screen bg-[#07070A] text-white overflow-hidden selection:bg-[#2AABEE]/30">
            <TopHeader title="Command Router" session={session} />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                    
                    {/* LEFT: CREATE COMMAND */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
                                <TerminalSquare className="w-6 h-6 text-[#2AABEE]" /> Create Menu Command
                            </h2>
                            <p className="text-[12px] text-gray-500">Deploy instant slash commands to your Telegram Bot&apos;s native menu. Maximum 100 allowed.</p>
                        </div>

                        <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Trigger Command</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono">/</div>
                                        <input 
                                            type="text" 
                                            value={newCommand.replace(/\//g, '')}
                                            onChange={(e) => setNewCommand(e.target.value.replace(/\s+/g, '_'))}
                                            placeholder="offer"
                                            className="w-full bg-[#111114] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-[#2AABEE]/50 outline-none font-mono"
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-1">No spaces allowed. Use underscores (e.g., /book_now)</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Menu Description</label>
                                    <input 
                                        type="text" 
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        maxLength={256}
                                        placeholder="Get 50% exclusive discount link"
                                        className="w-full bg-[#111114] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#2AABEE]/50 outline-none"
                                    />
                                    <p className="text-[9px] text-gray-600 mt-1">This text appears next to the command in the Telegram Menu.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2AABEE] mb-2 flex items-center gap-2">
                                        <Zap className="w-3 h-3"/> Bot Reply / Action Action
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={newAction}
                                        onChange={(e) => setNewAction(e.target.value)}
                                        placeholder="🎉 Congratulations! Here is your exclusive 50% discount link..."
                                        className="w-full bg-[#111114] border border-[#2AABEE]/30 rounded-2xl p-4 text-sm text-white focus:border-[#2AABEE] outline-none resize-none custom-scrollbar"
                                    />
                                </div>

                                <button 
                                    onClick={handleSaveCommand} 
                                    disabled={isSaving || !newCommand || !newDesc || !newAction}
                                    className="w-full bg-[#2AABEE] hover:bg-[#2298D6] text-white py-4 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(42,171,238,0.2)] disabled:opacity-50 transition-all"
                                >
                                    {isSaving ? <Activity className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
                                    {isSaving ? "Syncing to Telegram..." : "Deploy to Menu"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: LIST COMMANDS */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <ListOrdered className="w-5 h-5 text-gray-400" /> Active Menu ({commands.length}/100)
                            </h2>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <ShieldCheck className="w-3 h-3 text-green-400"/>
                                <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Live Synced</span>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0D] border border-white/5 rounded-[24px] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] h-[600px] flex flex-col">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {commands.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                                        <TerminalSquare className="w-10 h-10 text-gray-500 mb-3" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">No Commands Deployed</p>
                                    </div>
                                ) : (
                                    commands.map((cmd) => (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={cmd.id} className="bg-[#111114] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-colors group relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2AABEE]/50"></div>
                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <div>
                                                    <span className="text-[13px] font-bold text-[#2AABEE] font-mono">{cmd.command}</span>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{cmd.description}</p>
                                                </div>
                                                <button 
                                                    aria-label="Delete Command"
                                                    title="Delete Command"
                                                    onClick={() => handleDeleteCommand(cmd.id)} 
                                                    className="text-gray-500 hover:text-red-500 p-2 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                            <div className="mt-3 pl-2 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Bot Action</p>
                                                <p className="text-[11px] text-gray-300 leading-relaxed truncate">{cmd.action}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html:`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}}/>
        </div>
    );
}