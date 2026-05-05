import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch Active Automations & Global Settings
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'instagram'; // Default to Instagram

    // 🚀 Fetch from Real Database
    const { data, error } = await supabase
      .from('automations')
      .select('rules, settings')
      .eq('email', email)
      .eq('channel', channel)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "Row not found" error
        throw error;
    }

    // Default settings if empty
    const defaultSettings = { storyMentions: true, autoLikeComments: true };

    return NextResponse.json({ 
        success: true, 
        rules: data?.rules || [], 
        settings: data?.settings || defaultSettings 
    });

  } catch (error: any) {
    console.error("[AUTOMATION_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save/Deploy New Automations
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const userEmail = token.email.toLowerCase();
    const { email, channel, rules, settings } = await req.json();

    // Security check to ensure user isn't overriding someone else's data
    if (email.toLowerCase() !== userEmail) {
        return NextResponse.json({ success: false, error: "Email mismatch security trigger." }, { status: 403 });
    }

    // 🚀 Upsert into Database (Update if exists, Insert if new)
    const { error } = await supabase
      .from('automations')
      .upsert({
          email: userEmail,
          channel: channel || 'instagram',
          rules: rules,
          settings: settings,
          updated_at: new Date().toISOString()
      }, { onConflict: 'email, channel' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Automations saved successfully." });
  } catch (error: any) {
    console.error("[AUTOMATION_POST_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}