import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt"; // 🛡️ THE MASTER SECURITY LOCK

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    // 🛡️ SECURITY LOCK: Verify Session First
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      console.error("🚨 [SECURITY BREACH] Unauthenticated Billing GET attempt blocked.");
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid Session." }, { status: 401 });
    }

    // 🔥 Overwrite user input with cryptographic token email
    const email = token.email.toLowerCase();

    const { data, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Billing API Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to fetch billing history" }, { status: 500 });
  }
}