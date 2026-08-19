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
// ALWAYS use service role key for backend operations to bypass RLS when necessary
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

    // 🔥 BUGFIX: Sending rules mapped to "funnels" so the UI doesn't break!
    return NextResponse.json({ 
      success: true, 
      funnels: data?.rules || [], // Mapped for the frontend state
      rules: data?.rules || [], 
      settings: data?.settings || {} 
    });
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
    const body = await req.json();

    // 🧠 SMART JSONB MERGER LOGIC
    let newRules = body.rules;
    let newSettings = body.settings;

    // If the frontend is sending a SINGLE funnel object instead of the full array
    if (body.keyword && body.dmContent) {
        // 1. Fetch existing rules
        const { data: existingData } = await supabase
          .from('automations')
          .select('rules, settings')
          .eq('email', extractedEmail)
          .eq('channel', 'instagram')
          .single();

        const currentRules = existingData?.rules || [];
        
        // 2. Append the new rule to the top of the array
        newRules = [
            {
                postType: body.postType || "Any Post or Reel",
                keyword: body.keyword,
                publicReply: body.publicReply || "",
                dmContent: body.dmContent,
                isActive: body.isActive !== undefined ? body.isActive : true,
                createdAt: new Date().toISOString()
            },
            ...currentRules
        ];

        newSettings = existingData?.settings || {};
    }

    // 🚀 UPSERT THE FULL JSONB ARRAY
    const { error } = await supabase
      .from('automations')
      .upsert({
          email: extractedEmail,
          channel: 'instagram',
          rules: newRules || [],
          settings: newSettings || {},
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