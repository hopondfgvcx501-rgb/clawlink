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
            opens: "N/A",
            date: new Date(camp.created_at).toLocaleDateString()
        }));

        return NextResponse.json({ success: true, campaigns: formattedCampaigns });
    } catch (error: any) {
        console.error("[BROADCAST_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 2. DISPATCH BROADCAST (Signed URL Engine)
export async function POST(req: Request) {
    try {
        let { email, channel, audience, message, name } = await req.json();

        if (!email || !message || !channel) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();
        const safeChannel = channel.toLowerCase();

        // A. Get Bot Tokens
        const { data: config } = await supabase
            .from("user_configs")
            .select("telegram_token, whatsapp_token, instagram_token")
            .eq("email", safeEmail)
            .single();

        if (!config) {
            return NextResponse.json({ success: false, error: "Account config not found." }, { status: 400 });
        }

        // B. SECURE MEDIA PARSER ENGINE (Using Signed URLs)
        let mediaUrl = null;
        let mediaType = null;
        const mediaMatch = message.match(/\{\{media:(.+?)\}\}/);

        if (mediaMatch) {
            const fileId = mediaMatch[1];
            
            const { data: mediaData } = await supabase
                .from("media_library")
                .select("storage_path, file_type")
                .eq("id", fileId)
                .eq("email", safeEmail)
                .single();

            if (mediaData) {
                // 🔥 CRITICAL FIX: Use createSignedUrl instead of getPublicUrl. 
                // This generates a secure temporary link that works even if the bucket is fully Private!
                const { data: signedUrlData, error: signError } = await supabase.storage
                    .from("telegram_media") 
                    .createSignedUrl(mediaData.storage_path, 60 * 60); // Valid for 1 hour
                
                if (signError || !signedUrlData) {
                    return NextResponse.json({ success: false, error: "Failed to generate secure VIP link for media." }, { status: 400 });
                }

                mediaUrl = signedUrlData.signedUrl;
                mediaType = mediaData.file_type; 
            } else {
                return NextResponse.json({ success: false, error: "Attached Media not found in Vault." }, { status: 400 });
            }
            
            message = message.replace(mediaMatch[0], "").trim();
        }

        // C. Get Target Audience 
        const { data: chatHistory, error: dbError } = await supabase
            .from("chat_history")
            .select("platform_chat_id, customer_name")
            .eq("email", safeEmail)
            .eq("platform", safeChannel);

        if (dbError) throw dbError;

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
        let lastTgError = ""; 

        // D. UNIVERSAL DISPATCH LOOP
        for (const [chatId, customerName] of usersArray) {
            const personalizedText = message.replace(/\{\{first_name\}\}/g, customerName || "there");
            
            try {
                if (safeChannel === "telegram") {
                    if (!config.telegram_token) throw new Error("Missing Telegram Token");
                    
                    let apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendMessage`;
                    let payload: any = { chat_id: chatId, text: personalizedText || " " }; 

                    if (mediaUrl) {
                        const finalCaption = personalizedText || "";
                        
                        if (mediaType === "image") {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendPhoto`;
                            payload = { chat_id: chatId, photo: mediaUrl, caption: finalCaption };
                        } else if (mediaType === "video") {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendVideo`;
                            payload = { chat_id: chatId, video: mediaUrl, caption: finalCaption };
                        } else {
                            apiUrl = `https://api.telegram.org/bot${config.telegram_token}/sendDocument`;
                            payload = { chat_id: chatId, document: mediaUrl, caption: finalCaption };
                        }
                    }

                    const res = await fetch(apiUrl, {
                        method: "POST", 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    
                    if (res.ok) {
                        sentCount++;
                    } else {
                        lastTgError = await res.text();
                        console.error(`[TELEGRAM_REJECTED_API] ${chatId}:`, lastTgError);
                    }
                } 
                
                await new Promise(resolve => setTimeout(resolve, 50)); 

            } catch (e: any) {
                console.error(`Failed to send to ${chatId}:`, e.message);
            }
        }

        // Block fake success messages
        if (sentCount === 0 && usersArray.length > 0) {
             return NextResponse.json({ 
                 success: false, 
                 error: `Telegram blocked the messages. Reason: ${lastTgError || "Unknown API Error"}` 
             });
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