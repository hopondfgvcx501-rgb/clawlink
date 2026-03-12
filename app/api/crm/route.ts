import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });

        // Fetch last 500 messages to build the CRM Inbox
        const { data, error } = await supabase
            .from("bot_conversations")
            .select("*")
            .eq("bot_email", email)
            .order("created_at", { ascending: true });

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("CRM Fetch Error:", error.message);
        return NextResponse.json({ success: false, error: "Failed to fetch CRM data" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, chatId, message } = body;

        if (!email || !chatId || !message) {
            return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
        }

        // 1. Fetch user config to get Bot Token
        const { data: config, error: configErr } = await supabase
            .from("user_configs")
            .select("telegram_token")
            .eq("email", email)
            .single();

        if (configErr || !config) throw new Error("Configuration not found.");

        // 2. Save the Human Message to the AI Memory Database
        // We save it as role: "human" so the AI knows the business owner replied, not the customer.
        await supabase.from("bot_conversations").insert({
            bot_email: email,
            chat_id: chatId,
            role: "human", 
            content: message
        });

        // 3. Send Manual Message via Telegram API
        if (config.telegram_token) {
            await fetch(`https://api.telegram.org/bot${config.telegram_token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `🧑‍💻 *Support Agent:*\n${message}`, parse_mode: "Markdown" })
            });
        }

        return NextResponse.json({ success: true, message: "Manual reply dispatched successfully." });

    } catch (error: any) {
        console.error("CRM Send Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}