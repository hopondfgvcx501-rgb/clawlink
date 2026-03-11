import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch all customers for the authenticated bot owner
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized request. Email missing." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("customer_memory")
      .select("*")
      .eq("bot_owner_email", email)
      .order("last_interaction", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("CRM Fetch Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to retrieve CRM data." }, { status: 500 });
  }
}

// PUT: Update customer parameters (Billing, Orders, Support)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      email, 
      customer_name, 
      outstanding_balance, 
      last_order_status, 
      active_ticket_id, 
      past_behavior_notes 
    } = body;

    if (!id || !email) {
      return NextResponse.json({ success: false, error: "Invalid payload parameters." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("customer_memory")
      .update({
        customer_name,
        outstanding_balance,
        last_order_status,
        active_ticket_id,
        past_behavior_notes
      })
      .eq("id", id)
      .eq("bot_owner_email", email)
      .select();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("CRM Update Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to update CRM data." }, { status: 500 });
  }
}