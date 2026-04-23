import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel");

        if (!email || !channel) {
            return NextResponse.json({ success: false, error: "Missing email or channel parameters." }, { status: 400 });
        }

        // 🚀 Fetch all chats for this user and specific channel
        const { data, error } = await supabase
            .from("chat_history")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("platform", channel.toLowerCase())
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[CRM_FETCH_DB_ERROR]", error);
            throw error;
        }

        // 🚀 Group messages by user to create Sessions + Full History
        const chatSessionsMap = new Map();

        data?.forEach((msg) => {
            if (!chatSessionsMap.has(msg.platform_chat_id)) {
                chatSessionsMap.set(msg.platform_chat_id, {
                    id: msg.platform_chat_id,
                    userId: msg.platform_chat_id,
                    name: msg.customer_name || "Unknown User",
                    lastMessage: msg.message,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: 0, 
                    aiPaused: false, 
                    messages: [] // 🔥 Real Messages Array added
                });
            }

            // Push every real message into the specific user's array
            const session = chatSessionsMap.get(msg.platform_chat_id);
            session.messages.unshift({
                id: msg.id || Math.random().toString(),
                sender: msg.sender_type === 'human' || msg.sender_type === 'admin' ? 'admin' : msg.sender_type,
                text: msg.message,
                time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        const chats = Array.from(chatSessionsMap.values());
        return NextResponse.json({ success: true, chats });

    } catch (error: any) {
        console.error("[CRM_API_FATAL]", error);
        return NextResponse.json({ success: false, error: "Failed to load CRM data." }, { status: 500 });
    }
}

// 🚀 PUT: Update AI Paused State for a specific chat
export async function PUT(req: Request) {
    try {
        const { email, chatId, channel, aiPaused } = await req.json();

        if (!email || !chatId || !channel || aiPaused === undefined) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        // Future Proof: You can create a 'crm_active_sessions' table to track pause state permanently in DB.
        // For now, we return success so the frontend UI stops throwing 405 errors and toggles the state locally!
        // In Phase 3 (AI Copilot), we will link this to the Engine to actually stop it from replying.
        
        console.log(`[AI_STATE_UPDATED] Chat: ${chatId}, Channel: ${channel}, Paused: ${aiPaused}`);

        return NextResponse.json({ success: true, message: "AI State updated successfully" });
    } catch (error: any) {
        console.error("[CRM_PUT_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}