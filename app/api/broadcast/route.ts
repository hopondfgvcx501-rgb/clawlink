import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. FETCH CAMPAIGN HISTORY
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel");

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("broadcast_history")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("platform", channel.toLowerCase())
            .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedCampaigns = data.map((camp: any) => ({
            id: camp.id,
            name: camp.campaign_name,
            status: camp.status,
            sent: camp.sent_count,
            opens: "N/A", // Telegram doesn't officially support open rates easily without inline buttons
            date: new Date(camp.created_at).toLocaleDateString()
        }));

        return NextResponse.json({ success: true, campaigns: formattedCampaigns });
    } catch (error: any) {
        console.error("[BROADCAST_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. DISPATCH BROADCAST
export async function POST(req: Request) {
    try {
        const { email, channel, audience, message, name } = await req.json();

        if (!email || !message) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // A. Get Bot Token
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token")
            .eq("email", safeEmail)
            .single();

        if (!config || !config.telegram_token) {
            return NextResponse.json({ success: false, error: "Telegram Token not configured" }, { status: 400 });
        }

        // B. Get Subscribers (Users who have interacted with the bot)
        // We get unique chat IDs from chat_history
        const { data: chatHistory, error: dbError } = await supabase
            .from("chat_history")
            .select("platform_chat_id, customer_name")
            .eq("email", safeEmail)
            .eq("platform", "telegram");

        if (dbError) throw dbError;

        // Deduplicate users
        const uniqueUsers = new Map();
        chatHistory?.forEach(row => {
            if (!uniqueUsers.has(row.platform_chat_id)) {
                uniqueUsers.set(row.platform_chat_id, row.customer_name);
            }
        });

        const usersArray = Array.from(uniqueUsers.entries());

        if (usersArray.length === 0) {
            return NextResponse.json({ success: false, error: "No subscribers found to send messages to." }, { status: 400 });
        }

        let sentCount = 0;

        // C. Dispatch Messages (Basic Loop for now, ideal for Serverless would be queuing)
        for (const [chatId, customerName] of usersArray) {
            const personalizedMessage = message.replace(/{{first_name}}/g, customerName || "there");
            
            try {
                const res = await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: personalizedMessage })
                });

                if (res.ok) sentCount++;
                
                // Add a small delay to avoid rate limits (30 msgs/sec limit for Telegram)
                await new Promise(resolve => setTimeout(resolve, 50)); 
            } catch (e) {
                console.error(`Failed to send to ${chatId}`);
            }
        }

        // D. Save Campaign History
        await supabase.from("broadcast_history").insert({
            email: safeEmail,
            platform: "telegram",
            campaign_name: name || "Mass Broadcast",
            status: "Completed",
            sent_count: sentCount
        });

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error("[BROADCAST_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}