import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// Secure Supabase Init
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch Active Growth Tools on Page Load
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from('instagram_growth_tools')
      .select('tools')
      .eq('email', token.email.toLowerCase())
      .single();

    // PGRST116 means no rows returned (user hasn't saved tools yet), which is fine.
    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ success: true, tools: data?.tools || null }); 
  } catch (error: any) {
    console.error("[GROWTH_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 🚀 PUT: Save Tool State (On/Off) to Database
export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { tools } = await req.json();

    // Upsert will create a new row if email doesn't exist, or update if it does
    const { error } = await supabase
      .from('instagram_growth_tools')
      .upsert({ 
          email: token.email.toLowerCase(), 
          tools: tools,
          updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Growth tools synced securely." });
  } catch (error: any) {
    console.error("[GROWTH_PUT_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}