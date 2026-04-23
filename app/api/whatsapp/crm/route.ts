import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch all CRM Contacts
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { data, error } = await supabase
            .from("crm_contacts")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("platform", "whatsapp")
            .order("last_active", { ascending: false });

        if (error) throw error;

        const formattedContacts = (data || []).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            status: c.status,
            labels: c.labels || [],
            lastActive: new Date(c.last_active).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        }));

        return NextResponse.json({ success: true, contacts: formattedContacts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 POST: Manually Add New Contact
export async function POST(req: Request) {
    try {
        const { email, name, phone, status, labels } = await req.json();

        if (!email || !phone) return NextResponse.json({ success: false, error: "Phone and Email required" }, { status: 400 });

        const { error } = await supabase.from("crm_contacts").upsert({
            email: email.toLowerCase(),
            platform: "whatsapp",
            name: name || "WA User",
            phone: phone,
            status: status || "Active",
            labels: labels || [],
            last_active: new Date().toISOString()
        }, { onConflict: 'email,platform,phone' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}