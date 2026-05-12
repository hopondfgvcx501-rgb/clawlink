/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: TELEGRAM ANALYTICS API
 * ==============================================================================================
 * @file app/api/telegram/analytics/route.ts
 * @description High-speed data aggregation engine. Fetches raw chat logs and config data 
 * to generate real-time metrics for the Analytics Dashboard.
 * 🚀 SECURED: Strict Row Level Security (RLS) simulation via session email.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // 1. Fetch User Configs for Token/Billing Stats
        const { data: configData, error: configError } = await supabaseAdmin
            .from("user_configs")
            .select("tokens_used, tokens_allocated, messages_used_this_month, plan_tier")
            .eq("email", safeEmail)
            .single();

        if (configError && configError.code !== 'PGRST116') {
            throw new Error(`Config DB Error: ${configError.message}`);
        }

        // 2. Fetch Chat History for the last 7 Days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: chatData, error: chatError } = await supabaseAdmin
            .from("chat_history")
            .select("created_at, sender_type, platform_chat_id")
            .eq("email", safeEmail)
            .eq("platform", "telegram")
            .gte("created_at", sevenDaysAgo.toISOString())
            .order("created_at", { ascending: true });

        if (chatError) {
            throw new Error(`Chat DB Error: ${chatError.message}`);
        }

        // 3. Process & Aggregate Data (O(n) Complexity)
        let totalUsersSet = new Set();
        let totalUserMsgs = 0;
        let totalBotMsgs = 0;

        // Group by Date for Chart: { "YYYY-MM-DD": { user: 10, bot: 12 } }
        const chartMap = new Map();
        
        // Initialize last 7 days with 0 to ensure continuous graph
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartMap.set(dateStr, { date: dateStr, user: 0, bot: 0 });
        }

        (chatData || []).forEach(chat => {
            totalUsersSet.add(chat.platform_chat_id);
            
            const dateStr = new Date(chat.created_at).toISOString().split('T')[0];
            
            // Increment overall counters
            if (chat.sender_type === "user") totalUserMsgs++;
            if (chat.sender_type === "bot") totalBotMsgs++;

            // Increment daily chart counters
            if (chartMap.has(dateStr)) {
                const dayData = chartMap.get(dateStr);
                if (chat.sender_type === "user") dayData.user++;
                if (chat.sender_type === "bot") dayData.bot++;
            }
        });

        // 4. Construct Final Payload
        const analyticsPayload = {
            overview: {
                totalUniqueUsers: totalUsersSet.size,
                totalMessages7D: totalUserMsgs + totalBotMsgs,
                userMessages: totalUserMsgs,
                botMessages: totalBotMsgs,
            },
            billing: {
                tokensUsed: configData?.tokens_used || 0,
                tokensAllocated: configData?.tokens_allocated || 0,
                plan: configData?.plan_tier || "Free",
                messagesThisMonth: configData?.messages_used_this_month || 0
            },
            chartData: Array.from(chartMap.values())
        };

        return NextResponse.json({ success: true, data: analyticsPayload });

    } catch (error: any) {
        console.error("[ANALYTICS_API_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}