/**
 * ==============================================================================================
 * CLAWLINK ENTERPRISE VOICE CONFIGURATION API (TITANIUM SECURED)
 * ==============================================================================================
 * @file app/api/voice/route.ts
 * @description Manages Twilio/Voice AI API keys and prompts. 
 * Strictly locked with NextAuth JWT and PLG Gatekeeper (Active Plan verification).
 * Prevents IDOR (Insecure Direct Object Reference) attacks.
 * * ALL RIGHTS RESERVED. CLAWLINK INC.
 * ==============================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛡️ SECURITY LOCK: ENTERPRISE DATA SANITIZER
function sanitizeInput(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "").replace(/--/g, "").replace(/;/g, "").trim();
}

// =========================================================================
// 1. GET: SECURELY FETCH VOICE CONFIGURATION
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    // 🔒 LEVEL 1: Absolute Identity Verification
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid session." }, { status: 401 });
    }
    const secureEmail = token.email.toLowerCase();

    // 🔒 LEVEL 2: PLG Gatekeeper (Only Active users can access Voice AI)
    const { data: configCheck } = await supabase.from("user_configs").select("plan_status").eq("email", secureEmail).single();
    if (!configCheck || configCheck.plan_status !== "Active") {
        return NextResponse.json({ success: false, error: "Active Premium Plan required to access Voice AI." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("voice_configs")
      .select("provider, api_key, phone_number, voice_type, system_prompt")
      .eq("email", secureEmail)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[VOICE_GET_ERROR] Database query error:", error);
      return NextResponse.json({ success: false, error: "Failed to retrieve voice configuration." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      config: data ? {
        provider: data.provider,
        apiKey: data.api_key,
        phoneNumber: data.phone_number,
        voiceType: data.voice_type,
        systemPrompt: data.system_prompt
      } : null 
    });

  } catch (error: any) {
    console.error("[VOICE_GET_FATAL]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}

// =========================================================================
// 2. POST: SECURELY SAVE/UPDATE VOICE CONFIGURATION
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    // 🔒 LEVEL 1: Absolute Identity Verification
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid session." }, { status: 401 });
    }
    const secureEmail = token.email.toLowerCase();

    // 🔒 LEVEL 2: PLG Gatekeeper
    const { data: configCheck } = await supabase.from("user_configs").select("plan_status").eq("email", secureEmail).single();
    if (!configCheck || configCheck.plan_status !== "Active") {
        return NextResponse.json({ success: false, error: "Active Premium Plan required to deploy Voice AI." }, { status: 403 });
    }

    const body = await req.json();
    
    // 🛡️ SANITIZE ALL INCOMING DATA
    const provider = sanitizeInput(body.provider || "twilio");
    const apiKey = sanitizeInput(body.apiKey);
    const phoneNumber = sanitizeInput(body.phoneNumber);
    const voiceType = sanitizeInput(body.voiceType || "alloy");
    const systemPrompt = sanitizeInput(body.systemPrompt);

    if (!apiKey || !phoneNumber) {
      return NextResponse.json({ success: false, error: "API Key and Phone Number are strictly required." }, { status: 400 });
    }

    // 🔒 LEVEL 3: Secure Upsert bounded by verified session email
    const { error } = await supabase
      .from("voice_configs")
      .upsert(
        {
          email: secureEmail, // FORCED: Cannot be overwritten by API body payload
          provider: provider,
          api_key: apiKey,
          phone_number: phoneNumber,
          voice_type: voiceType,
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error("[VOICE_POST_ERROR] Database upsert error:", error);
      return NextResponse.json({ success: false, error: "Failed to securely save voice configuration." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Voice Infrastructure provisioned securely." });

  } catch (error: any) {
    console.error("[VOICE_POST_FATAL]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}