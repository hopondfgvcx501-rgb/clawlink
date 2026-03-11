import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, issueType, description } = body;

    if (!email || !description) {
      return NextResponse.json({ success: false, error: "Required fields are missing." }, { status: 400 });
    }

    const { error } = await supabase
      .from("support_tickets")
      .insert({ 
        user_email: email, 
        issue_type: issueType, 
        description: description 
      });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: "Support ticket registered successfully." });
  } catch (error: any) {
    console.error("Support Desk API Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to submit support ticket." }, { status: 500 });
  }
}