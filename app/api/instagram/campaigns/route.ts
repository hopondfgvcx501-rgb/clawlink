import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch Campaign Logs from DB
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();

    // 🚀 Fetch from Real Database
    const { data: logs, error } = await supabase
      .from('campaign_logs')
      .select('*')
      .eq('email', email)
      .eq('channel', 'instagram')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedLogs = logs?.map(log => ({
        id: log.id,
        name: log.name,
        status: log.status,
        sent: log.sent,
        opens: "N/A", // Opens tracking requires Meta Pixel/Webhooks
        date: new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    })) || [];

    return NextResponse.json({ success: true, campaigns: formattedLogs });
  } catch (error: any) {
    console.error("[IG_CAMPAIGNS_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Save and Dispatch Campaign
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();
    const { audience, message, name, hasMedia } = await req.json();

    // 🚀 STEP 1: Find how many active leads we have for this user
    const { count } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('channel', 'instagram')
      .eq('status', 'Active');

    const totalSent = count || 0;

    // 🚀 STEP 2: Save Campaign to DB
    const { error } = await supabase
      .from('campaign_logs')
      .insert({
          email: email,
          channel: 'instagram',
          name: hasMedia ? `${name} (with Media)` : name,
          message: message,
          audience: audience,
          sent: totalSent, // Record how many it was sent to
          status: 'Completed'
      });

    if (error) throw error;

    // TODO: Meta Graph API Bulk Dispatch Loop goes here in Phase 3

    return NextResponse.json({ success: true, message: "Campaign Dispatched" });
  } catch (error: any) {
    console.error("[IG_CAMPAIGNS_POST_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}