import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🛡️ Bypassing Meta Timeouts: Edge runtime is fast, but we ensure quick responses.
export const maxDuration = 45; 

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ==========================================
// 1. GET: Meta Webhook Verification (The Main Gate)
// ==========================================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Standard verification for ClawLink International Users
    if (mode === "subscribe" && token === "clawlinkmeta2026") {
        console.log("✅ [IG-WEBHOOK] Meta Verification Success!");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// ==========================================
// 2. POST: The 98% Compliant Traffic Handler
// ==========================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 🛡️ META COMPLIANCE: If it's not a valid entry, ignore immediately.
        if (body.object !== "instagram" && body.object !== "page") {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const entry = body.entry?.[0];
        if (!entry) return NextResponse.json({ success: true }, { status: 200 });

        const accountId = entry.id; // The B2B Client's Instagram Account ID

        // 🟢 SCENARIO A: Direct Messages (DMs)
        if (entry.messaging && entry.messaging[0]) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;
            const userText = webhookEvent.message?.text;

            // Ignore echoes or empty messages to save API cost
            if (!userText || webhookEvent.message?.is_echo) {
                return NextResponse.json({ success: true }, { status: 200 });
            }

            // Fire and Forget pattern (Bypasses Meta 20s limit)
            processDynamicAI(senderId, accountId, userText, "dm", req).catch(console.error);
        }

        // 🔵 SCENARIO B: Post Comments (Auto-DM Trigger)
        if (entry.changes && entry.changes[0]) {
            const change = entry.changes[0].value;
            if (change.item === "comment" && change.verb === "add") {
                const commentId = change.id;
                const userText = change.text;
                const senderId = change.from?.id;

                // Ignore if the bot itself commented
                if (senderId === accountId || !userText) {
                     return NextResponse.json({ success: true }, { status: 200 });
                }

                processDynamicAI(senderId, accountId, userText, "comment", req, commentId).catch(console.error);
            }
        }

        // 🛡️ META RULE 1: ALWAYS RETURN 200 OK INSTANTLY!
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("🚨 [IG-WEBHOOK] Fatal Error:", error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// ==========================================
// 🧠 3. THE DYNAMIC ENGINE ROUTER (Global Logic)
// ==========================================
async function processDynamicAI(senderId: string, accountId: string, text: string, type: "dm" | "comment", req: Request, commentId?: string) {
    console.log(`⚡ [IG-PROCESSOR] Intercepted ${type} from ${senderId}`);

    // 1. Identify B2B Client in Database
    const { data: config } = await supabase
        .from("user_configs")
        .select("*")
        .eq("whatsapp_phone_id", accountId)
        .single();

    if (!config || !config.telegram_token) {
        console.error("❌ [IG-PROCESSOR] Unregistered Account ID:", accountId);
        return;
    }

    const metaApiToken = config.telegram_token;
    
    // 🔄 DYNAMIC ROUTING LOGIC (The Founder's Masterstroke)
    const aiProvider = config.ai_provider || "multi_model"; 
    const isOmni = aiProvider === "multi_model";
    const targetEndpoint = isOmni ? "/api/omni" : "/api/ai";

    console.log(`🧭 [IG-ROUTER] Routing to: ${targetEndpoint} (Model: ${aiProvider})`);

    // 2. Fetch Client's AI Memory (Last 10 messages)
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

    // 3. Trigger The Selected AI Engine
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const baseUrl = `${protocol}://${host}`;

    const engineRes = await fetch(`${baseUrl}${targetEndpoint}`, {
        method: "POST",
        headers: { 
            "Authorization": `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({
            prompt: type === "comment" ? `User commented on a post: "${text}". Reply to them to check their DM.` : text,
            systemPrompt: config.system_prompt || "You are an Enterprise AI Agent for Instagram. Be concise, use emojis.",
            history: historyArray,
            apiKey: config.user_api_key,
            model: isOmni ? undefined : aiProvider // Send specific model to /api/ai
        })
    });

    const engineData = await engineRes.json();
    const aiReply = engineData.reply || "I'm currently undergoing maintenance. Be back shortly!";

    // 4. Send Response via Meta Graph API v18.0
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
        // Reply publicly to comment
        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Check your DM! I've sent you the details right now. 🚀" })
        });
        // Send actual response to DM
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: aiReply }
            })
        });
    }

    // 5. Save everything to Supabase for Memory & Analytics
    await supabase.from("chat_history").insert([
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "user", message: text },
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "bot", message: aiReply }
    ]);
    
    console.log("✅ [IG-PROCESSOR] Flow Complete.");
}