/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE: INSTAGRAM AUTOMATION API
 * ==============================================================================================
 * @description Manages IG DM and Comment automations for REAL users. Integrated with Alert Matrix.
 * 🚀 FEATURE: 100% User-Isolated Data (No Dummies). Supports Add, Edit, Delete & History.
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
// ALWAYS use service role key for backend operations to bypass RLS safely
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 GET: Fetch User's Personal History & Settings
export async function GET(req: NextRequest) {
  let extractedEmail = "Unknown";
  
  try {
    // 1. STRICT AUTH: Identifies the REAL logged-in user
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
        return NextResponse.json({ success: false, error: "Unauthorized User" }, { status: 401 });
    }

    extractedEmail = token.email.toLowerCase();

    // 2. FETCH REAL DATA: Only get the data belonging to this specific user
    const { data, error } = await supabase
      .from('automations')
      .select('rules, settings')
      .eq('email', extractedEmail)
      .eq('channel', 'instagram')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no row found (new user)

    return NextResponse.json({ 
      success: true, 
      funnels: data?.rules || [], // User's personal funnel history
      rules: data?.rules || [], 
      settings: data?.settings || {} 
    });
  } catch (error: any) {
    console.error("[AUTOMATION_GET_ERROR]", error.message);
    
    // 🚨 SEND REAL BACKEND ERRORS TO TG ADMIN
    await dispatchAdminAlert(error.message, { 
        module: "Instagram Automation GET", 
        channel: "instagram", 
        userEmail: extractedEmail 
    });
    
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// 🚀 POST: Save, Edit, or Delete User's Automations
export async function POST(req: NextRequest) {
  let extractedEmail = "Unknown";
  
  try {
    // 1. STRICT AUTH: Verify REAL user identity before saving/deleting
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
        return NextResponse.json({ success: false, error: "Unauthorized User" }, { status: 401 });
    }

    extractedEmail = token.email.toLowerCase();
    const body = await req.json();

    let finalRules = body.rules;
    let finalSettings = body.settings;

    // 🧠 SMART MODE CHECK: Is the user ADDING a new funnel, or EDITING/DELETING existing ones?
    
    // MODE A: Append New Funnel (User clicked "Add Funnel")
    if (body.keyword && body.dmContent) {
        const { data: existingData } = await supabase
          .from('automations')
          .select('rules, settings')
          .eq('email', extractedEmail)
          .eq('channel', 'instagram')
          .single();

        const currentRules = existingData?.rules || [];
        
        finalRules = [
            {
                id: crypto.randomUUID(), // Unique ID for future edits/deletes
                postType: body.postType || "Any Post or Reel",
                keyword: body.keyword,
                publicReply: body.publicReply || "",
                dmContent: body.dmContent,
                isActive: body.isActive !== undefined ? body.isActive : true,
                createdAt: new Date().toISOString()
            },
            ...currentRules
        ];

        finalSettings = existingData?.settings || {};
    } 
    // MODE B: Full Sync (User clicked "Delete" or Toggled a setting)
    else {
        // If the frontend sends the whole array, we trust it and overwrite (This handles deletions)
        if (!finalRules) throw new Error("Invalid payload: Rules array missing during sync.");
    }

    // 🚀 UPSERT TO REAL DB: Save strictly under this user's email
    const { error } = await supabase
      .from('automations')
      .upsert({
          email: extractedEmail,
          channel: 'instagram',
          rules: finalRules || [],
          settings: finalSettings || {},
          updated_at: new Date().toISOString()
      }, { onConflict: 'email, channel' });

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[AUTOMATION_POST_ERROR]", error.message);
    
    // 🚨 SEND REAL BACKEND ERRORS TO TG ADMIN
    await dispatchAdminAlert(error.message, { 
        module: "Instagram Automation Save/Edit/Delete", 
        channel: "instagram", 
        userEmail: extractedEmail,
        details: "Failed to sync JSONB payload to database." 
    });
    
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}