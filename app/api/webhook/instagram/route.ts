import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bypassing timeouts: Edge runtime is fast, but we ensure quick responses.
export const maxDuration = 45;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// 1. GET: Webhook Verification
// ==========================================
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

// ==========================================
// 2. POST: Traffic Handler
// ==========================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("[IG-WEBHOOK] Incoming payload:", JSON.stringify(body, null, 2));

        if (body.object !== "instagram" && body.object !== "page") {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const entry = body.entry?.[0];
        if (!entry) return NextResponse.json({ success: true }, { status: 200 });

        const accountId = entry.id; // The 15-digit Instagram Account ID

        // SCENARIO A: Direct Messages
        if (entry.messaging && entry.messaging[0]) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message?.text;

            if (userText && !webhookEvent.message?.is_echo) {
                processDynamicAI(senderId, accountId, userText, "dm", req).catch(console.error);
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

                if (senderId && userText && senderId !== accountId) {
                    processDynamicAI(senderId, accountId, userText, "comment", req, commentId).catch(console.error);
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("[IG-WEBHOOK] Fatal Error:", error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// ==========================================
// 3. Dynamic Engine Router
// ==========================================
async function processDynamicAI(senderId: string, accountId: string, text: string, type: "dm" | "comment", req: Request, commentId?: string) {
    console.log(`[IG-PROCESSOR] Intercepted ${type} from user ${senderId}`);

    // 🔥 ISOLATED ARCHITECTURE: Searching only in the dedicated Instagram column
    const { data: config, error: dbError } = await supabase
        .from("user_configs")
        .select("*")
        .eq("instagram_account_id", accountId)
        .single();

    if (dbError || !config || !config.instagram_token) {
        console.error(`[IG-PROCESSOR] Unregistered Account ID or missing token: ${accountId}`);
        return;
    }

    const metaApiToken = config.instagram_token; 
    
    // Dynamic routing logic
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

    const engineRes = await fetch(`${baseUrl}${targetEndpoint}`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({
            prompt: promptText,
            systemPrompt: config.system_prompt || "You are an AI Assistant for Instagram. Keep responses concise.",
            history: historyArray,
            apiKey: config.user_api_key,
            model: isOmni ? undefined : aiProvider 
        })
    });

    const engineData = await engineRes.json();
    const aiReply = engineData.reply || "Service currently unavailable. Please try again later.";

    if (type === "dm") {
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: aiReply }
            })
        });
    } else if (type === "comment") {
        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Please check your DMs for more details." })
        });
        
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: aiReply }
            })
        });
    }

    await supabase.from("chat_history").insert([
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "user", message: text },
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "bot", message: aiReply }
    ]);
    
    console.log("[IG-PROCESSOR] Workflow executed successfully.");
}