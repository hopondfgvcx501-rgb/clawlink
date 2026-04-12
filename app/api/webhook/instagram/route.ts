import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ CORS HEADERS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// =========================================================================
// 🛡️ SECURITY LOCK: ENTERPRISE DATA SANITIZER (XSS & Injection Blocker)
// =========================================================================
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove malicious scripts
        .replace(/<[^>]*>?/gm, "") // Remove HTML tags
        .replace(/--/g, "") // Prevent SQL comment injection
        .trim();
}

const ENTERPRISE_GUARDRAIL = `
CRITICAL INSTRUCTION: You are an Enterprise AI Support Agent. 
1. ANTI-HALLUCINATION LOCK: You must ONLY use the provided Company Knowledge to answer questions. 
2. ZERO SPECULATION: If the answer is NOT explicitly written in the provided context, DO NOT guess, make up prices, or create policies.
3. HUMAN HANDOFF: If the user asks something outside the Knowledge Base, or seems frustrated/angry, reply EXACTLY with: "I apologize, but I don't have that specific information. Let me connect you with a human support agent who can help you right away."
4. TONE: Be professional, concise, and highly polite. Never argue with the customer.
`;

// =========================================================================
// 1. 🌐 GET REQUEST: META WEBHOOK VERIFICATION
// =========================================================================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === "clawlinkmeta2026") {
        console.log("[IG_WEBHOOK_VERIFICATION] Validation successful.");
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// =========================================================================
// 2. 🤖 POST REQUEST: INCOMING MESSAGES
// =========================================================================
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.object !== "instagram" && body.object !== "page") {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const entry = body.entry?.[0];
        if (!entry) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const accountId = entry.id; 

        if (entry.messaging && entry.messaging[0]) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender?.id;
            const userText = webhookEvent.message?.text;
            
            if (userText && !webhookEvent.message?.is_echo) {
                await processDynamicAI(senderId, accountId, userText, "dm", req);
            }
        }

        if (entry.changes && entry.changes[0]) {
            const change = entry.changes[0];
            if (change.field === "comments") {
                const commentValue = change.value;
                const commentId = commentValue?.id;
                const userText = commentValue?.text;
                const senderId = commentValue?.from?.id;

                if (senderId && userText && senderId !== accountId) {
                    await processDynamicAI(senderId, accountId, userText, "comment", req, commentId);
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("[IG_WEBHOOK_FATAL] Error in POST handler:", error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// =========================================================================
// 🧠 PROCESSOR: DYNAMIC AI ROUTING
// =========================================================================
async function processDynamicAI(senderId: string, accountId: string, text: string, type: "dm" | "comment", req: Request, commentId?: string) {
    const { data: config, error: dbError } = await supabase
        .from("user_configs")
        .select("*")
        .eq("instagram_account_id", accountId)
        .single();

    if (dbError || !config || !config.instagram_token) {
        console.warn(`[IG_PROCESSOR_REJECTED] Unauthorized account or missing token for ID: ${accountId}.`);
        return;
    }

    const metaApiToken = config.instagram_token.trim();

    // ==========================================
    // 🛑 THE GATEKEEPER (Plan, Expiry & Limits Check) 
    // ==========================================
    const currentPlan = (config.plan_tier || config.plan || "free").toLowerCase();

    // 1. GATEKEEPER CHECK: Free Tier or Inactive Plan
    if (currentPlan === "free" || currentPlan === "starter" || config.plan_status !== "Active") {
        console.warn(`[IG_GATEKEEPER] Unpaid or inactive account for ${config.email}. Blocking AI.`);
        const sleepMsg = "🤖 *ClawLink AI:* This agent is currently sleeping. The owner needs to activate their plan in the dashboard to enable 24/7 autonomous replies.";

        if (type === "dm") {
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: sleepMsg } })
            });
        }
        return; // HALT EXECUTION
    }

    // 2. TOKEN & EXPIRY LIMITS CHECK 
    const isUnlimited = config.is_unlimited || config.plan === "adv_max" || config.plan === "yearly";
    const tokensUsed = config.tokens_used || 0;
    const tokensAllocated = config.tokens_allocated || 10000;
    
    const expiryDate = new Date(config.plan_expiry_date);
    const isExpired = config.plan_expiry_date ? (new Date() > expiryDate) : false;

    if (isExpired || (!isUnlimited && tokensUsed >= tokensAllocated)) {
        console.warn(`[IG_LIMITS] Account limits exhausted for ${config.email}. Dropping request.`);
        const maintenanceMsg = "System Note: The AI assistant for this account is currently offline due to account limits. Please contact the administrator.";
        
        if (type === "dm") {
            await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient: { id: senderId }, message: { text: maintenanceMsg } })
            });
        }
        return; // HALT EXECUTION
    }

    // ✅ PROCEED TO AI PROCESSING (CLEANED MULTI_MODEL)
    const aiProvider = config.selected_model || "omni 3 nexus"; 
    const isOmni = aiProvider.toLowerCase().includes("omni") || aiProvider.toLowerCase().includes("nexus");
    
    // 🔥 ROUTE SELECTION
    const targetEndpoint = isOmni ? "/api/omni" : "/api/ai";

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

    const payloadData = {
        prompt: promptText,
        systemPrompt: config.system_prompt || "You are an AI Assistant for Instagram. Keep responses concise.",
        history: historyArray,
        apiKey: config.user_api_key,
        model: isOmni ? undefined : aiProvider,
        email: config.email,
        message: promptText,
        platform: "instagram",
        userPhoneOrChatId: senderId
    };

    let aiReply = "Service currently unavailable.";
    try {
        const engineRes = await fetch(`${baseUrl}${targetEndpoint}`, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${process.env.CLAWLINK_MASTER_SECRET}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(payloadData)
        });

        const engineData = await engineRes.json();
        if (engineRes.ok && engineData.reply) {
            aiReply = engineData.reply;
        }
    } catch (e) {
        console.error("[IG_PROCESSOR_ERROR] Failed to communicate with internal AI engine:", e);
    }
    
    // 🚀 DEDUCT TOKENS AFTER SUCCESSFUL AI REPLY
    const calculatedTokens = Math.ceil((promptText.length + aiReply.length) / 3);
    const updatePayload: any = { messages_used_this_month: (config.messages_used_this_month || 0) + 1 };
    if (!isUnlimited) updatePayload.tokens_used = tokensUsed + calculatedTokens;
    await supabase.from("user_configs").update(updatePayload).eq("id", config.id);

    let finalDbMessage = aiReply;

    if (type === "dm") {
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiReply } })
        });
        
        const metaResponseData = await metaRes.json();
        if (metaResponseData.error) {
             finalDbMessage = `[META_ERROR] Code: ${metaResponseData.error.code} | Msg: ${metaResponseData.error.message}`;
        }

    } else if (type === "comment") {
        await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Please check your DMs for more details." })
        });
        
        const dmRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${metaApiToken}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: { id: senderId }, message: { text: aiReply } })
        });
        const dmResponseData = await dmRes.json();
        if (dmResponseData.error) {
             finalDbMessage = `[META_ERROR] Code: ${dmResponseData.error.code} | Msg: ${dmResponseData.error.message}`;
        }
    }

    await supabase.from("chat_history").insert([
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "user", message: text },
        { email: config.email, platform: "instagram", platform_chat_id: senderId, sender_type: "bot", message: finalDbMessage }
    ]);
}