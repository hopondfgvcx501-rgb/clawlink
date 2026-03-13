import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Fetch Settings
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("followup_settings").select("*").eq("email", email).single();
  
  if (error) return NextResponse.json({ success: true, data: null }); // Return null if no settings yet
  return NextResponse.json({ success: true, data });
}

// Save Settings
export async function POST(req: Request) {
  const { email, isEnabled, delayHours, messageTemplate } = await req.json();

  if (!email) return NextResponse.json({ success: false, error: "Missing email" }, { status: 400 });

  const { error } = await supabase.from("followup_settings").upsert({
    email: email,
    is_enabled: isEnabled,
    delay_hours: parseInt(delayHours),
    message_template: messageTemplate,
    updated_at: new Date().toISOString()
  });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: "Settings saved successfully" });
}