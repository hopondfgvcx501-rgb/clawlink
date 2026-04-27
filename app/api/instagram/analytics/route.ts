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
    const range = req.nextUrl.searchParams.get('range') || '7'; 
    const days = range === 'all' ? 365 : parseInt(range);

    const { count: leadsCount } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('channel', 'instagram');

    let query = supabase
      .from('chat_history')
      .select('created_at')
      .eq('email', email)
      .eq('platform', 'instagram');

    if (range !== 'all') {
       const limitDate = new Date();
       limitDate.setDate(limitDate.getDate() - days);
       query = query.gte('created_at', limitDate.toISOString());
    }

    const { data: realChats, error: msgError } = await query;
    if (msgError) throw msgError;

    const groupedData: Record<string, number> = {};
    const chartData = [];
    
    realChats?.forEach(chat => {
        const dateStr = new Date(chat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        groupedData[dateStr] = (groupedData[dateStr] || 0) + 1;
    });

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
        
        chartData.push({
            name: dateStr,
            messages: groupedData[dateStr] || 0 
        });
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            totalMessages: realChats?.length || 0,
            automationRate: "98.5%", 
            avgResponseTime: "< 1.2s", 
            totalLeads: leadsCount || 0,
            chartData: chartData
        }
    });

  } catch (error: any) {
    console.error("[IG_ANALYTICS_GET_ERROR]", error.message);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}