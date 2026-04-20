import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. FETCH CAMPAIGN HISTORY (Omni-Channel)
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
            opens: "N/A", // Platforms don't officially support open rates without read-receipt webhooks
            date: new Date(camp.created_at).toLocaleDateString()
        }));

        return NextResponse.json({ success: true, campaigns: formattedCampaigns });
    } catch (error: any) {
        console.error("[BROADCAST_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. DISPATCH BROADCAST (Universal Engine: Text + Media + All Channels)
export async function POST(req: Request) {
    try {
        let { email, channel, audience, message, name } = await req.json();

        if (!email || !message || !channel) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();
        const safeChannel = channel.toLowerCase();

        // A. Get Bot Tokens for all platforms to future-proof
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, instagram_token")
            .eq("email", safeEmail)
            .single();

        if (!config) {
            return NextResponse.json({ success: false, error: "Account config not found." }, { status: 400 });
        }

        // B. MEDIA PARSER ENGINE (Extracts {{media:id}} and gets URL)
        let mediaUrl = null;
        let mediaType = null;
        const mediaMatch = message.match(/\{\{media:(.+?)\}\}/);

        if (mediaMatch) {
            const fileId = mediaMatch[1];
            
            // Fetch file details from vault
            const { data: mediaData } = await supabase
                .from("media_library")
                .select("storage_path, file_type")
                .eq("id", fileId)
                .eq("email", safeEmail)
                .single();

            if (mediaData) {
                // Get absolute public URL from bucket
                const { data: publicUrlData } = supabase.storage
                    .from("telegram_media") // Shared bucket for all channel assets
                    .getPublicUrl(mediaData.storage_path);
                
                mediaUrl = publicUrlData.publicUrl;
                mediaType = mediaData.file_type; // 'image', 'video', 'document'
            }
            
            // Remove the variable from the text message so it doesn't look ugly to the user
            message = message.replace(mediaMatch[0], "").trim();
        }

        // C. Get Target Audience (Filtered by specific channel)
        const { data: chatHistory, error: dbError } = await supabase
            .from("chat_history")
            .select("platform_chat_id, customer_name")
            .eq("email", safeEmail)
            .eq("platform", safeChannel);

        if (dbError) throw dbError;

        // Deduplicate users (We only want to send 1 message per user)
        const uniqueUsers = new Map();
        chatHistory?.forEach(row => {
            if (!uniqueUsers.has(row.platform_chat_id)) {
                uniqueUsers.set(row.platform_chat_id, row.customer_name);
            }
        });

        const usersArray = Array.from(uniqueUsers.entries());

        if (usersArray.length === 0) {
            return NextResponse.json({ success: false, error: `No subscribers found for ${safeChannel}.` }, { status: 400 });
        }

        let sentCount = 0;

        // D. UNIVERSAL DISPATCH LOOP
        for (const [chatId, customerName] of usersArray) {
            const personalizedText = message.replace(/\{\{first_name\}\}/g, customerName || "there");
            
            try {
                // 📱 --- TELEGRAM DISPATCH ---
                if (safeChannel === "telegram") {
                    if (!config.telegram_token) throw new Error("Missing Telegram Token");
                    
                    let apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendMessage`;
                    let payload: any = { chat_id: chatId, text: personalizedText || " " };

                    // If Media exists, change the API route and payload dynamically
                    if (mediaUrl) {
                        if (mediaType === "image") {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendPhoto`;
                            payload = { chat_id: chatId, photo: mediaUrl, caption: personalizedText };
                        } else if (mediaType === "video") {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendVideo`;
                            payload = { chat_id: chatId, video: mediaUrl, caption: personalizedText };
                        } else {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendDocument`;
                            payload = { chat_id: chatId, document: mediaUrl, caption: personalizedText };
                        }
                    }

                    const res = await fetch(apiUrl, {
                        method: "POST", 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) sentCount++;
                } 
                
                // 🟢 --- WHATSAPP DISPATCH (Prepared for Next Phase) ---
                else if (safeChannel === "whatsapp") {
                    if (!config.whatsapp_token) throw new Error("Missing WhatsApp Token");
                    // WhatsApp Cloud API logic will plug in here exactly like Telegram
                    // sentCount++;
                }

                // 🟣 --- INSTAGRAM DISPATCH (Prepared for Next Phase) ---
                else if (safeChannel === "instagram") {
                    if (!config.instagram_token) throw new Error("Missing Instagram Token");
                    // Instagram Graph API logic will plug in here
                    // sentCount++;
                }

                // Delay to respect platform rate limits (Crucial for bulk sending)
                await new Promise(resolve => setTimeout(resolve, 50)); 

            } catch (e) {
                console.error(`Failed to send to ${chatId} on ${safeChannel}`);
            }
        }

        // E. Save Universal Campaign History
        await supabase.from("broadcast_history").insert({
            email: safeEmail,
            platform: safeChannel,
            campaign_name: name || `${safeChannel.toUpperCase()} Broadcast`,
            status: "Completed",
            sent_count: sentCount
        });

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error("[BROADCAST_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}