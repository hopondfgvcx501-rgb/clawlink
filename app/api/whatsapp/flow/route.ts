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

        const { data: config, error } = await supabase
            .from("user_configs")
            .select("whatsapp_flow_data")
            .eq("email", email.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error; 

        const flowData = config?.whatsapp_flow_data || { nodes: [], edges: [] };
        return NextResponse.json({ success: true, data: flowData });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { email, nodes, edges } = await req.json();

        if (!email) return NextResponse.json({ success: false, error: "Missing Email" }, { status: 400 });

        const flowData = { nodes: nodes || [], edges: edges || [] };

        const { error } = await supabase
            .from("user_configs")
            .update({ whatsapp_flow_data: flowData })
            .eq("email", email.toLowerCase());

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}