import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch Saved Flow (Nodes & Edges) for the canvas
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'instagram';

    // 🚀 Fetch exact nodes and edges from Database
    const { data, error } = await supabase
      .from('flow_builder_configs')
      .select('nodes, edges')
      .eq('email', email)
      .eq('channel', channel)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore Row Not Found (New user)

    return NextResponse.json({ 
        success: true, 
        data: {
           nodes: data?.nodes || [], 
           edges: data?.edges || []
        }
    });

  } catch (error: any) {
    console.error("[FLOW_BUILDER_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save visual flow configuration to the Database
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const userEmail = token.email.toLowerCase();
    const { email, channel, nodes, edges } = await req.json();

    if (email.toLowerCase() !== userEmail) {
        return NextResponse.json({ success: false, error: "Security Mismatch" }, { status: 403 });
    }

    // 🚀 Upsert Flow Data safely into DB
    const { error } = await supabase
      .from('flow_builder_configs')
      .upsert({
          email: userEmail,
          channel: channel || 'instagram',
          nodes: nodes,
          edges: edges,
          updated_at: new Date().toISOString()
      }, { onConflict: 'email, channel' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Flow compiled and saved successfully." });
  } catch (error: any) {
    console.error("[FLOW_BUILDER_POST_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}