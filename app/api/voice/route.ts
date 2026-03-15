import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("voice_configs")
      .select("provider, api_key, phone_number, voice_type, system_prompt")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Database query error:", error);
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
    console.error("Voice GET Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, provider, apiKey, phoneNumber, voiceType, systemPrompt } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required to save configuration." }, { status: 400 });
    }

    // Upsert logic: Update if email exists, insert if it does not.
    const { error } = await supabase
      .from("voice_configs")
      .upsert(
        {
          email: email,
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
      console.error("Database upsert error:", error);
      return NextResponse.json({ success: false, error: "Failed to securely save voice configuration." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Voice configuration updated successfully." });

  } catch (error: any) {
    console.error("Voice POST Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error." }, { status: 500 });
  }
}