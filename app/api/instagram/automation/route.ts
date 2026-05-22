/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM AUTOMATION API
 * ==============================================================================================
 * @description Manages IG DM and Comment automations. Integrated with Alert Matrix.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

// 🚀 EXACT PATH FIX: 3 levels up to 'app', then into 'lib'
import { dispatchAdminAlert } from "../../../lib/monitoring/adminAlert";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch Active Automations & Global Settings
export async function GET(req: NextRequest) {
  let extractedEmail = "Unknown";
  
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    extractedEmail = token.email.toLowerCase();

    const { data, error } = await supabase
      .from('automations')
      .select('rules, settings')
      .eq('email', extractedEmail)
      .eq('channel', 'instagram')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json({ success: true, rules: data?.rules || [], settings: data?.settings || {} });
  } catch (error: any) {
    console.error("[AUTOMATION_GET_ERROR]", error.message);
    
    await dispatchAdminAlert(error.message, { 
        module: "Instagram Automation GET", 
        channel: "instagram", 
        userEmail: extractedEmail 
    });
    
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 🚀 POST: Save/Deploy New Automations
export async function POST(req: NextRequest) {
  let extractedEmail = "Unknown";
  
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    extractedEmail = token.email.toLowerCase();
    const { rules, settings } = await req.json();

    const { error } = await supabase
      .from('automations')
      .upsert({
          email: extractedEmail,
          channel: 'instagram',
          rules,
          settings,
          updated_at: new Date().toISOString()
      }, { onConflict: 'email, channel' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[AUTOMATION_POST_ERROR]", error.message);
    
    await dispatchAdminAlert(error.message, { 
        module: "Instagram Automation Save", 
        channel: "instagram", 
        userEmail: extractedEmail,
        details: "Failed to sync JSONB payload to database." 
    });
    
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}