import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Fetch Team Members
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("team_members").select("*").eq("owner_email", email);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}

// Invite New Member
export async function POST(req: Request) {
  const { ownerEmail, memberEmail, role } = await req.json();

  if (!ownerEmail || !memberEmail || !role) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("team_members").insert({
    owner_email: ownerEmail,
    member_email: memberEmail,
    role: role,
    status: "Pending"
  });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: "Invite sent successfully" });
}

// Remove Member
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Member removed" });
}