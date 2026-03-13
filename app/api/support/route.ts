import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch all tickets for the Admin Dashboard
export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// PUT: Mark a ticket as "Resolved" when Admin clicks the button
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });

    const { error } = await supabase
      .from("support_tickets")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Ticket updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to update ticket" }, { status: 500 });
  }
}