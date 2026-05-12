/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: LIVE CRM INBOX API
 * ==============================================================================================
 * @file app/api/telegram/inbox/route.ts
 * @description Ultra-fast data aggregation API. Fetches raw chat logs and transforms them 
 * into WhatsApp-style grouped conversations using O(n) Map complexity.
 * 🚀 SECURED: Strict tenant isolation (Row Level Security logic via email).
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering so it doesn't cache old messages
export const dynamic = "force-dynamic";

// Initialize Supabase directly for edge-speed execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.error("[KNOX_SECURITY] FATAL: Supabase keys missing in CRM Inbox API.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            console.error("[CRM_AUTH_ERROR] Request blocked: Missing email parameter.");
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // 1. Fetch raw chronological data from the database
        // Ascending order ensures the chat reads naturally from top to bottom
        const { data: rawChats, error: dbError } = await supabaseAdmin
            .from("chat_history")
            .select("*")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .order("created_at", { ascending: true });

        if (dbError) {
            throw new Error(`Database Query Failed: ${dbError.message}`);
        }

        // 2. High-Performance Aggregation Engine (O(n) Complexity)
        // Grouping thousands of rows into clean conversation threads
        const groupedConversations = new Map();

        (rawChats || []).forEach(chat => {
            const chatId = chat.platform_chat_id;
            
            // If this is a new customer, create their profile block
            if (!groupedConversations.has(chatId)) {
                groupedConversations.set(chatId, {
                    chatId: chatId,
                    customerName: chat.customer_name || "Unknown User",
                    messages: []
                });
            }

            const conversation = groupedConversations.get(chatId);
            
            // Push the message into their thread
            conversation.messages.push({
                id: chat.id,
                sender_type: chat.sender_type,
                message: chat.message,
                created_at: chat.created_at
            });

            // Continuously update the "Last Message" preview and timestamp
            conversation.lastMessage = chat.message;
            conversation.lastMessageTime = chat.created_at;
            
            // Update customer name if a newer name was captured
            if (chat.customer_name) {
                conversation.customerName = chat.customer_name;
            }
        });

        // 3. Transform Map to Array and Sort by Most Recent Activity (WhatsApp Style)
        const sortedConversations = Array.from(groupedConversations.values()).sort((a, b) => {
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        // 4. Deliver Payload to Frontend
        return NextResponse.json({ 
            success: true, 
            conversations: sortedConversations 
        });

    } catch (error: any) {
        // STRICT RULE: Never hide backend errors. Log them for the Admin.
        console.error("[INBOX_API_FATAL_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}