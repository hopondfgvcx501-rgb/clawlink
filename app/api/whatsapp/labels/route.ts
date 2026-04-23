import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // 1. Fetch Labels
        const { data: labels, error: labelsErr } = await supabase
            .from("crm_labels")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("platform", "whatsapp")
            .order("created_at", { ascending: false });

        if (labelsErr) throw labelsErr;

        // 2. Fetch Contacts to calculate how many people have this label
        const { data: contacts, error: contactsErr } = await supabase
            .from("crm_contacts")
            .select("labels")
            .eq("email", email.toLowerCase())
            .eq("platform", "whatsapp");

        if (contactsErr) throw contactsErr;

        // Calculate dynamic counts
        const formattedLabels = (labels || []).map(label => {
            const count = (contacts || []).filter(c => (c.labels || []).includes(label.name)).length;
            return {
                id: label.id,
                name: label.name,
                color: label.color,
                userCount: count
            };
        });

        return NextResponse.json({ success: true, labels: formattedLabels });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { email, name, color } = await req.json();

        if (!email || !name || !color) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        const { error } = await supabase.from("crm_labels").insert({
            email: email.toLowerCase(),
            platform: "whatsapp",
            name: name.trim(),
            color: color
        });

        if (error) {
            if (error.code === '23505') return NextResponse.json({ success: false, error: "Label name already exists" }, { status: 400 });
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { email, labelId } = await req.json();

        if (!email || !labelId) return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });

        const { error } = await supabase
            .from("crm_labels")
            .delete()
            .eq("email", email.toLowerCase())
            .eq("id", labelId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}