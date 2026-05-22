/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: OMNI-CHANNEL GLOBAL COMMAND HEADER
 * ==============================================================================================
 * @description Retains the original UI structure while injecting Supabase Realtime WebSockets
 * for cross-channel notifications and a debounced semantic search matrix.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, ExternalLink, Bot, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface HeaderProps {
  title: string;
  session: any;
  onBotClick?: () => void;
}

interface SearchResult {
  id: string;
  customer_name: string;
  channel: string;
  phone_number?: string;
  platform_chat_id: string;
}

export default function TopHeader({ title, session, onBotClick }: HeaderProps) {
  const router = useRouter();
  const userEmail = session?.user?.email?.toLowerCase();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Notification State
  const [hasUnread, setHasUnread] = useState(false);

  // ============================================================================
  // 1. GLOBAL REALTIME NOTIFICATION MATRIX (WebSockets)
  // ============================================================================
  useEffect(() => {
    if (!userEmail) return;

    // Listen for incoming messages across all active channels for this account
    const globalNotificationSub = supabase
      .channel(`global_alerts_${userEmail}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_history",
        },
        (payload) => {
          try {
            // Validate the message belongs to the active CEO account
            if (payload.new.user_email === userEmail) {
              setHasUnread(true);
              triggerAudioAlert();
            }
          } catch (error: any) {
            console.error("[GLOBAL_REALTIME_ERROR]: Failed to parse webhook payload.", error);
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[GLOBAL_SOCKET_FAIL]: Critical failure connecting to Realtime.");
        }
      });

    return () => {
      supabase.removeChannel(globalNotificationSub);
    };
  }, [userEmail]);

  const triggerAudioAlert = () => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.6;
      audio.play();
    } catch (e: any) {
      console.warn("[AUDIO_BLOCKED]: Browser prevented notification sound.", e.message);
    }
  };

  // ============================================================================
  // 2. OMNI-CHANNEL DEBOUNCED SEARCH ENGINE
  // ============================================================================
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);

      try {
        if (!userEmail) throw new Error("Unauthenticated search attempt.");

        const { data, error } = await supabase
          .from("contacts")
          .select("id, customer_name, channel, phone_number, platform_chat_id")
          .eq("user_email", userEmail)
          .or(`customer_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,platform_chat_id.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error: any) {
        console.error("[GLOBAL_SEARCH_ERROR]: Search query failed.", error.message);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms Debounce to prevent DB overload

    return () => clearTimeout(delaySearch);
  }, [searchQuery, userEmail]);

  return (
    <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-[#111]/50 backdrop-blur-md sticky top-0 z-30">
      <div>
        <h1 className="text-2xl font-serif text-white tracking-tight">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Agent'}. Your AI fleet is active.
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {onBotClick && (
          <button
            onClick={onBotClick}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:scale-105"
          >
            <Bot className="w-4 h-4" /> DEPLOY LIVE AGENT NOW <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        )}
        
        {/* Advanced Realtime Search Bar */}
        <div className="relative hidden md:block">
          <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-full px-4 py-2 focus-within:border-blue-500 transition-colors">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-gray-500" />
            )}
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm ml-2 text-white placeholder-gray-600 w-32 focus:w-48 transition-all font-mono" 
            />
          </div>

          {/* Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute top-12 right-0 w-80 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <ul className="flex flex-col">
                  {searchResults.map((result) => (
                    <li 
                      key={result.id} 
                      className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                      onClick={() => {
                        console.log(`Routing to chat ID: ${result.platform_chat_id}`);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white font-medium truncate">
                          {result.customer_name || "Unknown Identity"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-white/10 text-gray-300">
                          {result.channel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                        {result.phone_number || result.platform_chat_id}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  {!isSearching && "No matching records found."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Notification Bell */}
        <button 
          title="Notifications" 
          onClick={() => setHasUnread(false)}
          className="relative p-2.5 bg-[#1A1A1A] border border-white/10 rounded-full hover:bg-white/10 transition-colors"
        >
          <Bell className={`w-5 h-5 ${hasUnread ? "text-orange-500 animate-pulse" : "text-gray-400"}`} />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#111]"></span>
          )}
        </button>
      </div>
    </header>
  );
}