import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 1. GET: Load Saved Flow into Canvas
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const channel = searchParams.get("channel") || "telegram";

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase(); 

        const { data, error } = await supabase
            .from("flow_builder_configs")
            .select("nodes, edges")
            .eq("email", safeEmail)
            .eq("channel", channel)
            .single(); // Only one master flow per channel per user for now

        // If no flow found, it's fine, return empty so canvas loads defaults
        if (error && error.code !== 'PGRST116') { 
            throw error;
        }

        return NextResponse.json({ 
            success: true, 
            data: data || { nodes: [], edges: [] } 
        });

    } catch (error: any) {
        console.error("[FLOW_GET_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 2. POST: Save Canvas to Database
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, channel, nodes, edges } = body;

        if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const safeEmail = email.toLowerCase();

        // UPSERT: Update if exists, Insert if new
        const { error } = await supabase
            .from("flow_builder_configs")
            .upsert({
                email: safeEmail,
                channel: channel || "telegram",
                nodes: nodes,   // Saved as JSONB in Supabase
                edges: edges,   // Saved as JSONB in Supabase
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'email, channel' // Assumes you have a unique constraint on email+channel
            });

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Flow saved successfully" });

    } catch (error: any) {
        console.error("[FLOW_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}