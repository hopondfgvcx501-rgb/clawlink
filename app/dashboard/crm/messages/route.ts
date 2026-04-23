import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { email, chatId, channel, message } = await req.json();

        // Basic validation
        if (!email || !chatId || !channel || !message) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const safeEmail = email.toLowerCase();

        // 🚀 THE MAGIC: Inject the Admin Message into the Real DB
        const { error } = await supabase.from("chat_history").insert({
            email: safeEmail,
            platform: channel,
            platform_chat_id: chatId, // This links the message to the specific user's chat
            sender_role: "admin",     // Flags it as a manual human intervention
            message: message
            // created_at is handled automatically by the DB defaults
        });

        if (error) {
            console.error("[CRM_MESSAGE_INSERT_ERROR]", error);
            throw error;
        }

        return NextResponse.json({ success: true, message: "Manual message saved to DB successfully" });

    } catch (error: any) {
        console.error("[CRM_MESSAGES_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error while saving manual reply" }, { status: 500 });
    }
}