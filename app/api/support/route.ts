import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 🚀 INITIALIZE SUPABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, issueType, description } = body;

    // 1. Validate Input
    if (!email || !issueType || !description) {
      return NextResponse.json({ success: false, error: "Required fields are missing." }, { status: 400 });
    }

    // 2. Save securely to Supabase (For the Admin Panel to fetch later)
    const { error } = await supabase
      .from("support_tickets")
      .insert({ 
        user_email: email, 
        issue_type: issueType, 
        description: description,
        status: "Open", // Default status for Admin Panel tracking
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("[SUPPORT_DB_ERROR] Failed to insert ticket:", error.message);
      throw new Error(error.message);
    }

    // 3. Return Success to the User UI
    return NextResponse.json({ success: true, message: "Support ticket registered successfully." });

  } catch (error: any) {
    console.error("Support API Fatal Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to submit support ticket. Please try again." }, { status: 500 });
  }
}