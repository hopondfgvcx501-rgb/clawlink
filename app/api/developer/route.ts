import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// 🚨 VERCEL BUILD FIX: Force dynamic execution so it doesn't crash at build time
export const dynamic = "force-dynamic"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("user_configs").select("developer_api_key").eq("email", email).single();
  return NextResponse.json({ success: true, apiKey: data?.developer_api_key || null });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Generate a secure, unique API key
  const newApiKey = "cl_live_" + crypto.randomBytes(24).toString('hex');

  const { error } = await supabase.from("user_configs").update({ developer_api_key: newApiKey }).eq("email", email);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, apiKey: newApiKey });
}