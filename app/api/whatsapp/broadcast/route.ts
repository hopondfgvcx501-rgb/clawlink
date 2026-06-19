import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendErrorToTG(errorMsg: string) {
    const { TG_BOT_TOKEN, TG_ADMIN_ID } = process.env;
    if (!TG_BOT_TOKEN || !TG_ADMIN_ID) return;
    try {
        await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_ADMIN_ID, text: `🚨 BROADCAST ERROR:\n\n${errorMsg}` })
        });
    } catch (e) {}
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email")?.toLowerCase();
        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data: campaigns, error } = await supabase.from("campaigns")
            .select("*").eq("email", email).eq("platform", "whatsapp").order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, campaigns });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { email, audience, template, name, status, scheduled_at, variables } = await req.json();
        const cleanEmail = email.toLowerCase();

        // 1. Fetch User Config (WhatsApp Token and Phone ID)
        const { data: config } = await supabase.from("user_configs")
            .select("whatsapp_token, whatsapp_phone_id").eq("email", cleanEmail).single();

        if (!config?.whatsapp_token || !config?.whatsapp_phone_id) {
            throw new Error("WhatsApp Cloud API not configured for this account.");
        }

        // 2. Fetch Audience Contacts
        const { data: contacts } = await supabase.from("contacts")
            .select("phone_number").eq("user_email", cleanEmail).eq("channel", "whatsapp");

        if (!contacts || contacts.length === 0) throw new Error("No contacts found in CRM to broadcast.");

        // 3. REAL DISPATCH (Meta Cloud API)
        if (status === "Sent") {
            for (const contact of contacts) {
                await fetch(`https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${config.whatsapp_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: contact.phone_number,
                        type: "template",
                        template: { name: template, language: { code: "en_US" } }
                    })
                });
            }
        }

        // 4. LOG TO DB
        const { error: logErr } = await supabase.from("campaigns").insert({
            email: cleanEmail, platform: "whatsapp", name, audience, template, status,
            sent: contacts.length, scheduled_at, opens: "0%"
        });

        if (logErr) throw logErr;
        return NextResponse.json({ success: true });

    } catch (error: any) {
        await sendErrorToTG(error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email")?.toLowerCase();
    await supabase.from("campaigns").delete().eq("id", id).eq("email", email);
    return NextResponse.json({ success: true });
}