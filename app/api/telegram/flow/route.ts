import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 1. FETCH SAVED FLOW FOR USER
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const safeEmail = email.toLowerCase();

        // 📝 We fetch the saved JSON from user_configs table. 
        // If it doesn't exist, we just return empty so the UI shows the default start node.
        const { data: config, error } = await supabase
            .from("user_configs")
            .select("telegram_flow_data")
            .eq("email", safeEmail)
            .single();

        if (error) {
            console.error("[FLOW_FETCH_ERROR]", error.message);
            return NextResponse.json({ success: false, error: "Failed to load flow data." }, { status: 500 });
        }

        // Check if there is data saved
        if (config?.telegram_flow_data) {
             return NextResponse.json({ 
                success: true, 
                data: config.telegram_flow_data 
            });
        } else {
             // Return success with empty data to trigger the default fallback node on frontend
             return NextResponse.json({ 
                success: true, 
                data: { nodes: [], edges: [] } 
            });
        }

    } catch (error: any) {
        console.error("[FLOW_API_FATAL]", error.message);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}

// 🚀 2. SAVE FLOW JSON PAYLOAD TO DB
export async function POST(req: Request) {
    try {
        const payload = await req.json();

        if (!payload.email || !payload.nodes) {
            return NextResponse.json({ success: false, error: "Missing required payload data" }, { status: 400 });
        }

        const safeEmail = payload.email.toLowerCase();

        // The flow UI sends an object with `nodes` and `edges` arrays.
        // We save this entire JSON object into the user_configs table.
        const flowDataToSave = {
            nodes: payload.nodes,
            edges: payload.edges || []
        };

        const { error } = await supabase
            .from("user_configs")
            .update({ telegram_flow_data: flowDataToSave })
            .eq("email", safeEmail);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[FLOW_POST_ERROR]", error.message);
        return NextResponse.json({ success: false, error: "Failed to save flow to database" }, { status: 500 });
    }
}