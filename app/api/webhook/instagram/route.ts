import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 45;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === "clawlinkmeta2026") {
        console.log("[IG-WEBHOOK] Verification successful.");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 🚀 ENHANCED LOGGING
        console.log("================ IG WEBHOOK TRIGGERED ================");
        console.log("[IG-WEBHOOK] Full Payload:", JSON.stringify(body, null, 2));

        if (body.object !== "instagram" && body.object !== "page") {
            console.log("[IG-WEBHOOK] Object is not instagram/page. Ignoring.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const entry = body.entry?.[0];
        if (!entry) {
            console.log("[IG-WEBHOOK] No entry found. Ignoring.");
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const accountId = entry.id; 
        console.log(`[IG-WEBHOOK] Extracted Account ID: ${accountId}`);

        // SCENARIO A: Direct Messages
        if (entry.messaging && entry.messaging[0]) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message?.text;
            
            console.log(`[IG-WEBHOOK] Processing DM from ${senderId}. Text: "${userText}"`);

            if (userText && !webhookEvent.message?.is_echo) {
                // FIXED: Added await to prevent Vercel from killing the background process
                await processDynamicAI(senderId, accountId, userText, "dm", req);
            } else {
                 console.log("[IG-WEBHOOK] Message is an echo or empty. Ignoring.");
            }
        }

        // SCENARIO B: Post Comments
        if (entry.changes && entry.changes[0]) {
            const change = entry.changes[0];
            
            if (change.field === "comments") {
                const commentValue = change.value;
                const commentId = commentValue?.id;
                const userText = commentValue?.text;
                const senderId = commentValue?.from?.id;

                console.log(`[IG-WEBHOOK] Processing Comment from ${senderId}. Text: "${userText}"`);

                if (senderId && userText && senderId !== accountId) {
                    // FIXED: Added await to prevent Vercel from killing the background process
                    await processDynamicAI(senderId, accountId, userText, "comment", req, commentId);
                } else {
                     console.log("[IG-WEBHOOK] Comment is from bot itself or missing text. Ignoring.");
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("[IG-WEBHOOK] Fatal Error in POST handler:", error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

async function processDynamicAI(senderId: string, accountId: string, text: string, type: "dm" | "comment", req: Request, commentId?: string) {
    console.log(`[IG-PROCESSOR] Intercepted ${type} from user ${senderId} to account ${accountId}`);

    const { data: config, error: dbError } = await supabase
        .from("user_configs")
        .select("*")
        .eq("instagram_account_id", accountId)
        .single();

    if (dbError) {
        console.error(`[IG-PROCESSOR] Database Error querying account ID ${accountId}:`, dbError);
        return;
    }

    if (!config) {
        console.error(`[IG-PROCESSOR] Unregistered Account ID: ${accountId}. Did not find match in DB.`);
        return;
    }

    if (!config.instagram_token) {
        console.error(`[IG-PROCESSOR] Match found for ${accountId}, but instagram_token is missing.`);
        return;
    }

    const metaApiToken = config.instagram_token; 
    
    const aiProvider = config.selected_model || "multi_model"; 
    const isOmni = aiProvider === "multi_model" || aiProvider === "omni";
    const targetEndpoint = isOmni ? "/api/omni" : "/api/ai";

    console.log(`[IG-ROUTER] Routing traffic to endpoint: ${targetEndpoint} using model: ${aiProvider}`);

    const { data: history } = await supabase
        .from("chat_history")
        .select("sender_type, message")
        .eq("platform_chat_id", senderId)
        .order("created_at", { ascending: false })
        .limit(10);

    const historyArray = (history || []).reverse().map(c => ({
        role: c.sender_type === "bot" ? "assistant" : "user",
        content: c.message || " "
    }));

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    const promptText = type === "comment" 
        ? `A user commented on an Instagram post: "${text}". Reply to them concisely and advise them to check their DMs.` 
        : text;

    console.log(`[IG-ROUTER] Triggering AI Engine with prompt: "${promptText}"`);

    // FIXED: Unified Payload Matrix to support BOTH /api/omni and /api/ai endpoints seamlessly
    const payloadData = {
        // Fields for Omni Engine
        prompt: promptText,
        systemPrompt: config.system_prompt || "You are an AI Assistant for Instagram. Keep responses concise.",
        history: historyArray,
        apiKey: config.user_api_key,
        model: isOmni ? undefined : aiProvider,
        
        // Fields for Standard AI Engine
        email: config.email,
        message: promptText,
        platform: "instagram",
        userPhoneOrChatId: senderId
    };

    const engineRes = await fetch(`${baseUrl}${targetEndpoint}`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify(payloadData)
    });

    const engineData = await engineRes.json();
    const aiReply = engineData.reply || "Service currently unavailable.";
    
    console.log(`[IG-ROUTER] AI Engine returned reply: "${aiReply}"`);

    // FIXED: Capturing and logging Meta Graph API response for deep debugging
    if (type === "dm") {
        console.log(`[IG-PROCESSOR] Attempting to send DM back to user via Meta Graph API...`);
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: aiReply }
            })
        });
        
        const metaResponseData = await metaRes.json();
        console.log(`[IG-PROCESSOR] Meta Graph API Response Data:`, JSON.stringify(metaResponseData, null, 2));

    } else if (type === "comment") {
        console.log(`[IG-PROCESSOR] Attempting to reply to comment and send DM...`);
        
        const commentRes = await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Please check your DMs for more details." })
        });
        const commentResponseData = await commentRes.json();
        console.log(`[IG-PROCESSOR] Meta Comment API Response:`, JSON.stringify(commentResponseData));
        
        const dmRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: aiReply }
            })
        });
        const dmResponseData = await dmRes.json();
        console.log(`[IG-PROCESSOR] Meta Follow-up DM API Response:`, JSON.stringify(dmResponseData));
    }

    await supabase.from("chat_history").insert([
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "user", message: text },
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "bot", message: aiReply }
    ]);
    
    console.log("[IG-PROCESSOR] Workflow executed successfully.");
}