import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // 1. 🔒 DIRECT DATABASE FETCH FOR STRICT MODEL & CHANNEL SYNC
        // (Added ai_provider, telegram_token, whatsapp_token so Dashboard can read them)
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("tokens_used, tokens_allocated, is_unlimited, selected_model, ai_provider, telegram_token, whatsapp_token")
            .eq("email", email)
            .single();

        if (configErr || !config) {
            return NextResponse.json({ success: false, error: "Config not found" }, { status: 404 });
        }

        // 2. Fetch Total Unique Leads (Customers)
        const { data: chats } = await supabase
            .from("chat_history")
            .select("platform_chat_id, platform, created_at")
            .eq("email", email);

        const chatData = chats || [];
        const uniqueLeads = new Set(chatData.map(c => c.platform_chat_id)).size;

        // 3. Platform Distribution
        const telegramCount = chatData.filter(c => c.platform === "telegram").length;
        const whatsappCount = chatData.filter(c => c.platform === "whatsapp").length;
        const webCount = chatData.filter(c => c.platform === "web").length;

        // 4. Generate Chart Data (Last 7 Days Activity)
        const chartDataMap: Record<string, number> = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            chartDataMap[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
        }

        chatData.forEach(msg => {
            const dateStr = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (chartDataMap[dateStr] !== undefined) {
                chartDataMap[dateStr]++;
            }
        });

        const chartData = Object.keys(chartDataMap).map(date => ({
            name: date,
            messages: chartDataMap[date]
        }));

        // 5. 🚀 RETURN STRICT DATA TO DASHBOARD UI
        return NextResponse.json({
            success: true,
            data: {
                tokensUsed: config.tokens_used || 0,
                tokensAllocated: config.is_unlimited ? "Unlimited" : (config.tokens_allocated || 0),
                isUnlimited: config.is_unlimited || false,
                activeModel: config.selected_model || "Not Set",
                aiProvider: config.ai_provider || "Not Set", // Passed exactly to fix Dashboard issue
                hasTelegram: !!config.telegram_token,        // Live Channel Indicator
                hasWhatsapp: !!config.whatsapp_token,        // Live Channel Indicator
                totalLeads: uniqueLeads,
                platformStats: { telegram: telegramCount, whatsapp: whatsappCount, web: webCount },
                chartData
            }
        });

    } catch (error: any) {
        console.error("Analytics API Master Error:", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}