import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const email = token.email.toLowerCase();

    // 🚀 Fetch real leads from DB
    const { data: leadsData, error } = await supabase
      .from('leads_contacts')
      .select('*')
      .eq('email', email)
      .eq('channel', 'instagram')
      .order('last_interaction', { ascending: false });

    if (error) throw error;

    // Map DB columns to Frontend Interface
    const formattedLeads = leadsData?.map(lead => ({
        id: lead.id,
        handle: lead.handle.startsWith('@') ? lead.handle : `@${lead.handle}`,
        name: lead.name || 'Instagram User',
        follower: lead.follower,
        status: lead.status,
        labels: lead.labels || [],
        lastActive: new Date(lead.last_interaction).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    })) || [];

    return NextResponse.json({ success: true, leads: formattedLeads });
  } catch (error: any) {
    console.error("[IG_LEADS_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}